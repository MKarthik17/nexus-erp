import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Building,
  UserCheck,
  LogOut,
  RotateCcw,
  Search,
} from 'lucide-react';
import { useAuth } from '@/core/auth/AuthContext';
import { useBranch } from '@/core/branch/BranchContext';
import { useTheme } from '@/core/theme/ThemeContext';
import { seedDatabase } from '@/database/seed';
import type { Role } from '@/shared/types';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, loginAsDemoUser, logout } = useAuth();
  const { branches, selectedBranchId, setSelectedBranchId } = useBranch();
  const { theme, toggleTheme } = useTheme();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const demoRoles: { label: string; role: Role }[] = [
    { label: 'Super Admin (Full Access)', role: 'super_admin' },
    { label: 'HR Manager (Elena Rostova)', role: 'hr_manager' },
    { label: 'Finance Manager (Marcus Vance)', role: 'finance_manager' },
    { label: 'Inventory Manager (David Zhao)', role: 'inventory_manager' },
    { label: 'Procurement Officer (Rachel Sterling)', role: 'procurement_manager' },
    { label: 'Employee (Sarah Jenkins)', role: 'employee' },
    { label: 'Auditor (Arthur Sterling)', role: 'auditor' },
  ];

  const handleResetData = async () => {
    if (window.confirm('Reset database back to standard enterprise demo seed data?')) {
      setIsResetting(true);
      await seedDatabase(true);
      window.location.reload();
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global branch switch */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700">
          <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
          >
            <option value="all">Enterprise-Wide (All Branches)</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Reset Demo Data button */}
        <button
          onClick={handleResetData}
          disabled={isResetting}
          title="Reset Demo Data to Seed"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-md hover:bg-amber-100 transition-colors"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Reset Seed Data</span>
        </button>

        {/* Theme switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
          title="Toggle Dark / Light Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notification center icon */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
          </button>
        </div>

        {/* Demo Role switcher dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user?.name || 'User'}
              className="w-7 h-7 rounded-full object-cover border border-slate-200"
            />
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                {user?.name || 'Guest'}
              </div>
              <div className="text-[10px] text-blue-600 dark:text-blue-400 capitalize font-medium">
                {user?.role.replace('_', ' ') || 'None'}
              </div>
            </div>
            <UserCheck className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-2 z-50">
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Simulate Demo Role
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {demoRoles.map((dr) => (
                  <button
                    key={dr.role}
                    onClick={() => {
                      loginAsDemoUser(dr.role);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      user?.role === dr.role
                        ? 'text-blue-600 font-semibold bg-blue-50/50 dark:bg-blue-950/20'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{dr.label}</span>
                    {user?.role === dr.role && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                <button
                  onClick={() => {
                    logout();
                    setShowRoleMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
