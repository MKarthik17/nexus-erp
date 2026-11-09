import React, { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { db } from '@/database';
import type { Vendor } from '@/shared/types';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Plus, Star, Truck, Phone, Mail } from 'lucide-react';

export const VendorsPage: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '100 Technology Parkway, Austin, TX',
    category: 'Enterprise Servers',
    paymentTerms: 'Net 30',
  });

  const loadData = async () => {
    const v = await db.vendors.toArray();
    setVendors(v);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    const newVendor: Vendor = {
      id: `vendor-${Date.now()}`,
      code: `VEN-${Math.floor(500 + Math.random() * 500)}`,
      name: form.name,
      email: form.email,
      phone: form.phone || '+1 (800) 555-0199',
      address: form.address,
      category: form.category,
      paymentTerms: form.paymentTerms,
      status: 'active',
      rating: 4.8,
    };

    await db.vendors.add(newVendor);
    setIsModalOpen(false);
    loadData();
  };

  const columns: ColumnDef<Vendor>[] = [
    {
      accessorKey: 'code',
      header: 'Vendor Code',
      cell: ({ row }) => <span className="font-mono font-medium text-blue-600">{row.original.code}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Vendor Organization',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-slate-800">{row.original.name}</div>
          <div className="text-[11px] text-slate-400">{row.original.address}</div>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Supply Domain',
      cell: ({ row }) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
          {row.original.category}
        </span>
      ),
    },
    {
      accessorKey: 'paymentTerms',
      header: 'Terms',
      cell: ({ row }) => <span className="font-medium text-slate-700">{row.original.paymentTerms}</span>,
    },
    {
      accessorKey: 'rating',
      header: 'SLA Score',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-amber-500 font-semibold">
          <Star className="w-3.5 h-3.5 fill-amber-400" />
          <span>{row.original.rating.toFixed(1)}</span>
        </div>
      ),
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Approved Vendor Registry</h1>
          <p className="text-xs text-slate-500 mt-1">
            Certified hardware suppliers, credit terms and supplier reliability rating.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Onboard Vendor
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={vendors}
        searchPlaceholder="Search vendors..."
        exportFilename="NexusERP_Vendor_Register"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Onboard Certified Vendor"
        description="Registers supplier entity for procurement purchasing requisitions."
      >
        <form onSubmit={handleCreateVendor} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Company Legal Name</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. NextGen Micro Technologies Inc."
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Corporate Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Supply Domain</label>
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
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Credit Terms</label>
              <select
                value={form.paymentTerms}
                onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 60">Net 60 Days</option>
                <option value="Due on Receipt">Due on Receipt</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Register Vendor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
