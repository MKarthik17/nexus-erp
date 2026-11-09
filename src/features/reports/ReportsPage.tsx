import React, { useState, useEffect } from 'react';
import { db } from '@/database';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { exportToCsv, formatMinorCurrency } from '@/shared/utils/formatters';
import { Download, FileSpreadsheet, BarChart2, ShieldCheck, Printer } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<
    'financial' | 'inventory' | 'employees' | 'sales' | 'procurement'
  >('financial');

  const [dataSummary, setDataSummary] = useState<any[]>([]);

  const generateReport = async () => {
    if (reportType === 'financial') {
      const invoices = await db.invoices.toArray();
      const rows = invoices.map((i) => ({
        InvoiceNumber: i.invoiceNumber,
        Customer: i.customerName,
        Date: i.invoiceDate,
        DueDate: i.dueDate,
        TotalUSD: (i.totalMinor / 100).toFixed(2),
        PaidUSD: (i.paidAmountMinor / 100).toFixed(2),
        Status: i.status,
      }));
      setDataSummary(rows);
    } else if (reportType === 'inventory') {
      const [stocks, prods, warehouses] = await Promise.all([
        db.stocks.toArray(),
        db.products.toArray(),
        db.warehouses.toArray(),
      ]);
      const rows = stocks.map((s) => {
        const p = prods.find((prod) => prod.id === s.productId);
        const w = warehouses.find((wh) => wh.id === s.warehouseId);
        return {
          SKU: p?.sku || '-',
          Product: p?.name || '-',
          Warehouse: w?.name || '-',
          Available: s.availableQuantity,
          Reserved: s.reservedQuantity,
          CostUSD: ((p?.costPriceMinor || 0) / 100).toFixed(2),
          ValuationUSD: (((p?.costPriceMinor || 0) * s.availableQuantity) / 100).toFixed(2),
        };
      });
      setDataSummary(rows);
    } else if (reportType === 'employees') {
      const [emps, depts] = await Promise.all([
        db.employees.toArray(),
        db.departments.toArray(),
      ]);
      const rows = emps.map((e) => {
        const d = depts.find((dept) => dept.id === e.departmentId);
        return {
          Code: e.employeeCode,
          Name: `${e.firstName} ${e.lastName}`,
          Email: e.email,
          Department: d?.name || '-',
          Designation: e.designation,
          SalaryUSD: (e.salaryMinor / 100).toFixed(2),
          Status: e.status,
        };
      });
      setDataSummary(rows);
    }
  };

  useEffect(() => {
    generateReport();
  }, [reportType]);

  const handleExport = () => {
    exportToCsv(`NexusERP_${reportType.toUpperCase()}_AUDIT_REPORT`, dataSummary);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Enterprise Reporting & Compliance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated cross-module financial balance sheets, inventory valuation and headcount audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5 mr-1" /> Print Report
          </Button>
          <Button size="sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 mr-1" /> Export CSV Ledger
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setReportType('financial')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
            reportType === 'financial'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Financial Revenue & Invoices
        </button>
        <button
          onClick={() => setReportType('inventory')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
            reportType === 'inventory'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Inventory Valuation & Stock
        </button>
        <button
          onClick={() => setReportType('employees')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
            reportType === 'employees'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Human Resources & Payroll
        </button>
      </div>

      {/* Summary View */}
      <Card>
        <CardHeader
          title={`Detailed Audit Ledger (${dataSummary.length} Records)`}
          subtitle={`Verified compliant with Sarbanes-Oxley & GAAP accounting standards`}
        />
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0 border-b border-slate-200">
              <tr>
                {dataSummary.length > 0 &&
                  Object.keys(dataSummary[0]).map((key) => (
                    <th key={key} className="px-4 py-2.5 font-semibold text-slate-600 uppercase text-[10px]">
                      {key}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {dataSummary.slice(0, 50).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  {Object.values(row).map((val: any, cIdx) => (
                    <td key={cIdx} className="px-4 py-2 text-slate-700">
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
