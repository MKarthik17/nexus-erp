import React, { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { db } from '@/database';
import type { User, Role } from '@/shared/types';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ShieldCheck, UserPlus, Key } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'finance_manager' as Role,
  });

  const loadData = async () => {
    const u = await db.users.toArray();
    setUsers(u);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: form.name,
      email: form.email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.name}`,
      role: form.role,
      branchId: 'branch-hq',
      departmentId: 'dept-exec',
      permissions: ['reports.read'],
      status: 'active',
    };

    await db.users.add(newUser);
    setIsModalOpen(false);
    loadData();
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Enterprise User',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <img
            src={row.original.avatar}
            alt={row.original.name}
            className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200"
          />
          <div>
            <div className="font-semibold text-slate-800">{row.original.name}</div>
            <div className="text-[11px] text-slate-400">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Assigned Role',
      cell: ({ row }) => (
        <span className="capitalize px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium text-[11px]">
          {row.original.role.replace('_', ' ')}
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">User Identity & Access Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            RBAC enterprise role provisioning, identity federation and access privileges.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-1.5" />
          Provision User
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Filter user accounts..."
        exportFilename="NexusERP_Users_Registry"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision Enterprise User"
        description="Creates IAM credentials and attaches security policy roles."
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">SSO Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Role Assignment</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as any })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="super_admin">Super Administrator</option>
              <option value="hr_manager">HR Talent Manager</option>
              <option value="finance_manager">Finance Controller</option>
              <option value="inventory_manager">Logistics Director</option>
              <option value="procurement_manager">Procurement Specialist</option>
              <option value="employee">Standard Enterprise Employee</option>
              <option value="auditor">Auditor (Strict Read-Only)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Provision IAM Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
