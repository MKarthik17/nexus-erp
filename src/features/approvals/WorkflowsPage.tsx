import React, { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { db } from '@/database';
import type { ApprovalWorkflow, ApprovalHistory } from '@/shared/types';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Check, X, History, Clock, FileCheck } from 'lucide-react';
import { formatMinorCurrency, formatDateTime } from '@/shared/utils/formatters';
import { useAuth } from '@/core/auth/AuthContext';

export const WorkflowsPage: React.FC = () => {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [selectedWf, setSelectedWf] = useState<ApprovalWorkflow | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const loadData = async () => {
    const wf = await db.approvalWorkflows.reverse().toArray();
    setWorkflows(wf);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (wf: ApprovalWorkflow) => {
    const isFinalStep = wf.currentStep >= wf.totalSteps;
    const nextStep = isFinalStep ? wf.currentStep : wf.currentStep + 1;
    const nextStatus = isFinalStep ? 'approved' : 'pending';

    const newHistory: ApprovalHistory = {
      id: `h-${Date.now()}`,
      step: wf.currentStep,
      stepName: isFinalStep ? 'Final Approval' : `Step ${wf.currentStep} Sign-Off`,
      actorId: user?.id || 'user-admin',
      actorName: user?.name || 'Administrator',
      actorRole: user?.role || 'admin',
      action: 'approved',
      comment: 'Reviewed and certified under corporate procurement guidelines.',
      timestamp: new Date().toISOString(),
    };

    await db.approvalWorkflows.update(wf.id, {
      status: nextStatus,
      currentStep: nextStep,
      history: [...wf.history, newHistory],
      updatedAt: new Date().toISOString(),
    });

    // Also update parent record status if purchase order / request
    if (nextStatus === 'approved') {
      if (wf.type === 'purchase_order') {
        await db.purchaseOrders.update(wf.referenceId, { status: 'approved' });
      } else if (wf.type === 'expense') {
        await db.expenses.update(wf.referenceId, { status: 'approved' });
      }
    }

    loadData();
  };

  const handleReject = async (wf: ApprovalWorkflow) => {
    const reason = window.prompt('Specify required reason for audit rejection:');
    if (!reason) return;

    const newHistory: ApprovalHistory = {
      id: `h-${Date.now()}`,
      step: wf.currentStep,
      stepName: `Step ${wf.currentStep} Review`,
      actorId: user?.id || 'user-admin',
      actorName: user?.name || 'Administrator',
      actorRole: user?.role || 'admin',
      action: 'rejected',
      comment: reason,
      timestamp: new Date().toISOString(),
    };

    await db.approvalWorkflows.update(wf.id, {
      status: 'rejected',
      history: [...wf.history, newHistory],
      updatedAt: new Date().toISOString(),
    });

    if (wf.type === 'purchase_order') {
      await db.purchaseOrders.update(wf.referenceId, { status: 'cancelled' });
    } else if (wf.type === 'expense') {
      await db.expenses.update(wf.referenceId, { status: 'rejected' });
    }

    loadData();
  };

  const columns: ColumnDef<ApprovalWorkflow>[] = [
    {
      accessorKey: 'type',
      header: 'Workflow Domain',
      cell: ({ row }) => (
        <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
          {row.original.type.replace('_', ' ')}
        </span>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Subject & Reference Record',
      cell: ({ row }) => <span className="font-semibold text-slate-800">{row.original.title}</span>,
    },
    {
      accessorKey: 'amountMinor',
      header: 'Value',
      cell: ({ row }) =>
        row.original.amountMinor ? (
          <span className="font-bold text-slate-900">{formatMinorCurrency(row.original.amountMinor)}</span>
        ) : (
          <span className="text-slate-400">N/A</span>
        ),
    },
    {
      id: 'stepProgress',
      header: 'Approval Stage',
      cell: ({ row }) => (
        <span className="text-slate-600 font-mono text-[11px]">
          Stage {row.original.currentStep} of {row.original.totalSteps}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Engine Status',
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
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedWf(row.original);
              setIsHistoryModalOpen(true);
            }}
            title="Inspect Audit Trail"
          >
            <History className="w-3.5 h-3.5 text-slate-600" />
          </Button>

          {row.original.status === 'pending' && (
            <>
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
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Enterprise Multi-Tier Approvals</h1>
        <p className="text-xs text-slate-500 mt-1">
          Governance engine managing stage gates, approver delegation and immutable decision histories.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={workflows}
        searchPlaceholder="Filter pending approvals..."
        exportFilename="NexusERP_Approval_Workflows"
      />

      {/* History Audit Modal */}
      {selectedWf && (
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title={`Approval Audit Trail: ${selectedWf.title}`}
          description={`Workflow ID: ${selectedWf.id} | Initiated: ${formatDateTime(selectedWf.createdAt)}`}
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="space-y-3 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {selectedWf.history.map((h, idx) => (
                <div key={idx} className="relative">
                  <div
                    className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                      h.action === 'approved'
                        ? 'border-emerald-500 text-emerald-500'
                        : h.action === 'rejected'
                        ? 'border-rose-500 text-rose-500'
                        : 'border-blue-500 text-blue-500'
                    }`}
                  />
                  <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{h.stepName}</span>
                      <span className="text-[10px] text-slate-400">{formatDateTime(h.timestamp)}</span>
                    </div>
                    <div className="mt-1 text-slate-600">
                      Sign-off by <span className="font-semibold">{h.actorName}</span> ({h.actorRole})
                    </div>
                    {h.comment && (
                      <div className="mt-1.5 p-2 bg-white rounded border border-slate-100 text-slate-700 italic">
                        "{h.comment}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button size="sm" onClick={() => setIsHistoryModalOpen(false)}>
                Close Trail
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
