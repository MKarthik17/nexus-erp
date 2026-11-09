import React, { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { db } from '@/database';
import type { Expense, Department } from '@/shared/types';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Plus, Check, X, Receipt } from 'lucide-react';
import { formatMinorCurrency } from '@/shared/utils/formatters';
import { useAuth } from '@/core/auth/AuthContext';

export const ExpensesPage: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    category: 'software' as Expense['category'],
    amount: 1250,
    departmentId: '',
    description: '',
  });

  const loadData = async () => {
    const [exps, depts] = await Promise.all([
      db.expenses.toArray(),
      db.departments.toArray(),
    ]);
    setExpenses(exps);
    setDepartments(depts);
    if (depts.length > 0 && !form.departmentId) {
      setForm((prev) => ({ ...prev, departmentId: depts[0].id }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const newExp: Expense = {
      id: `exp-${Date.now()}`,
      expenseNumber: `EXP-2026-${Math.floor(9000 + Math.random() * 1000)}`,
      category: form.category,
      amountMinor: form.amount * 100,
      departmentId: form.departmentId,
      submittedById: user?.id || 'user-emp',
      submittedByName: user?.name || 'Sarah Jenkins',
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      description: form.description || 'Enterprise project expense claim',
    };

    await db.expenses.add(newExp);

    // Register workflow
    await db.approvalWorkflows.add({
      id: `wf-exp-${Date.now()}`,
      type: 'expense',
      referenceId: newExp.id,
      title: `Expense Claim: ${formatMinorCurrency(newExp.amountMinor)} (${newExp.category.toUpperCase()})`,
      amountMinor: newExp.amountMinor,
      currentStep: 1,
      totalSteps: 1,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: `h-${Date.now()}`,
          step: 1,
          stepName: 'Department Finance Review',
          actorId: user?.id || 'user-emp',
          actorName: user?.name || 'Sarah Jenkins',
          actorRole: user?.role || 'employee',
          action: 'submitted',
          timestamp: new Date().toISOString(),
        },
      ],
    });

    setIsModalOpen(false);
    loadData();
  };

  const handleApprove = async (exp: Expense) => {
    await db.expenses.update(exp.id, { status: 'approved' });
    loadData();
  };

  const handleReject = async (exp: Expense) => {
    const reason = window.prompt('Specify reason for expense rejection:');
    if (!reason) return;
    await db.expenses.update(exp.id, { status: 'rejected', rejectionReason: reason });
    loadData();
  };

  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: 'expenseNumber',
      header: 'Expense Code',
      cell: ({ row }) => <span className="font-mono font-medium text-blue-600">{row.original.expenseNumber}</span>,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
          {row.original.category.replace('_', ' ')}
        </span>
      ),
    },
    {
      accessorKey: 'amountMinor',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-bold text-slate-900">{formatMinorCurrency(row.original.amountMinor)}</span>
      ),
    },
    {
      accessorKey: 'departmentId',
      header: 'Division',
      cell: ({ row }) => {
        const d = departments.find((dept) => dept.id === row.original.departmentId);
        return <span>{d?.code || '-'}</span>;
      },
    },
    {
      accessorKey: 'submittedByName',
      header: 'Claimant',
      cell: ({ row }) => <span className="text-slate-600 font-medium">{row.original.submittedByName}</span>,
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => <span className="text-slate-500">{row.original.date}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Approval Status',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === 'approved'
              ? 'success'
              : row.original.status === 'pending'
              ? 'warning'
              : 'danger'
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
        if (row.original.status !== 'pending') {
          return <span className="text-[11px] text-slate-400">Processed</span>;
        }
        return (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-7 px-2"
              onClick={() => handleApprove(row.original)}
            >
              <Check className="w-3 h-3 mr-1" /> Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50 h-7 px-2"
              onClick={() => handleReject(row.original)}
            >
              <X className="w-3 h-3 mr-1" /> Reject
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Corporate Expenses</h1>
          <p className="text-xs text-slate-500 mt-1">
            Reimbursement ledger, receipt verification and divisional cost allocation.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Submit Expense Claim
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={expenses}
        searchPlaceholder="Filter expense records..."
        exportFilename="NexusERP_Corporate_Expenses"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="File Corporate Expense Reimbursement"
        description="Attach expense receipts and route to department financial approver."
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Expense Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="travel">Travel & Client Lodging</option>
                <option value="software">Software SaaS Licenses</option>
                <option value="office_supplies">Office Supplies & Facilities</option>
                <option value="hardware">Hardware & Peripherals</option>
                <option value="utilities">Utilities & Cloud Infra</option>
                <option value="marketing">Marketing & Sponsorship</option>
                <option value="consulting">Legal & External Consulting</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Charging Division</label>
              <select
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Claim Total ($)</label>
            <input
              required
              type="number"
              min={1}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Business Purpose Statement</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="State business necessity, project code, or client event..."
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Submit Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
