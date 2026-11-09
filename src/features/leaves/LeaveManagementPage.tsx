import React, { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { db } from '@/database';
import type { LeaveRequest, Employee } from '@/shared/types';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Plus, Check, X, Calendar } from 'lucide-react';
import { useAuth } from '@/core/auth/AuthContext';

export const LeaveManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    employeeId: 'emp-001',
    leaveType: 'annual' as LeaveRequest['leaveType'],
    startDate: '2026-11-15',
    endDate: '2026-11-18',
    reason: '',
  });

  const loadData = async () => {
    const [l, e] = await Promise.all([
      db.leaveRequests.toArray(),
      db.employees.toArray(),
    ]);
    setLeaves(l);
    setEmployees(e);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((emp) => emp.id === form.employeeId);
    const newLeave: LeaveRequest = {
      id: `leave-${Date.now()}`,
      employeeId: form.employeeId,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Enterprise Employee',
      leaveType: form.leaveType,
      startDate: form.startDate,
      endDate: form.endDate,
      daysCount: 3,
      reason: form.reason || 'Family medical engagement & personal leave',
      status: 'pending',
      appliedAt: new Date().toISOString(),
    };

    await db.leaveRequests.add(newLeave);

    // Also register workflow approval item
    await db.approvalWorkflows.add({
      id: `wf-leave-${Date.now()}`,
      type: 'leave',
      referenceId: newLeave.id,
      title: `Leave Request: ${newLeave.employeeName} (${newLeave.leaveType.toUpperCase()})`,
      currentStep: 1,
      totalSteps: 1,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: `h-${Date.now()}`,
          step: 1,
          stepName: 'Manager Review',
          actorId: user?.id || 'user-admin',
          actorName: user?.name || 'Administrator',
          actorRole: user?.role || 'admin',
          action: 'submitted',
          timestamp: new Date().toISOString(),
        },
      ],
    });

    setIsModalOpen(false);
    loadData();
  };

  const handleApprove = async (leave: LeaveRequest) => {
    await db.leaveRequests.update(leave.id, {
      status: 'approved',
      approverId: user?.id || 'user-hr',
      approverName: user?.name || 'Elena Rostova',
    });
    // Send notification
    await db.notifications.add({
      id: `notif-${Date.now()}`,
      title: 'Leave Approved',
      message: `Your ${leave.leaveType} leave request starting ${leave.startDate} has been approved.`,
      type: 'success',
      category: 'workflow',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    loadData();
  };

  const handleReject = async (leave: LeaveRequest) => {
    const reason = window.prompt('Specify justification for leave rejection:');
    if (!reason) return;

    await db.leaveRequests.update(leave.id, {
      status: 'rejected',
      rejectionReason: reason,
      approverId: user?.id || 'user-hr',
      approverName: user?.name || 'Elena Rostova',
    });
    loadData();
  };

  const columns: ColumnDef<LeaveRequest>[] = [
    {
      accessorKey: 'employeeName',
      header: 'Applicant',
      cell: ({ row }) => <span className="font-semibold text-slate-800">{row.original.employeeName}</span>,
    },
    {
      accessorKey: 'leaveType',
      header: 'Type',
      cell: ({ row }) => (
        <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
          {row.original.leaveType}
        </span>
      ),
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      cell: ({ row }) => <span>{row.original.startDate}</span>,
    },
    {
      accessorKey: 'endDate',
      header: 'End Date',
      cell: ({ row }) => <span>{row.original.endDate}</span>,
    },
    {
      accessorKey: 'daysCount',
      header: 'Days',
      cell: ({ row }) => <span>{row.original.daysCount} days</span>,
    },
    {
      accessorKey: 'reason',
      header: 'Justification',
      cell: ({ row }) => (
        <span className="text-slate-600 max-w-xs truncate block" title={row.original.reason}>
          {row.original.reason}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
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
          return <span className="text-[11px] text-slate-400">Archived</span>;
        }
        return (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-7 px-2"
              onClick={() => handleApprove(row.original)}
            >
              <Check className="w-3.5 h-3.5 mr-1" /> Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50 h-7 px-2"
              onClick={() => handleReject(row.original)}
            >
              <X className="w-3.5 h-3.5 mr-1" /> Reject
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Leave & Absence Governance</h1>
          <p className="text-xs text-slate-500 mt-1">
            PTO balance accounting, medical leaves, and multi-tier department approvals.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Submit Leave Request
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={leaves}
        searchPlaceholder="Search leave requests..."
        exportFilename="NexusERP_Leave_Records"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit Employee Leave Request"
        description="Deducts allocated balances from employee vacation allowance once authorized."
      >
        <form onSubmit={handleApplyLeave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Employee</label>
            <select
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {employees.slice(0, 30).map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Leave Category</label>
            <select
              value={form.leaveType}
              onChange={(e) => setForm({ ...form, leaveType: e.target.value as any })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="annual">Paid Annual Vacation (PTO)</option>
              <option value="sick">Medical / Sick Leave</option>
              <option value="casual">Casual Personal Leave</option>
              <option value="unpaid">Unpaid Leave</option>
              <option value="maternity">Parental / Maternity Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Start Date</label>
              <input
                required
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">End Date</label>
              <input
                required
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Statement & Justification</label>
            <textarea
              required
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="State coverage arrangements or reason for absence..."
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Dispatch for Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
