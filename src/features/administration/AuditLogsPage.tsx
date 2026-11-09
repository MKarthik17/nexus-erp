import React, { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { db } from '@/database';
import type { AuditLog } from '@/shared/types';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/shared/utils/formatters';
import { Shield, Lock } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const loadData = async () => {
    const l = await db.auditLogs.reverse().toArray();
    setLogs(l);
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Event Timestamp',
      cell: ({ row }) => <span className="font-mono text-slate-500">{formatDateTime(row.original.timestamp)}</span>,
    },
    {
      accessorKey: 'module',
      header: 'System Module',
      cell: ({ row }) => (
        <span className="font-medium text-slate-800 px-2 py-0.5 rounded bg-slate-100 text-[11px]">
          {row.original.module}
        </span>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Operation Action',
      cell: ({ row }) => (
        <span className="font-mono text-[11px] font-bold text-blue-600">{row.original.action}</span>
      ),
    },
    {
      accessorKey: 'userName',
      header: 'Actor Identity',
      cell: ({ row }) => <span className="font-semibold text-slate-800">{row.original.userName}</span>,
    },
    {
      accessorKey: 'description',
      header: 'Audit Description',
      cell: ({ row }) => <span className="text-slate-600">{row.original.description}</span>,
    },
    {
      accessorKey: 'ipAddress',
      header: 'Source IP',
      cell: ({ row }) => <span className="font-mono text-slate-400 text-[11px]">{row.original.ipAddress}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Immutable Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident system activity event telemetry for SOC 2 Type II compliance.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-medium">
          <Lock className="w-3.5 h-3.5" /> Append-Only Enforced
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        searchPlaceholder="Filter audit events..."
        exportFilename="NexusERP_Audit_Trail_Log"
      />
    </div>
  );
};
