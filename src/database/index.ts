import Dexie, { type Table } from 'dexie';
import type {
  Organization,
  Branch,
  User,
  Department,
  Employee,
  Attendance,
  LeaveRequest,
  LeaveBalance,
  Invoice,
  Expense,
  Budget,
  Product,
  Warehouse,
  Stock,
  StockMovement,
  Vendor,
  PurchaseRequest,
  PurchaseOrder,
  Customer,
  SalesOrder,
  ApprovalWorkflow,
  Notification,
  AuditLog,
} from '@/shared/types';

export class NexusDatabase extends Dexie {
  organizations!: Table<Organization, string>;
  branches!: Table<Branch, string>;
  users!: Table<User, string>;
  departments!: Table<Department, string>;
  employees!: Table<Employee, string>;
  attendances!: Table<Attendance, string>;
  leaveRequests!: Table<LeaveRequest, string>;
  leaveBalances!: Table<LeaveBalance, string>;
  invoices!: Table<Invoice, string>;
  expenses!: Table<Expense, string>;
  budgets!: Table<Budget, string>;
  products!: Table<Product, string>;
  warehouses!: Table<Warehouse, string>;
  stocks!: Table<Stock, string>;
  stockMovements!: Table<StockMovement, string>;
  vendors!: Table<Vendor, string>;
  purchaseRequests!: Table<PurchaseRequest, string>;
  purchaseOrders!: Table<PurchaseOrder, string>;
  customers!: Table<Customer, string>;
  salesOrders!: Table<SalesOrder, string>;
  approvalWorkflows!: Table<ApprovalWorkflow, string>;
  notifications!: Table<Notification, string>;
  auditLogs!: Table<AuditLog, string>;

  constructor() {
    super('NexusERPDatabase');
    this.version(1).stores({
      organizations: 'id, code',
      branches: 'id, organizationId, code, status',
      users: 'id, email, role, branchId, departmentId, status',
      departments: 'id, branchId, code',
      employees: 'id, employeeCode, departmentId, branchId, status, email',
      attendances: 'id, employeeId, date, status',
      leaveRequests: 'id, employeeId, status, leaveType',
      leaveBalances: 'id, employeeId',
      invoices: 'id, invoiceNumber, customerId, branchId, status, invoiceDate, dueDate',
      expenses: 'id, expenseNumber, departmentId, submittedById, status, date',
      budgets: 'id, departmentId, fiscalYear',
      products: 'id, sku, category, status',
      warehouses: 'id, branchId, code, status',
      stocks: 'id, productId, warehouseId, [productId+warehouseId]',
      stockMovements: 'id, productId, timestamp, type',
      vendors: 'id, code, status, category',
      purchaseRequests: 'id, requestNumber, departmentId, vendorId, status',
      purchaseOrders: 'id, poNumber, vendorId, warehouseId, branchId, status',
      customers: 'id, code, customerType, status',
      salesOrders: 'id, orderNumber, customerId, warehouseId, branchId, status',
      approvalWorkflows: 'id, type, referenceId, status',
      notifications: 'id, category, isRead, createdAt',
      auditLogs: 'id, userId, module, timestamp',
    });
  }
}

export const db = new NexusDatabase();
