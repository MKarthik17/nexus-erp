import React, { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { db } from '@/database';
import type { Employee, Department, Branch } from '@/shared/types';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Plus, Eye, Edit2, Archive, Check } from 'lucide-react';
import { formatMinorCurrency } from '@/shared/utils/formatters';

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    branchId: '',
    designation: '',
    salary: 85000,
  });

  const loadData = async () => {
    const [emps, depts, brs] = await Promise.all([
      db.employees.toArray(),
      db.departments.toArray(),
      db.branches.toArray(),
    ]);
    setEmployees(emps);
    setDepartments(depts);
    setBranches(brs);

    if (depts.length > 0 && !formData.departmentId) {
      setFormData((prev) => ({
        ...prev,
        departmentId: depts[0].id,
        branchId: brs[0]?.id || '',
      }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const newEmpId = `emp-${Date.now()}`;
    const newEmp: Employee = {
      id: newEmpId,
      employeeCode: `EMP-${Math.floor(2000 + Math.random() * 8000)}`,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone || '+1 (555) 019-2831',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.firstName}${formData.lastName}`,
      departmentId: formData.departmentId,
      designation: formData.designation,
      branchId: formData.branchId,
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'active',
      salaryMinor: formData.salary * 100,
    };

    await db.employees.add(newEmp);
    await db.leaveBalances.add({
      id: `lb-${newEmpId}`,
      employeeId: newEmpId,
      annual: 20,
      sick: 10,
      casual: 5,
    });

    await db.auditLogs.add({
      id: `audit-${Date.now()}`,
      userId: 'user-admin',
      userName: 'Administrator',
      module: 'Human Resources',
      action: 'CREATE_EMPLOYEE',
      recordId: newEmpId,
      description: `Onboarded employee ${formData.firstName} ${formData.lastName} into ${formData.designation}.`,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1',
    });

    setIsAddModalOpen(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      departmentId: departments[0]?.id || '',
      branchId: branches[0]?.id || '',
      designation: '',
      salary: 85000,
    });
    loadData();
  };

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: 'employeeCode',
      header: 'Emp ID',
      cell: ({ row }) => (
        <span className="font-mono text-blue-600 font-medium">{row.original.employeeCode}</span>
      ),
    },
    {
      accessorKey: 'firstName',
      header: 'Full Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <img
            src={row.original.avatar}
            alt={row.original.firstName}
            className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200"
          />
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              {row.original.firstName} {row.original.lastName}
            </div>
            <div className="text-[11px] text-slate-400">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'departmentId',
      header: 'Department',
      cell: ({ row }) => {
        const d = departments.find((dept) => dept.id === row.original.departmentId);
        return <span>{d?.name || row.original.departmentId}</span>;
      },
    },
    {
      accessorKey: 'designation',
      header: 'Designation',
      cell: ({ row }) => <span className="font-medium text-slate-700">{row.original.designation}</span>,
    },
    {
      accessorKey: 'branchId',
      header: 'Branch',
      cell: ({ row }) => {
        const b = branches.find((br) => br.id === row.original.branchId);
        return <span className="text-slate-500">{b?.name.split(' ')[0] || '-'}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === 'active'
              ? 'success'
              : row.original.status === 'on_leave'
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
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedEmployee(row.original);
              setIsDetailModalOpen(true);
            }}
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              if (window.confirm(`Archive ${row.original.firstName} ${row.original.lastName}?`)) {
                await db.employees.update(row.original.id, { status: 'terminated' });
                loadData();
              }
            }}
            title="Archive Record"
          >
            <Archive className="w-3.5 h-3.5 text-slate-400 hover:text-rose-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Employee Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete personnel records, department distribution and profile dossiers.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Onboard Employee
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={employees}
        searchPlaceholder="Filter employees by name or code..."
        exportFilename="NexusERP_Employees_Directory"
      />

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Onboard New Employee"
        description="Create enterprise profile, allocate hardware tokens, and configure payroll bracket."
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">First Name</label>
              <input
                required
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Last Name</label>
              <input
                required
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Corporate Email</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Department</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Branch Facility</label>
              <select
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Designation</label>
              <input
                required
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="Senior Systems Analyst"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Annual Compensation ($)</label>
              <input
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Complete Onboarding
            </Button>
          </div>
        </form>
      </Modal>

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Employee Dossier: ${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
          description={`Record ID: ${selectedEmployee.employeeCode} | Joined: ${selectedEmployee.joiningDate}`}
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
              <img
                src={selectedEmployee.avatar}
                alt={selectedEmployee.firstName}
                className="w-16 h-16 rounded-full bg-white border border-slate-200 shadow-xs"
              />
              <div className="flex-1">
                <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </div>
                <div className="text-xs text-blue-600 font-medium">{selectedEmployee.designation}</div>
                <div className="text-xs text-slate-500 mt-0.5">{selectedEmployee.email} • {selectedEmployee.phone}</div>
              </div>
              <Badge variant={selectedEmployee.status === 'active' ? 'success' : 'warning'}>
                {selectedEmployee.status.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-md">
                <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Department</span>
                <span className="font-medium text-slate-800 mt-1 block">
                  {departments.find((d) => d.id === selectedEmployee.departmentId)?.name || 'General Operations'}
                </span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-md">
                <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Compensation</span>
                <span className="font-medium text-slate-800 mt-1 block">
                  {formatMinorCurrency(selectedEmployee.salaryMinor)} / yr
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-md text-xs text-slate-600">
              <span className="font-semibold text-blue-800 block mb-1">Enterprise Benefits Package</span>
              Medical, 401(k) 6% corporate match, 20 annual paid PTO days, continuous training stipend.
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close Dossier
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
