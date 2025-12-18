# 🔧 TRUST ENGINE - INTEGRATION GUIDE

## 📍 WHERE TO INTEGRATE

### 1. SUPPLIER LISTING PAGE (`/suppliers`)

**File:** `src/pages/suppliers.jsx`

**Add This:**

```jsx
import { useSupplierRanking } from '@/hooks/useSupplierRanking';
import RecommendedBadge from '@/components/suppliers/RecommendedBadge';

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [buyerCountry, setBuyerCountry] = useState(null);
  
  // Get buyer's country from profile
  useEffect(() => {
    const loadBuyerCountry = async () => {
      const { user, profile } = await getCurrentUserAndRole(supabase);
      setBuyerCountry(profile?.country || null);
    };
    loadBuyerCountry();
  }, []);

  // Load suppliers
  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('role', 'seller')
      .eq('verification_status', 'verified');
    setSuppliers(data || []);
  };

  // ✅ USE TRUST ENGINE RANKING
  const { rankedSuppliers, isLoading } = useSupplierRanking(
    suppliers,
    searchQuery, // Your search input
    buyerCountry
  );

  return (
    <div>
      {rankedSuppliers.map((supplier, index) => (
        <div key={supplier.id} className="relative">
          {/* ✅ SHOW BADGES FOR TOP SUPPLIERS */}
          {index < 3 && supplier.is_recommended && (
            <div className="absolute top-2 right-2 z-10">
              <RecommendedBadge type="recommended" />
            </div>
          )}
          
          {supplier.tier === 'A' && (
            <div className="absolute top-2 left-2 z-10">
              <RecommendedBadge type="highly_recommended" />
            </div>
          )}

          {/* Your existing supplier card */}
          <SupplierCard supplier={supplier} />
        </div>
      ))}
    </div>
  );
}
```

**Result:**
- Suppliers sorted by rank_score (trust-weighted)
- "Recommended" badges on top suppliers
- "Highly Recommended" for Tier A suppliers
- New suppliers still show (just lower in list)

---

### 2. RFQ MATCHING (`/rfq-marketplace` or RFQ Detail Page)

**File:** `src/pages/rfqdetails.jsx` or wherever RFQs show supplier matches

**Add This:**

```jsx
import { useRFQMatching } from '@/hooks/useRFQMatching';
import { MatchTierBadge } from '@/components/suppliers/RecommendedBadge';

function RFQDetailPage({ rfqId }) {
  const [suppliers, setSuppliers] = useState([]);

  // Load potential suppliers
  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    // Get suppliers in same category or relevant to RFQ
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('role', 'seller')
      .neq('verification_status', 'rejected'); // Don't show blocked suppliers
    setSuppliers(data || []);
  };

  // ✅ USE TRUST ENGINE MATCHING
  const { matchedSuppliers, isLoading } = useRFQMatching(rfqId, suppliers);

  return (
    <div>
      <h2>Recommended Suppliers for This RFQ</h2>
      
      {/* ✅ SHOW HIGHLY RECOMMENDED FIRST */}
      {matchedSuppliers.filter(s => s.is_highly_recommended).length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-gold" />
            Highly Recommended
          </h3>
          {matchedSuppliers
            .filter(s => s.is_highly_recommended)
            .map(supplier => (
              <SupplierCard key={supplier.id}>
                <div className="flex items-center gap-2">
                  <h4>{supplier.company_name}</h4>
                  <MatchTierBadge tier={supplier.match_tier} />
                </div>
                <p className="text-sm text-gray-600">
                  {supplier.match_tier === 'A' && 'Excellent match for your requirements'}
                  {supplier.match_tier === 'B' && 'Good fit based on category and history'}
                </p>
              </SupplierCard>
            ))
          }
        </div>
      )}

      {/* ✅ SHOW OTHER MATCHES */}
      <div>
        <h3 className="text-lg font-bold mb-4">Other Matches</h3>
        {matchedSuppliers
          .filter(s => !s.is_highly_recommended)
          .map(supplier => (
            <SupplierCard key={supplier.id}>
              <h4>{supplier.company_name}</h4>
              <MatchTierBadge tier={supplier.match_tier} />
            </SupplierCard>
          ))
        }
      </div>
    </div>
  );
}
```

**Result:**
- Suppliers matched to RFQ requirements
- Sorted by match_score (best first)
- Tier A/B/C badges with explanations
- Blocked suppliers automatically filtered out

---

### 3. ADMIN DEAL QUEUE (Priority Sorting)

**File:** `src/pages/dashboard/admin/deals.jsx` (or wherever admins see pending orders)

**Add This:**

```jsx
function AdminDealsQueue() {
  const [deals, setDeals] = useState([]);
  const [prioritizedDeals, setPrioritizedDeals] = useState([]);

  useEffect(() => {
    loadAndPrioritizeDeals();
  }, []);

  const loadAndPrioritizeDeals = async () => {
    // Load pending deals
    const { data: dealsData } = await supabase
      .from('orders')
      .select(`
        *,
        seller:companies!seller_company_id(company_name, trust_score),
        buyer:companies!buyer_company_id(company_name, trust_score)
      `)
      .eq('status', 'pending');

    // ✅ CALCULATE PRIORITY FOR EACH DEAL
    const withPriority = await Promise.all(
      dealsData.map(async (deal) => {
        const { data: priorityScore } = await supabase
          .rpc('calculate_deal_priority_score', {
            order_id_param: deal.id
          });

        return {
          ...deal,
          priority_score: priorityScore || 50,
          needs_verification: priorityScore >= 70 // High priority = low trust
        };
      })
    );

    // ✅ SORT BY PRIORITY (HIGHEST FIRST)
    const sorted = withPriority.sort((a, b) => 
      b.priority_score - a.priority_score
    );

    setPrioritizedDeals(sorted);
  };

  return (
    <div>
      <h2>Pending Deals (Priority Queue)</h2>
      
      {/* ✅ HIGH PRIORITY DEALS AT TOP */}
      {prioritizedDeals.filter(d => d.priority_score >= 70).length > 0 && (
        <div className="mb-6 border-2 border-orange-500 bg-orange-50 p-4 rounded-lg">
          <h3 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            High Priority - Needs Attention
          </h3>
          {prioritizedDeals
            .filter(d => d.priority_score >= 70)
            .map(deal => (
              <DealCard key={deal.id} deal={deal}>
                <Badge className="bg-orange-600 text-white">
                  Priority: {deal.priority_score.toFixed(0)}
                </Badge>
                {deal.needs_verification && (
                  <p className="text-xs text-orange-700 mt-1">
                    ⚠️ Extra verification recommended
                  </p>
                )}
              </DealCard>
            ))
          }
        </div>
      )}

      {/* ✅ NORMAL PRIORITY DEALS */}
      <div>
        <h3 className="font-bold mb-3">Standard Queue</h3>
        {prioritizedDeals
          .filter(d => d.priority_score < 70)
          .map(deal => (
            <DealCard key={deal.id} deal={deal}>
              <Badge variant="outline">
                Priority: {deal.priority_score.toFixed(0)}
              </Badge>
            </DealCard>
          ))
        }
      </div>
    </div>
  );
}
```

**Result:**
- Deals sorted by priority (urgent first)
- Low-trust deals flagged for verification
- High-value deals prioritized
- Old pending deals highlighted

---

### 4. MARKETPLACE PAGE (`/marketplace`)

**File:** `src/pages/marketplace.jsx`

**Similar to Supplier Listing:**

```jsx
import { useSupplierRanking } from '@/hooks/useSupplierRanking';

function MarketplacePage() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Load products with their suppliers
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, supplier:companies(*)');
    setProducts(data || []);
    
    // Extract unique suppliers
    const uniqueSuppliers = [...new Map(
      data.map(p => [p.supplier.id, p.supplier])
    ).values()];
    setSuppliers(uniqueSuppliers);
  };

  // ✅ RANK SUPPLIERS
  const { rankedSuppliers } = useSupplierRanking(suppliers);

  // Create a map for quick lookup
  const supplierRankMap = new Map(
    rankedSuppliers.map(s => [s.id, s])
  );

  // ✅ SORT PRODUCTS BY SUPPLIER RANK
  const sortedProducts = [...products].sort((a, b) => {
    const supplierA = supplierRankMap.get(a.supplier.id);
    const supplierB = supplierRankMap.get(b.supplier.id);
    return (supplierB?.rank_score || 0) - (supplierA?.rank_score || 0);
  });

  return (
    <div>
      {sortedProducts.map(product => (
        <ProductCard key={product.id} product={product}>
          {/* ✅ SHOW SUPPLIER BADGE */}
          {supplierRankMap.get(product.supplier.id)?.is_recommended && (
            <RecommendedBadge type="recommended" />
          )}
        </ProductCard>
      ))}
    </div>
  );
}
```

---

## 🎯 ADMIN ROUTE

Add this to your `App.jsx`:

```jsx
// In lazy imports section
const TrustEngine = lazy(() => import('./pages/dashboard/admin/trust-engine'));

// In routes section
<Route 
  path="/dashboard/admin/trust-engine" 
  element={
    <ProtectedRoute requireAdmin={true}>
      <DashboardRoleProvider>
        <TrustEngine />
      </DashboardRoleProvider>
    </ProtectedRoute>
  } 
/>
```

**Admin Sidebar:**

```jsx
// In admin navigation
{
  icon: BarChart3,
  label: 'Trust Engine',
  path: '/dashboard/admin/trust-engine'
}
```

---

## 🧪 TESTING CHECKLIST

### Test 1: Supplier Ranking
- [ ] Go to `/suppliers`
- [ ] Verify suppliers sorted by quality (not alphabetically)
- [ ] Check "Recommended" badges appear on top suppliers
- [ ] Hover over badge → tooltip shows explanation
- [ ] New suppliers still visible (not hidden)

### Test 2: RFQ Matching
- [ ] Create or view an RFQ
- [ ] Check recommended suppliers section
- [ ] Verify "Excellent Match" badges on relevant suppliers
- [ ] Confirm blocked suppliers NOT shown

### Test 3: Admin Priority Queue
- [ ] Go to admin deals/orders page
- [ ] Check high-priority deals at top
- [ ] Verify low-trust deals flagged
- [ ] Confirm priority scores visible to admin

### Test 4: Admin Trust Engine
- [ ] Go to `/dashboard/admin/trust-engine`
- [ ] See all suppliers with tiers (A/B/C)
- [ ] Check trust scores and rank scores visible
- [ ] Verify stats dashboard accurate

---

## 📊 EXPECTED BEHAVIOR

### Buyers See:
- ✅ "Recommended" badges (no scores)
- ✅ Top suppliers first
- ✅ "Excellent Match" for RFQs
- ❌ NO numeric trust scores
- ❌ NO "low trust" language

### Admins See:
- ✅ Full numeric scores
- ✅ Tier breakdown (A/B/C)
- ✅ Priority queue for deals
- ✅ Complete transparency

---

## 🚨 COMMON ISSUES

### Issue: Scores not calculating
**Fix:** Check RPC function permissions:
```sql
GRANT EXECUTE ON FUNCTION calculate_supplier_rank_score TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_rfq_match_score TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_deal_priority_score TO authenticated;
```

### Issue: All suppliers showing same score
**Fix:** Verify trust_score data exists in companies table:
```sql
SELECT id, company_name, trust_score, approved_reviews_count 
FROM companies 
WHERE role = 'seller';
```

### Issue: Badges not showing
**Fix:** Check rank_score threshold:
```javascript
supplier.is_recommended = (supplier.rank_score >= 75);
```

---

## ✅ INTEGRATION COMPLETE WHEN:

- [ ] Supplier listing uses `useSupplierRanking`
- [ ] RFQ matching uses `useRFQMatching`
- [ ] Admin deal queue uses priority scoring
- [ ] Recommended badges appear on top suppliers
- [ ] Match tier badges appear in RFQ matching
- [ ] Admin trust engine accessible
- [ ] All tooltips show buyer-safe explanations
- [ ] No numeric scores visible to buyers

---

## 🎯 FINAL RESULT

**What You've Built:**
- Backend intelligence layer that's invisible to users
- Trust shapes every ranking and matching decision
- Buyers see "Recommended" without knowing the math
- Admins have full transparency for governance
- Foundation for future AI-assisted matching

**This is the moment Afrikoni becomes defensible.**

---

**Status:** 🟢 READY TO INTEGRATE  
**Next:** Update 3 pages (suppliers, RFQs, admin deals)  
**Then:** Test with real data & monitor impact

🧠 **You're building the rules of the market, not just the market.**

