import React, { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { db } from '@/database';
import type { Warehouse, Branch } from '@/shared/types';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Plus, Warehouse as WarehouseIcon, Building } from 'lucide-react';
import { formatNumber } from '@/shared/utils/formatters';

export const WarehousesPage: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    location: '',
    capacityUnits: 75000,
    branchId: '',
  });

  const loadData = async () => {
    const [w, b] = await Promise.all([
      db.warehouses.toArray(),
      db.branches.toArray(),
    ]);
    setWarehouses(w);
    setBranches(b);
    if (b.length > 0 && !form.branchId) {
      setForm((prev) => ({ ...prev, branchId: b[0].id }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    const newWh: Warehouse = {
      id: `wh-${Date.now()}`,
      name: form.name,
      code: form.code.toUpperCase(),
      location: form.location,
      capacityUnits: form.capacityUnits,
      branchId: form.branchId,
      status: 'active',
    };

    await db.warehouses.add(newWh);
    setIsModalOpen(false);
    loadData();
  };

  const columns: ColumnDef<Warehouse>[] = [
    {
      accessorKey: 'code',
      header: 'Facility Code',
      cell: ({ row }) => <span className="font-mono font-bold text-blue-600">{row.original.code}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Logistics Facility',
      cell: ({ row }) => <span className="font-semibold text-slate-800">{row.original.name}</span>,
    },
    {
      accessorKey: 'location',
      header: 'Geographic Location',
      cell: ({ row }) => <span className="text-slate-600">{row.original.location}</span>,
    },
    {
      accessorKey: 'capacityUnits',
      header: 'Storage Capacity',
      cell: ({ row }) => <span>{formatNumber(row.original.capacityUnits)} cubic units</span>,
    },
    {
      accessorKey: 'branchId',
      header: 'Hub Alignment',
      cell: ({ row }) => {
        const br = branches.find((b) => b.id === row.original.branchId);
        return <span className="text-slate-500">{br?.name || '-'}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Operational Status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'active' ? 'success' : 'warning'}>
          {row.original.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Warehouse & Depot Terminals</h1>
          <p className="text-xs text-slate-500 mt-1">
            Regional distribution facilities, storage capacities, and depot topologies.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Provision Depot
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={warehouses}
        searchPlaceholder="Search warehouses..."
        exportFilename="NexusERP_Warehouses_Register"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision Warehouse Depot"
        description="Registers physical logistics center for goods intake and inventory holding."
      >
        <form onSubmit={handleCreateWarehouse} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Depot Name</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Chicago Central Multi-Modal Facility"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Code</label>
              <input
                required
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="WH-CHI-01"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Regional Branch</label>
              <select
                value={form.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Location Address</label>
              <input
                required
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Chicago, IL"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Volumetric Capacity</label>
              <input
                required
                type="number"
                value={form.capacityUnits}
                onChange={(e) => setForm({ ...form, capacityUnits: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Provision Depot
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
