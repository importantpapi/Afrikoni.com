<p align="center">
  <img src="public/images/afrikoni-logo.png" alt="Afrikoni Logo" width="300">
</p>

<h1 align="center">AFRIKONI</h1>

<p align="center">
  <strong>Trade. Trust. Thrive.</strong>
</p>

<p align="center">
  The Pan-African B2B Marketplace for Verified Trade
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Overview

**Afrikoni** is a Pan-African B2B marketplace that connects verified suppliers and buyers across all 54 African countries. We provide the trust infrastructure - verification, escrow payments, logistics tracking, and dispute resolution - that enables African businesses to trade across borders with confidence.

### The Problem

- 85% of African trade goes outside the continent
- No trusted platform for cross-border B2B transactions
- Payment fraud and supplier verification challenges
- Fragmented logistics and customs processes

### Our Solution

Afrikoni creates the **trust layer** for African trade:

- **Verified Suppliers** - KYC/KYB verification for every business
- **Protected Payments** - Escrow holds funds until delivery confirmed
- **Integrated Logistics** - Track shipments and customs in real-time
- **Dispute Resolution** - Fair arbitration when issues arise
- **One Platform** - 54 countries, unified marketplace

---

## Features

### For Buyers

| Feature | Description |
|---------|-------------|
| **Product Discovery** | Browse verified suppliers across 54 countries |
| **RFQ System** | Request quotes from multiple suppliers |
| **Trade Shield** | Escrow protection for all payments |
| **Order Tracking** | Real-time shipment and customs tracking |
| **Supplier Reviews** | Community-driven trust ratings |

### For Sellers

| Feature | Description |
|---------|-------------|
| **Product Listings** | List products for Pan-African buyers |
| **RFQ Responses** | Respond to buyer requests |
| **Sales Analytics** | Track performance and revenue |
| **Secure Payouts** | Get paid when delivery confirmed |
| **Verification Badge** | Build trust with verification |

### Platform Features

| Feature | Description |
|---------|-------------|
| **KYC/KYB Verification** | Identity and business verification |
| **Multi-Currency** | Support for all African currencies |
| **Real-time Messaging** | Buyer-seller communication |
| **Logistics Integration** | Shipping quotes and tracking |
| **Admin Dashboard** | Platform analytics and management |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/afrikoni.git

# Navigate to project directory
cd afrikoni

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Add your Supabase credentials to .env
# VITE_SUPABASE_URL=your_url
# VITE_SUPABASE_ANON_KEY=your_key

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_key
VITE_SENTRY_DSN=your_sentry_dsn
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite 5, Tailwind CSS |
| **UI Components** | Radix UI, Framer Motion |
| **Backend** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Real-time** | Supabase Realtime |
| **Storage** | Supabase Storage |
| **Payments** | Flutterwave |
| **Hosting** | Vercel |
| **Monitoring** | Sentry |

---

## Project Structure

```
afrikoni/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React context providers
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   ├── services/           # API and service layers
│   ├── utils/              # Utility functions
│   └── App.jsx             # Main application component
├── supabase/
│   ├── migrations/         # Database migrations
│   └── functions/          # Edge functions
├── docs/                   # Documentation
└── package.json
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Brand Guidelines](docs/BRAND_GUIDELINES.md) | Logo, colors, typography |
| [Press Kit](docs/PRESS_KIT.md) | Media resources and boilerplate |
| [Product Documentation](docs/PRODUCT_DOCUMENTATION.md) | Feature specifications |
| [Kernel Manifesto](AFRIKONI_KERNEL_MANIFESTO.md) | Architecture principles |
| [Business Plan](BUSINESS_PLAN_2026.md) | Strategy and roadmap |

---

## Architecture

### The Kernel Pattern

Afrikoni uses a unified "Kernel" architecture for dashboard state management:

```javascript
const {
  userId,           // Current user ID
  profileCompanyId, // Company for data scoping
  isAdmin,          // Admin flag
  capabilities,     // Buyer/Seller/Logistics
  isSystemReady,    // UI ready flag
  canLoadData       // Data loading flag
} = useDashboardKernel();
```

This ensures:
- Single source of truth
- No authentication jitter
- Consistent data scoping
- Simplified component logic

See [Kernel Manifesto](AFRIKONI_KERNEL_MANIFESTO.md) for details.

---

## Development

### Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Format code
npm run format
```

### Database Migrations

```bash
# Migrations are in supabase/migrations/
# Apply via Supabase dashboard or CLI
```

---

## Contributing

We welcome contributions to Afrikoni!

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow existing code patterns
- Use the Kernel pattern for dashboard components
- Write meaningful commit messages
- Add comments for complex logic

---

## Market Opportunity

| Metric | Value |
|--------|-------|
| **Total Market** | $1 Trillion |
| **Countries** | 54 |
| **Population** | 1.4 Billion |
| **Growth Rate** | 15-20% annually |

Africa's Continental Free Trade Area (AfCFTA) is the world's largest free trade zone. Afrikoni is building the digital infrastructure to make it work.

---

## Platform Statistics

| Metric | Value |
|--------|-------|
| **Lines of Code** | 38,835+ |
| **Components** | 210 |
| **Pages** | 168 |
| **Database Migrations** | 43 |
| **Completion** | 95% |

---

## Contact

- **Website:** [afrikoni.com](https://afrikoni.com)
- **Email:** info@afrikoni.com
- **LinkedIn:** [/company/afrikoni](https://linkedin.com/company/afrikoni)
- **Twitter:** [@afrikoni](https://twitter.com/afrikoni)

---

## License

This project is proprietary software. All rights reserved.

---

<p align="center">
  <strong>TRADE. TRUST. THRIVE.</strong>
</p>

<p align="center">
  Built with determination in Brussels, Belgium
</p>

<p align="center">
  © 2026 Afrikoni. All rights reserved.
</p>
