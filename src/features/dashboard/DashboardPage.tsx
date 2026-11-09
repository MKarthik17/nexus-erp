import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  CheckSquare,
  Package,
  AlertOctagon,
  ArrowUpRight,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { db } from '@/database';
import { useBranch } from '@/core/branch/BranchContext';
import { formatMinorCurrency, formatNumber } from '@/shared/utils/formatters';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { selectedBranchId } = useBranch();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    totalRevenueMinor: 0,
    totalExpensesMinor: 0,
    netProfitMinor: 0,
    totalEmployees: 0,
    pendingApprovals: 0,
    inventoryValueMinor: 0,
    outstandingInvoicesMinor: 0,
    activePurchaseOrders: 0,
  });

  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [departmentStats, setDepartmentStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);

    // Filter invoices by branch if branch selected
    let invoices = await db.invoices.toArray();
    let employees = await db.employees.toArray();
    let expenses = await db.expenses.toArray();
    let purchaseOrders = await db.purchaseOrders.toArray();
    let products = await db.products.toArray();
    let stocks = await db.stocks.toArray();
    let workflows = await db.approvalWorkflows.toArray();
    let departments = await db.departments.toArray();

    if (selectedBranchId !== 'all') {
      invoices = invoices.filter((i) => i.branchId === selectedBranchId);
      employees = employees.filter((e) => e.branchId === selectedBranchId);
      purchaseOrders = purchaseOrders.filter((po) => po.branchId === selectedBranchId);
    }

    // Calculations
    const totalRev = invoices
      .filter((i) => i.status === 'paid')
      .reduce((acc, curr) => acc + curr.totalMinor, 0);

    const totalExp = expenses
      .filter((e) => e.status === 'approved')
      .reduce((acc, curr) => acc + curr.amountMinor, 0);

    const outstanding = invoices
      .filter((i) => i.status === 'pending' || i.status === 'overdue')
      .reduce((acc, curr) => acc + (curr.totalMinor - curr.paidAmountMinor), 0);

    const activePOs = purchaseOrders.filter(
      (po) => po.status === 'ordered' || po.status === 'approved' || po.status === 'pending_approval'
    ).length;

    // Stock valuation
    let stockVal = 0;
    stocks.forEach((s) => {
      const prod = products.find((p) => p.id === s.productId);
      if (prod) {
        stockVal += s.availableQuantity * prod.costPriceMinor;
      }
    });

    const pendingWf = workflows.filter((w) => w.status === 'pending').length;

    setMetrics({
      totalRevenueMinor: totalRev,
      totalExpensesMinor: totalExp,
      netProfitMinor: totalRev - totalExp,
      totalEmployees: employees.length,
      pendingApprovals: pendingWf,
      inventoryValueMinor: stockVal,
      outstandingInvoicesMinor: outstanding,
      activePurchaseOrders: activePOs,
    });

    // Recent Invoices as transactions
    setRecentTransactions(invoices.slice(0, 5));

    // Department Stats
    const deptData = departments.map((d) => {
      const empCount = employees.filter((e) => e.departmentId === d.id).length;
      return {
        name: d.code,
        employees: empCount,
        budget: d.budgetMinor / 100,
      };
    });
    setDepartmentStats(deptData);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedBranchId]);

  const revenueChartData = [
    { month: 'Jun', revenue: 420000, expenses: 280000 },
    { month: 'Jul', revenue: 460000, expenses: 310000 },
    { month: 'Aug', revenue: 510000, expenses: 295000 },
    { month: 'Sep', revenue: 590000, expenses: 340000 },
    { month: 'Oct', revenue: 640000, expenses: 380000 },
    { month: 'Nov', revenue: 720000, expenses: 410000 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Executive Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time cross-functional metrics, fiscal trajectory and operational indicators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => navigate('/finance/invoices')}>
            <Plus className="w-3.5 h-3.5" />
            New Invoice
          </Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/inventory/products')}>
            <Plus className="w-3.5 h-3.5" />
            Add Product
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card className="p-4 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-md text-blue-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatMinorCurrency(metrics.totalRevenueMinor)}
          </div>
          <div className="mt-2 flex items-center text-xs text-emerald-600 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            +14.8% from prior quarter
          </div>
        </Card>

        {/* Net Profit */}
        <Card className="p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Profit</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-md text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatMinorCurrency(metrics.netProfitMinor)}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500">
            Margin: 24.2% healthy margin
          </div>
        </Card>

        {/* Employees */}
        <Card className="p-4 border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Workforce Headcount</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-md text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatNumber(metrics.totalEmployees)} Active
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500">
            Across 3 regional enterprise hubs
          </div>
        </Card>

        {/* Inventory Stock Value */}
        <Card className="p-4 border-l-4 border-l-amber-600">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Inventory Valuation</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-md text-amber-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatMinorCurrency(metrics.inventoryValueMinor)}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500">
            Distributed in 5 active warehouses
          </div>
        </Card>

        {/* Outstanding Invoices */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Outstanding Invoices</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
            {formatMinorCurrency(metrics.outstandingInvoicesMinor)}
          </div>
          <div className="mt-1 text-xs text-rose-600 font-medium">Requires A/R follow up</div>
        </Card>

        {/* Pending Approvals */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Approvals</span>
            <CheckSquare className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
            {metrics.pendingApprovals} Actions
          </div>
          <div className="mt-1 text-xs text-blue-600 font-medium">In multi-step approval engine</div>
        </Card>

        {/* Active POs */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active POs</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
            {metrics.activePurchaseOrders} Orders
          </div>
          <div className="mt-1 text-xs text-slate-500">Supply chain procurement pipeline</div>
        </Card>

        {/* Quick Route to Reports */}
        <Card className="p-4 bg-slate-900 text-white flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Audit & Reports Center
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Generate compliance balance sheets, P&L, stock matrices and attendance exports.
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 w-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            onClick={() => navigate('/reports')}
          >
            Open Analytics Suite
          </Button>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Revenue & Expense Trajectory"
            subtitle="Trailing 6-month fiscal trend comparison"
          />
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                  <YAxis
                    stroke="#64748B"
                    fontSize={11}
                    tickFormatter={(val) => `$${val / 1000}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`$${val.toLocaleString()}`, '']}
                    contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '6px', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses"
                    stroke="#DC2626"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorExp)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Headcount by Department */}
        <Card>
          <CardHeader
            title="Department Allocations"
            subtitle="Headcount density across organizational divisions"
          />
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '6px', fontSize: '12px' }}
                  />
                  <Bar dataKey="employees" name="Employees" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Business Activity Table */}
      <Card>
        <CardHeader
          title="Recent Commercial Transactions"
          subtitle="Latest client billing invoices processed across regions"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/finance/invoices')}>
              View All Invoices
            </Button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600">Invoice ID</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Client Organization</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Total Amount</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono text-blue-600 font-medium">{tx.invoiceNumber}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{tx.customerName}</td>
                  <td className="px-4 py-3 text-slate-500">{tx.invoiceDate}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {formatMinorCurrency(tx.totalMinor)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        tx.status === 'paid'
                          ? 'success'
                          : tx.status === 'overdue'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {tx.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
