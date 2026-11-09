import React, { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { db } from '@/database';
import type { Invoice, Customer, Branch } from '@/shared/types';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Plus, Check, FileText, Printer, DollarSign } from 'lucide-react';
import { formatMinorCurrency } from '@/shared/utils/formatters';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [form, setForm] = useState({
    customerId: '',
    branchId: '',
    dueDate: '2026-12-15',
    itemDescription: 'Enterprise Platform Subscription License - Tier 1',
    quantity: 1,
    unitPrice: 15000,
  });

  const loadData = async () => {
    const [invs, custs, brs] = await Promise.all([
      db.invoices.toArray(),
      db.customers.toArray(),
      db.branches.toArray(),
    ]);
    setInvoices(invs);
    setCustomers(custs);
    setBranches(brs);

    if (custs.length > 0 && !form.customerId) {
      setForm((prev) => ({
        ...prev,
        customerId: custs[0].id,
        branchId: brs[0]?.id || '',
      }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === form.customerId);
    const subtotalMinor = form.quantity * form.unitPrice * 100;
    const taxMinor = Math.round(subtotalMinor * 0.08);
    const totalMinor = subtotalMinor + taxMinor;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-${Math.floor(8000 + Math.random() * 2000)}`,
      customerId: form.customerId,
      customerName: cust?.company || 'Corporate Enterprise',
      branchId: form.branchId,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: form.dueDate,
      items: [
        {
          id: `item-${Date.now()}`,
          productId: 'prod-001',
          description: form.itemDescription,
          quantity: form.quantity,
          unitPriceMinor: form.unitPrice * 100,
          taxRatePercent: 8,
          discountMinor: 0,
          totalMinor,
        },
      ],
      subtotalMinor,
      taxMinor,
      discountMinor: 0,
      totalMinor,
      paidAmountMinor: 0,
      status: 'pending',
    };

    await db.invoices.add(newInvoice);

    await db.auditLogs.add({
      id: `audit-${Date.now()}`,
      userId: 'user-fin',
      userName: 'Marcus Vance',
      module: 'Finance',
      action: 'CREATE_INVOICE',
      recordId: newInvoice.invoiceNumber,
      description: `Drafted invoice for ${newInvoice.customerName} of amount ${formatMinorCurrency(totalMinor)}`,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1',
    });

    setIsModalOpen(false);
    loadData();
  };

  const handleRecordPayment = async (inv: Invoice) => {
    if (window.confirm(`Mark invoice ${inv.invoiceNumber} as fully paid?`)) {
      await db.invoices.update(inv.id, {
        status: 'paid',
        paidAmountMinor: inv.totalMinor,
      });
      loadData();
    }
  };

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice #',
      cell: ({ row }) => <span className="font-mono font-medium text-blue-600">{row.original.invoiceNumber}</span>,
    },
    {
      accessorKey: 'customerName',
      header: 'Customer / Client',
      cell: ({ row }) => <span className="font-semibold text-slate-800">{row.original.customerName}</span>,
    },
    {
      accessorKey: 'invoiceDate',
      header: 'Date Issued',
      cell: ({ row }) => <span className="text-slate-500">{row.original.invoiceDate}</span>,
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => <span className="text-slate-500">{row.original.dueDate}</span>,
    },
    {
      accessorKey: 'totalMinor',
      header: 'Gross Total',
      cell: ({ row }) => (
        <span className="font-bold text-slate-900">{formatMinorCurrency(row.original.totalMinor)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Payment Status',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === 'paid'
              ? 'success'
              : row.original.status === 'pending'
              ? 'warning'
              : 'danger'
          }
        >
          {row.original.status.replace('_', ' ')}
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
            onClick={() => setSelectedInvoice(row.original)}
            title="Printable Statement"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
          </Button>
          {row.original.status !== 'paid' && (
            <Button
              size="sm"
              variant="outline"
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-7 px-2"
              onClick={() => handleRecordPayment(row.original)}
            >
              <Check className="w-3 h-3 mr-1" /> Paid
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Commercial Invoices</h1>
          <p className="text-xs text-slate-500 mt-1">
            Accounts receivable billing ledger, payment receipts and tax line auditing.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Create Invoice
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        searchPlaceholder="Search invoices by number or customer..."
        exportFilename="NexusERP_Invoices_Register"
      />

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Draft Commercial Invoice"
        description="Calculates 8% state commerce tax and generates invoice ledger record."
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Customer Account</label>
              <select
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company} ({c.name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Billing Branch</label>
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
            <label className="text-xs font-semibold text-slate-700 block mb-1">Due Date</label>
            <input
              required
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Line Item Description</label>
            <input
              required
              type="text"
              value={form.itemDescription}
              onChange={(e) => setForm({ ...form, itemDescription: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Quantity</label>
              <input
                required
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Unit Price ($)</label>
              <input
                required
                type="number"
                min={1}
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Post Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Printable Invoice Dialog */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Official Invoice: ${selectedInvoice.invoiceNumber}`}
          description={`Tax Compliant Commercial Statement`}
          maxWidth="xl"
        >
          <div className="p-4 border border-slate-200 rounded-lg space-y-4 text-xs font-sans bg-white">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <div className="text-lg font-bold text-slate-900">NEXUS ENTERPRISES GLOBAL INC.</div>
                <div className="text-slate-500 text-[11px]">100 Enterprise Way, Suite 500</div>
                <div className="text-slate-500 text-[11px]">San Francisco, CA 94105</div>
                <div className="text-slate-500 text-[11px]">Tax ID: US-EIN-883920194</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-blue-600 text-sm">{selectedInvoice.invoiceNumber}</div>
                <div className="text-slate-500">Issued: {selectedInvoice.invoiceDate}</div>
                <div className="text-slate-500">Due: {selectedInvoice.dueDate}</div>
              </div>
            </div>

            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Billed Client</span>
              <div className="font-bold text-slate-800 text-sm">{selectedInvoice.customerName}</div>
            </div>

            <table className="w-full text-left border-collapse border border-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-2 border border-slate-200">Item Description</th>
                  <th className="p-2 border border-slate-200 text-right">Qty</th>
                  <th className="p-2 border border-slate-200 text-right">Price</th>
                  <th className="p-2 border border-slate-200 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border border-slate-200">{it.description}</td>
                    <td className="p-2 border border-slate-200 text-right">{it.quantity}</td>
                    <td className="p-2 border border-slate-200 text-right">{formatMinorCurrency(it.unitPriceMinor)}</td>
                    <td className="p-2 border border-slate-200 text-right font-medium">{formatMinorCurrency(it.totalMinor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end pt-2">
              <div className="w-56 space-y-1 text-right">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>{formatMinorCurrency(selectedInvoice.subtotalMinor)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax (8%):</span>
                  <span>{formatMinorCurrency(selectedInvoice.taxMinor)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-1">
                  <span>Gross Total:</span>
                  <span>{formatMinorCurrency(selectedInvoice.totalMinor)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                window.print();
              }}
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              Print / Save PDF
            </Button>
            <Button size="sm" onClick={() => setSelectedInvoice(null)}>
              Dismiss
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
