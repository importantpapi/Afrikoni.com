# 🔍 END-TO-END USER WORKFLOW DOCUMENTATION
**Afrikoni B2B Marketplace - Complete System Analysis**

**Date:** January 2025  
**Status:** Production System Analysis  
**Author:** Senior Product Architect Review

---

## 📋 TABLE OF CONTENTS

A. [FLOW MAP](#a-flow-map)  
B. [ROLE-BASED MATRIX](#b-role-based-matrix)  
C. [MISSING FLOWS & WEAK POINTS](#c-missing-flows--weak-points)  
D. [RECOMMENDATIONS](#d-recommendations)

---

# DETAILED WORKFLOW STEPS

## 1. FIRST VISIT (NOT LOGGED IN)

### User Goal
Browse marketplace, view products, understand platform value proposition

### System Actions

**Frontend:**
- Render public homepage (`/`) with navigation
- Show marketplace browse page (`/marketplace`)
- Display product listings (public read access)
- Show supplier profiles (public read access)
- Display "Sign Up" / "Login" CTAs

**Backend:**
- Supabase RLS allows public SELECT on:
  - `products` (status = 'active')
  - `companies` (public read)
  - `categories` (public read)
  - `rfqs` (public read)

### Data Created/Updated
- **None** - Pure read-only browsing
- Analytics events may be logged (if analytics enabled)

### Permissions & Access Rules
- ✅ Public read access to products, companies, categories
- ✅ No authentication required for browsing
- ❌ Cannot create RFQ (requires login)
- ❌ Cannot view private data (orders, messages, wallet)

### What Can Go Wrong
1. **Slow product loading** - No pagination limits visible in codebase
2. **No offline state** - Network failure = blank page
3. **SEO concerns** - React SPA may have indexing issues
4. **Image loading failures** - No fallback images configured

### UX Signals
- ✅ Product cards show loading skeleton
- ✅ Empty state if no products found
- ⚠️ No "Retry" button on network errors
- ⚠️ No search loading indicator

---

## 2. SIGN UP / LOGIN

### User Goal
Create account or authenticate existing account

### System Actions

**Signup Flow (`signup.jsx`):**

**Frontend:**
1. User fills: `full_name`, `email`, `password`, `confirmPassword`
2. User selects role: `buyer`, `seller`, `logistics`, or `hybrid` (radio buttons)
3. Form validation:
   - Email format check
   - Password length ≥ 6 characters
   - Password match check
   - Role selection required

**Backend:**
1. `supabase.auth.signUp()` creates auth user
2. Profile created in `profiles` table:
   ```sql
   INSERT INTO profiles (
     id, full_name, email, role, user_role, onboarding_completed
   ) VALUES (
     auth_user.id, formData.fullName, formData.email, 
     selectedRole, selectedRole, true
   )
   ```
3. If session exists (email confirmation disabled):
   - ✅ User auto-logged in
   - ✅ Redirects to `/dashboard`
4. If no session (email confirmation required):
   - 📧 Confirmation email sent (if SMTP configured)
   - ⚠️ User cannot proceed until email verified
   - ⚠️ **PROBLEM:** Profile created with `onboarding_completed: true` even before email verification

**Login Flow (`login.jsx`):**

**Frontend:**
1. User enters: `email`, `password`
2. OAuth options: Google, Facebook

**Backend:**
1. `supabase.auth.signInWithPassword()` authenticates
2. Fetches user profile via `getCurrentUserAndRole()`
3. Determines role from profile or user_metadata
4. Redirects to `/dashboard` (all roles go to same route)

### Data Created/Updated

**Signup:**
- `auth.users`: New user record
- `profiles`: New profile with role, `onboarding_completed: true`
- `user_metadata`: `{ full_name, role, user_role }`

**Login:**
- `auth.users`: Session created
- No data mutations (read-only)

### Permissions & Access Rules
- ✅ Users can create their own profile (`auth.uid() = id`)
- ✅ Profile RLS: Users can only update own profile
- ⚠️ **PROBLEM:** Role selection happens at signup, but onboarding was supposed to handle this (inconsistency)

### What Can Go Wrong

**Critical Issues:**
1. **Email confirmation disabled** - Users can sign up without verifying email (security risk)
2. **Role set too early** - Role selected at signup, but onboarding may ask again (confusion)
3. **Profile creation failure** - If profile insert fails, user has auth account but no profile (broken state)
4. **OAuth callback errors** - No clear error handling if OAuth provider fails
5. **Duplicate emails** - Supabase prevents this, but UX doesn't clearly explain

**Minor Issues:**
- No password strength indicator
- No rate limiting on signup attempts
- No CAPTCHA for bot protection

### UX Signals
- ✅ Loading spinner during signup/login
- ✅ Success toast: "Account created! Welcome to Afrikoni."
- ✅ Error toast shows error message
- ⚠️ No email verification status indicator
- ⚠️ No "Check your email" message if confirmation required

---

## 3. ROLE SELECTION (BUYER / SELLER / HYBRID / LOGISTICS)

### User Goal
Select how they will use the platform

### System Actions

**Current Implementation (PROBLEMATIC):**

**Option 1: Signup page (`signup.jsx`)**
- ✅ Role selected via radio buttons
- ✅ Saved to `profiles.role` and `profiles.user_role`
- ✅ Set `onboarding_completed: true`
- ❌ **BYPASSES ONBOARDING** - User never sees onboarding flow

**Option 2: Onboarding page (`onboarding.jsx`)**
- Step 1: Role selection cards
- Step 2: Company information
- Saves role to profile
- **CONFLICT:** Signup already set role, so this step is redundant

### Data Created/Updated
- `profiles.role`: Selected role
- `profiles.user_role`: Duplicate field (legacy?)
- `profiles.onboarding_completed`: Set to `true`

### Permissions & Access Rules
- ✅ Users can update own profile
- ⚠️ Role cannot be changed after signup (no UI for role switching)

### What Can Go Wrong

**CRITICAL PROBLEMS:**
1. **Double role selection** - Role selected at signup AND onboarding (confusing)
2. **Onboarding skipped** - If role set at signup, user may skip onboarding entirely
3. **No role validation** - Invalid roles can be set
4. **No role switching** - User cannot change role later (locked in)

### UX Signals
- ✅ Role cards with icons (ShoppingCart, Package, Building2, Truck)
- ✅ Visual feedback on selection
- ⚠️ No explanation of what each role does
- ⚠️ No preview of role-specific features

---

## 4. ONBOARDING STEPS PER ROLE

### User Goal
Complete profile setup, provide company information

### System Actions

**Onboarding Page (`onboarding.jsx`):**

**Step 1: Role Selection** (IF role not already set)
- 4 role cards: Buyer, Seller, Hybrid, Logistics
- User selects one
- Continue button disabled until selection

**Step 2: Company Information**
- Fields:
  - `company_name` (required)
  - `business_type`
  - `country` (required, dropdown)
  - `city`
  - `phone` (required)
  - `website`
  - `year_established`
  - `company_size`
  - `company_description`

**Backend:**
1. `getOrCreateCompany()` helper creates/updates `companies` table
2. Profile updated with company info and `company_id`
3. `onboarding_completed` set to `true`

**Code Flow:**
```javascript
// Create company
const companyId = await getOrCreateCompany(supabase, {
  ...formData,
  id: user.id,
  email: user.email,
  role: selectedRole
});

// Update profile
await supabase.from('profiles').update({
  role: selectedRole,
  user_role: selectedRole,
  onboarding_completed: true,
  company_name: formData.company_name,
  country: formData.country,
  phone: formData.phone,
  // ... other fields
  company_id: companyId
}).eq('id', user.id);
```

### Data Created/Updated

**Tables:**
- `companies`: New company record
  - Fields: `company_name`, `owner_email`, `email`, `role`, `country`, `city`, `phone`, `website`, etc.
- `profiles`: Updated with company info
  - Fields: All company fields duplicated + `company_id`, `onboarding_completed: true`

### Permissions & Access Rules
- ✅ Users can create companies (RLS: `owner_email = auth user email`)
- ✅ Users can update own profile
- ⚠️ **PROBLEM:** Company fields duplicated in both `companies` and `profiles` (data redundancy)

### What Can Go Wrong

**Critical Issues:**
1. **Onboarding skipped** - If user signs up with role, they may bypass onboarding
2. **Company creation failure** - If `getOrCreateCompany()` fails, profile update still succeeds (inconsistent state)
3. **Duplicate data** - Company info stored in both `companies` and `profiles` tables (maintenance nightmare)
4. **No validation** - Phone number, website format not validated
5. **No email verification** - Company email not verified

**Minor Issues:**
- No progress indicator (just step 1/2)
- No "Save as draft" functionality
- No field-level validation errors

### UX Signals
- ✅ Progress indicator: Step 1 of 2
- ✅ Form validation on submit
- ✅ Loading state during submission
- ✅ Success toast: "Account created! Welcome to Afrikoni."
- ✅ Redirect to `/dashboard` on completion
- ⚠️ No "Skip for now" option
- ⚠️ No field-level error messages

---

## 5. DASHBOARD ENTRY

### User Goal
Access role-specific dashboard with personalized data

### System Actions

**Dashboard Route (`/dashboard`):**

**Frontend (`dashboard/index.jsx`):**
1. Check session via `supabase.auth.getSession()`
2. If no session → redirect to `/login`
3. Fetch user profile and role via `getCurrentUserAndRole()`
4. Check if admin → redirect to `/dashboard/admin`
5. Normalize role via `getUserRole()`
6. Render role-specific component:
   - `buyer` → `<BuyerHome />`
   - `seller` → `<SellerHome />`
   - `hybrid` → `<HybridHome />`
   - `logistics` → `<LogisticsHome />`

**Backend:**
- No mutations, only reads:
  - `profiles` table (user profile)
  - `companies` table (company info)
  - Role detection from profile/user_metadata

### Data Created/Updated
- **None** - Dashboard entry is read-only
- Analytics events may be logged

### Permissions & Access Rules
- ✅ Authenticated users only (session required)
- ✅ Users see only their own data (filtered by `company_id`)
- ✅ Admin users redirected to admin dashboard
- ⚠️ **PROBLEM:** No onboarding completion check - user can access dashboard even if onboarding incomplete

### What Can Go Wrong

**Critical Issues:**
1. **No onboarding guard** - Dashboard doesn't check `onboarding_completed` flag
2. **Role mismatch** - If profile role doesn't match signup role, user sees wrong dashboard
3. **Missing company_id** - If company not created, dashboard may show empty state (no error)
4. **Admin detection** - Admin check only looks at email hardcode (`youba.thiam@icloud.com`) - not scalable

**Minor Issues:**
- Loading spinner shown but no timeout
- No error boundary for dashboard crashes
- No fallback if role detection fails

### UX Signals
- ✅ Loading spinner: "Loading..."
- ✅ Role-specific dashboard content
- ⚠️ No empty state message if no data
- ⚠️ No "Complete your profile" banner if onboarding incomplete

---

## 6. CORE ACTIONS PER DASHBOARD

### 6.1 BUYER DASHBOARD

#### User Goal
Source products, create RFQs, manage orders, communicate with suppliers

#### Core Actions

**1. Browse Marketplace**
- View products (`/marketplace`)
- Search/filter products
- View supplier profiles
- **Data:** Read-only from `products`, `companies` tables

**2. Create RFQ**
- Form: Product name, quantity, target price, delivery location, deadline
- **Backend:**
  ```sql
  INSERT INTO rfqs (
    title, description, quantity, target_price,
    delivery_location, delivery_deadline, expires_at,
    status, buyer_company_id
  ) VALUES (...)
  ```
- **Notifications:** Sent to all sellers (or matched sellers)
- **Data Created:** `rfqs` table record

**3. View RFQ Quotes**
- See all quotes submitted for RFQ
- Compare prices, delivery times
- **Data:** Read from `quotes` table filtered by `rfq_id`

**4. Award Quote → Create Order**
- Buyer selects winning quote
- **Backend:**
  ```sql
  -- Update RFQ status
  UPDATE rfqs SET status = 'awarded' WHERE id = rfq_id;
  
  -- Update quote status
  UPDATE quotes SET status = 'accepted' WHERE id = quote_id;
  UPDATE quotes SET status = 'rejected' WHERE rfq_id = rfq_id AND id != quote_id;
  
  -- Create order
  INSERT INTO orders (
    rfq_id, quote_id, buyer_company_id, seller_company_id,
    product_id, quantity, unit_price, total_amount,
    status, payment_status
  ) VALUES (...)
  
  -- Create escrow hold transaction
  INSERT INTO wallet_transactions (
    order_id, company_id, type, amount, status
  ) VALUES (order_id, buyer_company_id, 'escrow_hold', total_amount, 'pending')
  ```
- **Notifications:** Sent to buyer and seller
- **Data Created:** `orders` record, `wallet_transactions` record

**5. Manage Orders**
- View order status
- Track shipments
- Confirm delivery
- **Data:** Read/update `orders` table filtered by `buyer_company_id`

**6. Messages**
- Start conversation with supplier
- Send/receive messages
- **Backend:**
  ```sql
  -- Create conversation if doesn't exist
  INSERT INTO conversations (
    buyer_company_id, seller_company_id, subject, last_message, last_message_at
  ) VALUES (...)
  
  -- Insert message
  INSERT INTO messages (
    conversation_id, sender_company_id, receiver_company_id,
    sender_user_email, content, read, related_to, related_type
  ) VALUES (...)
  ```
- **Notifications:** Sent to receiver (if not viewing conversation)
- **Data Created:** `conversations`, `messages` records

### 6.2 SELLER DASHBOARD

#### User Goal
List products, respond to RFQs, manage sales, fulfill orders

#### Core Actions

**1. Add Product**
- Form: Title, description, images, price, MOQ, specifications, category
- **Backend:**
  ```sql
  INSERT INTO products (
    title, description, price, moq, category_id,
    supplier_id, status, images
  ) VALUES (...)
  ```
- **Storage:** Images uploaded to Supabase Storage (`product-images/`)
- **Data Created:** `products` record, `product_images` records

**2. Manage Products**
- Edit product details
- Update inventory/stock
- Activate/deactivate products
- **Data:** Update `products` table filtered by `supplier_id = company_id`

**3. View RFQs**
- Browse open RFQs
- Filter by category, country
- **Data:** Read from `rfqs` table (public read, status = 'open')

**4. Submit Quote**
- Form: Price per unit, total price, delivery time, incoterms, MOQ, notes
- **Backend:**
  ```sql
  INSERT INTO quotes (
    rfq_id, supplier_company_id, price_per_unit, total_price,
    currency, delivery_time, incoterms, moq, notes, status
  ) VALUES (...)
  
  -- Auto-create conversation
  INSERT INTO conversations (
    buyer_company_id, seller_company_id, subject
  ) VALUES (rfq.buyer_company_id, supplier_company_id, 'RFQ Discussion')
  ```
- **Notifications:** Sent to buyer
- **Data Created:** `quotes` record, `conversations` record (if new)

**5. Manage Sales**
- View all orders (seller side)
- Update order status: `processing` → `shipped` → `delivered`
- **Data:** Read/update `orders` table filtered by `seller_company_id`

**6. Fulfillment**
- Create shipment
- Update tracking
- **Backend:**
  ```sql
  INSERT INTO shipments (
    order_id, logistics_partner_id, tracking_number,
    carrier, status, origin, destination
  ) VALUES (...)
  ```
- **Notifications:** Sent to buyer on status change
- **Data Created:** `shipments` record

### 6.3 HYBRID DASHBOARD

#### User Goal
Access both buyer and seller features with toggle

#### Core Actions
- **Same as Buyer + Seller**
- **View Mode Toggle:** `'everything'`, `'buyer'`, `'seller'`
- **Data Loading:** Loads buyer OR seller data based on view mode
- **UI:** Toggle switches between buyer/seller views

### 6.4 LOGISTICS DASHBOARD

#### User Goal
Manage shipments, provide logistics services

#### Core Actions

**1. View Shipment Requests**
- See orders requiring logistics
- **Data:** Read from `orders` table (filtered by logistics availability)

**2. Create Shipment Quote**
- Quote shipping costs
- Provide delivery timeline
- **Backend:**
  ```sql
  INSERT INTO shipment_quotes (
    order_id, logistics_partner_id, quote_amount,
    estimated_delivery, status
  ) VALUES (...)
  ```

**3. Manage Shipments**
- Update shipment status
- Add tracking information
- **Data:** Update `shipments` table filtered by `logistics_partner_id`

---

## 7. CROSS-FLOWS (RFQ → CHAT → DEAL → FOLLOW-UP)

### 7.1 RFQ → QUOTE FLOW

**Step-by-Step:**

1. **Buyer Creates RFQ**
   - User: Fills RFQ form on `/rfq/create` or `/dashboard/rfqs/new`
   - Frontend: Validates form, calls `supabase.from('rfqs').insert()`
   - Backend: Creates RFQ record, status = `'open'` or `'in_review'`
   - **Data Created:** `rfqs` record
   - **Notifications:** Sent to all sellers (via notification service)

2. **Seller Views RFQ**
   - User: Browses `/dashboard/rfqs` or receives notification
   - Frontend: Reads `rfqs` table (public read)
   - Backend: No mutations

3. **Seller Submits Quote**
   - User: Fills quote form on `/dashboard/rfqs/[id]`
   - Frontend: Validates quote, calls `supabase.from('quotes').insert()`
   - Backend:
     ```sql
     INSERT INTO quotes (...)
     -- Auto-create conversation
     INSERT INTO conversations (buyer_company_id, seller_company_id, ...)
     ```
   - **Data Created:** `quotes` record, `conversations` record (if new)
   - **Notifications:** Sent to buyer

4. **Buyer Reviews Quotes**
   - User: Views quotes on `/dashboard/rfqs/[id]`
   - Frontend: Reads `quotes` table filtered by `rfq_id`
   - Backend: No mutations

### 7.2 QUOTE → ORDER FLOW

**Step-by-Step:**

1. **Buyer Awards Quote**
   - User: Clicks "Award Quote" on RFQ detail page
   - Frontend: Calls `handleAwardRFQ()` in `dashboard/rfqs/[id].jsx`
   - Backend:
     ```sql
     -- Update RFQ
     UPDATE rfqs SET status = 'awarded' WHERE id = rfq_id;
     
     -- Update quote
     UPDATE quotes SET status = 'accepted' WHERE id = quote_id;
     UPDATE quotes SET status = 'rejected' WHERE rfq_id = rfq_id AND id != quote_id;
     
     -- Create order
     INSERT INTO orders (
       rfq_id, quote_id, buyer_company_id, seller_company_id,
       product_id, quantity, unit_price, total_amount,
       status, payment_status, currency
     ) VALUES (...)
     
     -- Create escrow hold
     INSERT INTO wallet_transactions (
       order_id, company_id, type, amount, status, description
     ) VALUES (order_id, buyer_company_id, 'escrow_hold', total_amount, 'pending', ...)
     ```
   - **Data Created:** `orders` record, `wallet_transactions` record
   - **Notifications:** Sent to buyer and seller
   - **Redirect:** Buyer redirected to `/dashboard/orders/[order_id]`

2. **Order Created**
   - Both parties can view order in their dashboards
   - Order status: `'pending'` or `'processing'`
   - Payment status: `'pending'`

### 7.3 ORDER → PAYMENT FLOW

**Step-by-Step:**

1. **Buyer Initiates Payment**
   - User: Clicks "Pay Now" on order detail page
   - Frontend: Redirects to Flutterwave payment gateway (`/payment/[order_id]`)
   - Backend: Creates payment session

2. **Payment Processing (Flutterwave)**
   - User: Completes payment on Flutterwave
   - Callback: Flutterwave redirects to `/payment/callback`
   - Backend:
     ```sql
     UPDATE orders SET 
       payment_status = 'paid',
       payment_method = 'flutterwave',
       status = 'processing',
       payment_reference = transaction_id
     WHERE id = order_id;
     
     -- Update escrow transaction
     UPDATE wallet_transactions SET 
       status = 'completed'
     WHERE order_id = order_id AND type = 'escrow_hold';
     ```
   - **Data Updated:** `orders.payment_status`, `wallet_transactions.status`
   - **Notifications:** Order confirmation email to buyer, payment received email to seller

3. **Payment Confirmed**
   - Order status: `'processing'`
   - Seller notified to fulfill order

### 7.4 ORDER → FULFILLMENT FLOW

**Step-by-Step:**

1. **Seller Updates Order Status**
   - User: Changes status to `'shipped'` on order detail page
   - Frontend: Calls `handleUpdateStatus()` in `dashboard/orders/[id].jsx`
   - Backend:
     ```sql
     UPDATE orders SET 
       status = 'shipped',
       updated_at = NOW()
     WHERE id = order_id;
     ```
   - **Data Updated:** `orders.status`
   - **Notifications:** Order shipped email to buyer

2. **Seller Creates Shipment (Optional)**
   - User: Fills shipment form
   - Backend:
     ```sql
     INSERT INTO shipments (
       order_id, logistics_partner_id, tracking_number,
       carrier, status, origin, destination
     ) VALUES (...)
     ```
   - **Data Created:** `shipments` record

3. **Buyer Confirms Delivery**
   - User: Clicks "Confirm Delivery" on order detail page
   - Frontend: Calls `handleUpdateStatus('delivered')`
   - Backend:
     ```sql
     UPDATE orders SET status = 'delivered' WHERE id = order_id;
     
     -- Release escrow
     INSERT INTO wallet_transactions (
       order_id, company_id, type, amount, status
     ) VALUES (order_id, seller_company_id, 'escrow_release', total_amount, 'completed')
     ```
   - **Data Updated:** `orders.status`, `wallet_transactions` (escrow release)
   - **Notifications:** Delivery confirmed notification

### 7.5 MESSAGING FLOW

**Step-by-Step:**

1. **User Opens Conversation**
   - User: Clicks "Message" on product/RFQ/order
   - Frontend: Calls `handleOpenConversation()` or `NewMessageDialog`
   - Backend:
     ```sql
     -- Check if conversation exists
     SELECT * FROM conversations WHERE 
       (buyer_company_id = company_id AND seller_company_id = recipient_id)
       OR (buyer_company_id = recipient_id AND seller_company_id = company_id)
     
     -- If not exists, create
     INSERT INTO conversations (
       buyer_company_id, seller_company_id, subject, last_message, last_message_at
     ) VALUES (...)
     ```
   - **Data Created:** `conversations` record (if new)

2. **User Sends Message**
   - User: Types message, clicks "Send"
   - Frontend: Calls `supabase.from('messages').insert()`
   - Backend:
     ```sql
     INSERT INTO messages (
       conversation_id, sender_company_id, receiver_company_id,
       sender_user_email, content, read, related_to, related_type
     ) VALUES (...)
     
     -- Update conversation
     UPDATE conversations SET 
       last_message = content,
       last_message_at = NOW()
     WHERE id = conversation_id;
     ```
   - **Data Created:** `messages` record
   - **Data Updated:** `conversations.last_message`, `conversations.last_message_at`
   - **Notifications:** Sent to receiver (if not viewing conversation)

3. **Receiver Views Message**
   - User: Opens conversation on `/dashboard/messages`
   - Frontend: Marks messages as read
   - Backend:
     ```sql
     UPDATE messages SET read = true 
     WHERE conversation_id = conversation_id 
       AND receiver_company_id = company_id
     ```

### 7.6 POST-ORDER FOLLOW-UP

**Step-by-Step:**

1. **Buyer Leaves Review**
   - User: Fills review form on order detail page (after delivery)
   - Frontend: Calls `createCompanyReview()`
   - Backend:
     ```sql
     INSERT INTO company_reviews (
       reviewer_company_id, reviewed_company_id, order_id,
       rating_overall, rating_quality, rating_communication, rating_shipping,
       comment, verified_purchase
     ) VALUES (...)
     
     -- Update trust score
     UPDATE companies SET trust_score = calculated_score WHERE id = company_id;
     ```
   - **Data Created:** `company_reviews` record
   - **Data Updated:** `companies.trust_score`

2. **Seller Responds to Review (Optional)**
   - User: Adds response to review
   - Backend:
     ```sql
     UPDATE company_reviews SET 
       seller_response = response,
       seller_response_at = NOW()
     WHERE id = review_id;
     ```

---

## 8. NOTIFICATIONS, PERMISSIONS, AND DATA OWNERSHIP

### 8.1 NOTIFICATIONS SYSTEM

**Notification Types:**
- `order` - Order status updates
- `message` - New messages
- `rfq` - New RFQ posted
- `quote` - Quote submitted/received
- `review` - New review
- `payment` - Payment updates
- `onboarding_reminder` - Onboarding incomplete

**Notification Service (`notificationService.js`):**

**Frontend:**
- Notification bell component (`NotificationBell`)
- Real-time subscription via Supabase Realtime
- Mark as read functionality

**Backend:**
```sql
-- Create notification
INSERT INTO notifications (
  user_id, company_id, user_email, title, message, type, link, related_id, read
) VALUES (...)

-- Email notification (if preferences allow)
-- Sent via Resend API (hello@afrikoni.com)
```

**Notification Preferences:**
- Stored in `notification_preferences` table (if exists)
- Default: All notifications enabled
- Email preferences: `order_updates`, `new_messages`, `rfq_responses`, `reviews`, `payments`

**What Can Go Wrong:**
1. **Email service failures** - No retry mechanism
2. **Notification spam** - No rate limiting
3. **Preferences not enforced** - Some notifications ignore preferences
4. **Real-time subscription failures** - No fallback to polling

### 8.2 PERMISSIONS & RLS

**Row Level Security (RLS) Policies:**

**profiles:**
- ✅ SELECT: Users can view own profile
- ✅ INSERT: Users can insert own profile (`auth.uid() = id`)
- ✅ UPDATE: Users can update own profile
- ✅ DELETE: Users can delete own profile

**companies:**
- ✅ SELECT: Public read (anyone can view)
- ✅ INSERT: Users can create (`owner_email = auth user email`)
- ✅ UPDATE: Users can update own company

**products:**
- ✅ SELECT: Public read for active products OR owner can view all
- ✅ INSERT: Authenticated users can create
- ✅ UPDATE: Users can update own products (`supplier_id = company_id`)
- ✅ DELETE: Users can delete own products

**orders:**
- ✅ SELECT: Users can view orders where `buyer_company_id = company_id OR seller_company_id = company_id`
- ✅ INSERT: Authenticated users can create
- ✅ UPDATE: Users can update own orders (buyer or seller)

**rfqs:**
- ✅ SELECT: Public read (anyone can view)
- ✅ INSERT: Authenticated users can create
- ✅ UPDATE: Users can update own RFQs (`buyer_company_id = company_id`)

**quotes:**
- ✅ SELECT: Public read (anyone can view)
- ✅ INSERT: Authenticated users can create
- ✅ UPDATE: Users can update own quotes (`supplier_company_id = company_id`)

**messages:**
- ✅ SELECT: Users can view messages in conversations they participate in
- ✅ INSERT: Authenticated users can create
- ✅ UPDATE: Users can update own messages

**conversations:**
- ✅ SELECT: Users can view conversations where `buyer_company_id = company_id OR seller_company_id = company_id`
- ✅ INSERT: Authenticated users can create
- ✅ UPDATE: Users can update own conversations

**notifications:**
- ✅ SELECT: Users can view notifications where `user_id = auth.uid() OR company_id = company_id OR user_email = email`
- ✅ INSERT: System creates (via service role key)
- ✅ UPDATE: Users can update own notifications (mark as read)

**Critical RLS Issues:**
1. **Service role key exposure** - Some operations may require service role (security risk)
2. **Admin access** - Admin detection via hardcoded email (not scalable)
3. **Company ownership** - Multiple users per company not properly handled

### 8.3 DATA OWNERSHIP

**User Data:**
- Owned by: `auth.uid()`
- Tables: `profiles` (id = auth.uid())

**Company Data:**
- Owned by: Company (identified by `company_id`)
- Tables: `companies`, `products` (supplier_id), `orders` (buyer_company_id/seller_company_id)
- **PROBLEM:** Multiple users per company not well supported

**Order Data:**
- Owned by: Both buyer and seller companies
- Access: Either party can view/update (limited by role)

**RFQ Data:**
- Owned by: Buyer company
- Access: Public read, buyer can update

**Message Data:**
- Owned by: Both companies in conversation
- Access: Either party can view/send

---

## 9. EDGE CASES

### 9.1 INCOMPLETE ONBOARDING

**Current Behavior:**
- ⚠️ **PROBLEM:** User can access dashboard even if `onboarding_completed = false`
- No redirect to onboarding page
- Dashboard may show empty state or errors

**What Should Happen:**
1. Dashboard should check `onboarding_completed`
2. If `false`, redirect to `/onboarding`
3. Prevent access to other protected routes

**Current Code Issue:**
```javascript
// dashboard/index.jsx - MISSING ONBOARDING CHECK
const { user, profile, role } = await getCurrentUserAndRole(...);
// No check for onboarding_completed!
```

### 9.2 ROLE SWITCH

**Current Behavior:**
- ❌ **NOT SUPPORTED** - No UI to change role
- Role locked after signup
- User would need to create new account

**What Should Happen:**
1. Allow role change in settings
2. Update profile role
3. Redirect to appropriate dashboard
4. Handle data migration (if needed)

### 9.3 ACCOUNT SUSPENSION

**Current Behavior:**
- ❌ **NOT IMPLEMENTED** - No account suspension system
- No `suspended` or `banned` flag in profiles
- Admin cannot suspend users

**What Should Happen:**
1. Add `status` field to `profiles` table (`'active'`, `'suspended'`, `'banned'`)
2. Check status on login
3. Show suspension message
4. Prevent access to protected routes

### 9.4 EMAIL VERIFICATION FAILURE

**Current Behavior:**
- ⚠️ Email confirmation can be disabled (security risk)
- If enabled and user doesn't verify, they're stuck
- No resend email functionality visible

**What Should Happen:**
1. Show "Resend verification email" button
2. Track verification attempts
3. Allow admin to manually verify

### 9.5 COMPANY CREATION FAILURE

**Current Behavior:**
- ⚠️ If `getOrCreateCompany()` fails, profile update still succeeds
- User has profile but no company_id
- Dashboard may show errors or empty state

**What Should Happen:**
1. Transaction rollback on failure
2. Show error message to user
3. Allow retry

### 9.6 PAYMENT FAILURE

**Current Behavior:**
- Flutterwave handles payment failures
- Order remains in `'pending'` status
- No automatic retry mechanism

**What Should Happen:**
1. Handle payment callback errors
2. Show error message to user
3. Allow retry payment
4. Cancel order after X days if unpaid

---

## 10. ADMIN OVERSIGHT FLOW

### Admin Detection

**Current Implementation:**
```javascript
// utils/permissions.js
export const isAdmin = (user) => {
  if (!user) return false;
  const email = user.email?.toLowerCase();
  if (email === "youba.thiam@icloud.com") return true; // HARDCODED!
  return user.user_metadata?.role === "admin";
};
```

**CRITICAL PROBLEMS:**
1. **Hardcoded email** - Not scalable
2. **No admin table** - Should use `admin_users` table or `profiles.is_admin`
3. **No admin onboarding** - Admin access granted manually

### Admin Dashboard Routes

**Routes:**
- `/dashboard/admin` - Admin dashboard
- `/dashboard/admin/users` - User management
- `/dashboard/admin/review` - Supplier verification review
- `/dashboard/admin/analytics` - Platform analytics
- `/dashboard/admin/revenue` - Revenue tracking

**Access Control:**
- Protected by `ProtectedRoute` with `requireAdmin={true}`
- Checks `isAdmin(user)` before rendering

### Admin Actions

**1. User Management**
- View all users
- Suspend/ban users (⚠️ NOT IMPLEMENTED)
- View user activity

**2. Supplier Verification**
- Review verification submissions
- Approve/reject suppliers
- Update `companies.verification_status` and `companies.verified`

**3. Order Management**
- View all orders
- Cancel orders
- Refund payments (⚠️ NOT IMPLEMENTED)

**4. Analytics**
- Platform metrics (GMV, orders, users)
- Revenue tracking
- User growth

**What Can Go Wrong:**
1. **Admin access too broad** - No granular permissions
2. **No audit log** - Admin actions not logged
3. **No admin approval workflow** - Single admin decides everything

---

# A. FLOW MAP

## COMPLETE USER JOURNEY MAP

```
┌─────────────────────────────────────────────────────────────┐
│                    FIRST VISIT (PUBLIC)                      │
├─────────────────────────────────────────────────────────────┤
│ 1. Browse Homepage → View Products → Explore Marketplace    │
│ 2. Click "Sign Up" → Signup Form                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      SIGNUP FLOW                             │
├─────────────────────────────────────────────────────────────┤
│ 1. Fill: Name, Email, Password                              │
│ 2. Select Role: Buyer/Seller/Hybrid/Logistics              │
│ 3. Submit → Auth User Created                               │
│ 4. Profile Created (role, onboarding_completed: true)       │
│ 5. IF session exists → Redirect to /dashboard              │
│    IF no session → Email confirmation required              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    ONBOARDING (SKIPPED?)                     │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ PROBLEM: Role already set at signup                     │
│ Step 1: Role Selection (may be skipped)                    │
│ Step 2: Company Information                                 │
│   - Company name, country, phone, etc.                      │
│   - Company created in companies table                      │
│   - Profile updated with company_id                         │
│   - onboarding_completed: true                              │
│   - Redirect to /dashboard                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD ENTRY                           │
├─────────────────────────────────────────────────────────────┤
│ 1. Check Session → If none, redirect to /login             │
│ 2. Fetch Profile & Role                                     │
│ 3. Check Admin → If admin, redirect to /dashboard/admin    │
│ 4. Render Role-Specific Dashboard:                          │
│    - Buyer → BuyerHome                                      │
│    - Seller → SellerHome                                    │
│    - Hybrid → HybridHome                                    │
│    - Logistics → LogisticsHome                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              BUYER WORKFLOW                                  │
├─────────────────────────────────────────────────────────────┤
│ 1. Browse Marketplace → View Products                       │
│ 2. Create RFQ → RFQ Created → Notify Sellers               │
│ 3. View Quotes → Compare Offers                            │
│ 4. Award Quote → Order Created → Escrow Hold               │
│ 5. Pay Order → Flutterwave → Payment Confirmed             │
│ 6. Track Order → Seller Ships → Confirm Delivery           │
│ 7. Leave Review → Trust Score Updated                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              SELLER WORKFLOW                                 │
├─────────────────────────────────────────────────────────────┤
│ 1. Add Product → Product Listed                             │
│ 2. View RFQs → Submit Quote → Notify Buyer                 │
│ 3. Quote Awarded → Order Created → Payment Received        │
│ 4. Fulfill Order → Update Status → Create Shipment         │
│ 5. Order Delivered → Escrow Released → Payment Received    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              CROSS-FLOW: MESSAGING                           │
├─────────────────────────────────────────────────────────────┤
│ 1. User Clicks "Message" → Conversation Created             │
│ 2. Send Message → Message Saved → Notify Receiver          │
│ 3. Receiver Views → Mark as Read                            │
│ 4. Back-and-forth Communication                             │
└─────────────────────────────────────────────────────────────┘
```

---

# B. ROLE-BASED MATRIX

## WHAT EACH ROLE CAN SEE/DO

| Feature | Buyer | Seller | Hybrid | Logistics | Admin |
|---------|-------|--------|--------|-----------|-------|
| **BROWSE** | | | | | |
| View Products | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Suppliers | ✅ | ✅ | ✅ | ✅ | ✅ |
| Search Marketplace | ✅ | ✅ | ✅ | ✅ | ✅ |
| **RFQs** | | | | | |
| Create RFQ | ✅ | ❌ | ✅ (buyer mode) | ❌ | ✅ |
| View All RFQs | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit Quote | ❌ | ✅ | ✅ (seller mode) | ❌ | ✅ |
| Award Quote | ✅ | ❌ | ✅ (buyer mode) | ❌ | ✅ |
| **PRODUCTS** | | | | | |
| Add Product | ❌ | ✅ | ✅ (seller mode) | ❌ | ✅ |
| Edit Own Products | ❌ | ✅ | ✅ (seller mode) | ❌ | ✅ |
| Delete Own Products | ❌ | ✅ | ✅ (seller mode) | ❌ | ✅ |
| **ORDERS** | | | | | |
| Create Order | ✅ | ❌ | ✅ (buyer mode) | ❌ | ✅ |
| View Own Orders | ✅ | ✅ | ✅ | ✅ | ✅ (all) |
| Update Order Status | ✅ (limited) | ✅ (seller side) | ✅ (both) | ✅ (shipment) | ✅ |
| Cancel Order | ✅ | ✅ (before shipped) | ✅ | ❌ | ✅ |
| **PAYMENTS** | | | | | |
| Pay Order | ✅ | ❌ | ✅ (buyer mode) | ❌ | ✅ |
| View Payments | ✅ | ✅ | ✅ | ✅ | ✅ (all) |
| **MESSAGING** | | | | | |
| Start Conversation | ✅ | ✅ | ✅ | ✅ | ✅ |
| Send Messages | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Conversations | ✅ | ✅ | ✅ | ✅ | ✅ (all) |
| **SHIPMENTS** | | | | | |
| Create Shipment | ❌ | ✅ | ✅ (seller mode) | ✅ | ✅ |
| Update Tracking | ❌ | ✅ | ✅ (seller mode) | ✅ | ✅ |
| View Shipments | ✅ (own orders) | ✅ (own orders) | ✅ | ✅ (all) | ✅ (all) |
| **ANALYTICS** | | | | | |
| View Own Analytics | ✅ | ✅ | ✅ | ✅ | ✅ (all) |
| **VERIFICATION** | | | | | |
| Submit Verification | ✅ | ✅ | ✅ | ✅ | ❌ |
| Review Verifications | ❌ | ❌ | ❌ | ❌ | ✅ |
| **ADMIN** | | | | | |
| User Management | ❌ | ❌ | ❌ | ❌ | ✅ |
| Platform Analytics | ❌ | ❌ | ❌ | ❌ | ✅ |
| Revenue Tracking | ❌ | ❌ | ❌ | ❌ | ✅ |
| **NOTIFICATIONS** | | | | | |
| Receive Notifications | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Preferences | ✅ | ✅ | ✅ | ✅ | ✅ |

---

# C. MISSING FLOWS & WEAK POINTS

## 🔴 CRITICAL MISSING FLOWS

### 1. **EMAIL VERIFICATION FLOW**
- ❌ No resend verification email functionality
- ❌ No clear UI for unverified users
- ❌ Users can bypass verification (if disabled)

### 2. **PASSWORD RESET FLOW**
- ⚠️ Route exists (`/forgot-password`) but implementation unclear
- ❌ No password reset email template confirmed
- ❌ No password reset confirmation page

### 3. **ACCOUNT SUSPENSION/BAN FLOW**
- ❌ No suspension system
- ❌ No `status` field in profiles
- ❌ Admin cannot suspend users
- ❌ Suspended users can still log in

### 4. **ROLE SWITCHING FLOW**
- ❌ No UI to change role after signup
- ❌ Role locked forever
- ❌ Users must create new account to switch

### 5. **COMPANY MULTI-USER FLOW**
- ❌ No team member invitation system
- ❌ No `company_team` table usage visible
- ❌ Multiple users per company not supported

### 6. **REFUND/CHARGEBACK FLOW**
- ❌ No refund functionality
- ❌ No dispute resolution workflow
- ❌ No chargeback handling

### 7. **ORDER CANCELLATION FLOW**
- ⚠️ UI exists but logic unclear
- ❌ No cancellation policy enforcement
- ❌ No automatic refund on cancellation

### 8. **PRODUCT REVIEW/REPORTING FLOW**
- ❌ No product reporting system
- ❌ No product moderation
- ❌ No flagging inappropriate products

## 🟡 MODERATE WEAK POINTS

### 1. **ONBOARDING GUARD MISSING**
- Dashboard doesn't check `onboarding_completed`
- Users can access dashboard without completing onboarding

### 2. **DATA REDUNDANCY**
- Company info stored in both `companies` and `profiles` tables
- Maintenance nightmare
- Risk of data inconsistency

### 3. **ERROR HANDLING**
- Many try-catch blocks swallow errors
- No error tracking service (Sentry mentioned but not confirmed)
- User sees generic error messages

### 4. **LOADING STATES**
- Some components lack loading indicators
- No skeleton screens for slow loads
- No timeout handling

### 5. **EMPTY STATES**
- Many pages lack empty state messages
- No CTAs in empty states
- Poor UX when no data

### 6. **VALIDATION**
- Frontend validation only
- No backend validation confirmed
- SQL injection risk if inputs not sanitized (some sanitization exists)

### 7. **AUDIT LOGGING**
- No audit log for admin actions
- No tracking of data changes
- Cannot trace who did what

### 8. **NOTIFICATION PREFERENCES**
- Preferences table may not exist
- Default preferences unclear
- No UI to manage preferences

## 🟢 MINOR WEAK POINTS

### 1. **SEARCH FUNCTIONALITY**
- No search result pagination visible
- No search filters
- No search history

### 2. **PRODUCT IMAGES**
- No image optimization
- No lazy loading confirmed
- No fallback images

### 3. **MOBILE RESPONSIVENESS**
- Some components may not be mobile-optimized
- No mobile-specific flows

### 4. **I18N (INTERNATIONALIZATION)**
- Translation system exists but coverage unclear
- No language switcher visible

### 5. **ANALYTICS**
- No user analytics tracking confirmed
- No conversion tracking
- No A/B testing infrastructure

---

# D. RECOMMENDATIONS

## 🔴 CRITICAL RECOMMENDATIONS (DO IMMEDIATELY)

### 1. **FIX ONBOARDING FLOW**
**Problem:** Role selected at signup, onboarding may be skipped  
**Solution:**
- Remove role selection from signup page
- Move role selection to onboarding Step 1
- Add onboarding guard to dashboard:
  ```javascript
  if (!profile?.onboarding_completed) {
    navigate('/onboarding', { replace: true });
    return;
  }
  ```

### 2. **ADD ACCOUNT SUSPENSION SYSTEM**
**Problem:** No way to suspend/ban users  
**Solution:**
```sql
ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'active' 
  CHECK (status IN ('active', 'suspended', 'banned'));

-- Add RLS policy
CREATE POLICY "Suspended users cannot access"
  ON profiles FOR SELECT
  USING (status != 'suspended' AND status != 'banned');
```
- Check status on login
- Show suspension message
- Prevent access to protected routes

### 3. **FIX EMAIL VERIFICATION**
**Problem:** Email verification can be bypassed  
**Solution:**
- Require email verification before profile creation
- Add "Resend verification email" button
- Show clear UI for unverified users
- Don't set `onboarding_completed: true` until email verified

### 4. **REMOVE DATA REDUNDANCY**
**Problem:** Company info in both `companies` and `profiles`  
**Solution:**
- Remove company fields from `profiles` table
- Use `company_id` foreign key only
- Join `companies` table when company data needed
- Migrate existing data

### 5. **ADD ADMIN SYSTEM**
**Problem:** Admin detection via hardcoded email  
**Solution:**
```sql
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Or create admin_users table
CREATE TABLE admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT CHECK (role IN ('admin', 'moderator', 'support')),
  granted_at TIMESTAMP DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id)
);
```
- Remove hardcoded email check
- Use database flag
- Add admin management UI

## 🟡 HIGH PRIORITY RECOMMENDATIONS (DO SOON)

### 6. **ADD ROLE SWITCHING**
**Solution:**
- Add "Switch Role" in settings
- Allow one role switch per month (prevent abuse)
- Update profile role
- Redirect to appropriate dashboard
- Handle data migration if needed

### 7. **ADD COMPANY MULTI-USER SUPPORT**
**Solution:**
- Implement `company_team` table usage
- Add "Invite Team Member" feature
- Email invitation system
- Role-based permissions per team member
- Primary owner cannot be removed

### 8. **ADD REFUND/DISPUTE SYSTEM**
**Solution:**
- Create `disputes` table (may exist, verify)
- Add refund functionality
- Integrate with Flutterwave refund API
- Admin dispute resolution workflow
- Automatic refund on cancellation (within policy)

### 9. **ADD AUDIT LOGGING**
**Solution:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```
- Log all admin actions
- Log sensitive data changes (orders, payments)
- Admin view of audit logs

### 10. **IMPROVE ERROR HANDLING**
**Solution:**
- Integrate error tracking (Sentry)
- Add error boundaries to all routes
- Show user-friendly error messages
- Log errors server-side
- Add retry mechanisms for transient failures

## 🟢 MEDIUM PRIORITY RECOMMENDATIONS

### 11. **ADD NOTIFICATION PREFERENCES UI**
- Create preferences management page
- Allow users to toggle notification types
- Email vs in-app preferences
- Quiet hours setting

### 12. **IMPROVE LOADING STATES**
- Add skeleton screens everywhere
- Add loading timeouts
- Show progress indicators for long operations
- Optimistic UI updates

### 13. **ADD EMPTY STATES**
- Design empty state components
- Add CTAs in empty states
- Guide users to next actions

### 14. **ADD PRODUCT MODERATION**
- Flag inappropriate products
- Admin review queue
- Auto-hide reported products pending review

### 15. **IMPROVE SEARCH**
- Add pagination
- Add filters (price, category, country, MOQ)
- Add search history
- Add saved searches

## 🔵 LOW PRIORITY RECOMMENDATIONS

### 16. **ADD ANALYTICS TRACKING**
- User behavior tracking
- Conversion funnel tracking
- A/B testing infrastructure

### 17. **OPTIMIZE IMAGES**
- Image compression
- Lazy loading
- WebP format support
- CDN integration

### 18. **IMPROVE MOBILE UX**
- Mobile-specific navigation
- Touch-optimized interactions
- Mobile checkout flow

### 19. **ADD I18N COMPLETE COVERAGE**
- Ensure all text is translatable
- Add language switcher
- Test all languages

### 20. **ADD PERFORMANCE MONITORING**
- Page load time tracking
- API response time monitoring
- Database query optimization
- Caching strategy

---

## 🎯 SUMMARY: TOP 5 CRITICAL ACTIONS

1. **Fix Onboarding Flow** - Remove role from signup, enforce onboarding completion
2. **Add Account Suspension** - Implement status field, prevent suspended user access
3. **Fix Email Verification** - Require verification, add resend functionality
4. **Remove Data Redundancy** - Consolidate company data to single source
5. **Add Admin System** - Replace hardcoded email with database flag

---

**END OF DOCUMENTATION**

