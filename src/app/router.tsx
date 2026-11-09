import React from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { EmployeesPage } from '@/features/employees/EmployeesPage';
import { DepartmentsPage } from '@/features/departments/DepartmentsPage';
import { AttendancePage } from '@/features/attendance/AttendancePage';
import { LeaveManagementPage } from '@/features/leaves/LeaveManagementPage';
import { InvoicesPage } from '@/features/invoices/InvoicesPage';
import { ExpensesPage } from '@/features/expenses/ExpensesPage';
import { BudgetsPage } from '@/features/budgets/BudgetsPage';
import { ProductsPage } from '@/features/inventory/ProductsPage';
import { WarehousesPage } from '@/features/inventory/WarehousesPage';
import { StockPage } from '@/features/inventory/StockPage';
import { StockTransfersPage } from '@/features/inventory/StockTransfersPage';
import { VendorsPage } from '@/features/procurement/VendorsPage';
import { PurchaseOrdersPage } from '@/features/procurement/PurchaseOrdersPage';
import { CustomersPage } from '@/features/customers/CustomersPage';
import { SalesOrdersPage } from '@/features/sales/SalesOrdersPage';
import { WorkflowsPage } from '@/features/approvals/WorkflowsPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { UsersPage } from '@/features/administration/UsersPage';
import { AuditLogsPage } from '@/features/administration/AuditLogsPage';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },

      // Human Resources
      { path: 'employees', element: <EmployeesPage /> },
      { path: 'departments', element: <DepartmentsPage /> },
      { path: 'attendance', element: <AttendancePage /> },
      { path: 'leaves', element: <LeaveManagementPage /> },

      // Finance
      { path: 'finance', element: <InvoicesPage /> },
      { path: 'finance/invoices', element: <InvoicesPage /> },
      { path: 'finance/expenses', element: <ExpensesPage /> },
      { path: 'finance/budgets', element: <BudgetsPage /> },

      // Inventory
      { path: 'inventory', element: <ProductsPage /> },
      { path: 'inventory/products', element: <ProductsPage /> },
      { path: 'inventory/warehouses', element: <WarehousesPage /> },
      { path: 'inventory/stock', element: <StockPage /> },
      { path: 'inventory/transfers', element: <StockTransfersPage /> },

      // Procurement
      { path: 'procurement', element: <VendorsPage /> },
      { path: 'procurement/vendors', element: <VendorsPage /> },
      { path: 'procurement/requests', element: <PurchaseOrdersPage /> },
      { path: 'procurement/orders', element: <PurchaseOrdersPage /> },

      // Sales
      { path: 'sales', element: <CustomersPage /> },
      { path: 'sales/customers', element: <CustomersPage /> },
      { path: 'sales/orders', element: <SalesOrdersPage /> },

      // Operations & Approvals
      { path: 'workflows', element: <WorkflowsPage /> },
      { path: 'reports', element: <ReportsPage /> },

      // Administration
      { path: 'admin/users', element: <UsersPage /> },
      { path: 'admin/audit', element: <AuditLogsPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};
