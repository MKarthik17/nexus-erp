export type Role =
  | 'super_admin'
  | 'hr_manager'
  | 'finance_manager'
  | 'inventory_manager'
  | 'procurement_manager'
  | 'employee'
  | 'auditor';

export type Permission =
  | 'employees.read'
  | 'employees.create'
  | 'employees.update'
  | 'employees.delete'
  | 'finance.read'
  | 'finance.create'
  | 'finance.approve'
  | 'inventory.read'
  | 'inventory.update'
  | 'inventory.manage'
  | 'procurement.read'
  | 'procurement.create'
  | 'procurement.approve'
  | 'sales.read'
  | 'sales.create'
  | 'sales.manage'
  | 'reports.read'
  | 'reports.export'
  | 'users.manage'
  | 'system.audit';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  branchId: string;
  departmentId: string;
  permissions: Permission[];
  status: 'active' | 'inactive';
  lastLogin?: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  currency: string;
  taxNumber: string;
  address: string;
}

export interface Branch {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  location: string;
  isHeadquarters: boolean;
  phone: string;
  status: 'active' | 'inactive';
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headEmployeeId?: string;
  headName?: string;
  budgetMinor: number; // Stored in cents/pennies
  branchId: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  departmentId: string;
  designation: string;
  branchId: string;
  joiningDate: string;
  status: 'active' | 'on_leave' | 'terminated';
  salaryMinor: number;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkInTime?: string;
  checkOutTime?: string;
  status: 'present' | 'absent' | 'late' | 'half_day';
  hoursWorked: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'annual' | 'sick' | 'casual' | 'unpaid' | 'maternity';
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  approverId?: string;
  approverName?: string;
  appliedAt: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  annual: number;
  sick: number;
  casual: number;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitPriceMinor: number;
  taxRatePercent: number;
  discountMinor: number;
  totalMinor: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  branchId: string;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotalMinor: number;
  taxMinor: number;
  discountMinor: number;
  totalMinor: number;
  paidAmountMinor: number;
  status: 'draft' | 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  category: 'travel' | 'software' | 'office_supplies' | 'utilities' | 'marketing' | 'hardware' | 'consulting';
  amountMinor: number;
  departmentId: string;
  submittedById: string;
  submittedByName: string;
  date: string;
  receiptUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  description: string;
}

export interface Budget {
  id: string;
  departmentId: string;
  fiscalYear: number;
  allocatedMinor: number;
  spentMinor: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  unitPriceMinor: number;
  costPriceMinor: number;
  reorderLevel: number;
  status: 'active' | 'discontinued';
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location: string;
  branchId: string;
  capacityUnits: number;
  status: 'active' | 'maintenance';
}

export interface Stock {
  id: string;
  productId: string;
  warehouseId: string;
  availableQuantity: number;
  reservedQuantity: number;
  damagedQuantity: number;
  lastUpdated: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sourceWarehouseId?: string;
  destWarehouseId?: string;
  quantity: number;
  type: 'transfer' | 'inbound_po' | 'outbound_so' | 'adjustment';
  referenceId?: string; // PO number, SO number, or Transfer ID
  timestamp: string;
  performedBy: string;
}

export interface Vendor {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  paymentTerms: string;
  status: 'active' | 'inactive';
  rating: number; // 1-5
}

export interface PurchaseRequestItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  estimatedPriceMinor: number;
}

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  departmentId: string;
  vendorId: string;
  requestedById: string;
  requestedByName: string;
  items: PurchaseRequestItem[];
  totalMinor: number;
  status: 'pending' | 'finance_approved' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPriceMinor: number;
  totalMinor: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  warehouseId: string;
  branchId: string;
  items: PurchaseOrderItem[];
  totalMinor: number;
  status: 'draft' | 'submitted' | 'pending_approval' | 'approved' | 'ordered' | 'received' | 'cancelled';
  rejectionReason?: string;
  orderDate: string;
  expectedDate: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  customerType: 'enterprise' | 'smb' | 'government' | 'individual';
  status: 'active' | 'inactive';
}

export interface SalesOrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPriceMinor: number;
  discountMinor: number;
  totalMinor: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  warehouseId: string;
  branchId: string;
  items: SalesOrderItem[];
  totalMinor: number;
  status: 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
}

export interface ApprovalWorkflow {
  id: string;
  type: 'leave' | 'expense' | 'purchase_request' | 'purchase_order';
  referenceId: string; // ID of record
  title: string;
  amountMinor?: number;
  currentStep: number;
  totalSteps: number;
  status: 'pending' | 'approved' | 'rejected';
  history: ApprovalHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalHistory {
  id: string;
  step: number;
  stepName: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: 'submitted' | 'approved' | 'rejected';
  comment?: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  category: 'workflow' | 'inventory' | 'finance' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  module: string;
  action: string;
  recordId: string;
  description: string;
  timestamp: string;
  ipAddress: string;
}
