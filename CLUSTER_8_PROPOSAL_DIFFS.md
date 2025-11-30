# 🎯 CLUSTER 8: MARKETPLACE INTELLIGENCE — PROPOSAL & DIFFS

**Date**: Phase 2 - Cluster 8  
**Status**: Proposal Complete - Awaiting Approval  
**Implementation**: Not Started

---

## 📋 OVERVIEW

This proposal outlines 3 sub-clusters to enhance marketplace intelligence:

- **8A**: Marketplace Smart Search & Filters (Buyer-side)
- **8B**: Buyer Intelligence & Tools
- **8C**: Dashboard Intelligence Widgets

Each sub-cluster includes:
- New helpers/components
- Files to modify
- Example DIFFs
- Expected UX

---

## 🔹 SUB-CLUSTER 8A: MARKETPLACE SMART SEARCH & FILTERS

### Goal
Wire up existing filter inputs, add sort options, add chip filters, and improve search functionality across marketplace pages.

### New Helpers/Components

#### 1. `src/utils/marketplaceHelpers.js` (NEW)
```javascript
/**
 * Marketplace helper functions
 */

/**
 * Calculate time remaining until deadline
 */
export function getTimeRemaining(deadline) {
  if (!deadline) return null;
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate - now;
  
  if (diff < 0) return { expired: true, text: 'Expired' };
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 7) return { expired: false, text: `${days} days left` };
  if (days > 0) return { expired: false, text: `${days}d ${hours}h left`, urgent: true };
  if (hours > 0) return { expired: false, text: `${hours}h left`, urgent: true };
  return { expired: false, text: 'Less than 1h left', urgent: true };
}

/**
 * Check if supplier has fast response (response_rate > 80 or avg_response_time < 24h)
 */
export function hasFastResponse(company) {
  return (company.response_rate > 80) || (company.avg_response_time && company.avg_response_time < 24);
}

/**
 * Check if product is ready to ship (lead_time_min_days <= 7)
 */
export function isReadyToShip(product) {
  return product.lead_time_min_days && product.lead_time_min_days <= 7;
}
```

#### 2. `src/components/ui/FilterChip.jsx` (NEW)
```jsx
import React from 'react';
import { Badge } from './badge';
import { X } from 'lucide-react';

export default function FilterChip({ label, onRemove, active = true }) {
  return (
    <Badge
      variant={active ? 'default' : 'outline'}
      className="flex items-center gap-1 px-3 py-1 cursor-pointer hover:bg-afrikoni-gold/20"
      onClick={onRemove}
    >
      {label}
      {onRemove && <X className="w-3 h-3" />}
    </Badge>
  );
}
```

### Files to Modify

#### 1. `src/pages/marketplace.jsx`

**Changes:**
- Add `searchQuery` state and wire to Input
- Connect price range inputs to filtering
- Connect MOQ input to filtering
- Connect certifications checkboxes to filtering
- Connect lead time buttons to filtering
- Add chip filters for "Verified", "Fast Response", "Ready to Ship"
- Add sort dropdown
- Use `buildProductQuery` from `queryBuilders.js` for server-side filtering

**DIFF:**
```diff
--- a/src/pages/marketplace.jsx
+++ b/src/pages/marketplace.jsx
@@ -20,6 +20,7 @@ export default function Marketplace() {
   const [filtersOpen, setFiltersOpen] = useState(false);
   const [products, setProducts] = useState([]);
   const [isLoading, setIsLoading] = useState(true);
+  const [searchQuery, setSearchQuery] = useState('');
   const [selectedFilters, setSelectedFilters] = useState({
     category: '',
     country: '',
@@ -27,13 +28,18 @@ export default function Marketplace() {
     priceRange: '',
     moq: '',
     certifications: [],
-    deliveryTime: ''
+    deliveryTime: '',
+    verified: false,
+    fastResponse: false,
+    readyToShip: false
   });
+  const [sortBy, setSortBy] = useState('created_at');
+  const [priceMin, setPriceMin] = useState('');
+  const [priceMax, setPriceMax] = useState('');
+  const [moqMin, setMoqMin] = useState('');

   const categories = ['All Categories', 'Agriculture', 'Textiles', 'Industrial', 'Beauty & Health'];
   const countries = ['All Countries', 'Nigeria', 'Ghana', 'Egypt', 'Kenya', 'South Africa'];
   const verificationOptions = ['All', 'Verified', 'Premium Partner'];
   const [pagination, setPagination] = useState(createPaginationState());
+  const debouncedSearchQuery = useDebounce(searchQuery, 300);

   useEffect(() => {
     trackPageView('Marketplace');
-    loadProducts();
+    loadProducts();
   }, []);

+  useEffect(() => {
+    applyFilters();
+  }, [selectedFilters, searchQuery, sortBy, priceMin, priceMax, moqMin, debouncedSearchQuery]);

   const loadProducts = async () => {
     setIsLoading(true);
     try {
-      const result = await paginateQuery(
+      // Use buildProductQuery for server-side filtering
+      let query = buildProductQuery({
+        status: 'active',
+        categoryId: selectedFilters.category || null,
+        country: selectedFilters.country || null
+      });
+      
+      // Apply sorting
+      const sortField = sortBy.startsWith('-') ? sortBy.slice(1) : sortBy;
+      const ascending = !sortBy.startsWith('-');
+      query = query.order(sortField, { ascending });
+      
+      const result = await paginateQuery(
         supabase
           .from('products')
           .select(`
             *,
             companies(*),
             categories(*),
             product_images(*)
           `)
           .eq('status', 'active'),
         { 
           page: pagination.page, 
           pageSize: 20,
-          orderBy: 'created_at',
-          ascending: false
+          orderBy: sortField,
+          ascending
         }
       );
       
       const { data, error } = result;
       
       setPagination(prev => ({
         ...prev,
         ...result,
         isLoading: false
       }));
       
       if (error) throw error;
       
       // Transform products to include primary image
       const productsWithImages = (data || []).map(product => {
         const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];
         return {
           ...product,
           primaryImage: primaryImage?.url || product.images?.[0] || null
         };
       });
       
-      setProducts(productsWithImages);
+      // Apply client-side filters (search, price range, MOQ, certifications, lead time, chip filters)
+      const filtered = applyClientSideFilters(productsWithImages);
+      setProducts(filtered);
     } catch (error) {
       setProducts([]);
     } finally {
       setIsLoading(false);
     }
   };

+  const applyClientSideFilters = (productsList) => {
+    return productsList.filter(product => {
+      // Search query
+      if (debouncedSearchQuery) {
+        const query = debouncedSearchQuery.toLowerCase();
+        if (!product.title?.toLowerCase().includes(query) &&
+            !product.description?.toLowerCase().includes(query) &&
+            !product.companies?.company_name?.toLowerCase().includes(query)) {
+          return false;
+        }
+      }
+      
+      // Price range
+      if (priceMin || priceMax) {
+        const productPrice = product.price_min || product.price || 0;
+        if (priceMin && productPrice < parseFloat(priceMin)) return false;
+        if (priceMax && productPrice > parseFloat(priceMax)) return false;
+      }
+      
+      // MOQ
+      if (moqMin) {
+        const productMOQ = product.min_order_quantity || 0;
+        if (productMOQ < parseFloat(moqMin)) return false;
+      }
+      
+      // Certifications
+      if (selectedFilters.certifications.length > 0) {
+        const productCerts = product.certifications || [];
+        if (!selectedFilters.certifications.some(cert => productCerts.includes(cert))) return false;
+      }
+      
+      // Lead time
+      if (selectedFilters.deliveryTime) {
+        const leadTime = product.lead_time_min_days || 0;
+        if (selectedFilters.deliveryTime === 'ready' && leadTime > 0) return false;
+        if (selectedFilters.deliveryTime === '7days' && leadTime > 7) return false;
+        if (selectedFilters.deliveryTime === '30days' && leadTime > 30) return false;
+      }
+      
+      // Chip filters
+      if (selectedFilters.verified && !product.companies?.verified) return false;
+      if (selectedFilters.fastResponse && !hasFastResponse(product.companies)) return false;
+      if (selectedFilters.readyToShip && !isReadyToShip(product)) return false;
+      
+      return true;
+    });
+  };

   const filteredProducts = products.filter(product => {
     // ... existing filters ...
   });

   return (
     <>
       {/* Header */}
       <div className="bg-afrikoni-offwhite border-b border-afrikoni-gold/20 sticky top-0 z-30">
         <div className="max-w-7xl mx-auto px-4 py-4">
           <div className="flex items-center gap-4">
             <div className="flex-1 relative">
               <Search className="w-4 h-4 text-afrikoni-deep/70 absolute left-3 top-1/2 -translate-y-1/2" />
               <Input
                 placeholder="Search products, suppliers, or services..."
                 className="pl-10"
+                value={searchQuery}
+                onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
+            {/* Chip Filters */}
+            <div className="hidden md:flex items-center gap-2">
+              <FilterChip
+                label="Verified"
+                active={selectedFilters.verified}
+                onRemove={() => setSelectedFilters({ ...selectedFilters, verified: !selectedFilters.verified })}
+              />
+              <FilterChip
+                label="Fast Response"
+                active={selectedFilters.fastResponse}
+                onRemove={() => setSelectedFilters({ ...selectedFilters, fastResponse: !selectedFilters.fastResponse })}
+              />
+              <FilterChip
+                label="Ready to Ship"
+                active={selectedFilters.readyToShip}
+                onRemove={() => setSelectedFilters({ ...selectedFilters, readyToShip: !selectedFilters.readyToShip })}
+              />
+            </div>
             <Button
               variant="secondary"
               size="sm"
               onClick={() => setFiltersOpen(true)}
               className="md:hidden"
             >
               <SlidersHorizontal className="w-4 h-4 mr-2" />
               Filters
             </Button>
           </div>
         </div>
       </div>

       <div className="max-w-7xl mx-auto px-4 py-6">
         <div className="flex gap-6">
           {/* Sidebar Filters */}
           <aside className="hidden md:block w-64 flex-shrink-0">
             <Card>
               <CardContent className="p-4 space-y-6">
                 {/* ... existing filters ... */}
                 
                 <div>
                   <h3 className="font-semibold text-afrikoni-chestnut mb-3">Price Range</h3>
                   <div className="space-y-2">
-                    <Input placeholder="Min $" type="number" className="text-sm" />
-                    <Input placeholder="Max $" type="number" className="text-sm" />
+                    <Input 
+                      placeholder="Min $" 
+                      type="number" 
+                      className="text-sm"
+                      value={priceMin}
+                      onChange={(e) => setPriceMin(e.target.value)}
+                    />
+                    <Input 
+                      placeholder="Max $" 
+                      type="number" 
+                      className="text-sm"
+                      value={priceMax}
+                      onChange={(e) => setPriceMax(e.target.value)}
+                    />
                   </div>
                 </div>

                 <div>
                   <h3 className="font-semibold text-afrikoni-chestnut mb-3">Minimum Order (MOQ)</h3>
                   <div className="space-y-2">
-                    <Input placeholder="Min quantity" type="number" className="text-sm" />
+                    <Input 
+                      placeholder="Min quantity" 
+                      type="number" 
+                      className="text-sm"
+                      value={moqMin}
+                      onChange={(e) => setMoqMin(e.target.value)}
+                    />
                   </div>
                 </div>

                 <div>
                   <h3 className="font-semibold text-afrikoni-chestnut mb-3">Certifications</h3>
                   <div className="space-y-2">
                     <label className="flex items-center gap-2 text-sm text-afrikoni-deep">
-                      <input type="checkbox" className="rounded" />
+                      <input 
+                        type="checkbox" 
+                        className="rounded"
+                        checked={selectedFilters.certifications.includes('ISO')}
+                        onChange={(e) => {
+                          const certs = e.target.checked
+                            ? [...selectedFilters.certifications, 'ISO']
+                            : selectedFilters.certifications.filter(c => c !== 'ISO');
+                          setSelectedFilters({ ...selectedFilters, certifications: certs });
+                        }}
+                      />
                       <span>ISO Certified</span>
                     </label>
                     <label className="flex items-center gap-2 text-sm text-afrikoni-deep">
-                      <input type="checkbox" className="rounded" />
+                      <input 
+                        type="checkbox" 
+                        className="rounded"
+                        checked={selectedFilters.certifications.includes('Trade Shield')}
+                        onChange={(e) => {
+                          const certs = e.target.checked
+                            ? [...selectedFilters.certifications, 'Trade Shield']
+                            : selectedFilters.certifications.filter(c => c !== 'Trade Shield');
+                          setSelectedFilters({ ...selectedFilters, certifications: certs });
+                        }}
+                      />
                       <span>Trade Shield Eligible</span>
                     </label>
                   </div>
                 </div>

                 <div>
                   <h3 className="font-semibold text-afrikoni-chestnut mb-3">Lead Time</h3>
                   <div className="space-y-2">
-                    <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-afrikoni-deep hover:bg-afrikoni-offwhite">
+                    <button 
+                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
+                        selectedFilters.deliveryTime === 'ready'
+                          ? 'bg-afrikoni-gold/20 text-afrikoni-gold font-semibold'
+                          : 'text-afrikoni-deep hover:bg-afrikoni-offwhite'
+                      }`}
+                      onClick={() => setSelectedFilters({ 
+                        ...selectedFilters, 
+                        deliveryTime: selectedFilters.deliveryTime === 'ready' ? '' : 'ready' 
+                      })}
+                    >
                       Ready to Ship
                     </button>
-                    <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-afrikoni-deep hover:bg-afrikoni-offwhite">
+                    <button 
+                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
+                        selectedFilters.deliveryTime === '7days'
+                          ? 'bg-afrikoni-gold/20 text-afrikoni-gold font-semibold'
+                          : 'text-afrikoni-deep hover:bg-afrikoni-offwhite'
+                      }`}
+                      onClick={() => setSelectedFilters({ 
+                        ...selectedFilters, 
+                        deliveryTime: selectedFilters.deliveryTime === '7days' ? '' : '7days' 
+                      })}
+                    >
                       Within 7 days
                     </button>
-                    <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-afrikoni-deep hover:bg-afrikoni-offwhite">
+                    <button 
+                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
+                        selectedFilters.deliveryTime === '30days'
+                          ? 'bg-afrikoni-gold/20 text-afrikoni-gold font-semibold'
+                          : 'text-afrikoni-deep hover:bg-afrikoni-offwhite'
+                      }`}
+                      onClick={() => setSelectedFilters({ 
+                        ...selectedFilters, 
+                        deliveryTime: selectedFilters.deliveryTime === '30days' ? '' : '30days' 
+                      })}
+                    >
                       Within 30 days
                     </button>
                   </div>
                 </div>

-                <Button className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream size="sm">
+                <Button 
+                  className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream" 
+                  size="sm"
+                  onClick={applyFilters}
+                >
                   Apply Filters
                 </Button>
-                <Button variant="ghost" className="w-full" size="sm">
+                <Button 
+                  variant="ghost" 
+                  className="w-full" 
+                  size="sm"
+                  onClick={() => {
+                    setSelectedFilters({
+                      category: '',
+                      country: '',
+                      verification: '',
+                      priceRange: '',
+                      moq: '',
+                      certifications: [],
+                      deliveryTime: '',
+                      verified: false,
+                      fastResponse: false,
+                      readyToShip: false
+                    });
+                    setPriceMin('');
+                    setPriceMax('');
+                    setMoqMin('');
+                    setSearchQuery('');
+                  }}
+                >
                   Clear All
                 </Button>
               </CardContent>
             </Card>
           </aside>

           {/* Products Grid */}
           <main className="flex-1">
             <div className="flex items-center justify-between mb-6">
               <div>
                 <h1 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-1">
                   Marketplace
                 </h1>
                 <p className="text-sm text-afrikoni-deep">
                   {filteredProducts.length} products found
                 </p>
               </div>
+              <Select value={sortBy} onValueChange={setSortBy}>
+                <SelectTrigger className="w-48">
+                  <SelectValue />
+                </SelectTrigger>
+                <SelectContent>
+                  <SelectItem value="-created_at">Newest First</SelectItem>
+                  <SelectItem value="created_at">Oldest First</SelectItem>
+                  <SelectItem value="price_min">Price: Low to High</SelectItem>
+                  <SelectItem value="-price_min">Price: High to Low</SelectItem>
+                  <SelectItem value="-views">Most Popular</SelectItem>
+                </SelectContent>
+              </Select>
               <div className="hidden md:flex items-center gap-2">
                 <Button variant="ghost" size="sm">Grid</Button>
                 <Button variant="ghost" size="sm">List</Button>
               </div>
             </div>
```

#### 2. `src/pages/rfq-marketplace.jsx`

**Changes:**
- Add sort dropdown (Newest, Closing Soon, Most Quotes, Budget High-Low)
- Add "time remaining" calculation using `getTimeRemaining`
- Display time remaining on RFQ cards
- Add buyer country badge
- Add buyer verification badge

**DIFF:**
```diff
--- a/src/pages/rfq-marketplace.jsx
+++ b/src/pages/rfq-marketplace.jsx
@@ -1,5 +1,6 @@
 import React, { useState, useEffect } from 'react';
 import { Link, useNavigate } from 'react-router-dom';
+import { getTimeRemaining } from '@/utils/marketplaceHelpers';
 import { paginateQuery, createPaginationState } from '@/utils/pagination';
 import { FileText, Search, Filter, MapPin, Calendar, Package, DollarSign, CheckCircle } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
@@ -20,6 +21,7 @@ export default function RFQMarketplace() {
   const [searchQuery, setSearchQuery] = useState('');
   const [categoryFilter, setCategoryFilter] = useState('all');
   const [statusFilter, setStatusFilter] = useState('all');
+  const [sortBy, setSortBy] = useState('-created_at');
   const [categories, setCategories] = useState([]);
   const [pagination, setPagination] = useState(createPaginationState());

@@ -28,7 +30,7 @@ export default function RFQMarketplace() {
     loadData();
   }, []);

-  const loadData = async () => {
+  const loadData = async () => {
     setIsLoading(true);
     try {
       const [rfqsResult, catsRes] = await Promise.all([
@@ -36,7 +38,7 @@ export default function RFQMarketplace() {
           supabase
             .from('rfqs')
             .select('*, categories(*), companies(*)')
-            .eq('status', 'open'),
+            .eq('status', 'open')
+            .order(sortBy.startsWith('-') ? sortBy.slice(1) : sortBy, { ascending: !sortBy.startsWith('-') }),
           { 
             page: pagination.page, 
             pageSize: 20,
-            orderBy: 'created_at',
-            ascending: false
+            orderBy: sortBy.startsWith('-') ? sortBy.slice(1) : sortBy,
+            ascending: !sortBy.startsWith('-')
           }
         ),
         supabase.from('categories').select('*')
@@ -50,6 +52,20 @@ export default function RFQMarketplace() {
         ...result,
         isLoading: false
       });

       if (rfqsRes.error) throw rfqsRes.error;
       if (catsRes.error) throw catsRes.error;

-      setRfqs(rfqsRes.data || []);
+      // Enrich RFQs with quote counts and time remaining
+      const rfqIds = (rfqsRes.data || []).map(rfq => rfq.id);
+      let quotesCountMap = {};
+      
+      if (rfqIds.length > 0) {
+        const { data: quotesData } = await supabase
+          .from('quotes')
+          .select('rfq_id')
+          .in('rfq_id', rfqIds);
+        
+        quotesCountMap = (quotesData || []).reduce((acc, quote) => {
+          acc[quote.rfq_id] = (acc[quote.rfq_id] || 0) + 1;
+          return acc;
+        }, {});
+      }
+      
+      const enrichedRfqs = (rfqsRes.data || []).map(rfq => ({
+        ...rfq,
+        quote_count: quotesCountMap[rfq.id] || 0,
+        timeRemaining: getTimeRemaining(rfq.delivery_deadline || rfq.expires_at)
+      }));
+      
+      setRfqs(enrichedRfqs);
       setCategories(catsRes.data || []);
     } catch (error) {
       setRfqs([]);
     } finally {
       setIsLoading(false);
     }
   };

+  useEffect(() => {
+    loadData();
+  }, [sortBy]);

   const filteredRFQs = rfqs.filter(rfq => {
     // ... existing filters ...
   });

   return (
     <>
       {/* Header */}
       <div className="bg-afrikoni-offwhite border-b border-afrikoni-gold/20 sticky top-0 z-30">
         <div className="max-w-7xl mx-auto px-4 py-6">
           {/* ... existing header ... */}
           
           {/* Search and Filters */}
           <div className="flex flex-col md:flex-row gap-4">
             {/* ... existing search and filters ... */}
+            <Select value={sortBy} onValueChange={setSortBy}>
+              <SelectTrigger className="w-full md:w-48">
+                <SelectValue placeholder="Sort by" />
+              </SelectTrigger>
+              <SelectContent>
+                <SelectItem value="-created_at">Newest First</SelectItem>
+                <SelectItem value="created_at">Oldest First</SelectItem>
+                <SelectItem value="delivery_deadline">Closing Soon</SelectItem>
+                <SelectItem value="-target_price">Budget: High to Low</SelectItem>
+                <SelectItem value="target_price">Budget: Low to High</SelectItem>
+              </SelectContent>
+            </Select>
           </div>
         </div>
       </div>

       {/* RFQ Cards */}
       <div className="grid md:grid-cols-2 gap-6">
         {filteredRFQs.map((rfq, idx) => (
           <Card key={rfq.id}>
             <CardHeader>
               <div className="flex items-start justify-between mb-2">
                 <CardTitle className="text-xl">{rfq.title}</CardTitle>
                 <Badge className={getStatusBadge(rfq.status)}>
                   {rfq.status}
                 </Badge>
               </div>
+              {/* Buyer Info */}
+              {rfq.companies && (
+                <div className="flex items-center gap-2 mb-2">
+                  <MapPin className="w-4 h-4 text-afrikoni-deep/70" />
+                  <span className="text-sm text-afrikoni-deep">{rfq.companies.country}</span>
+                  {rfq.companies.verified && (
+                    <Badge variant="verified" className="text-xs">Verified Buyer</Badge>
+                  )}
+                </div>
+              )}
               <div className="flex items-center gap-4 text-sm text-afrikoni-deep">
                 <div className="flex items-center gap-1">
                   <Package className="w-4 h-4" />
                   <span>{rfq.categories?.name || 'Uncategorized'}</span>
                 </div>
                 <div className="flex items-center gap-1">
                   <MapPin className="w-4 h-4" />
                   <span>{rfq.delivery_location || 'N/A'}</span>
                 </div>
               </div>
             </CardHeader>
             <CardContent className="space-y-4">
               <p className="text-afrikoni-deep line-clamp-3">{rfq.description}</p>
               
               <div className="grid grid-cols-2 gap-4 pt-4 border-t border-afrikoni-gold/20">
                 {/* ... existing fields ... */}
                 <div>
                   <p className="text-xs text-afrikoni-deep/70 mb-1">Deadline</p>
                   <p className="font-semibold text-afrikoni-chestnut">
-                    {rfq.delivery_deadline ? new Date(rfq.delivery_deadline).toLocaleDateString() : 'Flexible'}
+                    {rfq.timeRemaining ? (
+                      <span className={rfq.timeRemaining.urgent ? 'text-red-600' : ''}>
+                        {rfq.timeRemaining.text}
+                      </span>
+                    ) : (
+                      rfq.delivery_deadline ? new Date(rfq.delivery_deadline).toLocaleDateString() : 'Flexible'
+                    )}
                   </p>
                 </div>
                 <div>
                   <p className="text-xs text-afrikoni-deep/70 mb-1">Responses</p>
                   <p className="font-semibold text-afrikoni-chestnut">
                     {rfq.quote_count || 0} quotes
                   </p>
                 </div>
               </div>
             </CardContent>
           </Card>
         ))}
       </div>
     </>
   );
 }
```

#### 3. `src/pages/products.jsx`

**Changes:**
- Add country filter dropdown (wire up existing state)
- Add chip filters for "Verified", "Fast Response", "Ready to Ship"
- Display trust score and response rate on product cards

**DIFF:**
```diff
--- a/src/pages/products.jsx
+++ b/src/pages/products.jsx
@@ -1,5 +1,6 @@
 import React, { useState, useEffect, useMemo } from 'react';
 import { Link } from 'react-router-dom';
+import { hasFastResponse, isReadyToShip } from '@/utils/marketplaceHelpers';
 import { createPageUrl } from '../utils';
 import { supabase } from '@/api/supabaseClient';
 import { paginateQuery, createPaginationState } from '@/utils/pagination';
@@ -22,6 +23,9 @@ export default function Products() {
   const [priceRange, setPriceRange] = useState('all');
   const [sortBy, setSortBy] = useState('created_at');
   const [pagination, setPagination] = useState(createPaginationState());
+  const [chipFilters, setChipFilters] = useState({
+    verified: false,
+    fastResponse: false,
+    readyToShip: false
   });
   const { trackPageView } = useAnalytics();
   
@@ -35,7 +39,7 @@ export default function Products() {
   useEffect(() => {
     applyFilters();
-  }, [selectedCategory, selectedCountry, priceRange, sortBy, debouncedSearchQuery]);
+  }, [selectedCategory, selectedCountry, priceRange, sortBy, debouncedSearchQuery, chipFilters]);

   // ... existing loadData and applyFilters ...

   const filteredProducts = useMemo(() => {
-    return products;
+    return products.filter(product => {
+      if (chipFilters.verified && !product.companies?.verified) return false;
+      if (chipFilters.fastResponse && !hasFastResponse(product.companies)) return false;
+      if (chipFilters.readyToShip && !isReadyToShip(product)) return false;
+      return true;
+    });
   }, [products, chipFilters]);

   return (
     <>
       <div className="bg-afrikoni-offwhite border-b border-afrikoni-gold/20">
         <div className="max-w-7xl mx-auto px-4 py-8">
           {/* ... existing header ... */}
+          {/* Chip Filters */}
+          <div className="flex items-center gap-2 mt-4">
+            <FilterChip
+              label="Verified"
+              active={chipFilters.verified}
+              onRemove={() => setChipFilters({ ...chipFilters, verified: !chipFilters.verified })}
+            />
+            <FilterChip
+              label="Fast Response"
+              active={chipFilters.fastResponse}
+              onRemove={() => setChipFilters({ ...chipFilters, fastResponse: !chipFilters.fastResponse })}
+            />
+            <FilterChip
+              label="Ready to Ship"
+              active={chipFilters.readyToShip}
+              onRemove={() => setChipFilters({ ...chipFilters, readyToShip: !chipFilters.readyToShip })}
+            />
+          </div>
         </div>
       </div>

       <div className="max-w-7xl mx-auto px-4 py-8">
         <div className="grid md:grid-cols-4 gap-8">
           <div className="md:col-span-1">
             <Card className="border-afrikoni-gold/20 sticky top-24">
               <CardContent className="p-6 space-y-6">
                 {/* ... existing filters ... */}
                 <div>
                   <label className="text-sm font-medium text-afrikoni-deep mb-2 block">Country</label>
                   <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                     <SelectTrigger>
                       <SelectValue placeholder="All Countries" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="all">All Countries</SelectItem>
-                      {/* TODO: Load from DB */}
+                      {AFRICAN_COUNTRIES.map(country => (
+                        <SelectItem key={country} value={country}>{country}</SelectItem>
+                      ))}
                     </SelectContent>
                   </Select>
                 </div>
                 {/* ... rest of filters ... */}
               </CardContent>
             </Card>
           </div>

           <div className="md:col-span-3">
             {/* ... existing product grid ... */}
             {products.map(product => (
               <Card>
                 <CardContent className="p-4">
                   <h3>{product.title}</h3>
+                  {/* Trust Signals */}
+                  {product.companies && (
+                    <div className="flex items-center gap-2 mt-2">
+                      {product.companies.verified && (
+                        <Badge variant="verified" className="text-xs">Verified</Badge>
+                      )}
+                      {product.companies.trust_score > 0 && (
+                        <Badge variant="outline" className="text-xs">
+                          Trust: {product.companies.trust_score}%
+                        </Badge>
+                      )}
+                      {product.companies.response_rate > 0 && (
+                        <Badge variant="outline" className="text-xs">
+                          {product.companies.response_rate}% Response
+                        </Badge>
+                      )}
+                    </div>
+                  )}
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>
       </div>
     </>
   );
 }
```

### Expected UX

1. **Marketplace Page:**
   - Search bar works and filters in real-time
   - Chip filters appear above search (Verified, Fast Response, Ready to Ship)
   - All sidebar filter inputs are connected and functional
   - Sort dropdown appears next to product count
   - Clear All button resets all filters

2. **RFQ Marketplace:**
   - Sort dropdown with options: Newest, Closing Soon, Most Quotes, Budget
   - Time remaining displayed on cards (e.g., "3d 5h left", "Expired")
   - Buyer country and verification badge shown
   - Quote count displayed

3. **Products Page:**
   - Country filter dropdown populated and working
   - Chip filters below search bar
   - Trust signals (trust score, response rate) on product cards

---

## 🔹 SUB-CLUSTER 8B: BUYER INTELLIGENCE & TOOLS

### Goal
Add "Save" buttons, "Recently Viewed", "Recommended for you", and enrich RFQ cards with intelligence.

### New Helpers/Components

#### 1. `src/utils/viewHistory.js` (NEW)
```javascript
/**
 * View history management using localStorage
 */

const VIEW_HISTORY_KEY = 'afrikoni_view_history';
const MAX_HISTORY = 50;

export function addToViewHistory(itemId, itemType, metadata = {}) {
  try {
    const history = getViewHistory();
    const newEntry = {
      id: itemId,
      type: itemType,
      timestamp: new Date().toISOString(),
      ...metadata
    };
    
    // Remove existing entry if present
    const filtered = history.filter(item => !(item.id === itemId && item.type === itemType));
    
    // Add to beginning
    const updated = [newEntry, ...filtered].slice(0, MAX_HISTORY);
    
    localStorage.setItem(VIEW_HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    return [];
  }
}

export function getViewHistory(itemType = null) {
  try {
    const stored = localStorage.getItem(VIEW_HISTORY_KEY);
    if (!stored) return [];
    
    const history = JSON.parse(stored);
    if (itemType) {
      return history.filter(item => item.type === itemType);
    }
    return history;
  } catch (error) {
    return [];
  }
}

export function clearViewHistory() {
  try {
    localStorage.removeItem(VIEW_HISTORY_KEY);
  } catch (error) {
    // Ignore
  }
}
```

#### 2. `src/utils/recommendations.js` (NEW)
```javascript
/**
 * Simple recommendation engine
 */

export function getRecommendedProducts(viewHistory, allProducts, limit = 6) {
  if (!viewHistory || viewHistory.length === 0) return [];
  
  // Get most viewed category
  const categoryCounts = {};
  viewHistory.forEach(item => {
    if (item.category_id) {
      categoryCounts[item.category_id] = (categoryCounts[item.category_id] || 0) + 1;
    }
  });
  
  const topCategory = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  
  // Get most viewed country
  const countryCounts = {};
  viewHistory.forEach(item => {
    if (item.country) {
      countryCounts[item.country] = (countryCounts[item.country] || 0) + 1;
    }
  });
  
  const topCountry = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  
  // Find products matching top category or country
  const recommended = allProducts
    .filter(product => {
      // Exclude already viewed
      const viewedIds = viewHistory.map(item => item.id);
      if (viewedIds.includes(product.id)) return false;
      
      // Match category or country
      return (topCategory && product.category_id === topCategory) ||
             (topCountry && product.country_of_origin === topCountry);
    })
    .slice(0, limit);
  
  return recommended;
}

export function getSimilarProducts(product, allProducts, limit = 4) {
  if (!product) return [];
  
  return allProducts
    .filter(p => {
      if (p.id === product.id) return false;
      if (p.category_id !== product.category_id) return false;
      
      // Similar price range (within 50%)
      const productPrice = product.price_min || product.price || 0;
      const pPrice = p.price_min || p.price || 0;
      if (productPrice > 0 && pPrice > 0) {
        const diff = Math.abs(productPrice - pPrice) / productPrice;
        if (diff > 0.5) return false;
      }
      
      return true;
    })
    .slice(0, limit);
}
```

#### 3. `src/components/ui/SaveButton.jsx` (NEW)
```jsx
import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from './button';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { toast } from 'sonner';

export default function SaveButton({ itemId, itemType, className = '' }) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    checkSavedStatus();
  }, [itemId, itemType]);

  const checkSavedStatus = async () => {
    try {
      const userData = await supabaseHelpers.auth.me();
      if (!userData) {
        setIsSaved(false);
        return;
      }
      
      setUserId(userData.id);
      
      const { data } = await supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', userData.id)
        .eq('item_id', itemId)
        .eq('item_type', itemType)
        .single();
      
      setIsSaved(!!data);
    } catch (error) {
      setIsSaved(false);
    }
  };

  const handleToggle = async () => {
    if (!userId) {
      toast.error('Please log in to save items');
      return;
    }

    setIsLoading(true);
    try {
      if (isSaved) {
        // Unsave
        const { error } = await supabase
          .from('saved_items')
          .delete()
          .eq('user_id', userId)
          .eq('item_id', itemId)
          .eq('item_type', itemType);
        
        if (error) throw error;
        setIsSaved(false);
        toast.success('Removed from saved');
      } else {
        // Save
        const { error } = await supabase
          .from('saved_items')
          .insert({
            user_id: userId,
            item_id: itemId,
            item_type: itemType
          });
        
        if (error) throw error;
        setIsSaved(true);
        toast.success('Saved to your list');
      }
    } catch (error) {
      toast.error('Failed to update saved status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className={className}
    >
      <Heart 
        className={`w-4 h-4 ${isSaved ? 'fill-afrikoni-gold text-afrikoni-gold' : 'text-afrikoni-deep/70'}`} 
      />
    </Button>
  );
}
```

### Files to Modify

#### 1. `src/pages/productdetails.jsx`

**Changes:**
- Track product view in localStorage
- Add Save button
- Add "Recently Viewed" section
- Add "Similar Products" section
- Add "Recommended for you" section

**DIFF:**
```diff
--- a/src/pages/productdetails.jsx
+++ b/src/pages/productdetails.jsx
@@ -1,5 +1,6 @@
 import React, { useState, useEffect } from 'react';
 import { Link, useNavigate } from 'react-router-dom';
+import { addToViewHistory, getViewHistory, getSimilarProducts, getRecommendedProducts } from '@/utils/viewHistory';
+import SaveButton from '@/components/ui/SaveButton';
 import { createPageUrl } from '../utils';
 import { supabase, supabaseHelpers } from '@/api/supabaseClient';
 import { Button } from '@/components/ui/button';
@@ -18,6 +19,8 @@ export default function ProductDetail() {
   const [reviews, setReviews] = useState([]);
   const [companies, setCompanies] = useState([]);
   const navigate = useNavigate();
+  const [similarProducts, setSimilarProducts] = useState([]);
+  const [recommendedProducts, setRecommendedProducts] = useState([]);

   const { trackPageView } = useAnalytics();

@@ -95,6 +98,20 @@ export default function ProductDetail() {
       // Update views
       await supabase
         .from('products')
         .update({ views: (foundProduct.views || 0) + 1 })
         .eq('id', foundProduct.id);

+      // Track view history
+      addToViewHistory(foundProduct.id, 'product', {
+        title: foundProduct.title,
+        category_id: foundProduct.category_id,
+        country: foundProduct.country_of_origin,
+        price: foundProduct.price_min || foundProduct.price
+      });
+
+      // Load similar and recommended products
+      const allProductsRes = await supabase
+        .from('products')
+        .select('*')
+        .eq('status', 'active')
+        .limit(100);
+      
+      if (allProductsRes.data) {
+        setSimilarProducts(getSimilarProducts(foundProduct, allProductsRes.data));
+        const viewHistory = getViewHistory('product');
+        setRecommendedProducts(getRecommendedProducts(viewHistory, allProductsRes.data));
+      }
     } catch (error) {
       toast.error('Failed to load product');
     } finally {
@@ -320,6 +337,7 @@ export default function ProductDetail() {
                 <div>
                   <h1 className="text-2xl font-bold text-afrikoni-chestnut mb-4">{product.title}</h1>
                   
+                  <div className="flex items-center gap-2 mb-4">
                   {product.categories && (
                     <Badge variant="outline" className="mb-4">
                       {product.categories.name}
                     </Badge>
                   )}
+                    <SaveButton itemId={product.id} itemType="product" />
+                  </div>
                   
                   <div className="space-y-4">
                     {/* ... existing price display ... */}
@@ -480,6 +498,48 @@ export default function ProductDetail() {
           </div>
         </div>
       </div>

+      {/* Similar Products */}
+      {similarProducts.length > 0 && (
+        <div className="max-w-7xl mx-auto px-4 py-8">
+          <h2 className="text-2xl font-bold text-afrikoni-chestnut mb-6">Similar Products</h2>
+          <div className="grid md:grid-cols-4 gap-6">
+            {similarProducts.map(product => (
+              <Link key={product.id} to={`/product?id=${product.id}`}>
+                <Card className="hover:shadow-lg transition-shadow">
+                  <CardContent className="p-4">
+                    <h3 className="font-semibold text-afrikoni-chestnut mb-2">{product.title}</h3>
+                    <p className="text-lg font-bold text-afrikoni-gold">
+                      {product.price_min || product.price ? `$${product.price_min || product.price}` : 'Price on request'}
+                    </p>
+                  </CardContent>
+                </Card>
+              </Link>
+            ))}
+          </div>
+        </div>
+      )}
+
+      {/* Recommended for You */}
+      {recommendedProducts.length > 0 && (
+        <div className="max-w-7xl mx-auto px-4 py-8">
+          <h2 className="text-2xl font-bold text-afrikoni-chestnut mb-6">Recommended for You</h2>
+          <div className="grid md:grid-cols-4 gap-6">
+            {recommendedProducts.map(product => (
+              <Link key={product.id} to={`/product?id=${product.id}`}>
+                <Card className="hover:shadow-lg transition-shadow">
+                  <CardContent className="p-4">
+                    <h3 className="font-semibold text-afrikoni-chestnut mb-2">{product.title}</h3>
+                    <p className="text-lg font-bold text-afrikoni-gold">
+                      {product.price_min || product.price ? `$${product.price_min || product.price}` : 'Price on request'}
+                    </p>
+                  </CardContent>
+                </Card>
+              </Link>
+            ))}
+          </div>
+        </div>
+      )}
     </div>
     </>
   );
 }
```

#### 2. `src/pages/marketplace.jsx` & `src/pages/products.jsx`

**Changes:**
- Add Save button to product cards
- Track product views when cards are clicked

**DIFF:**
```diff
--- a/src/pages/marketplace.jsx
+++ b/src/pages/marketplace.jsx
@@ -1,5 +1,6 @@
 import React, { useState, useEffect } from 'react';
 import { Link } from 'react-router-dom';
+import { addToViewHistory } from '@/utils/viewHistory';
+import SaveButton from '@/components/ui/SaveButton';
 import { motion } from 'framer-motion';
 import { paginateQuery, createPaginationState } from '@/utils/pagination';
 import {
@@ -109,7 +110,7 @@ export default function Marketplace() {
   const ProductCard = ({ product }) => (
     <motion.div>
       <Link to={`/product/${product.slug || product.id}`}>
+        onClick={() => addToViewHistory(product.id, 'product', {
+          title: product.title,
+          category_id: product.category_id,
+          country: product.country_of_origin
+        })}
         <motion.div>
           <Card hover className="h-full">
             <div className="relative h-48 bg-afrikoni-cream rounded-t-xl overflow-hidden">
               {/* ... existing image ... */}
+              <div className="absolute top-2 right-2">
+                <SaveButton itemId={product.id} itemType="product" />
+              </div>
             </div>
             <CardContent className="p-4">
               {/* ... existing content ... */}
             </CardContent>
           </Card>
         </motion.div>
       </Link>
     </motion.div>
   );
```

#### 3. `src/pages/rfq-marketplace.jsx`

**Changes:**
- Add Save button to RFQ cards
- Enrich cards with average quote price (if available)
- Add competition level indicator (Low/Medium/High based on quote count)

**DIFF:**
```diff
--- a/src/pages/rfq-marketplace.jsx
+++ b/src/pages/rfq-marketplace.jsx
@@ -1,5 +1,6 @@
 import React, { useState, useEffect } from 'react';
 import { Link, useNavigate } from 'react-router-dom';
+import SaveButton from '@/components/ui/SaveButton';
 import { getTimeRemaining } from '@/utils/marketplaceHelpers';
 import { paginateQuery, createPaginationState } from '@/utils/pagination';
 import { FileText, Search, Filter, MapPin, Calendar, Package, DollarSign, CheckCircle } from 'lucide-react';
@@ -50,6 +51,20 @@ export default function RFQMarketplace() {
         quotesCountMap = (quotesData || []).reduce((acc, quote) => {
           acc[quote.rfq_id] = (acc[quote.rfq_id] || 0) + 1;
           return acc;
         }, {});
+        
+        // Get average quote price
+        const { data: quotesWithPrice } = await supabase
+          .from('quotes')
+          .select('rfq_id, price')
+          .in('rfq_id', rfqIds)
+          .not('price', 'is', null);
+        
+        const avgPriceMap = {};
+        quotesWithPrice?.forEach(quote => {
+          if (!avgPriceMap[quote.rfq_id]) {
+            avgPriceMap[quote.rfq_id] = { sum: 0, count: 0 };
+          }
+          avgPriceMap[quote.rfq_id].sum += parseFloat(quote.price || 0);
+          avgPriceMap[quote.rfq_id].count += 1;
+        });
+        
+        Object.keys(avgPriceMap).forEach(rfqId => {
+          avgPriceMap[rfqId] = avgPriceMap[rfqId].sum / avgPriceMap[rfqId].count;
+        });
       }
       
       const enrichedRfqs = (rfqsRes.data || []).map(rfq => ({
         ...rfq,
-        quote_count: quotesCountMap[rfq.id] || 0,
+        quote_count: quotesCountMap[rfq.id] || 0,
+        avg_quote_price: avgPriceMap[rfq.id] || null,
+        competition_level: (quotesCountMap[rfq.id] || 0) < 3 ? 'Low' : (quotesCountMap[rfq.id] || 0) < 10 ? 'Medium' : 'High',
         timeRemaining: getTimeRemaining(rfq.delivery_deadline || rfq.expires_at)
       }));
       
       setRfqs(enrichedRfqs);
     } catch (error) {
       setRfqs([]);
     } finally {
       setIsLoading(false);
     }
   };

   return (
     <>
       {/* ... existing header ... */}
       
       <div className="grid md:grid-cols-2 gap-6">
         {filteredRFQs.map((rfq, idx) => (
           <Card key={rfq.id}>
             <CardHeader>
               <div className="flex items-start justify-between mb-2">
                 <CardTitle className="text-xl">{rfq.title}</CardTitle>
+                <div className="flex items-center gap-2">
                 <Badge className={getStatusBadge(rfq.status)}>
                   {rfq.status}
                 </Badge>
+                  <SaveButton itemId={rfq.id} itemType="rfq" />
+                </div>
               </div>
               {/* ... existing content ... */}
             </CardHeader>
             <CardContent className="space-y-4">
               {/* ... existing fields ... */}
               <div className="grid grid-cols-2 gap-4 pt-4 border-t border-afrikoni-gold/20">
                 {/* ... existing fields ... */}
                 <div>
                   <p className="text-xs text-afrikoni-deep/70 mb-1">Responses</p>
                   <p className="font-semibold text-afrikoni-chestnut">
                     {rfq.quote_count || 0} quotes
+                    {rfq.avg_quote_price && (
+                      <span className="text-xs text-afrikoni-deep/70 block">
+                        Avg: ${rfq.avg_quote_price.toFixed(2)}
+                      </span>
+                    )}
                   </p>
+                  {rfq.competition_level && (
+                    <Badge variant={rfq.competition_level === 'Low' ? 'default' : rfq.competition_level === 'Medium' ? 'secondary' : 'destructive'} className="text-xs mt-1">
+                      {rfq.competition_level} Competition
+                    </Badge>
+                  )}
                 </div>
               </div>
             </CardContent>
           </Card>
         ))}
       </div>
     </>
   );
 }
```

### Expected UX

1. **Product Detail Page:**
   - Save button in header (heart icon, fills when saved)
   - "Similar Products" section below product details
   - "Recommended for You" section (based on view history)
   - Toast notifications when saving/unsaving

2. **Marketplace/Products Pages:**
   - Save button on each product card (top-right corner)
   - View history tracked automatically when clicking product

3. **RFQ Marketplace:**
   - Save button on each RFQ card
   - Average quote price displayed (if available)
   - Competition level badge (Low/Medium/High)
   - Time remaining with urgent styling

---

## 🔹 SUB-CLUSTER 8C: DASHBOARD INTELLIGENCE WIDGETS

### Goal
Add intelligent widgets to DashboardHome.jsx showing marketplace insights, opportunities, and trends.

### New Helpers/Components

#### 1. `src/utils/marketplaceIntelligence.js` (NEW)
```javascript
/**
 * Marketplace intelligence helpers
 */

export async function getRFQsInUserCategories(companyId, limit = 5) {
  if (!companyId) return [];
  
  try {
    // Get user's product categories
    const { data: userProducts } = await supabase
      .from('products')
      .select('category_id')
      .eq('supplier_id', companyId)
      .not('category_id', 'is', null);
    
    const categoryIds = [...new Set(userProducts.map(p => p.category_id))];
    
    if (categoryIds.length === 0) return [];
    
    // Get RFQs in those categories
    const { data: rfqs } = await supabase
      .from('rfqs')
      .select('*, categories(*), companies(*)')
      .in('category_id', categoryIds)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return rfqs || [];
  } catch (error) {
    return [];
  }
}

export async function getRFQsExpiringSoon(companyId, days = 7, limit = 5) {
  if (!companyId) return [];
  
  try {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    
    const { data: rfqs } = await supabase
      .from('rfqs')
      .select('*, categories(*), companies(*)')
      .eq('status', 'open')
      .or(`delivery_deadline.gte.${now.toISOString()},delivery_deadline.lte.${futureDate.toISOString()},expires_at.gte.${now.toISOString()},expires_at.lte.${futureDate.toISOString()}`)
      .order('delivery_deadline', { ascending: true })
      .limit(limit);
    
    return rfqs || [];
  } catch (error) {
    return [];
  }
}

export async function getNewSuppliersInCountry(country, days = 30, limit = 5) {
  if (!country) return [];
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const { data: companies } = await supabase
      .from('companies')
      .select('*')
      .eq('country', country)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return companies || [];
  } catch (error) {
    return [];
  }
}

export async function getTopCategoriesThisWeek(limit = 5) {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: rfqs } = await supabase
      .from('rfqs')
      .select('category_id, categories(*)')
      .gte('created_at', weekAgo.toISOString())
      .not('category_id', 'is', null);
    
    const categoryCounts = {};
    rfqs?.forEach(rfq => {
      const catId = rfq.category_id;
      categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
    });
    
    const sorted = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([catId, count]) => ({
        category_id: catId,
        category: rfqs.find(r => r.category_id === catId)?.categories,
        count
      }));
    
    return sorted;
  } catch (error) {
    return [];
  }
}
```

### Files to Modify

#### 1. `src/pages/dashboard/DashboardHome.jsx`

**Changes:**
- Add new widgets section after Recent Orders/RFQs
- Load intelligence data based on user role
- Display widgets with real data

**DIFF:**
```diff
--- a/src/pages/dashboard/DashboardHome.jsx
+++ b/src/pages/dashboard/DashboardHome.jsx
@@ -1,5 +1,6 @@
 import React, { useState, useEffect, useCallback, useRef } from 'react';
 import { Link, useNavigate } from 'react-router-dom';
+import { getRFQsInUserCategories, getRFQsExpiringSoon, getNewSuppliersInCountry, getTopCategoriesThisWeek } from '@/utils/marketplaceIntelligence';
 import { motion } from 'framer-motion';
 import { supabase, supabaseHelpers } from '@/api/supabaseClient';
 import { getCurrentUserAndRole } from '@/utils/authHelpers';
@@ -8,7 +9,7 @@ import {
   ShoppingCart, FileText, Package, Users, TrendingUp, Search,
   Plus, Eye, MessageSquare, DollarSign, Wallet, Truck, AlertCircle,
   BarChart3, Shield, CheckCircle, Clock, Bell, Activity, Target, HelpCircle, Building2
-} from 'lucide-react';
+} from 'lucide-react';
 import { StatCard } from '@/components/ui/stat-card';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
@@ -28,6 +29,10 @@ export default function DashboardHome({ currentRole = 'buyer' }) {
   const [companyId, setCompanyId] = useState(null);
   const [viewMode, setViewMode] = useState('everything'); // For hybrid users
   const navigate = useNavigate();
+  const [rfqsInCategories, setRfqsInCategories] = useState([]);
+  const [rfqsExpiringSoon, setRfqsExpiringSoon] = useState([]);
+  const [newSuppliers, setNewSuppliers] = useState([]);
+  const [topCategories, setTopCategories] = useState([]);
   const loadingRef = useRef(false); // Prevent concurrent loads

   // ... existing code ...

   useEffect(() => {
     if (!loadingRef.current) {
-    loadDashboardData();
+    loadDashboardData();
+    loadIntelligenceData();
     }
   }, [currentRole, loadDashboardData]);

+  const loadIntelligenceData = useCallback(async () => {
+    try {
+      const { user: userData, companyId: userCompanyId } = await getCurrentUserAndRole(supabase, supabaseHelpers);
+      if (!userData || !userCompanyId) return;
+      
+      const role = getUserRole(userData);
+      
+      // Load data based on role
+      if (role === 'seller' || role === 'hybrid') {
+        const [rfqsInCats, expiringRfqs] = await Promise.all([
+          getRFQsInUserCategories(userCompanyId, 5),
+          getRFQsExpiringSoon(userCompanyId, 7, 5)
+        ]);
+        setRfqsInCategories(rfqsInCats);
+        setRfqsExpiringSoon(expiringRfqs);
+      }
+      
+      if (role === 'buyer' || role === 'hybrid') {
+        // Get user's country
+        const { data: company } = await supabase
+          .from('companies')
+          .select('country')
+          .eq('id', userCompanyId)
+          .single();
+        
+        if (company?.country) {
+          const suppliers = await getNewSuppliersInCountry(company.country, 30, 5);
+          setNewSuppliers(suppliers);
+        }
+      }
+      
+      // Load top categories (for all roles)
+      const topCats = await getTopCategoriesThisWeek(5);
+      setTopCategories(topCats);
+    } catch (error) {
+      // Silently fail - intelligence is optional
+    }
+  }, []);

   // ... existing loadDashboardData, loadStats, etc. ...

   return (
     <div className="space-y-3">
       {/* ... existing welcome header, stats, quick actions, tasks, activity, recent orders/rfqs ... */}

+      {/* Intelligence Widgets */}
+      <div className="grid md:grid-cols-2 gap-4">
+        {/* RFQs in Your Categories (Seller/Hybrid) */}
+        {(currentRole === 'seller' || currentRole === 'hybrid') && rfqsInCategories.length > 0 && (
+          <Card>
+            <CardHeader>
+              <CardTitle className="flex items-center justify-between">
+                <div className="flex items-center gap-2">
+                  <FileText className="w-5 h-5" />
+                  Active RFQs in Your Categories
+                </div>
+                <Link to="/dashboard/rfqs">
+                  <Button variant="ghost" size="sm">View All</Button>
+                </Link>
+              </CardTitle>
+            </CardHeader>
+            <CardContent>
+              <div className="space-y-3">
+                {rfqsInCategories.map((rfq) => (
+                  <Link key={rfq.id} to={`/dashboard/rfqs/${rfq.id}`}>
+                    <div className="p-3 border border-afrikoni-gold/20 rounded-lg hover:bg-afrikoni-offwhite transition-colors">
+                      <div className="flex items-center justify-between mb-2">
+                        <span className="font-medium text-sm text-afrikoni-chestnut truncate">{rfq.title}</span>
+                        <Badge variant="outline" className="text-xs">{rfq.categories?.name}</Badge>
+                      </div>
+                      <div className="text-xs text-afrikoni-deep/70">
+                        Budget: {rfq.target_price ? `$${rfq.target_price.toLocaleString()}` : 'Negotiable'}
+                      </div>
+                    </div>
+                  </Link>
+                ))}
+              </div>
+            </CardContent>
+          </Card>
+        )}
+
+        {/* RFQs Expiring Soon (Seller/Hybrid) */}
+        {(currentRole === 'seller' || currentRole === 'hybrid') && rfqsExpiringSoon.length > 0 && (
+          <Card>
+            <CardHeader>
+              <CardTitle className="flex items-center justify-between">
+                <div className="flex items-center gap-2">
+                  <Clock className="w-5 h-5 text-red-600" />
+                  RFQs Expiring Soon
+                </div>
+                <Link to="/dashboard/rfqs">
+                  <Button variant="ghost" size="sm">View All</Button>
+                </Link>
+              </CardTitle>
+            </CardHeader>
+            <CardContent>
+              <div className="space-y-3">
+                {rfqsExpiringSoon.map((rfq) => {
+                  const deadline = rfq.delivery_deadline || rfq.expires_at;
+                  const timeRemaining = deadline ? getTimeRemaining(deadline) : null;
+                  return (
+                    <Link key={rfq.id} to={`/dashboard/rfqs/${rfq.id}`}>
+                      <div className="p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
+                        <div className="flex items-center justify-between mb-2">
+                          <span className="font-medium text-sm text-afrikoni-chestnut truncate">{rfq.title}</span>
+                          {timeRemaining && (
+                            <Badge variant="destructive" className="text-xs">
+                              {timeRemaining.text}
+                            </Badge>
+                          )}
+                        </div>
+                        <div className="text-xs text-afrikoni-deep/70">
+                          {rfq.categories?.name}
+                        </div>
+                      </div>
+                    </Link>
+                  );
+                })}
+              </div>
+            </CardContent>
+          </Card>
+        )}
+
+        {/* New Suppliers in Your Country (Buyer/Hybrid) */}
+        {(currentRole === 'buyer' || currentRole === 'hybrid') && newSuppliers.length > 0 && (
+          <Card>
+            <CardHeader>
+              <CardTitle className="flex items-center justify-between">
+                <div className="flex items-center gap-2">
+                  <Users className="w-5 h-5" />
+                  New Suppliers in Your Country
+                </div>
+                <Link to="/suppliers">
+                  <Button variant="ghost" size="sm">View All</Button>
+                </Link>
+              </CardTitle>
+            </CardHeader>
+            <CardContent>
+              <div className="space-y-3">
+                {newSuppliers.map((supplier) => (
+                  <Link key={supplier.id} to={`/supplier?id=${supplier.id}`}>
+                    <div className="p-3 border border-afrikoni-gold/20 rounded-lg hover:bg-afrikoni-offwhite transition-colors">
+                      <div className="flex items-center justify-between mb-2">
+                        <span className="font-medium text-sm text-afrikoni-chestnut">{supplier.company_name}</span>
+                        {supplier.verified && (
+                          <Badge variant="verified" className="text-xs">Verified</Badge>
+                        )}
+                      </div>
+                      <div className="text-xs text-afrikoni-deep/70">
+                        {supplier.country}
+                      </div>
+                    </div>
+                  </Link>
+                ))}
+              </div>
+            </CardContent>
+          </Card>
+        )}
+
+        {/* Top Categories This Week */}
+        {topCategories.length > 0 && (
+          <Card>
+            <CardHeader>
+              <CardTitle className="flex items-center gap-2">
+                <TrendingUp className="w-5 h-5" />
+                Top Categories This Week
+              </CardTitle>
+            </CardHeader>
+            <CardContent>
+              <div className="space-y-2">
+                {topCategories.map((item, idx) => (
+                  <div key={item.category_id} className="flex items-center justify-between p-2 border border-afrikoni-gold/20 rounded-lg">
+                    <div className="flex items-center gap-2">
+                      <span className="text-sm font-semibold text-afrikoni-gold w-6 text-center">{idx + 1}</span>
+                      <span className="text-sm text-afrikoni-deep">{item.category?.name || 'Uncategorized'}</span>
+                    </div>
+                    <Badge variant="outline" className="text-xs">{item.count} RFQs</Badge>
+                  </div>
+                ))}
+              </div>
+            </CardContent>
+          </Card>
+        )}
+      </div>
     </div>
   );
 }
```

### Expected UX

1. **Dashboard Home:**
   - New widgets section appears after Recent Orders/RFQs
   - **Sellers/Hybrids see:**
     - "Active RFQs in Your Categories" (RFQs matching their product categories)
     - "RFQs Expiring Soon" (RFQs closing in next 7 days, red border for urgency)
   - **Buyers/Hybrids see:**
     - "New Suppliers in Your Country" (suppliers registered in last 30 days)
   - **All roles see:**
     - "Top Categories This Week" (categories with most RFQs, ranked list)
   - Widgets only show if data exists (no empty widgets)
   - Each widget has "View All" link to relevant page

---

## 📦 SUMMARY OF NEW FILES

### Helpers
1. `src/utils/marketplaceHelpers.js` - Time remaining, fast response, ready to ship checks
2. `src/utils/viewHistory.js` - localStorage-based view history management
3. `src/utils/recommendations.js` - Simple recommendation engine
4. `src/utils/marketplaceIntelligence.js` - Dashboard intelligence queries

### Components
1. `src/components/ui/FilterChip.jsx` - Reusable filter chip component
2. `src/components/ui/SaveButton.jsx` - Save/unsave button with heart icon

---

## 📝 IMPLEMENTATION ORDER

1. **8A First** (Search & Filters) - Foundation for better discovery
2. **8B Second** (Buyer Intelligence) - Enhances user experience
3. **8C Last** (Dashboard Widgets) - Adds intelligence layer

---

## ✅ READY FOR IMPLEMENTATION

**Status**: Proposal complete, awaiting approval.

**Next Step**: Upon approval, implement sub-clusters in order (8A → 8B → 8C).

