import React, { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { db } from '@/database';
import type { PurchaseOrder, Vendor, Warehouse, Product } from '@/shared/types';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Plus, CheckCircle, PackageCheck, AlertCircle, ShoppingCart } from 'lucide-react';
import { formatMinorCurrency } from '@/shared/utils/formatters';

export const PurchaseOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    vendorId: '',
    warehouseId: '',
    productId: '',
    quantity: 25,
  });

  const loadData = async () => {
    const [o, v, w, p] = await Promise.all([
      db.purchaseOrders.toArray(),
      db.vendors.toArray(),
      db.warehouses.toArray(),
      db.products.toArray(),
    ]);
    setOrders(o);
    setVendors(v);
    setWarehouses(w);
    setProducts(p);

    if (v.length > 0 && !form.vendorId) {
      setForm((prev) => ({
        ...prev,
        vendorId: v[0].id,
        warehouseId: w[0]?.id || '',
        productId: p[0]?.id || '',
      }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find((v) => v.id === form.vendorId);
    const prod = products.find((p) => p.id === form.productId);
    const unitPriceMinor = prod ? prod.costPriceMinor : 25000;
    const totalMinor = unitPriceMinor * form.quantity;

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-${Math.floor(7000 + Math.random() * 2000)}`,
      vendorId: form.vendorId,
      vendorName: vendor?.name || 'Authorized Supplier',
      warehouseId: form.warehouseId,
      branchId: 'branch-tx',
      items: [
        {
          id: `item-${Date.now()}`,
          productId: form.productId,
          productName: prod?.name || 'Hardware Component',
          sku: prod?.sku || 'NX-SKU',
          quantity: form.quantity,
          unitPriceMinor,
          totalMinor,
        },
      ],
      totalMinor,
      status: 'pending_approval',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: '2026-11-28',
    };

    await db.purchaseOrders.add(newPO);

    // Register into approval engine
    await db.approvalWorkflows.add({
      id: `wf-po-${Date.now()}`,
      type: 'purchase_order',
      referenceId: newPO.id,
      title: `Purchase Order ${newPO.poNumber} (${formatMinorCurrency(totalMinor)})`,
      amountMinor: totalMinor,
      currentStep: 1,
      totalSteps: 2,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: `h-${Date.now()}`,
          step: 1,
          stepName: 'Procurement Specialist Approval',
          actorId: 'user-proc',
          actorName: 'Rachel Sterling',
          actorRole: 'procurement_manager',
          action: 'submitted',
          timestamp: new Date().toISOString(),
        },
      ],
    });

    setIsModalOpen(false);
    loadData();
  };

  // CROSS-MODULE INTEGRATION: Mark received -> updates warehouse stock!
  const handleSimulateGoodsReceipt = async (po: PurchaseOrder) => {
    if (
      !window.confirm(
        `Receive goods for ${po.poNumber}? This will automatically replenish inventory stock at destination depot.`
      )
    ) {
      return;
    }

    await db.transaction('rw', [db.purchaseOrders, db.stocks, db.stockMovements, db.notifications], async () => {
      // 1. Update PO status
      await db.purchaseOrders.update(po.id, { status: 'received' });

      // 2. Replenish stocks for each item
      for (const item of po.items) {
        const existingStock = await db.stocks
          .where({ productId: item.productId, warehouseId: po.warehouseId })
          .first();

        if (existingStock) {
          await db.stocks.update(existingStock.id, {
            availableQuantity: existingStock.availableQuantity + item.quantity,
            lastUpdated: new Date().toISOString(),
          });
        } else {
          await db.stocks.add({
            id: `stock-${item.productId}-${po.warehouseId}`,
            productId: item.productId,
            warehouseId: po.warehouseId,
            availableQuantity: item.quantity,
            reservedQuantity: 0,
            damagedQuantity: 0,
            lastUpdated: new Date().toISOString(),
          });
        }

        // 3. Log stock inbound movement
        await db.stockMovements.add({
          id: `sm-po-${Date.now()}-${item.productId}`,
          productId: item.productId,
          productName: item.productName,
          sourceWarehouseId: undefined,
          destWarehouseId: po.warehouseId,
          quantity: item.quantity,
          type: 'inbound_po',
          referenceId: po.poNumber,
          timestamp: new Date().toISOString(),
          performedBy: 'Rachel Sterling (Procurement)',
        });
      }

      // 4. Generate notification
      await db.notifications.add({
        id: `notif-${Date.now()}`,
        title: 'Goods Inbound Received',
        message: `${po.poNumber} received. Stock levels automatically updated.`,
        type: 'success',
        category: 'inventory',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    });

    loadData();
  };

  const columns: ColumnDef<PurchaseOrder>[] = [
    {
      accessorKey: 'poNumber',
      header: 'PO Number',
      cell: ({ row }) => <span className="font-mono font-medium text-blue-600">{row.original.poNumber}</span>,
    },
    {
      accessorKey: 'vendorName',
      header: 'Supplier / Vendor',
      cell: ({ row }) => <span className="font-semibold text-slate-800">{row.original.vendorName}</span>,
    },
    {
      id: 'destinationDepot',
      header: 'Receiving Depot',
      cell: ({ row }) => {
        const wh = warehouses.find((w) => w.id === row.original.warehouseId);
        return <span className="text-slate-600 font-medium">{wh?.name || 'Central Logistics'}</span>;
      },
    },
    {
      accessorKey: 'totalMinor',
      header: 'PO Commitment',
      cell: ({ row }) => (
        <span className="font-bold text-slate-900">{formatMinorCurrency(row.original.totalMinor)}</span>
      ),
    },
    {
      accessorKey: 'orderDate',
      header: 'Order Date',
      cell: ({ row }) => <span className="text-slate-500">{row.original.orderDate}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Fulfillment Status',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === 'received'
              ? 'success'
              : row.original.status === 'approved'
              ? 'info'
              : row.original.status === 'pending_approval'
              ? 'warning'
              : 'danger'
          }
        >
          {row.original.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        if (row.original.status === 'received') {
          return (
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <CheckCircle className="w-3.5 h-3.5" /> In Stock
            </span>
          );
        }
        return (
          <Button
            size="sm"
            variant="outline"
            className="text-blue-600 border-blue-200 hover:bg-blue-50 h-7 px-2"
            onClick={() => handleSimulateGoodsReceipt(row.original)}
          >
            <PackageCheck className="w-3.5 h-3.5 mr-1" /> Goods Receipt
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Purchase Orders & Procurement</h1>
          <p className="text-xs text-slate-500 mt-1">
            Supplier contractual commitments with automated inbound stock replenishment.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Create Purchase Order
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        searchPlaceholder="Filter purchase orders..."
        exportFilename="NexusERP_Purchase_Orders"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Issue Vendor Purchase Order"
        description="Creates PO commitment and sends to multi-step financial approval workflow."
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Target Supplier</label>
              <select
                value={form.vendorId}
                onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Receiving Warehouse</label>
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
              <label className="text-xs font-semibold text-slate-700 block mb-1">Catalog SKU</label>
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
              <label className="text-xs font-semibold text-slate-700 block mb-1">Order Quantity</label>
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
              Dispatch Purchase Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
