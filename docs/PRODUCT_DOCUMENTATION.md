# AFRIKONI PRODUCT DOCUMENTATION
## Trade. Trust. Thrive.

---

## OVERVIEW

Afrikoni is a Pan-African B2B marketplace platform that enables verified suppliers and buyers to trade across 54 African countries with trust, security, and efficiency.

### Platform Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          AFRIKONI PLATFORM                              │
│                      "Trust Infrastructure for African Trade"           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────┬───────────┬───┴───┬───────────┬───────────┐
        │           │           │       │           │           │
   ┌────▼────┐ ┌────▼────┐ ┌────▼────┐ ┌────▼────┐ ┌────▼────┐ ┌────▼────┐
   │  BUYER  │ │ SELLER  │ │LOGISTICS│ │FINANCIAL│ │  TRUST  │ │  ADMIN  │
   │ ENGINE  │ │ ENGINE  │ │ ENGINE  │ │ ENGINE  │ │ FIREWALL│ │ CONSOLE │
   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

---

## CORE MODULES

### 1. BUYER ENGINE

The Buyer Engine enables businesses to discover, evaluate, and purchase from verified African suppliers.

#### Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Product Discovery** | Browse and search products across 54 countries | ✅ Live |
| **RFQ Creation** | Create Request for Quotes with specifications | ✅ Live |
| **Smart Matching** | AI-powered supplier recommendations | ⏳ Planned |
| **Quote Comparison** | Compare quotes from multiple suppliers | ✅ Live |
| **Order Placement** | Place orders with escrow protection | ✅ Live |
| **Order Tracking** | Real-time order status updates | ✅ Live |
| **Saved Items** | Wishlist and favorite products | ✅ Live |
| **Purchase History** | Complete transaction history | ✅ Live |

#### User Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Browse    │───▶│   Create    │───▶│   Compare   │───▶│   Place     │
│  Products   │    │    RFQ      │    │   Quotes    │    │   Order     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │
│   Review    │◀───│   Receive   │◀───│   Track     │◀──────────┘
│  Supplier   │    │  Delivery   │    │  Shipment   │
└─────────────┘    └─────────────┘    └─────────────┘
```

#### Key Pages

- `/marketplace` - Product browsing and search
- `/rfq/create` - RFQ creation form
- `/orders` - Order management dashboard
- `/saved` - Saved items and favorites

---

### 2. SELLER ENGINE

The Seller Engine provides tools for suppliers to list products, respond to RFQs, and manage sales.

#### Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Product Listing** | Create and manage product listings | ✅ Live |
| **Inventory Management** | Track stock levels and availability | ✅ Live |
| **RFQ Responses** | Respond to buyer requests with quotes | ✅ Live |
| **Order Management** | Process and fulfill orders | ✅ Live |
| **Sales Analytics** | Track sales performance metrics | ✅ Live |
| **Performance Score** | Supplier rating and trust score | ✅ Live |
| **Verification Status** | KYC/KYB verification management | ✅ Live |
| **Payout Management** | Track and withdraw earnings | ✅ Live |

#### User Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    List     │───▶│   Receive   │───▶│    Send     │───▶│   Process   │
│  Products   │    │    RFQs     │    │   Quotes    │    │   Orders    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │
│   Receive   │◀───│   Escrow    │◀───│    Ship     │◀──────────┘
│   Payout    │    │   Release   │    │   Order     │
└─────────────┘    └─────────────┘    └─────────────┘
```

#### Key Pages

- `/seller/products` - Product management
- `/seller/rfqs` - RFQ inbox and responses
- `/seller/orders` - Order fulfillment
- `/seller/analytics` - Sales performance
- `/seller/verification` - KYC status

---

### 3. LOGISTICS ENGINE

The Logistics Engine provides shipment tracking, customs clearance, and logistics partner integration.

#### Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Shipment Tracking** | Real-time cargo tracking | ✅ Live |
| **Customs Clearance** | Track customs documentation status | ✅ Live |
| **Logistics Quotes** | Get quotes from shipping partners | ✅ Live |
| **Document Management** | Store shipping documents | ✅ Live |
| **Route Optimization** | Suggest optimal shipping routes | ⏳ Planned |
| **Partner Network** | Integrated freight forwarders | ⏳ In Progress |

#### Tracking States

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Order   │──▶│  Picked  │──▶│   In     │──▶│ Customs  │──▶│Delivered │
│ Placed   │   │    Up    │   │ Transit  │   │ Clearing │   │          │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

#### Key Pages

- `/logistics/tracking` - Shipment tracking dashboard
- `/logistics/customs` - Customs clearance status
- `/logistics/quotes` - Request shipping quotes

---

### 4. FINANCIAL ENGINE

The Financial Engine handles payments, escrow, wallets, and commission tracking.

#### Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Escrow Payments** | Secure payment holding | ✅ Live |
| **Wallet Management** | Account balance and funds | ✅ Live |
| **Commission Tracking** | Platform fee calculation | ✅ Live |
| **Invoice Generation** | Auto-generate invoices | ✅ Live |
| **Payout Processing** | Seller fund releases | ⏳ Pending Flutterwave |
| **Multi-Currency** | Support for African currencies | ✅ Live |
| **Refund Processing** | Returns and refunds | ✅ Live |

#### Payment Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TRADE SHIELD ESCROW                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  BUYER                    AFRIKONI                     SELLER       │
│    │                         │                           │          │
│    │──── Payment ───────────▶│                           │          │
│    │                         │ (Held in Escrow)          │          │
│    │                         │                           │          │
│    │◀── Order Shipped ───────│─── Ship Order ───────────▶│          │
│    │                         │                           │          │
│    │── Confirm Delivery ────▶│                           │          │
│    │                         │                           │          │
│    │                         │── Release Funds ─────────▶│          │
│    │                         │   (minus 8% commission)   │          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Commission Structure

| Transaction Type | Commission Rate |
|------------------|-----------------|
| Standard Order | 8% |
| Premium Seller | 6% |
| Elite Seller | 5% |

#### Key Pages

- `/wallet` - Account balance and transactions
- `/payments` - Payment processing
- `/invoices` - Invoice management

---

### 5. TRUST FIREWALL (GOVERNANCE)

The Trust Firewall provides verification, risk assessment, and compliance monitoring.

#### Features

| Feature | Description | Status |
|---------|-------------|--------|
| **KYC Verification** | Individual identity verification | ✅ Live |
| **KYB Verification** | Business document verification | ✅ Live |
| **Risk Scoring** | AI-powered risk assessment | ✅ Live |
| **Dispute Resolution** | Conflict arbitration system | ✅ Live |
| **Review System** | Supplier and buyer reviews | ✅ Live |
| **Fraud Detection** | Suspicious activity monitoring | ✅ Live |
| **Compliance Monitoring** | Regulatory adherence | ✅ Live |
| **Activity Logging** | Complete audit trails | ✅ Live |

#### Verification Levels

| Level | Requirements | Benefits |
|-------|--------------|----------|
| **Unverified** | Email only | Can browse, limited features |
| **Basic** | ID + Phone | Can buy, basic selling |
| **Verified** | KYC + Business docs | Full platform access |
| **Premium** | Enhanced verification | Featured placement, lower fees |

#### Dispute Process

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Dispute  │──▶│ Evidence │──▶│  Review  │──▶│ Decision │──▶│Resolution│
│  Filed   │   │ Submitted│   │  Period  │   │   Made   │   │ Executed │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
     │              │              │              │              │
   Day 0         Day 3          Day 7         Day 10         Day 14
```

#### Key Pages

- `/verification` - KYC/KYB submission
- `/disputes` - Dispute management
- `/reviews` - Review system

---

### 6. ADMIN CONSOLE

The Admin Console provides platform management, analytics, and operational tools.

#### Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Dashboard** | Platform overview metrics | ✅ Live |
| **User Management** | Manage users and companies | ✅ Live |
| **Verification Queue** | Review KYC submissions | ✅ Live |
| **Dispute Management** | Arbitrate disputes | ✅ Live |
| **Analytics** | Platform performance metrics | ✅ Live |
| **Trade Intelligence** | Market insights | ✅ Live |
| **Revenue Tracking** | Financial analytics | ✅ Live |
| **Content Moderation** | Review listings and content | ✅ Live |

#### Key Pages

- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/verifications` - Verification review
- `/admin/disputes` - Dispute arbitration
- `/admin/analytics` - Platform analytics

---

## TECHNICAL ARCHITECTURE

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS |
| **UI Components** | Radix UI, Custom components |
| **State Management** | React Context, Custom hooks |
| **Backend** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth (Email, OAuth) |
| **Real-time** | Supabase Realtime |
| **Storage** | Supabase Storage |
| **Payments** | Flutterwave |
| **Hosting** | Vercel |
| **Monitoring** | Sentry |

### Database Schema Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  USERS & COMPANIES                                                  │
│  ├── profiles              User profiles linked to auth            │
│  ├── companies             Business entities                        │
│  └── company_capabilities  Buyer/Seller/Logistics flags            │
│                                                                     │
│  MARKETPLACE                                                        │
│  ├── products              Product listings                         │
│  ├── rfqs                  Request for Quotes                       │
│  ├── quotes                Seller responses to RFQs                 │
│  └── orders                Purchase orders                          │
│                                                                     │
│  FINANCIAL                                                          │
│  ├── escrow_payments       Payment protection                       │
│  ├── revenue_transactions  Platform revenue tracking                │
│  └── subscriptions         Company subscription plans               │
│                                                                     │
│  LOGISTICS                                                          │
│  ├── shipment_tracking_events  Shipment status updates             │
│  ├── customs_clearance     Customs documentation                    │
│  └── logistics_quotes      Shipping quotes                          │
│                                                                     │
│  TRUST                                                              │
│  ├── kyc_verifications     Identity verification                    │
│  ├── reviews               User reviews                             │
│  ├── disputes              Dispute records                          │
│  └── activity_logs         Audit trail                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Security

| Feature | Implementation |
|---------|----------------|
| **Authentication** | Supabase Auth with JWT |
| **Authorization** | Row-Level Security (RLS) |
| **Data Isolation** | Company-scoped queries |
| **API Security** | API keys, rate limiting |
| **Encryption** | TLS in transit, encrypted at rest |
| **Audit Logging** | Complete activity trails |

### The Kernel Pattern

Afrikoni uses a unified "Kernel" architecture for state management:

```javascript
// All dashboard components use this single hook
const {
  userId,           // Current user ID
  profileCompanyId, // Company for data scoping
  isAdmin,          // Admin flag
  capabilities,     // Buyer/Seller capabilities
  isSystemReady,    // UI gate
  canLoadData       // Data loading gate
} = useDashboardKernel();
```

**Benefits:**
- Single source of truth
- Prevents auth jitter
- Ensures data scoping
- Simplifies component logic

---

## USER ROLES & PERMISSIONS

### Role Types

| Role | Description | Permissions |
|------|-------------|-------------|
| **Buyer** | Purchases products | Browse, RFQ, Order, Review |
| **Seller** | Lists and sells products | List, Quote, Fulfill, Payout |
| **Hybrid** | Both buyer and seller | All buyer + seller permissions |
| **Logistics** | Shipping provider | Logistics features |
| **Admin** | Platform administrator | Full system access |

### Capability System

```javascript
// Company capabilities determine feature access
{
  can_buy: true,        // Buyer features enabled
  can_sell: true,       // Seller features enabled
  can_logistics: false, // Logistics features disabled
  sell_status: 'approved',
  logistics_status: 'pending'
}
```

---

## SUBSCRIPTION PLANS

### Plan Tiers

| Feature | Free | Growth (€49/mo) | Elite (€199/mo) |
|---------|------|-----------------|-----------------|
| Product listings | 5 | 50 | Unlimited |
| RFQs per month | 10 | 50 | Unlimited |
| Commission rate | 8% | 7% | 5% |
| Analytics | Basic | Advanced | Full |
| Support | Community | Priority | Dedicated |
| API access | No | Limited | Full |
| Featured placement | No | Yes | Yes |
| Verification speed | Standard | Fast-track | Immediate |

---

## API OVERVIEW

### Authentication

```
POST /auth/signup
POST /auth/signin
POST /auth/signout
POST /auth/reset-password
```

### Products

```
GET    /products              List products
GET    /products/:id          Get product details
POST   /products              Create product (seller)
PUT    /products/:id          Update product (seller)
DELETE /products/:id          Delete product (seller)
```

### RFQs

```
GET    /rfqs                  List RFQs
GET    /rfqs/:id              Get RFQ details
POST   /rfqs                  Create RFQ (buyer)
POST   /rfqs/:id/quotes       Submit quote (seller)
```

### Orders

```
GET    /orders                List orders
GET    /orders/:id            Get order details
POST   /orders                Create order
PUT    /orders/:id/status     Update order status
```

### Verification

```
GET    /verification/status   Get verification status
POST   /verification/kyc      Submit KYC documents
POST   /verification/kyb      Submit KYB documents
```

---

## INTEGRATIONS

### Current Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| **Supabase** | Database, Auth, Storage | ✅ Live |
| **Flutterwave** | Payment processing | ⏳ Pending |
| **Vercel** | Hosting | ✅ Live |
| **Sentry** | Error monitoring | ✅ Live |
| **Google Analytics** | Usage analytics | ✅ Live |

### Planned Integrations

| Service | Purpose | Timeline |
|---------|---------|----------|
| **Logistics APIs** | Shipping rates, tracking | Q2 2026 |
| **KYC Providers** | Identity verification | Q2 2026 |
| **Banking APIs** | Direct payouts | Q3 2026 |
| **AI/ML Services** | Matching, fraud detection | Q3 2026 |

---

## DEPLOYMENT

### Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| **Development** | localhost:5173 | Local development |
| **Staging** | staging.afrikoni.com | Pre-production testing |
| **Production** | afrikoni.com | Live platform |

### Build & Deploy

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Environment Variables

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_key
VITE_SENTRY_DSN=your_sentry_dsn
```

---

## SUPPORT

### Documentation

- Brand Guidelines: `/docs/BRAND_GUIDELINES.md`
- Press Kit: `/docs/PRESS_KIT.md`
- API Reference: `/docs/API.md`
- Architecture: `/AFRIKONI_KERNEL_MANIFESTO.md`

### Contact

- Technical Support: support@afrikoni.com
- Business Inquiries: business@afrikoni.com
- Press: press@afrikoni.com

---

**TRADE. TRUST. THRIVE.**

*© 2026 Afrikoni. All rights reserved.*
