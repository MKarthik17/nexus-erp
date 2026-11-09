import React, { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { db } from '@/database';
import type { Customer } from '@/shared/types';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Plus, Users, Building, Mail, Phone } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '500 Technology Drive, Suite 400, New York, NY',
    customerType: 'enterprise' as Customer['customerType'],
  });

  const loadData = async () => {
    const c = await db.customers.toArray();
    setCustomers(c);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      code: `CUST-${Math.floor(7000 + Math.random() * 2000)}`,
      name: form.name,
      company: form.company,
      email: form.email,
      phone: form.phone || '+1 (800) 555-0182',
      address: form.address,
      customerType: form.customerType,
      status: 'active',
    };

    await db.customers.add(newCust);
    setIsModalOpen(false);
    loadData();
  };

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'code',
      header: 'Account Code',
      cell: ({ row }) => <span className="font-mono font-medium text-blue-600">{row.original.code}</span>,
    },
    {
      accessorKey: 'company',
      header: 'Enterprise Client',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-slate-800">{row.original.company}</div>
          <div className="text-[11px] text-slate-400">{row.original.address}</div>
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Primary Representative',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-slate-700">{row.original.name}</div>
          <div className="text-[11px] text-slate-400">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'customerType',
      header: 'Tier',
      cell: ({ row }) => (
        <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
          {row.original.customerType}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Account Status',
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Customer & Client Accounts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise customer portfolio, commercial relationship records and billing profiles.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Client Account
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        searchPlaceholder="Filter customers..."
        exportFilename="NexusERP_Customer_Accounts"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Enterprise Client Account"
        description="Creates client profile for commercial quotes and sales order fulfillment."
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Company Name</label>
              <input
                required
                type="text"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="e.g. BlueSky Financial Capital"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Key Representative</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Marcus Henderson"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Billing Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Client Tier</label>
              <select
                value={form.customerType}
                onChange={(e) => setForm({ ...form, customerType: e.target.value as any })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="enterprise">Enterprise Tier</option>
                <option value="smb">Commercial SMB</option>
                <option value="government">Federal / Government</option>
                <option value="individual">Direct Partner</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Register Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
