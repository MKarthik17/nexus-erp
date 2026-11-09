import React, { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { db } from '@/database';
import type { Attendance, Employee } from '@/shared/types';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { CalendarCheck, Clock, UserCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/core/auth/AuthContext';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-11-09');

  const loadData = async () => {
    const [atts, emps] = await Promise.all([
      db.attendances.toArray(),
      db.employees.toArray(),
    ]);
    setAttendances(atts);
    setEmployees(emps);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSimulateCheckIn = async () => {
    const today = new Date().toISOString().split('T')[0];
    const existing = attendances.find((a) => a.date === today && a.employeeId === 'emp-001');

    if (existing) {
      alert('You have already punched in for today!');
      return;
    }

    const newRecord: Attendance = {
      id: `att-emp-001-${today}`,
      employeeId: 'emp-001',
      date: today,
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'present',
      hoursWorked: 8.0,
    };

    await db.attendances.add(newRecord);
    loadData();
  };

  const currentDayRecords = attendances.filter((a) => a.date === selectedDate);
  const presentCount = currentDayRecords.filter((a) => a.status === 'present').length;
  const lateCount = currentDayRecords.filter((a) => a.status === 'late').length;
  const absentCount = currentDayRecords.filter((a) => a.status === 'absent').length;

  const columns: ColumnDef<Attendance>[] = [
    {
      accessorKey: 'date',
      header: 'Shift Date',
      cell: ({ row }) => <span className="font-mono text-slate-600">{row.original.date}</span>,
    },
    {
      id: 'employeeName',
      header: 'Employee Name',
      cell: ({ row }) => {
        const emp = employees.find((e) => e.id === row.original.employeeId);
        return (
          <div className="font-semibold text-slate-800">
            {emp ? `${emp.firstName} ${emp.lastName}` : row.original.employeeId}
          </div>
        );
      },
    },
    {
      accessorKey: 'checkInTime',
      header: 'Clock In',
      cell: ({ row }) => <span>{row.original.checkInTime || '--:--'}</span>,
    },
    {
      accessorKey: 'checkOutTime',
      header: 'Clock Out',
      cell: ({ row }) => <span>{row.original.checkOutTime || '--:--'}</span>,
    },
    {
      accessorKey: 'hoursWorked',
      header: 'Total Hours',
      cell: ({ row }) => <span>{row.original.hoursWorked} hrs</span>,
    },
    {
      accessorKey: 'status',
      header: 'Attendance Status',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === 'present'
              ? 'success'
              : row.original.status === 'late'
              ? 'warning'
              : 'danger'
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Workforce Attendance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Biometric badge tracking, punch clock telemetry and shift compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-md text-xs bg-white text-slate-700 focus:outline-none"
          />
          <Button size="sm" onClick={handleSimulateCheckIn}>
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Simulate Punch In
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-emerald-600">
          <div className="text-xs font-semibold uppercase text-slate-500">Present On-Site</div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{presentCount} Staff</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="text-xs font-semibold uppercase text-slate-500">Late Arrivals</div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{lateCount} Staff</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-rose-600">
          <div className="text-xs font-semibold uppercase text-slate-500">Unexcused Absences</div>
          <div className="mt-2 text-2xl font-bold text-rose-600">{absentCount} Staff</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-600">
          <div className="text-xs font-semibold uppercase text-slate-500">Shift Compliance</div>
          <div className="mt-2 text-2xl font-bold text-blue-600">
            {currentDayRecords.length > 0
              ? `${Math.round(((presentCount + lateCount) / currentDayRecords.length) * 100)}%`
              : '98%'}
          </div>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={currentDayRecords.length > 0 ? currentDayRecords : attendances}
        searchPlaceholder="Filter attendance logs..."
        exportFilename={`NexusERP_Attendance_${selectedDate}`}
      />
    </div>
  );
};
