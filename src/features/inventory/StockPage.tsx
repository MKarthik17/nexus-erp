import React, { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { db } from '@/database';
import type { Stock, Product, Warehouse } from '@/shared/types';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Layers, AlertTriangle, ArrowUpDown, ShieldAlert } from 'lucide-react';
import { formatNumber } from '@/shared/utils/formatters';

export const StockPage: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);

  const loadData = async () => {
    const [s, p, w] = await Promise.all([
      db.stocks.toArray(),
      db.products.toArray(),
      db.warehouses.toArray(),
    ]);
    setStocks(s);
    setProducts(p);
    setWarehouses(w);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;

    const newAvailable = selectedStock.availableQuantity + adjustQty;
    if (newAvailable < 0) {
      alert('Stock cannot be adjusted to negative values!');
      return;
    }

    await db.stocks.update(selectedStock.id, {
      availableQuantity: newAvailable,
      lastUpdated: new Date().toISOString(),
    });

    // Record movement
    const prod = products.find((p) => p.id === selectedStock.productId);
    await db.stockMovements.add({
      id: `sm-${Date.now()}`,
      productId: selectedStock.productId,
      productName: prod?.name || 'Product',
      sourceWarehouseId: selectedStock.warehouseId,
      quantity: Math.abs(adjustQty),
      type: 'adjustment',
      referenceId: 'CYCLE-COUNT-ADJ',
      timestamp: new Date().toISOString(),
      performedBy: 'David Zhao',
    });

    setIsAdjustModalOpen(false);
    loadData();
  };

  const columns: ColumnDef<Stock>[] = [
    {
      id: 'productName',
      header: 'Product Item',
      cell: ({ row }) => {
        const prod = products.find((p) => p.id === row.original.productId);
        return (
          <div>
            <div className="font-semibold text-slate-800">{prod?.name || 'Unknown SKU'}</div>
            <div className="text-[10px] font-mono text-blue-600">{prod?.sku}</div>
          </div>
        );
      },
    },
    {
      id: 'warehouse',
      header: 'Warehouse Location',
      cell: ({ row }) => {
        const wh = warehouses.find((w) => w.id === row.original.warehouseId);
        return <span className="text-slate-600 font-medium">{wh?.name}</span>;
      },
    },
    {
      accessorKey: 'availableQuantity',
      header: 'Available Stock',
      cell: ({ row }) => {
        const prod = products.find((p) => p.id === row.original.productId);
        const isLow = prod && row.original.availableQuantity <= prod.reorderLevel;
        return (
          <div className="flex items-center gap-2">
            <span className={`font-bold ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
              {formatNumber(row.original.availableQuantity)}
            </span>
            {isLow && (
              <span className="flex items-center gap-1 text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded font-medium">
                <AlertTriangle className="w-3 h-3" /> Reorder
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'reservedQuantity',
      header: 'Reserved / Committed',
      cell: ({ row }) => <span className="text-slate-500">{row.original.reservedQuantity}</span>,
    },
    {
      accessorKey: 'damagedQuantity',
      header: 'Damaged / Quarantine',
      cell: ({ row }) => (
        <span className={row.original.damagedQuantity > 0 ? 'text-amber-600 font-medium' : 'text-slate-400'}>
          {row.original.damagedQuantity}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2"
          onClick={() => {
            setSelectedStock(row.original);
            setAdjustQty(0);
            setIsAdjustModalOpen(true);
          }}
        >
          <ArrowUpDown className="w-3 h-3 mr-1" /> Cycle Adjust
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Live Warehouse Inventory Levels</h1>
        <p className="text-xs text-slate-500 mt-1">
          Real-time physical bin allocation, quarantine holds, and cycle-count balance controls.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={stocks}
        searchPlaceholder="Filter inventory stock levels..."
        exportFilename="NexusERP_Stock_Ledger"
      />

      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Physical Cycle Stock Count Adjustment"
        description="Records positive or negative inventory delta and generates audit stock movement trail."
      >
        <form onSubmit={handleAdjustStock} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-md text-xs space-y-1">
            <div className="text-slate-500">Current Recorded Available:</div>
            <div className="text-base font-bold text-slate-800">{selectedStock?.availableQuantity} Units</div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Adjustment Quantity (e.g. +10 or -5)
            </label>
            <input
              required
              type="number"
              value={adjustQty}
              onChange={(e) => setAdjustQty(Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Apply Cycle Count
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
