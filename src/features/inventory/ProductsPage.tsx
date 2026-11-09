import React, { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { db } from '@/database';
import type { Product } from '@/shared/types';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Plus, Boxes, Layers, Tag } from 'lucide-react';
import { formatMinorCurrency } from '@/shared/utils/formatters';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    sku: '',
    name: '',
    category: 'Enterprise Servers',
    description: '',
    costPrice: 450,
    unitPrice: 650,
    reorderLevel: 25,
  });

  const loadData = async () => {
    const prods = await db.products.toArray();
    setProducts(prods);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const newProd: Product = {
      id: `prod-${Date.now()}`,
      sku: form.sku.toUpperCase() || `NX-SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: form.name,
      category: form.category,
      description: form.description || 'Enterprise catalog SKU',
      costPriceMinor: form.costPrice * 100,
      unitPriceMinor: form.unitPrice * 100,
      reorderLevel: form.reorderLevel,
      status: 'active',
    };

    await db.products.add(newProd);

    // Also populate initial stock records in all warehouses
    const warehouses = await db.warehouses.toArray();
    const stocks = warehouses.map((wh) => ({
      id: `stock-${newProd.id}-${wh.id}`,
      productId: newProd.id,
      warehouseId: wh.id,
      availableQuantity: 50,
      reservedQuantity: 0,
      damagedQuantity: 0,
      lastUpdated: new Date().toISOString(),
    }));
    await db.stocks.bulkAdd(stocks);

    setIsModalOpen(false);
    loadData();
  };

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'sku',
      header: 'SKU Code',
      cell: ({ row }) => <span className="font-mono font-bold text-blue-600">{row.original.sku}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Product Catalog Item',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-slate-800">{row.original.name}</div>
          <div className="text-[11px] text-slate-400 max-w-sm truncate">{row.original.description}</div>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
          {row.original.category}
        </span>
      ),
    },
    {
      accessorKey: 'costPriceMinor',
      header: 'Cost Price',
      cell: ({ row }) => <span>{formatMinorCurrency(row.original.costPriceMinor)}</span>,
    },
    {
      accessorKey: 'unitPriceMinor',
      header: 'Selling Price',
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900">{formatMinorCurrency(row.original.unitPriceMinor)}</span>
      ),
    },
    {
      accessorKey: 'reorderLevel',
      header: 'Reorder Threshold',
      cell: ({ row }) => <span className="font-mono text-slate-600">{row.original.reorderLevel} units</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'active' ? 'success' : 'danger'}>
          {row.original.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Product Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">
            Standard enterprise bill of materials, pricing matrices and reorder levels.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Catalog Product
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        searchPlaceholder="Search catalog by SKU or item name..."
        exportFilename="NexusERP_Product_Catalog"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Catalog SKU"
        description="Creates master SKU definition and provisions starting stock inventory records."
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">SKU Designation</label>
              <input
                required
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="NX-SRV-904"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Enterprise Servers">Enterprise Servers</option>
                <option value="Networking Gear">Networking Gear</option>
                <option value="Security Appliances">Security Appliances</option>
                <option value="Workstations">Workstations</option>
                <option value="Storage Systems">Storage Systems</option>
                <option value="Cloud Peripherals">Cloud Peripherals</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Product Title</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Nexus Multi-Core High Throughput Blade Server"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Cost Price ($)</label>
              <input
                required
                type="number"
                min={1}
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Selling Price ($)</label>
              <input
                required
                type="number"
                min={1}
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Reorder Threshold</label>
              <input
                required
                type="number"
                min={1}
                value={form.reorderLevel}
                onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Technical Specs & Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Register Product
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
