import React, { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { db } from '@/database';
import type { Budget, Department } from '@/shared/types';
import { DataTable } from '@/components/ui/DataTable';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { formatMinorCurrency } from '@/shared/utils/formatters';
import { PieChart, AlertCircle, CheckCircle2 } from 'lucide-react';

export const BudgetsPage: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const loadData = async () => {
    const [b, d] = await Promise.all([
      db.budgets.toArray(),
      db.departments.toArray(),
    ]);
    setBudgets(b);
    setDepartments(d);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalAllocated = budgets.reduce((acc, b) => acc + b.allocatedMinor, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spentMinor, 0);

  const columns: ColumnDef<Budget>[] = [
    {
      id: 'department',
      header: 'Department Division',
      cell: ({ row }) => {
        const d = departments.find((dept) => dept.id === row.original.departmentId);
        return (
          <div>
            <div className="font-semibold text-slate-800">{d?.name || 'Operations'}</div>
            <div className="text-[10px] text-slate-400 font-mono">{d?.code}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'allocatedMinor',
      header: 'Total Allocation',
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900">{formatMinorCurrency(row.original.allocatedMinor)}</span>
      ),
    },
    {
      accessorKey: 'spentMinor',
      header: 'Disbursed / Spent',
      cell: ({ row }) => (
        <span className="font-semibold text-slate-700">{formatMinorCurrency(row.original.spentMinor)}</span>
      ),
    },
    {
      id: 'remaining',
      header: 'Remaining Capital',
      cell: ({ row }) => {
        const rem = row.original.allocatedMinor - row.original.spentMinor;
        return (
          <span className={`font-semibold ${rem < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {formatMinorCurrency(rem)}
          </span>
        );
      },
    },
    {
      id: 'utilization',
      header: 'Utilization Gauge',
      cell: ({ row }) => {
        const pct = Math.round((row.original.spentMinor / row.original.allocatedMinor) * 100);
        return (
          <div className="w-36 space-y-1">
            <div className="flex justify-between text-[11px] font-medium">
              <span>{pct}%</span>
              <span>{pct > 85 ? 'High Burn' : 'Normal'}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full ${
                  pct > 90 ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Departmental Fiscal Budgets</h1>
        <p className="text-xs text-slate-500 mt-1">
          Fiscal year 2026 cap tracking, operational burn rate, and capital utilization.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-600">
          <div className="text-xs font-semibold uppercase text-slate-500">Corporate Allocated Cap</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{formatMinorCurrency(totalAllocated)}</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-600">
          <div className="text-xs font-semibold uppercase text-slate-500">Total Capital Spent</div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{formatMinorCurrency(totalSpent)}</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-600">
          <div className="text-xs font-semibold uppercase text-slate-500">Uncommitted Reserves</div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            {formatMinorCurrency(totalAllocated - totalSpent)}
          </div>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={budgets}
        searchPlaceholder="Filter department budgets..."
        exportFilename="NexusERP_Budgets_Matrix"
      />
    </div>
  );
};
