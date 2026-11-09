import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthContext';
import type { Role } from '@/shared/types';
import { Shield, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const LoginPage: React.FC = () => {
  const { loginAsDemoUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@nexuserp.com');
  const [password, setPassword] = useState('password123');

  const demoAccounts: { label: string; role: Role; desc: string }[] = [
    { label: 'Alexander Wright', role: 'super_admin', desc: 'Super Administrator — Unrestricted Global Access' },
    { label: 'Elena Rostova', role: 'hr_manager', desc: 'HR Manager — Personnel, Leave & Attendance' },
    { label: 'Marcus Vance', role: 'finance_manager', desc: 'Finance Controller — Invoices, Budgets & P&L' },
    { label: 'David Zhao', role: 'inventory_manager', desc: 'Logistics Director — Stock, Depots & Transfers' },
    { label: 'Rachel Sterling', role: 'procurement_manager', desc: 'Procurement Specialist — Vendors & POs' },
    { label: 'Sarah Jenkins', role: 'employee', desc: 'Enterprise Staff — Expense Claims & Absence' },
    { label: 'Arthur Sterling', role: 'auditor', desc: 'Corporate Auditor — Strict Read-Only Audit' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginAsDemoUser('super_admin');
    navigate('/dashboard');
  };

  const handleSelectDemo = async (role: Role) => {
    await loginAsDemoUser(role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-2xl flex items-center justify-center mx-auto shadow-md">
          N
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">NexusERP Enterprise Suite</h2>
        <p className="mt-1 text-xs text-slate-500">
          Centralized business governance, supply chain, and fiscal management.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 sm:rounded-lg">
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Corporate Email</label>
              <div className="mt-1 relative rounded-md shadow-2xs">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Access Key / Password</label>
              <div className="mt-1 relative rounded-md shadow-2xs">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Enter Enterprise Platform <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 border-t border-slate-100 pt-6">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center mb-3">
              One-Click Role Simulation
            </span>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  onClick={() => handleSelectDemo(acc.role)}
                  className="w-full text-left p-2 rounded-md border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-800">{acc.label}</div>
                    <div className="text-[10px] text-slate-500">{acc.desc}</div>
                  </div>
                  <UserCheck className="w-4 h-4 text-blue-500 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-[11px] text-slate-400">
          NexusERP Frontend Architecture • Powered by React 19, TypeScript, Dexie & Tailwind
        </div>
      </div>
    </div>
  );
};
