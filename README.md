<div align="center">

# 🌐 NexusERP

### Enterprise Resource Planning & Operations Platform

[![React](https://img.shields.io/badge/React-19.0.0-blue?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

*A sophisticated, production-grade enterprise frontend management application simulating interconnected corporate operations across multiple hubs, depots, departments, and personnel.*

[Explore Features](#-system-modules) • [Architecture](#-architecture--data-flow) • [Quick Start](#-quick-start) • [Role System](#-role-based-access-control-rbac)

---

</div>

## 📌 Overview

**NexusERP** is designed as a frontend-only enterprise suite that simulates the operational workflows of large-scale organizations (SAP / Oracle / Microsoft Dynamics level) without requiring external server dependencies.

By leveraging **IndexedDB (via Dexie)**, the application delivers persistent, deterministic enterprise state with relational integrity across human resources, accounting, procurement, warehouses, fulfillment, and audit logging.

---

## 🚀 Key System Modules

```
NexusERP Enterprise Matrix
├── 📊 Executive Operations  ── Real-time KPIs, Trajectory & Fiscal Metrics
├── 👥 Human Resources       ── Directory, Headcount, Attendance & PTO
├── 💳 Financial Accounting  ── Invoicing, Accounts Receivable & Expense Claims
├── 📦 Supply & Warehousing  ── Catalog, Multi-depot Stock & Inter-facility Transfers
├── 🚚 Procurement Operations── Certified Vendors, PO Lifecycle & Goods Intake
├── 💼 Sales & CRM           ── Enterprise Accounts, Order Booking & Dispatch
├── ⚙️ Workflow Engine       ── Multi-tier Sequential Stage-Gate Signoffs
├── 📑 Reports & Audit       ── P&L Ledgers, Balance Sheets & Immutable Event Logs
└── 🔐 IAM & Administration  ── Granular RBAC, Division Topologies & Policy Matrix
```

### 1. 📊 Executive Operations & Analytics
- Real-time aggregation of revenue, expenses, headcount, and inventory valuations computed directly from business records.
- 6-month fiscal trajectory comparative area charts and departmental headcount distribution bar charts.
- Branch facility filters (`All`, `HQ-SF`, `NY-FIN`, `TX-DIST`) dynamically scoping analytics.

### 2. 👥 Human Resources Management (HRM)
- **Personnel Directory**: Over 100 seeded employee profiles with position tiers, compensation, and profile dossiers.
- **Biometric Attendance**: Punch-clock simulator tracking daily shift compliance, late stamps, and hours worked.
- **Leave & Absence Governance**: PTO balance deduction, medical leave requests, and multi-tier approval actions.

### 3. 💳 Finance & Accounting
- **Commercial Billing**: Drafts invoices with itemized bill of materials, 8% state tax auto-calculation, and status workflows.
- **Printable Statements**: Generates official GAAP/tax-compliant printable invoices.
- **Corporate Expenses**: Employee expense reimbursement claims categorized across travel, software, hardware, and consulting.
- **Departmental Budgets**: Fiscal year caps with real-time burn-rate monitoring and high-utilization warnings.

### 4. 📦 Inventory & Multi-Depot Supply Chain
- **Master SKU Catalog**: Comprehensive bill-of-materials with cost vs. selling price matrices and reorder thresholds.
- **Depot Topology**: 5 active warehouses (Central Logistics, East Port Terminal, Texas Distribution, Dallas Transit, Northwest Storage).
- **Physical Cycle Counts**: Adjust stock with positive/negative audit adjustments.
- **⚡ Inter-Facility Stock Transfers**: Validates source depot stock availability and atomically shifts quantities between depots with full audit trails.

### 5. 🚚 Procurement & Vendor Operations
- **Certified Vendor Registry**: Supplier profiles with SLA scores, commercial categories, and payment terms (Net 30, Net 60).
- **Purchase Orders (POs)**: Create purchasing requisitions linked to approval workflows.
- **⚡ Automated Goods Receipt**: Marking purchase orders as received automatically replenishes destination warehouse inventory and logs inbound stock movements.

### 6. 💼 Sales Management & CRM
- **Enterprise Accounts**: Corporate client directories spanning Enterprise, SMB, and Federal accounts.
- **Sales Orders (SOs)**: Commercial contract bookings with automated tax and discounts.
- **⚡ Fulfillment Dispatch**: Dispatching sales orders validates depot stock, deducts physical inventory, and logs outbound movements.

### 7. ⚙️ Multi-Tier Workflow & Approval Engine
- Centralized governance for leaves, expense claims, and purchase commitments.
- Sequential stage gates with timestamped decision histories, reviewer signatures, and rejection justifications.

### 8. 📑 Audit Trail & Compliance
- **SOC 2 / ISO 27001 Ready**: Append-only tamper-evident audit logs capturing timestamp, user ID, module, action, and client IP.
- **Data Export**: One-click CSV export across all data tables and audit ledgers.

---

## 🔐 Role-Based Access Control (RBAC)

NexusERP features a global role switcher in the header to instantly simulate various enterprise roles:

| Role | Demo Persona | Primary Responsibilities |
| :--- | :--- | :--- |
| **Super Admin** | *Alexander Wright* | Unrestricted platform access across all operational modules & IAM |
| **HR Manager** | *Elena Rostova* | Workforce onboarding, department structures, leave & attendance |
| **Finance Manager**| *Marcus Vance* | Accounts receivable, billing invoices, corporate budgets & expenses |
| **Inventory Manager**| *David Zhao* | Depot management, cycle adjustments, and inter-facility transfers |
| **Procurement Specialist**| *Rachel Sterling* | Supplier relations, PO creation, and goods intake processing |
| **Enterprise Staff** | *Sarah Jenkins* | Employee portal: attendance check-in, leave requests, expense filing |
| **Auditor** | *Arthur Sterling* | Strict read-only inspection of ledgers, financial matrices, and audit logs |

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Core Framework** | React 19, TypeScript (Strict Mode) |
| **Build Tooling** | Vite 6 |
| **Styling & UI** | Tailwind CSS v4, Lucide React Icons |
| **Routing** | React Router v7 |
| **State & Queries** | TanStack Query, React Context Architecture |
| **Tables & Visuals** | TanStack Table v8, Recharts |
| **Persistence** | IndexedDB via Dexie |
| **Testing** | Vitest |

---

## 📂 Project Architecture

```
NexusERP/
├── src/
│   ├── app/                 # Root router, providers, and layout configuration
│   ├── core/                # Authentication, Branch context, Theme & RBAC
│   │   ├── auth/
│   │   ├── branch/
│   │   └── theme/
│   ├── database/            # Dexie database schema and deterministic seed data
│   │   ├── index.ts
│   │   └── seed.ts
│   ├── components/          # Reusable enterprise design system
│   │   ├── layout/          # Sidebar, Header, Breadcrumbs
│   │   └── ui/              # Button, Badge, Card, Modal, DataTable
│   ├── features/            # Feature-driven business domain modules
│   │   ├── administration/  # User IAM, Roles & Audit logs
│   │   ├── approvals/       # Multi-step workflow approval engine
│   │   ├── attendance/      # Biometric attendance & punch clock
│   │   ├── auth/            # Login page & demo account picker
│   │   ├── budgets/         # Fiscal year budget utilization
│   │   ├── customers/       # CRM enterprise accounts
│   │   ├── dashboard/       # Executive KPI overview & charts
│   │   ├── departments/     # Corporate divisions & cost centers
│   │   ├── employees/       # Personnel directory & dossiers
│   │   ├── expenses/        # Reimbursement claims ledger
│   │   ├── inventory/       # Products, Warehouses, Stock & Transfers
│   │   ├── invoices/        # Commercial invoices & printable billing
│   │   ├── leaves/          # PTO leave management
│   │   ├── procurement/     # Vendors & Purchase Orders
│   │   ├── reports/         # Compliance ledgers & CSV exports
│   │   └── sales/           # Sales orders & fulfillment
│   ├── shared/              # Shared TypeScript types, utility helpers, formatters
│   ├── styles/              # Global Tailwind CSS definitions
│   └── test/                # Unit & regression test suites
├── public/                  # Static assets
└── package.json
```

---

## ⚡ Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- `npm` or `pnpm`

### Installation & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MKarthik17/nexus-erp.git
   cd nexus-erp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open your browser at [http://localhost:3000](http://localhost:3000).

4. **Run Unit Tests:**
   ```bash
   npm test
   ```

5. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 🔄 Resetting Demo Data

NexusERP stores all modifications inside your browser's IndexedDB. If you make transfers, delete records, or test workflows and wish to restore the initial corporate state:
- Click the **"Reset Seed Data"** button located in the top navigation header at any time.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
