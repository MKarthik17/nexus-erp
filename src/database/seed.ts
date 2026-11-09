import { db } from './index';
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

export async function seedDatabase(force: boolean = false): Promise<void> {
  const count = await db.organizations.count();
  if (count > 0 && !force) {
    console.log('NexusERP Database already seeded.');
    return;
  }

  console.log('Seeding NexusERP Database...');
  await db.transaction('rw', db.tables, async () => {
    // Clear all tables
    for (const table of db.tables) {
      await table.clear();
    }

    // 1. Organization
    const organization: Organization = {
      id: 'org-nexus-01',
      name: 'Nexus Enterprises Global Inc.',
      code: 'NEX-CORP',
      currency: 'USD',
      taxNumber: 'US-EIN-883920194',
      address: '100 Enterprise Way, Suite 500, San Francisco, CA 94105',
    };
    await db.organizations.add(organization);

    // 2. Branches
    const branches: Branch[] = [
      {
        id: 'branch-hq',
        organizationId: organization.id,
        name: 'Global Headquarters (HQ)',
        code: 'HQ-SF',
        location: 'San Francisco, CA',
        isHeadquarters: true,
        phone: '+1 (415) 880-9200',
        status: 'active',
      },
      {
        id: 'branch-ny',
        organizationId: organization.id,
        name: 'New York Financial Hub',
        code: 'NY-FIN',
        location: 'New York, NY',
        isHeadquarters: false,
        phone: '+1 (212) 554-3200',
        status: 'active',
      },
      {
        id: 'branch-tx',
        organizationId: organization.id,
        name: 'Texas Logistics & Distribution',
        code: 'TX-DIST',
        location: 'Austin, TX',
        isHeadquarters: false,
        phone: '+1 (512) 774-1234',
        status: 'active',
      },
    ];
    await db.branches.bulkAdd(branches);

    // 3. Departments
    const departments: Department[] = [
      { id: 'dept-exec', name: 'Executive Operations', code: 'EXEC', budgetMinor: 50000000, branchId: 'branch-hq' },
      { id: 'dept-eng', name: 'Engineering & Technology', code: 'TECH', budgetMinor: 150000000, branchId: 'branch-hq' },
      { id: 'dept-hr', name: 'Human Resources & Talent', code: 'HR', budgetMinor: 35000000, branchId: 'branch-hq' },
      { id: 'dept-fin', name: 'Finance & Accounting', code: 'FIN', budgetMinor: 45000000, branchId: 'branch-ny' },
      { id: 'dept-sales', name: 'Global Sales & Enterprise Accounts', code: 'SALES', budgetMinor: 95000000, branchId: 'branch-ny' },
      { id: 'dept-proc', name: 'Procurement & Vendor Relations', code: 'PROC', budgetMinor: 40000000, branchId: 'branch-tx' },
      { id: 'dept-inv', name: 'Logistics & Supply Chain', code: 'LOG', budgetMinor: 80000000, branchId: 'branch-tx' },
      { id: 'dept-mktg', name: 'Marketing & Brand Strategy', code: 'MKTG', budgetMinor: 60000000, branchId: 'branch-hq' },
    ];
    await db.departments.bulkAdd(departments);

    // 4. Standard Demo Users & Roles
    const users: User[] = [
      {
        id: 'user-admin',
        name: 'Alexander Wright',
        email: 'admin@nexuserp.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        role: 'super_admin',
        branchId: 'branch-hq',
        departmentId: 'dept-exec',
        permissions: [
          'employees.read', 'employees.create', 'employees.update', 'employees.delete',
          'finance.read', 'finance.create', 'finance.approve',
          'inventory.read', 'inventory.update', 'inventory.manage',
          'procurement.read', 'procurement.create', 'procurement.approve',
          'sales.read', 'sales.create', 'sales.manage',
          'reports.read', 'reports.export', 'users.manage', 'system.audit',
        ],
        status: 'active',
      },
      {
        id: 'user-hr',
        name: 'Elena Rostova',
        email: 'hr@nexuserp.com',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
        role: 'hr_manager',
        branchId: 'branch-hq',
        departmentId: 'dept-hr',
        permissions: ['employees.read', 'employees.create', 'employees.update', 'employees.delete', 'reports.read'],
        status: 'active',
      },
      {
        id: 'user-fin',
        name: 'Marcus Vance',
        email: 'finance@nexuserp.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        role: 'finance_manager',
        branchId: 'branch-ny',
        departmentId: 'dept-fin',
        permissions: ['finance.read', 'finance.create', 'finance.approve', 'reports.read', 'reports.export'],
        status: 'active',
      },
      {
        id: 'user-inv',
        name: 'David Zhao',
        email: 'inventory@nexuserp.com',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        role: 'inventory_manager',
        branchId: 'branch-tx',
        departmentId: 'dept-inv',
        permissions: ['inventory.read', 'inventory.update', 'inventory.manage', 'reports.read'],
        status: 'active',
      },
      {
        id: 'user-proc',
        name: 'Rachel Sterling',
        email: 'procurement@nexuserp.com',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        role: 'procurement_manager',
        branchId: 'branch-tx',
        departmentId: 'dept-proc',
        permissions: ['procurement.read', 'procurement.create', 'procurement.approve', 'reports.read'],
        status: 'active',
      },
      {
        id: 'user-emp',
        name: 'Sarah Jenkins',
        email: 'employee@nexuserp.com',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        role: 'employee',
        branchId: 'branch-hq',
        departmentId: 'dept-eng',
        permissions: ['employees.read'],
        status: 'active',
      },
      {
        id: 'user-auditor',
        name: 'Arthur Sterling',
        email: 'auditor@nexuserp.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        role: 'auditor',
        branchId: 'branch-ny',
        departmentId: 'dept-fin',
        permissions: ['reports.read', 'reports.export', 'system.audit'],
        status: 'active',
      },
    ];
    await db.users.bulkAdd(users);

    // 5. Seed 100 Employees
    const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
    const designations = [
      'Senior Systems Architect', 'Staff Software Engineer', 'Operations Analyst', 'Financial Controller',
      'HR Business Partner', 'Supply Chain Planner', 'Enterprise Account Executive', 'Product Director',
      'Inventory Specialist', 'Procurement Officer', 'Lead DevOps Engineer', 'QA Automation Engineer'
    ];

    const employees: Employee[] = [];
    const leaveBalances: LeaveBalance[] = [];
    const attendances: Attendance[] = [];

    for (let i = 1; i <= 100; i++) {
      const fn = firstNames[i % firstNames.length];
      const ln = lastNames[(i * 3) % lastNames.length];
      const dept = departments[i % departments.length];
      const branch = branches[i % branches.length];
      const empId = `emp-${i.toString().padStart(3, '0')}`;

      employees.push({
        id: empId,
        employeeCode: `EMP-${1000 + i}`,
        firstName: fn,
        lastName: ln,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}@nexuserp.com`,
        phone: `+1 (555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fn}${ln}`,
        departmentId: dept.id,
        designation: designations[i % designations.length],
        branchId: branch.id,
        joiningDate: `202${2 + (i % 3)}-0${1 + (i % 9)}-15`,
        status: i % 15 === 0 ? 'on_leave' : i % 35 === 0 ? 'terminated' : 'active',
        salaryMinor: (60000 + (i % 50) * 1500) * 100,
      });

      leaveBalances.push({
        id: `lb-${empId}`,
        employeeId: empId,
        annual: 20 - (i % 6),
        sick: 10 - (i % 3),
        casual: 5 - (i % 2),
      });

      // Sample attendance for current week
      ['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09'].forEach((date, dIndex) => {
        const isAbsent = (i + dIndex) % 17 === 0;
        const isLate = (i + dIndex) % 7 === 0;
        attendances.push({
          id: `att-${empId}-${date}`,
          employeeId: empId,
          date,
          checkInTime: isAbsent ? undefined : isLate ? '09:42 AM' : '08:55 AM',
          checkOutTime: isAbsent ? undefined : '05:30 PM',
          status: isAbsent ? 'absent' : isLate ? 'late' : 'present',
          hoursWorked: isAbsent ? 0 : 8.5,
        });
      });
    }

    await db.employees.bulkAdd(employees);
    await db.leaveBalances.bulkAdd(leaveBalances);
    await db.attendances.bulkAdd(attendances);

    // 6. Warehouses (5 total)
    const warehouses: Warehouse[] = [
      { id: 'wh-central', name: 'Silicon Valley Central Logistics', code: 'WH-SF-01', location: 'Fremont, CA', branchId: 'branch-hq', capacityUnits: 100000, status: 'active' },
      { id: 'wh-east', name: 'New Jersey Port Logistics Terminal', code: 'WH-NJ-02', location: 'Newark, NJ', branchId: 'branch-ny', capacityUnits: 85000, status: 'active' },
      { id: 'wh-south', name: 'Austin High-Tech Distribution Center', code: 'WH-TX-01', location: 'Round Rock, TX', branchId: 'branch-tx', capacityUnits: 120000, status: 'active' },
      { id: 'wh-dallas', name: 'Dallas Metro Transit Facility', code: 'WH-TX-02', location: 'Fort Worth, TX', branchId: 'branch-tx', capacityUnits: 60000, status: 'active' },
      { id: 'wh-cold', name: 'Northwest Storage & Overflow', code: 'WH-NW-05', location: 'Reno, NV', branchId: 'branch-hq', capacityUnits: 40000, status: 'active' },
    ];
    await db.warehouses.bulkAdd(warehouses);

    // 7. Products (55 products)
    const productCategories = ['Enterprise Servers', 'Networking Gear', 'Security Appliances', 'Workstations', 'Storage Systems', 'Cloud Peripherals'];
    const products: Product[] = [];
    const stocks: Stock[] = [];

    for (let i = 1; i <= 55; i++) {
      const prodId = `prod-${i.toString().padStart(3, '0')}`;
      const cat = productCategories[i % productCategories.length];
      const costPriceMinor = (250 + (i * 45)) * 100;
      const unitPriceMinor = Math.round(costPriceMinor * 1.4);

      products.push({
        id: prodId,
        sku: `NX-${cat.slice(0, 3).toUpperCase()}-${1000 + i}`,
        name: `Nexus ${cat.slice(0, -1)} Pro Series ${100 + i * 2}X`,
        category: cat,
        description: `Enterprise-grade ${cat.toLowerCase()} optimized for high-throughput high-availability cluster deployments.`,
        costPriceMinor,
        unitPriceMinor,
        reorderLevel: 25 + (i % 15),
        status: i === 45 ? 'discontinued' : 'active',
      });

      // Stock across warehouses
      warehouses.forEach((wh, whIndex) => {
        const qty = (i * 7 + whIndex * 13) % 180 + 5;
        stocks.push({
          id: `stock-${prodId}-${wh.id}`,
          productId: prodId,
          warehouseId: wh.id,
          availableQuantity: qty,
          reservedQuantity: Math.floor(qty * 0.15),
          damagedQuantity: i % 11 === 0 ? 2 : 0,
          lastUpdated: '2026-11-08T10:00:00Z',
        });
      });
    }

    await db.products.bulkAdd(products);
    await db.stocks.bulkAdd(stocks);

    // 8. Vendors (15)
    const vendors: Vendor[] = [];
    const vendorNames = [
      'Apex Semiconductor Corp', 'BriteTech Microelectronics', 'Crestline Network Solutions',
      'Delta Power Systems', 'Echo Optical Fiber Inc', 'Frontier Hardware Systems',
      'Global Silicon Foundry', 'Hyperion Cooling Technologies', 'InfiniBand Connectors Ltd',
      'JetStream Server Racks', 'Krypton Logic Co', 'Luminary Datacenter Supplies',
      'Matrix Chipsets International', 'Nova Storage Modules', 'OmniTech Logistics Partners'
    ];

    vendorNames.forEach((name, idx) => {
      vendors.push({
        id: `vendor-${idx + 1}`,
        code: `VEN-${200 + idx}`,
        name,
        email: `contact@${name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        phone: `+1 (800) ${300 + idx}-${4000 + idx}`,
        address: `${100 + idx * 12} Industrial Blvd, Tech Park, Austin, TX`,
        category: productCategories[idx % productCategories.length],
        paymentTerms: idx % 2 === 0 ? 'Net 30' : 'Net 60',
        status: 'active',
        rating: 4 + (idx % 2) * 0.5 + (idx % 3 === 0 ? -0.5 : 0),
      });
    });
    await db.vendors.bulkAdd(vendors);

    // 9. Customers (30)
    const customers: Customer[] = [];
    const customerNames = [
      'Acrobatics Cloud Hosting', 'BlueHorizon Financial', 'Cognitive Dynamics AI',
      'Dataspring Analytics', 'Elevate BioPharma', 'FinTech Innovations Group',
      'GreenGrid Energy Systems', 'Helix Genomic Research', 'Ironclad Defense Logistics',
      'Jupiter Space Systems', 'Kinetic Robotics Labs', 'Latitude Telecommunications',
      'Metropolis Media Corp', 'Nexus Retail Networks', 'Oasis Health Alliance',
      'Pioneer Autonomous Vehicles', 'Quantum Cryptography Ltd', 'Redwood Capital Partners',
      'Summit Insurance Global', 'Titanium Security Works', 'United Maritime Freight',
      'Vanguard Aerospace', 'Wavelength Fiber Optics', 'Xenon Automotive Systems',
      'YieldMax Global Trading', 'Zenith Smart Cities', 'Apex Media Broadcast',
      'Beacon Logistics International', 'CyberTrust Solutions', 'Dynamic Grid Management'
    ];

    customerNames.forEach((comp, idx) => {
      customers.push({
        id: `cust-${idx + 1}`,
        code: `CUST-${5000 + idx}`,
        name: `${firstNames[idx % firstNames.length]} ${lastNames[idx % lastNames.length]}`,
        company: comp,
        email: `procurement@${comp.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        phone: `+1 (888) ${400 + idx}-${7000 + idx}`,
        address: `${200 + idx * 30} Financial Plaza, New York, NY`,
        customerType: idx % 4 === 0 ? 'enterprise' : idx % 3 === 0 ? 'government' : 'smb',
        status: 'active',
      });
    });
    await db.customers.bulkAdd(customers);

    // 10. Invoices (40)
    const invoices: Invoice[] = [];
    for (let i = 1; i <= 40; i++) {
      const cust = customers[i % customers.length];
      const prod = products[i % products.length];
      const qty = 5 + (i % 12);
      const subtotalMinor = prod.unitPriceMinor * qty;
      const taxMinor = Math.round(subtotalMinor * 0.08);
      const discountMinor = i % 5 === 0 ? Math.round(subtotalMinor * 0.05) : 0;
      const totalMinor = subtotalMinor + taxMinor - discountMinor;
      const isPaid = i % 3 === 0;
      const isOverdue = !isPaid && i % 4 === 0;

      invoices.push({
        id: `inv-${1000 + i}`,
        invoiceNumber: `INV-2026-${2000 + i}`,
        customerId: cust.id,
        customerName: cust.company,
        branchId: i % 2 === 0 ? 'branch-ny' : 'branch-hq',
        invoiceDate: `2026-10-${(1 + (i % 25)).toString().padStart(2, '0')}`,
        dueDate: isOverdue ? '2026-10-31' : '2026-11-30',
        items: [
          {
            id: `inv-item-${i}-1`,
            productId: prod.id,
            description: prod.name,
            quantity: qty,
            unitPriceMinor: prod.unitPriceMinor,
            taxRatePercent: 8,
            discountMinor,
            totalMinor,
          },
        ],
        subtotalMinor,
        taxMinor,
        discountMinor,
        totalMinor,
        paidAmountMinor: isPaid ? totalMinor : 0,
        status: isPaid ? 'paid' : isOverdue ? 'overdue' : 'pending',
      });
    }
    await db.invoices.bulkAdd(invoices);

    // 11. Purchase Orders (30) & Requests
    const purchaseOrders: PurchaseOrder[] = [];
    const purchaseRequests: PurchaseRequest[] = [];

    for (let i = 1; i <= 30; i++) {
      const vendor = vendors[i % vendors.length];
      const prod = products[(i * 2) % products.length];
      const qty = 20 + (i % 15);
      const costPriceMinor = prod.costPriceMinor;
      const totalMinor = costPriceMinor * qty;
      const isReceived = i % 2 === 0;

      purchaseOrders.push({
        id: `po-${i}`,
        poNumber: `PO-2026-${3000 + i}`,
        vendorId: vendor.id,
        vendorName: vendor.name,
        warehouseId: warehouses[i % warehouses.length].id,
        branchId: 'branch-tx',
        items: [
          {
            id: `po-item-${i}`,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            quantity: qty,
            unitPriceMinor: costPriceMinor,
            totalMinor,
          },
        ],
        totalMinor,
        status: isReceived ? 'received' : i % 5 === 0 ? 'pending_approval' : 'approved',
        orderDate: `2026-10-${(1 + (i % 20)).toString().padStart(2, '0')}`,
        expectedDate: `2026-11-${(5 + (i % 20)).toString().padStart(2, '0')}`,
      });

      if (i <= 15) {
        purchaseRequests.push({
          id: `pr-${i}`,
          requestNumber: `PR-2026-${100 + i}`,
          departmentId: departments[i % departments.length].id,
          vendorId: vendor.id,
          requestedById: 'user-proc',
          requestedByName: 'Rachel Sterling',
          items: [
            {
              id: `pr-item-${i}`,
              productId: prod.id,
              productName: prod.name,
              quantity: qty,
              estimatedPriceMinor: prod.costPriceMinor,
            },
          ],
          totalMinor,
          status: i % 3 === 0 ? 'pending' : 'approved',
          createdAt: `2026-10-${(1 + (i % 25)).toString().padStart(2, '0')}T09:00:00Z`,
        });
      }
    }
    await db.purchaseOrders.bulkAdd(purchaseOrders);
    await db.purchaseRequests.bulkAdd(purchaseRequests);

    // 12. Sales Orders (50)
    const salesOrders: SalesOrder[] = [];
    for (let i = 1; i <= 50; i++) {
      const cust = customers[i % customers.length];
      const prod = products[(i * 3) % products.length];
      const qty = 2 + (i % 8);
      const totalMinor = prod.unitPriceMinor * qty;

      salesOrders.push({
        id: `so-${i}`,
        orderNumber: `SO-2026-${5000 + i}`,
        customerId: cust.id,
        customerName: cust.company,
        warehouseId: warehouses[i % warehouses.length].id,
        branchId: i % 2 === 0 ? 'branch-ny' : 'branch-hq',
        items: [
          {
            id: `so-item-${i}`,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            quantity: qty,
            unitPriceMinor: prod.unitPriceMinor,
            discountMinor: 0,
            totalMinor,
          },
        ],
        totalMinor,
        status: i % 4 === 0 ? 'delivered' : i % 3 === 0 ? 'shipped' : i % 2 === 0 ? 'processing' : 'confirmed',
        orderDate: `2026-10-${(1 + (i % 28)).toString().padStart(2, '0')}`,
      });
    }
    await db.salesOrders.bulkAdd(salesOrders);

    // 13. Expenses & Budgets
    const expenses: Expense[] = [];
    const expCategories: Expense['category'][] = ['travel', 'software', 'office_supplies', 'utilities', 'marketing', 'hardware', 'consulting'];
    for (let i = 1; i <= 35; i++) {
      expenses.push({
        id: `exp-${i}`,
        expenseNumber: `EXP-2026-${8000 + i}`,
        category: expCategories[i % expCategories.length],
        amountMinor: (200 + (i * 125)) * 100,
        departmentId: departments[i % departments.length].id,
        submittedById: 'user-emp',
        submittedByName: 'Sarah Jenkins',
        date: `2026-10-${(1 + (i % 28)).toString().padStart(2, '0')}`,
        status: i % 5 === 0 ? 'pending' : 'approved',
        description: `Department operations and client project expense #${i}`,
      });
    }
    await db.expenses.bulkAdd(expenses);

    const budgets: Budget[] = departments.map((d, idx) => ({
      id: `bud-${d.id}-2026`,
      departmentId: d.id,
      fiscalYear: 2026,
      allocatedMinor: d.budgetMinor,
      spentMinor: Math.round(d.budgetMinor * (0.65 + (idx % 3) * 0.1)),
    }));
    await db.budgets.bulkAdd(budgets);

    // 14. Stock Movements (Transfer history)
    const stockMovements: StockMovement[] = [
      {
        id: 'sm-01',
        productId: 'prod-001',
        productName: 'Nexus Enterprise Server Pro Series 102X',
        sourceWarehouseId: 'wh-central',
        destWarehouseId: 'wh-south',
        quantity: 15,
        type: 'transfer',
        referenceId: 'TRF-2026-001',
        timestamp: '2026-11-04T14:30:00Z',
        performedBy: 'David Zhao',
      },
      {
        id: 'sm-02',
        productId: 'prod-005',
        productName: 'Nexus Workstation Pro Series 110X',
        sourceWarehouseId: undefined,
        destWarehouseId: 'wh-central',
        quantity: 50,
        type: 'inbound_po',
        referenceId: 'PO-2026-3001',
        timestamp: '2026-11-06T09:15:00Z',
        performedBy: 'David Zhao',
      },
      {
        id: 'sm-03',
        productId: 'prod-003',
        productName: 'Nexus Networking Gear Pro Series 106X',
        sourceWarehouseId: 'wh-east',
        destWarehouseId: undefined,
        quantity: 12,
        type: 'outbound_so',
        referenceId: 'SO-2026-5002',
        timestamp: '2026-11-07T16:45:00Z',
        performedBy: 'Marcus Vance',
      },
    ];
    await db.stockMovements.bulkAdd(stockMovements);

    // 15. Approval Workflows
    const workflows: ApprovalWorkflow[] = [
      {
        id: 'wf-01',
        type: 'purchase_request',
        referenceId: 'pr-1',
        title: 'High-Density Datacenter Server Procurement (Q4 Capacity Expansion)',
        amountMinor: 4500000,
        currentStep: 2,
        totalSteps: 2,
        status: 'approved',
        createdAt: '2026-10-25T10:00:00Z',
        updatedAt: '2026-10-26T16:00:00Z',
        history: [
          {
            id: 'h-1',
            step: 1,
            stepName: 'Procurement Review',
            actorId: 'user-proc',
            actorName: 'Rachel Sterling',
            actorRole: 'procurement_manager',
            action: 'submitted',
            comment: 'Specifications checked and quote validated against vendor agreement.',
            timestamp: '2026-10-25T10:00:00Z',
          },
          {
            id: 'h-2',
            step: 2,
            stepName: 'Finance Approval',
            actorId: 'user-fin',
            actorName: 'Marcus Vance',
            actorRole: 'finance_manager',
            action: 'approved',
            comment: 'Within budgeted capex for Tech infrastructure.',
            timestamp: '2026-10-26T16:00:00Z',
          },
        ],
      },
      {
        id: 'wf-02',
        type: 'expense',
        referenceId: 'exp-5',
        title: 'Executive Client Summit Travel Reimbursement',
        amountMinor: 382000,
        currentStep: 1,
        totalSteps: 2,
        status: 'pending',
        createdAt: '2026-11-07T08:30:00Z',
        updatedAt: '2026-11-07T08:30:00Z',
        history: [
          {
            id: 'h-3',
            step: 1,
            stepName: 'Finance Controller Review',
            actorId: 'user-emp',
            actorName: 'Sarah Jenkins',
            actorRole: 'employee',
            action: 'submitted',
            comment: 'Travel boarding passes and hotel invoice attached.',
            timestamp: '2026-11-07T08:30:00Z',
          },
        ],
      },
    ];
    await db.approvalWorkflows.bulkAdd(workflows);

    // 16. Notifications
    const notifications: Notification[] = [
      {
        id: 'notif-1',
        title: 'Low Stock Alert',
        message: 'Product "Nexus Cloud Peripherals Pro Series 122X" has reached reorder threshold (18 units remaining).',
        type: 'warning',
        category: 'inventory',
        isRead: false,
        link: '/inventory/products',
        createdAt: '2026-11-09T08:00:00Z',
      },
      {
        id: 'notif-2',
        title: 'Pending Expense Approval',
        message: 'Sarah Jenkins submitted travel expense ($3,820.00) requiring your review.',
        type: 'info',
        category: 'workflow',
        isRead: false,
        link: '/workflows/pending',
        createdAt: '2026-11-08T15:20:00Z',
      },
      {
        id: 'notif-3',
        title: 'Purchase Order Delivered',
        message: 'PO-2026-3004 from Apex Semiconductor successfully received at Central Logistics.',
        type: 'success',
        category: 'workflow',
        isRead: true,
        link: '/procurement/purchase-orders',
        createdAt: '2026-11-07T11:45:00Z',
      },
      {
        id: 'notif-4',
        title: 'Overdue Invoices Detected',
        message: '4 corporate client invoices are past their 30-day payment term window.',
        type: 'danger',
        category: 'finance',
        isRead: false,
        link: '/finance/invoices',
        createdAt: '2026-11-06T09:00:00Z',
      },
    ];
    await db.notifications.bulkAdd(notifications);

    // 17. Audit Logs
    const auditLogs: AuditLog[] = [
      {
        id: 'audit-1',
        userId: 'user-admin',
        userName: 'Alexander Wright',
        module: 'Administration',
        action: 'UPDATE_PERMISSIONS',
        recordId: 'role-finance-manager',
        description: 'Updated authorization scopes for Finance Manager role.',
        timestamp: '2026-11-08T16:20:00Z',
        ipAddress: '192.168.1.104',
      },
      {
        id: 'audit-2',
        userId: 'user-fin',
        userName: 'Marcus Vance',
        module: 'Finance',
        action: 'APPROVE_PURCHASE_REQUEST',
        recordId: 'PR-2026-101',
        description: 'Approved capex purchase request for datacenter hardware.',
        timestamp: '2026-11-07T14:15:00Z',
        ipAddress: '192.168.2.45',
      },
      {
        id: 'audit-3',
        userId: 'user-inv',
        userName: 'David Zhao',
        module: 'Inventory',
        action: 'STOCK_TRANSFER',
        recordId: 'TRF-2026-001',
        description: 'Transferred 15 units of Server Pro Series from Central to Austin terminal.',
        timestamp: '2026-11-04T14:30:00Z',
        ipAddress: '192.168.3.12',
      },
    ];
    await db.auditLogs.bulkAdd(auditLogs);
  });

  console.log('NexusERP Database seeding completed successfully.');
}
