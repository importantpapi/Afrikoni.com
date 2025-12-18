# 📍 SIDEBAR NAVIGATION - REVIEWS SYSTEM

## 🎯 REQUIRED UPDATES

### 1. SELLER/HYBRID DASHBOARD SIDEBAR

Add this navigation item for sellers and hybrid users:

```javascript
{
  name: 'Trust & Reviews',
  icon: Star, // or Shield icon for emphasis
  path: '/dashboard/reviews',
  roles: ['seller', 'hybrid'], // Only visible to sellers
  badge: null, // Optional: Can add review count badge
  description: 'View your trust score and customer reviews'
}
```

**Visual Style:**
- Icon: ⭐ Star (gold color)
- Position: Suggest placing after "Analytics" or before "Company Info"
- Active state: Gold highlight when on `/dashboard/reviews`

---

### 2. ADMIN DASHBOARD SIDEBAR

Add this navigation item for admins:

```javascript
{
  name: 'Reviews Moderation',
  icon: Shield, // or CheckSquare icon
  path: '/dashboard/admin/reviews-moderation',
  roles: ['admin'], // Admin only
  badge: 'pending_count', // Shows number of pending reviews
  description: 'Approve or reject customer reviews'
}
```

**Visual Style:**
- Icon: 🛡️ Shield (blue or gold color)
- Position: Suggest placing in "Admin" section, near "Marketplace" or "Users"
- Badge: Red/orange notification badge showing pending count
- Active state: Gold highlight when on route

**Badge Implementation:**
```javascript
// Fetch pending review count
const { count } = await supabase
  .from('reviews')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'pending');

// Display as badge
{count > 0 && <Badge className="bg-red-500">{count}</Badge>}
```

---

### 3. BUYER DASHBOARD

**No sidebar item needed!**

Buyers interact with reviews through:
- `Dashboard → Orders` page
- "⭐ Review" button on completed orders

This keeps the UX clean and contextual.

---

## 📋 SIDEBAR STRUCTURE EXAMPLE

### Seller/Hybrid Sidebar:
```
Dashboard
├── RFQs & Deals
├── Orders
├── Products
├── Messages
├── Analytics
├── Trust & Reviews ⭐ ← NEW
├── Company Info
├── Payments & Escrow
└── Support
```

### Admin Sidebar:
```
Admin Dashboard
├── Overview
├── Users
├── Marketplace
├── Reviews Moderation 🛡️ ← NEW (with pending badge)
├── Verifications
├── Disputes
└── Settings
```

### Buyer Sidebar:
```
Dashboard
├── RFQs & Deals
├── Orders ← Reviews accessible here via button
├── Saved Products
├── Messages
├── Payments & Escrow
└── Support
```

---

## 🎨 ICON RECOMMENDATIONS

### Option 1: Star Icon (Friendly)
```jsx
import { Star } from 'lucide-react';
<Star className="w-5 h-5" />
```
**Pros:** Clearly indicates reviews/ratings
**Cons:** Might look too casual

### Option 2: Shield Icon (Professional) ✅ RECOMMENDED
```jsx
import { Shield } from 'lucide-react';
<Shield className="w-5 h-5" />
```
**Pros:** Emphasizes trust/security (aligned with "Trust Score")
**Cons:** None

### Option 3: Award Icon (Achievement)
```jsx
import { Award } from 'lucide-react';
<Award className="w-5 h-5" />
```
**Pros:** Positive, achievement-oriented
**Cons:** Less obvious it's about reviews

---

## 🔔 NOTIFICATION BADGE (Admin)

For the admin "Reviews Moderation" link, add a real-time badge:

```jsx
function ReviewsModerationLink() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Load initial count
    loadPendingCount();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('reviews_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reviews' },
        () => loadPendingCount()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  const loadPendingCount = async () => {
    const { count } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    setPendingCount(count || 0);
  };

  return (
    <Link to="/dashboard/admin/reviews-moderation">
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5" />
        <span>Reviews Moderation</span>
        {pendingCount > 0 && (
          <Badge className="bg-red-500 text-white">
            {pendingCount}
          </Badge>
        )}
      </div>
    </Link>
  );
}
```

---

## 🚀 IMPLEMENTATION CHECKLIST

### Step 1: Add Routes (if not done)
- [ ] `/dashboard/reviews` → `reviews.jsx` (seller)
- [ ] `/dashboard/admin/reviews-moderation` → `reviews-moderation.jsx` (admin)

### Step 2: Update Sidebar Component
- [ ] Add "Trust & Reviews" for sellers/hybrid
- [ ] Add "Reviews Moderation" for admins  
- [ ] Implement pending count badge for admin
- [ ] Test role-based visibility

### Step 3: Visual Testing
- [ ] Seller sees "Trust & Reviews" in sidebar
- [ ] Buyer does NOT see "Trust & Reviews" in sidebar
- [ ] Admin sees "Reviews Moderation" with badge
- [ ] Active state highlights correctly
- [ ] Icons render properly

### Step 4: Navigation Testing
- [ ] Click "Trust & Reviews" → goes to `/dashboard/reviews`
- [ ] Click "Reviews Moderation" → goes to `/dashboard/admin/reviews-moderation`
- [ ] Active route matches highlighted sidebar item

---

## 💡 UX TIPS

### For Sellers:
- **First-time visitors:** Show a tooltip: "Build trust through verified customer reviews"
- **Empty state:** Redirect to page showing "0 reviews" with explanation
- **New review notification:** Consider adding a small badge when new review is approved

### For Admins:
- **Pending badge:** Update in real-time (use Supabase subscriptions)
- **Color coding:**
  - 0 pending: No badge
  - 1-5 pending: Orange badge
  - 6+ pending: Red badge (urgent)
- **Sort priority:** Reviews older than 48 hours should be flagged

---

## 🎨 COLOR SCHEME

Match Afrikoni's brand:
- **Primary:** Gold (`#D4AF37`)
- **Trust/Security:** Blue (`#1E40AF`)
- **Success:** Green (`#10B981`)
- **Alert:** Orange/Red (`#F59E0B` / `#EF4444`)

---

## ✅ FINAL STRUCTURE

```
Seller Sidebar:
  ...
  Analytics
  Trust & Reviews ⭐ [Gold icon]
  Company Info
  ...

Admin Sidebar:
  ...
  Marketplace
  Reviews Moderation 🛡️ [Shield icon + Red badge if pending]
  Verifications
  ...
```

**Implementation Files:**
- Sidebar component: Your main navigation/layout component
- Routes: `App.jsx` or routing configuration
- Badge logic: Custom hook or component for admin sidebar

---

**Ready to implement? All specifications above! 🚀**

