import React, { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { db } from '@/database';
import type { Department, Employee, Branch } from '@/shared/types';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Plus, Building, Users, DollarSign } from 'lucide-react';
import { formatMinorCurrency, formatNumber } from '@/shared/utils/formatters';

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    budget: 500000,
    branchId: '',
  });

  const loadData = async () => {
    const [d, e, b] = await Promise.all([
      db.departments.toArray(),
      db.employees.toArray(),
      db.branches.toArray(),
    ]);
    setDepartments(d);
    setEmployees(e);
    setBranches(b);
    if (b.length > 0 && !form.branchId) {
      setForm((prev) => ({ ...prev, branchId: b[0].id }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const newDept: Department = {
      id: `dept-${Date.now()}`,
      name: form.name,
      code: form.code.toUpperCase(),
      budgetMinor: form.budget * 100,
      branchId: form.branchId,
    };
    await db.departments.add(newDept);
    setIsModalOpen(false);
    setForm({ name: '', code: '', budget: 500000, branchId: branches[0]?.id || '' });
    loadData();
  };

  const columns: ColumnDef<Department>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => <span className="font-mono font-bold text-blue-600">{row.original.code}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Department Division',
      cell: ({ row }) => <span className="font-semibold text-slate-800">{row.original.name}</span>,
    },
    {
      id: 'headcount',
      header: 'Personnel Headcount',
      cell: ({ row }) => {
        const count = employees.filter((e) => e.departmentId === row.original.id).length;
        return <span className="font-medium text-slate-700">{count} Active Staff</span>;
      },
    },
    {
      accessorKey: 'budgetMinor',
      header: 'Fiscal Budget (Annual)',
      cell: ({ row }) => (
        <span className="font-medium text-slate-900">{formatMinorCurrency(row.original.budgetMinor)}</span>
      ),
    },
    {
      accessorKey: 'branchId',
      header: 'Operating Facility',
      cell: ({ row }) => {
        const b = branches.find((branch) => branch.id === row.original.branchId);
        return <span className="text-slate-500">{b?.name || '-'}</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Department Governance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Organizational division structures, budget ceilings and functional hierarchy.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Department
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Total Divisions</span>
            <Building className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{departments.length} Units</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Total Allocated Budget</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {formatMinorCurrency(departments.reduce((acc, d) => acc + d.budgetMinor, 0))}
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Total Enterprise Staff</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{employees.length} Members</div>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={departments}
        searchPlaceholder="Search departments by code or title..."
        exportFilename="NexusERP_Departments_Directory"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Department Division"
        description="Provision cost center and link administrative branch."
      >
        <form onSubmit={handleCreateDepartment} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Department Name</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Artificial Intelligence & Analytics"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Division Code</label>
              <input
                required
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="AIA"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Branch Facility</label>
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

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Annual Budget Allocation ($)</label>
            <input
              required
              type="number"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Provision Division
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
