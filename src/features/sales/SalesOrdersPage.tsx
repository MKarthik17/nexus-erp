import React, { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { db } from '@/database';
import type { SalesOrder, Customer, Warehouse, Product } from '@/shared/types';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Plus, Truck, Check, PackageCheck, AlertCircle } from 'lucide-react';
import { formatMinorCurrency } from '@/shared/utils/formatters';

export const SalesOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    customerId: '',
    warehouseId: '',
    productId: '',
    quantity: 5,
  });

  const loadData = async () => {
    const [so, c, w, p] = await Promise.all([
      db.salesOrders.toArray(),
      db.customers.toArray(),
      db.warehouses.toArray(),
      db.products.toArray(),
    ]);
    setOrders(so);
    setCustomers(c);
    setWarehouses(w);
    setProducts(p);

    if (c.length > 0 && !form.customerId) {
      setForm((prev) => ({
        ...prev,
        customerId: c[0].id,
        warehouseId: w[0]?.id || '',
        productId: p[0]?.id || '',
      }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSalesOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === form.customerId);
    const prod = products.find((p) => p.id === form.productId);
    const unitPriceMinor = prod ? prod.unitPriceMinor : 35000;
    const totalMinor = unitPriceMinor * form.quantity;

    const newSO: SalesOrder = {
      id: `so-${Date.now()}`,
      orderNumber: `SO-2026-${Math.floor(8000 + Math.random() * 2000)}`,
      customerId: form.customerId,
      customerName: cust?.company || 'Commercial Client',
      warehouseId: form.warehouseId,
      branchId: 'branch-hq',
      items: [
        {
          id: `item-${Date.now()}`,
          productId: form.productId,
          productName: prod?.name || 'Enterprise Hardware',
          sku: prod?.sku || 'NX-SKU',
          quantity: form.quantity,
          unitPriceMinor,
          discountMinor: 0,
          totalMinor,
        },
      ],
      totalMinor,
      status: 'confirmed',
      orderDate: new Date().toISOString().split('T')[0],
    };

    await db.salesOrders.add(newSO);
    setIsModalOpen(false);
    loadData();
  };

  // CROSS-MODULE INTEGRATION: When an order is shipped, decrement inventory from warehouse & record movement!
  const handleShipOrder = async (so: SalesOrder) => {
    if (
      !window.confirm(
        `Confirm shipment dispatch for ${so.orderNumber}? This will deduct inventory stock and record outbound movement.`
      )
    ) {
      return;
    }

    try {
      await db.transaction('rw', [db.salesOrders, db.stocks, db.stockMovements, db.notifications], async () => {
        // Validate stock availability
        for (const item of so.items) {
          const currentStock = await db.stocks
            .where({ productId: item.productId, warehouseId: so.warehouseId })
            .first();

          if (!currentStock || currentStock.availableQuantity < item.quantity) {
            throw new Error(`Insufficient inventory in warehouse to fulfill order!`);
          }

          // Deduct stock
          await db.stocks.update(currentStock.id, {
            availableQuantity: currentStock.availableQuantity - item.quantity,
            lastUpdated: new Date().toISOString(),
          });

          // Record outbound movement
          await db.stockMovements.add({
            id: `sm-so-${Date.now()}-${item.productId}`,
            productId: item.productId,
            productName: item.productName,
            sourceWarehouseId: so.warehouseId,
            destWarehouseId: undefined,
            quantity: item.quantity,
            type: 'outbound_so',
            referenceId: so.orderNumber,
            timestamp: new Date().toISOString(),
            performedBy: 'Marcus Vance (Sales Operations)',
          });
        }

        // Update sales order status
        await db.salesOrders.update(so.id, { status: 'shipped' });

        // Add notification
        await db.notifications.add({
          id: `notif-${Date.now()}`,
          title: 'Sales Order Shipped',
          message: `${so.orderNumber} successfully shipped to ${so.customerName}. Warehouse stock updated.`,
          type: 'success',
          category: 'workflow',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      });

      alert('Order marked as shipped. Stock quantities decremented.');
      loadData();
    } catch (err: any) {
      alert(`Error during shipment: ${err.message}`);
    }
  };

  const columns: ColumnDef<SalesOrder>[] = [
    {
      accessorKey: 'orderNumber',
      header: 'Sales Order #',
      cell: ({ row }) => <span className="font-mono font-medium text-blue-600">{row.original.orderNumber}</span>,
    },
    {
      accessorKey: 'customerName',
      header: 'Customer Company',
      cell: ({ row }) => <span className="font-semibold text-slate-800">{row.original.customerName}</span>,
    },
    {
      id: 'dispatchWarehouse',
      header: 'Fulfillment Depot',
      cell: ({ row }) => {
        const wh = warehouses.find((w) => w.id === row.original.warehouseId);
        return <span className="text-slate-600 font-medium">{wh?.name || 'Central Facility'}</span>;
      },
    },
    {
      accessorKey: 'totalMinor',
      header: 'Contract Value',
      cell: ({ row }) => (
        <span className="font-bold text-slate-900">{formatMinorCurrency(row.original.totalMinor)}</span>
      ),
    },
    {
      accessorKey: 'orderDate',
      header: 'Booked Date',
      cell: ({ row }) => <span className="text-slate-500">{row.original.orderDate}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Delivery Status',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === 'delivered'
              ? 'success'
              : row.original.status === 'shipped'
              ? 'info'
              : row.original.status === 'processing' || row.original.status === 'confirmed'
              ? 'warning'
              : 'default'
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        if (row.original.status === 'shipped' || row.original.status === 'delivered') {
          return (
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <Check className="w-3.5 h-3.5" /> Dispatched
            </span>
          );
        }
        return (
          <Button
            size="sm"
            variant="outline"
            className="text-blue-600 border-blue-200 hover:bg-blue-50 h-7 px-2"
            onClick={() => handleShipOrder(row.original)}
          >
            <Truck className="w-3.5 h-3.5 mr-1" /> Ship Order
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Enterprise Sales Orders</h1>
          <p className="text-xs text-slate-500 mt-1">
            Commercial order contracts with automated inventory deduction on shipment.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Book Sales Order
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        searchPlaceholder="Filter sales orders..."
        exportFilename="NexusERP_Sales_Orders"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Book Customer Sales Order"
        description="Fulfills product request from designated warehouse and records sales booking."
      >
        <form onSubmit={handleCreateSalesOrder} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Customer Account</label>
              <select
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company} ({c.name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Fulfillment Depot</label>
              <select
                value={form.warehouseId}
                onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">Ordered SKU</label>
              <select
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Quantity</label>
              <input
                required
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Confirm Sales Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
