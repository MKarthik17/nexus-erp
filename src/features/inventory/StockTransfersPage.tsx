import React, { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { db } from '@/database';
import type { StockMovement, Product, Warehouse } from '@/shared/types';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { ArrowLeftRight, Check, AlertCircle } from 'lucide-react';
import { formatDateTime } from '@/shared/utils/formatters';

export const StockTransfersPage: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [form, setForm] = useState({
    sourceWarehouseId: '',
    destWarehouseId: '',
    productId: '',
    quantity: 10,
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    const [m, p, w] = await Promise.all([
      db.stockMovements.reverse().toArray(),
      db.products.toArray(),
      db.warehouses.toArray(),
    ]);
    setMovements(m);
    setProducts(p);
    setWarehouses(w);

    if (w.length >= 2 && !form.sourceWarehouseId) {
      setForm((prev) => ({
        ...prev,
        sourceWarehouseId: w[0].id,
        destWarehouseId: w[1].id,
        productId: p[0]?.id || '',
      }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (form.sourceWarehouseId === form.destWarehouseId) {
      setErrorMsg('Source warehouse cannot be identical to destination terminal.');
      return;
    }

    if (form.quantity <= 0) {
      setErrorMsg('Transfer quantity must be greater than zero.');
      return;
    }

    // Check available stock in source warehouse
    const sourceStock = await db.stocks
      .where({ productId: form.productId, warehouseId: form.sourceWarehouseId })
      .first();

    if (!sourceStock || sourceStock.availableQuantity < form.quantity) {
      setErrorMsg(
        `Insufficient available stock at source warehouse! (Available: ${
          sourceStock?.availableQuantity ?? 0
        } units)`
      );
      return;
    }

    // Atomically decrement source and increment destination
    await db.transaction('rw', [db.stocks, db.stockMovements], async () => {
      // 1. Decrement source
      await db.stocks.update(sourceStock.id, {
        availableQuantity: sourceStock.availableQuantity - form.quantity,
        lastUpdated: new Date().toISOString(),
      });

      // 2. Increment destination
      const destStock = await db.stocks
        .where({ productId: form.productId, warehouseId: form.destWarehouseId })
        .first();

      if (destStock) {
        await db.stocks.update(destStock.id, {
          availableQuantity: destStock.availableQuantity + form.quantity,
          lastUpdated: new Date().toISOString(),
        });
      } else {
        await db.stocks.add({
          id: `stock-${form.productId}-${form.destWarehouseId}`,
          productId: form.productId,
          warehouseId: form.destWarehouseId,
          availableQuantity: form.quantity,
          reservedQuantity: 0,
          damagedQuantity: 0,
          lastUpdated: new Date().toISOString(),
        });
      }

      // 3. Record immutable stock movement
      const prod = products.find((p) => p.id === form.productId);
      const transferId = `TRF-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      await db.stockMovements.add({
        id: `sm-${Date.now()}`,
        productId: form.productId,
        productName: prod?.name || 'Enterprise SKU',
        sourceWarehouseId: form.sourceWarehouseId,
        destWarehouseId: form.destWarehouseId,
        quantity: form.quantity,
        type: 'transfer',
        referenceId: transferId,
        timestamp: new Date().toISOString(),
        performedBy: 'David Zhao',
      });
    });

    setSuccessMsg('Inter-facility inventory transfer successfully executed and ledger updated!');
    loadData();
  };

  const columns: ColumnDef<StockMovement>[] = [
    {
      accessorKey: 'referenceId',
      header: 'Movement ID',
      cell: ({ row }) => (
        <span className="font-mono font-medium text-blue-600">{row.original.referenceId || row.original.id}</span>
      ),
    },
    {
      accessorKey: 'productName',
      header: 'Product Transferred',
      cell: ({ row }) => <span className="font-semibold text-slate-800">{row.original.productName}</span>,
    },
    {
      id: 'route',
      header: 'Transit Route',
      cell: ({ row }) => {
        const src = warehouses.find((w) => w.id === row.original.sourceWarehouseId);
        const dest = warehouses.find((w) => w.id === row.original.destWarehouseId);
        return (
          <div className="flex items-center gap-2 text-slate-700">
            <span className="font-medium">{src?.name || 'External / Inbound'}</span>
            <span className="text-slate-400">→</span>
            <span className="font-medium">{dest?.name || 'External / Dispatched'}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'quantity',
      header: 'Units',
      cell: ({ row }) => <span className="font-bold text-slate-900">{row.original.quantity}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Movement Type',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.type === 'transfer'
              ? 'info'
              : row.original.type === 'inbound_po'
              ? 'success'
              : 'warning'
          }
        >
          {row.original.type.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'timestamp',
      header: 'Logged At',
      cell: ({ row }) => <span className="text-slate-500">{formatDateTime(row.original.timestamp)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Inter-Facility Stock Transfers</h1>
        <p className="text-xs text-slate-500 mt-1">
          Atomic warehouse-to-warehouse stock relocation with inventory balance validation.
        </p>
      </div>

      {/* Interactive Transfer Submission Card */}
      <Card>
        <CardHeader
          title="Dispatch Inter-Warehouse Stock Transfer"
          subtitle="Real-time multi-depot inventory balancing"
        />
        <CardContent>
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleExecuteTransfer} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Source Depot</label>
              <select
                value={form.sourceWarehouseId}
                onChange={(e) => setForm({ ...form, sourceWarehouseId: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Destination Depot</label>
              <select
                value={form.destWarehouseId}
                onChange={(e) => setForm({ ...form, destWarehouseId: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Product SKU</label>
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

            <div className="flex gap-2">
              <div className="w-24">
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
              <Button size="md" className="flex-1" type="submit">
                <ArrowLeftRight className="w-4 h-4 mr-1.5" />
                Dispatch Transfer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Movement History */}
      <DataTable
        columns={columns}
        data={movements}
        searchPlaceholder="Filter stock movements..."
        exportFilename="NexusERP_Stock_Movements"
      />
    </div>
  );
};
