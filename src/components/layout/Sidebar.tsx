import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  CalendarRange,
  DollarSign,
  FileText,
  Receipt,
  PieChart,
  Boxes,
  Warehouse as WarehouseIcon,
  Layers,
  ArrowLeftRight,
  Truck,
  FileQuestion,
  ShoppingCart,
  Contact2,
  PackageCheck,
  CheckCircle2,
  BarChart3,
  ShieldCheck,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/core/auth/AuthContext';
import { cn } from '@/shared/utils/cn';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const { hasPermission } = useAuth();

  const navSections = [
    {
      title: 'Core',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: null },
      ],
    },
    {
      title: 'Human Resources',
      items: [
        { label: 'Employees', path: '/employees', icon: Users, permission: 'employees.read' },
        { label: 'Departments', path: '/departments', icon: Building2, permission: 'employees.read' },
        { label: 'Attendance', path: '/attendance', icon: CalendarCheck, permission: 'employees.read' },
        { label: 'Leave Management', path: '/leaves', icon: CalendarRange, permission: 'employees.read' },
      ],
    },
    {
      title: 'Finance',
      items: [
        { label: 'Financial Overview', path: '/finance', icon: DollarSign, permission: 'finance.read' },
        { label: 'Invoices', path: '/finance/invoices', icon: FileText, permission: 'finance.read' },
        { label: 'Expenses', path: '/finance/expenses', icon: Receipt, permission: 'finance.read' },
        { label: 'Budgets', path: '/finance/budgets', icon: PieChart, permission: 'finance.read' },
      ],
    },
    {
      title: 'Inventory',
      items: [
        { label: 'Products', path: '/inventory/products', icon: Boxes, permission: 'inventory.read' },
        { label: 'Warehouses', path: '/inventory/warehouses', icon: WarehouseIcon, permission: 'inventory.read' },
        { label: 'Stock Levels', path: '/inventory/stock', icon: Layers, permission: 'inventory.read' },
        { label: 'Stock Transfers', path: '/inventory/transfers', icon: ArrowLeftRight, permission: 'inventory.update' },
      ],
    },
    {
      title: 'Procurement',
      items: [
        { label: 'Vendors', path: '/procurement/vendors', icon: Truck, permission: 'procurement.read' },
        { label: 'Purchase Requests', path: '/procurement/requests', icon: FileQuestion, permission: 'procurement.read' },
        { label: 'Purchase Orders', path: '/procurement/orders', icon: ShoppingCart, permission: 'procurement.read' },
      ],
    },
    {
      title: 'Sales & CRM',
      items: [
        { label: 'Customers', path: '/sales/customers', icon: Contact2, permission: 'sales.read' },
        { label: 'Sales Orders', path: '/sales/orders', icon: PackageCheck, permission: 'sales.read' },
      ],
    },
    {
      title: 'Operations',
      items: [
        { label: 'Workflows & Approvals', path: '/workflows', icon: CheckCircle2, permission: null },
        { label: 'Reports & Analytics', path: '/reports', icon: BarChart3, permission: 'reports.read' },
      ],
    },
    {
      title: 'Administration',
      items: [
        { label: 'Users & Roles', path: '/admin/users', icon: ShieldCheck, permission: 'users.manage' },
        { label: 'Audit Logs', path: '/admin/audit', icon: Sliders, permission: 'system.audit' },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        'h-screen bg-[#172554] text-slate-300 flex flex-col transition-all duration-200 border-r border-slate-800 shrink-0 z-30 select-none',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 gap-3 border-b border-slate-800 bg-[#0f172a]">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white tracking-wider text-base shadow-sm">
          N
        </div>
        {!collapsed && (
          <div>
            <div className="font-bold text-white text-base tracking-wide flex items-center gap-1.5">
              Nexus<span className="text-blue-400">ERP</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1 py-0.2 rounded font-mono">2026.1</span>
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">Enterprise Suite</div>
          </div>
        )}
      </div>

      {/* Navigation menu */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {navSections.map((sec, idx) => {
          // Filter items by permission
          const visibleItems = sec.items.filter((item) => !item.permission || hasPermission(item.permission));
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {sec.title}
                </div>
              )}
              {visibleItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all group',
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'hover:bg-slate-800/60 hover:text-white text-slate-300'
                    )
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="w-4 h-4 shrink-0 transition-colors" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </div>

      {/* Bottom Profile Summary */}
      <div className="p-3 border-t border-slate-800 bg-[#0f172a]/60">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[11px] text-slate-400">System Connected (IndexedDB)</span>
          </div>
        ) : (
          <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto" />
        )}
      </div>
    </aside>
  );
};
