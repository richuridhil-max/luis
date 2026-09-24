# LUISCART — Complete Premium E-Commerce Management System

![LUISCART Brand Banner](public/assets/luiscart-logo.png)

A production-ready, SaaS-grade **E-Commerce Operations & Management Platform** tailored for **LUISCART — Premium E-Commerce**.

Built with a unified, high-performance architecture:
- **Backend**: Native Node.js v24 HTTP REST server powered by built-in `node:sqlite` for transactional integrity.
- **Frontend**: Responsive Single-Page Application (SPA) designed with an emerald & gold luxury palette reflecting the LUISCART brand identity, powered by Tailwind CSS, Lucide icons, and Chart.js.
- **Print Engine**: Tax-compliant GST Invoice generator and 4x6 thermal shipping labels with scannable barcodes.
- **Simulators**: Live storefront checkout simulator & real-time courier tracking lookups.

---

## Key Modules & Features

### 1. Executive Operations Dashboard
Answers all core business questions immediately upon login:
- **Top-Level KPI Cards**:
  1. Total Revenue (₹)
  2. Total Orders
  3. Total Customers
  4. Products Sold (units)
  5. Net Sales
  6. Estimated Profit (Revenue - COGS - Expenses - Tax)
  7. Pending Payments
  8. Refund Amount
- **Period Filter**: `Today`, `Yesterday`, `7 Days`, `30 Days`, `This Month`, `Last Month`, `This Year`
- **Period Comparisons**: Dynamically calculates percentage growth vs the previous equivalent period (e.g. `+18.4% vs previous period`).
- **Interactive Charts**:
  - Revenue analytics line/area chart (Daily/Weekly/Monthly)
  - Order status breakdown donut chart (all 11 statuses)
  - Top-selling products ranking with units sold & profit margin
  - Customer cohort intelligence (repeat purchase rate, average order value, average LTV, VIP clients)
  - Recent live transactions feed

### 2. Order Management & Timeline Audit Trail
- **Complete 11-Stage Order Lifecycle**:
  `NEW` → `CONFIRMED` → `PROCESSING` → `PACKED` → `SHIPPED` → `OUT_FOR_DELIVERY` → `DELIVERED` → `CANCELLED` → `RETURN_REQUESTED` → `RETURNED` → `REFUNDED`
- **Search & Filters**: Search by Order ID (`#LC10294`), customer name, email, phone, or courier AWB. Tabbed filters with badge counts.
- **Timestamped Audit Timeline**: Every order status change creates an immutable, timestamped event recording who triggered it and why.
- **CSV Export**: One-click full export of orders for accounting and reporting.

### 3. Split-Screen Order Details
- **Left Column**:
  - Customer contact card (Phone, Email, Direct WhatsApp & Call buttons)
  - Itemized product table with thumbnails, SKU, unit prices, quantity, and line totals
  - Financial breakdown (Subtotal, Promo discount, 18% GST, Shipping fee, Total)
  - Chronological vertical timeline with status badges, timestamps, and actor notes
- **Right Column**:
  - Payment status & gateway reference ID
  - Courier logistics (Bluedart, Delhivery, DTDC, FedEx) with live tracking status
  - Customer delivery & billing address
  - **Admin Action Suite**:
    - **Print / Save PDF Tax Invoice**: Luxury invoice with LUISCART branding, GSTIN, HSN codes, and digital signature stamp.
    - **Print 4x6 Shipping Label**: Thermal-ready shipping label with scannable barcode and AWB.
    - **Update Order Status**: Advance order state with audit memo.
    - **Assign / Edit Courier Tracking**: Set AWB and courier partner.
    - **Process Refund**: Full or partial refund with optional stock replenishment.
    - **Internal Private Notes**: Staff collaboration thread.

### 4. Customer Management (CRM)
- Customer directory table with search, tags (`VIP`, `REGULAR`, `NEW`, `AT_RISK`), total spend (₹), and orders count.
- **Customer 360° Profile Drawer**: Complete purchase history, lifetime value, and concierge notes editor.
- Export customer directory to CSV.

### 5. Products & Inventory Margin Engine
- Luxury catalog with high-resolution imagery, SKUs, and categories (Watches, Leather Goods, Eyewear, Fragrances, Apparel).
- **Profit Margin Calculator**: Displays gross margin percentage and profit per unit dynamically as cost/selling prices are edited.
- **Inventory Valuations**: Retail potential yield vs cost locked in stock.
- **Low-Stock Alert Banners**: Flags SKUs at or below threshold with quick restock modals.
- **Stock Movement Audit Log**: Immutable ledger of inventory changes (sales, restocks, returns).

### 6. Logistics & Shipping Hub
- Carrier statistics: Shipment volume, in-transit parcels, and on-time delivery rates across Bluedart, Delhivery, DTDC, and FedEx.
- Active in-flight consignments table with live tracking simulation.

### 7. Financials, P&L & Billing
- **Audited Profit & Loss Statement**:
  - Gross Sales
  - Less: Discounts given
  - Net Sales
  - Less: Cost of Goods Sold (COGS)
  - Gross Profit & Margin %
  - Operating expenses breakdown (Marketing, Packaging, Shipping, Platform Fee, Office)
  - Net Profit & Net Margin %
- **GST Tax Ledger**: 18% GST output tax tracked across all paid transactions.
- **Operating Expense Logger**: Add ad spend, packaging supplies, and studio shoots.
- **Centralized Invoices Table**: Access and print tax invoices for all settled orders.

### 8. Discounts & Promotional Engine
- Promo codes management (`LUISGOLD`, `WELCOME10`, `ROYAL500`, `FREESHIP`, `FESTIVE20`).
- Configurable discount types (Percentage, Fixed Amount, Free Shipping), min. order values, usage limits, and expiration dates.

### 9. Storefront Order Simulator / POS
- Test customer checkout and watch the entire admin platform respond in real-time:
  - Add items to basket, adjust quantities, apply promo codes, select customer, and checkout.
  - Automatically deducts inventory, creates order, appends to chronological timeline, updates KPIs, and opens the invoice ready to print!

---

## Getting Started

### 1. Launch the Server
Double click `run.cmd` on Windows, or execute:
```bash
node server/server.js
```
Or via the Antigravity Node runner:
```powershell
& "C:\Users\VICTUS\AppData\Roaming\Antigravity\bin\agy-node.cmd" server/server.js
```

### 2. Access the Admin Platform
Open your browser and navigate to:
```
http://localhost:3001
```

### 3. Reset Demo Data
To re-populate realistic demo orders, products, and VIP clients anytime, go to **Store Settings** → **Reset & Re-Seed Demo Data**, or run:
```powershell
& "C:\Users\VICTUS\AppData\Roaming\Antigravity\bin\agy-node.cmd" server/seed.js
```

# luis
