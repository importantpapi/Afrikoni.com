# Afrikoni Alibaba Mode - Implementation Guide

## 🎯 Overview

This document provides a complete guide to implementing all remaining dashboard pages and features for Afrikoni's Alibaba-level B2B marketplace.

## ✅ What's Already Done

1. **Database Schema** - All tables created via Supabase migrations
2. **Query Wrappers** - Complete Supabase query functions in `src/lib/supabaseQueries/`
3. **Navigation** - Dashboard menu updated for all roles
4. **Payments Dashboard** - Example implementation at `src/pages/dashboard/payments.jsx`
5. **Routes** - All routes added to `src/App.jsx`

## 📋 Pages to Create

### Priority 1: Core Business Pages

#### 1. Invoices Dashboard (`src/pages/dashboard/invoices.jsx`)
**Features:**
- List all invoices (buyer/seller view)
- Filter by status (draft, issued, paid, overdue, cancelled)
- Create invoice from order (seller)
- Pay invoice (buyer) → triggers wallet transaction
- View invoice detail page
- Download/print invoice PDF

**Query Functions:**
- `getInvoices(companyId, role, filters)`
- `getInvoice(invoiceId)`
- `createInvoiceFromOrder(orderId, invoiceData)`
- `markInvoiceAsPaid(invoiceId, paymentData)`

#### 2. Returns Dashboard (`src/pages/dashboard/returns.jsx`)
**Features:**
- List returns (buyer/seller view)
- Request return (buyer)
- Approve/reject return (seller)
- Track return status
- Auto-refund via escrow when approved

**Query Functions:**
- `getReturns(companyId, role, filters)`
- `getReturn(returnId)`
- `createReturn(returnData)`
- `updateReturnStatus(returnId, status, updates)`

#### 3. Reviews Dashboard (`src/pages/dashboard/reviews.jsx`)
**Features:**
- List company reviews
- Create review after order completion
- View trust score history
- Display company ranking badge

**Query Functions:**
- `getCompanyReviews(companyId, filters)`
- `createCompanyReview(reviewData)`
- `getCompanyTrustHistory(companyId)`
- `getCompanyRanking(companyId)`

#### 4. Fulfillment Dashboard (`src/pages/dashboard/fulfillment.jsx`)
**Features:**
- List orders needing fulfillment
- Update fulfillment status (picking → packed → ready → dispatched)
- Add warehouse locations
- Track fulfillment timeline

**Query Functions:**
- `getOrderFulfillment(orderId)`
- `updateFulfillmentStatus(fulfillmentId, status, updates)`
- `getWarehouseLocations(companyId)`
- `createWarehouseLocation(locationData)`

#### 5. Performance Dashboard (`src/pages/dashboard/performance.jsx`)
**Features:**
- Supplier performance metrics:
  - On-time delivery rate
  - Average response time
  - Dispute rate
  - Average rating
- Product performance:
  - View counts
  - Views by source
  - Conversion metrics
- Charts using Recharts

**Query Functions:**
- `getSupplierPerformance(companyId)`
- `calculateSupplierPerformance(companyId)`
- `getProductViewStats(productId, period)`

### Priority 2: Detail Pages

#### 6. Escrow Detail (`src/pages/dashboard/escrow/[orderId].jsx`)
**Features:**
- View escrow payment details
- See escrow event timeline
- Release escrow (admin/seller after delivery confirmation)
- Refund escrow (admin for disputes)

#### 7. Invoice Detail (`src/pages/dashboard/invoices/[id].jsx`)
**Features:**
- Full invoice details
- Payment button (buyer)
- PDF download
- Payment history

#### 8. Return Detail (`src/pages/dashboard/returns/[id].jsx`)
**Features:**
- Return request details
- Approve/reject buttons (seller)
- Refund status
- Return timeline

### Priority 3: Admin Pages

#### 9. Marketing Leads (`src/pages/dashboard/admin/leads.jsx`)
**Features:**
- List all marketing leads
- Filter by status, source
- Update lead status
- Conversion funnel visualization

**Query Functions:**
- `getMarketingLeads(filters)`
- `updateMarketingLead(leadId, updates)`
- `getChannelStats(filters)`

#### 10. KYB Verification (`src/pages/dashboard/admin/kyb.jsx`)
**Features:**
- List pending KYB documents
- Approve/reject documents
- View document details
- Link to company verification

**Query Functions:**
- `getAllPendingKYBDocuments()`
- `updateKYBDocumentStatus(documentId, status, reviewerId, notes)`

#### 11. Disputes & Escrow (`src/pages/dashboard/admin/disputes.jsx`)
**Features:**
- List all disputes
- Escrow release/refund controls
- Dispute resolution workflow
- Audit log

## 🎨 Design Patterns

### Page Structure Template

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '@/layouts/DashboardLayout';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
// Import query functions
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/skeletons';

export default function YourDashboardPage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { user, companyId: userCompanyId } = await getCurrentUserAndRole(supabase);
      if (!user || !userCompanyId) {
        navigate('/login');
        return;
      }
      setCompanyId(userCompanyId);
      
      // Load data using query functions
      const result = await yourQueryFunction(userCompanyId);
      setData(result);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <CardSkeleton count={3} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-afrikoni-text-dark mb-2">Page Title</h1>
          <p className="text-afrikoni-text-dark/70">Description</p>
        </motion.div>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>Content Title</CardTitle>
          </CardHeader>
          <CardContent>
            {data.length === 0 ? (
              <EmptyState
                icon={YourIcon}
                title="No data"
                description="Description"
              />
            ) : (
              // Your content here
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
```

## 🔗 Integration Points

### Order Flow Integration

1. **On Order Confirmation:**
   - Create escrow payment
   - Create order fulfillment record
   - Send notifications

2. **On Order Completion:**
   - Prompt for review
   - Update supplier performance
   - Release escrow (if auto-release enabled)

3. **On Return Request:**
   - Create return record
   - Notify seller
   - Track return status

### Product Page Integration

1. **Add AI Recommendations:**
   ```jsx
   import { getProductRecommendations } from '@/lib/supabaseQueries/ai';
   
   const recommendations = await getProductRecommendations(productId, 10);
   // Display in carousel
   ```

2. **Track Product Views:**
   ```jsx
   import { trackProductView } from '@/lib/supabaseQueries/products';
   
   await trackProductView(productId, {
     profile_id: user.id,
     company_id: companyId,
     source_page: 'marketplace'
   });
   ```

3. **Display Product Specs:**
   ```jsx
   import { getProductSpecs } from '@/lib/supabaseQueries/products';
   
   const specs = await getProductSpecs(productId);
   // Display in specs table
   ```

### Supplier Profile Integration

1. **Display Trust Score:**
   ```jsx
   import { getCompanyRanking } from '@/lib/supabaseQueries/reviews';
   
   const ranking = await getCompanyRanking(companyId);
   // Show badge: Gold/Silver/Bronze
   ```

2. **Show Performance Metrics:**
   ```jsx
   import { getSupplierPerformance } from '@/lib/supabaseQueries/products';
   
   const performance = await getSupplierPerformance(companyId);
   // Display metrics
   ```

## 🚀 Next Steps

1. Create all Priority 1 pages (Invoices, Returns, Reviews, Fulfillment, Performance)
2. Create detail pages (Escrow, Invoice, Return)
3. Create admin pages (Leads, KYB, Disputes)
4. Integrate with existing order flow
5. Add AI recommendations to product pages
6. Add product view tracking
7. Add trust score badges to supplier profiles
8. Test end-to-end flows

## 📝 Notes

- All pages should follow the design pattern above
- Use Afrikoni color scheme (gold, cream, charcoal)
- Include loading states and error handling
- Make responsive for mobile
- Use Framer Motion for animations
- Follow role-based access control

