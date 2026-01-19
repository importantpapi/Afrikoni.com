# Kernel Alignment & RFQ Logic Cleanup - Complete

**Date:** January 20, 2026  
**Status:** ✅ Complete

## Overview

Refactored RFQ creation flow to follow the "Kernel Architecture" by removing business logic from UI components and consolidating it into the service layer (`rfqService.js`).

---

## ✅ Changes Made

### 1. Created RFQ Service (`src/services/rfqService.js`)

**New Service Layer:**
- `createRFQ()` - Main RFQ creation method (status: `'open'`)
- `createRFQInReview()` - Mobile wizard method (status: `'in_review'`)

**Service Responsibilities:**
- ✅ Company ID resolution (`getOrCreateCompany`)
- ✅ Status enforcement (`'open'` for dashboard, `'in_review'` for mobile)
- ✅ `buyer_user_id` appending
- ✅ Data sanitization and validation
- ✅ Database insertion
- ✅ Notification creation (non-blocking)
- ✅ Clean error handling with user-friendly messages

**Key Features:**
- Business logic centralized in service layer
- Frontend only sends user-inputted fields
- Service handles all derived fields (status, buyer_company_id, buyer_user_id, unit_type)
- Returns clean error objects for frontend display

---

### 2. Refactored Dashboard RFQ Creation (`src/pages/dashboard/rfqs/new.jsx`)

**Removed:**
- ❌ Manual `getOrCreateCompany` import and call
- ❌ Business logic validation (moved to service)
- ❌ Status setting (`status: 'open'`)
- ❌ `buyer_company_id` setting
- ❌ `unit_type` setting
- ❌ Direct database insert
- ❌ Notification creation logic

**Added:**
- ✅ `createRFQ` import from `@/services/rfqService`
- ✅ Service call with user-inputted fields only
- ✅ Clean error handling from service response

**Payload Cleanup:**
```javascript
// ✅ BEFORE: Frontend set business logic fields
const rfqData = {
  title: sanitizeString(formData.title),
  // ... user fields ...
  status: 'open', // ❌ Business logic in UI
  buyer_company_id: companyId || null, // ❌ Business logic in UI
  unit_type: sanitizeString(formData.unit || 'pieces') // ❌ Business logic in UI
};

// ✅ AFTER: Frontend only sends user-inputted fields
const result = await createRFQ({
  user,
  formData: {
    title: formData.title,
    description: formData.description,
    category_id: formData.category_id,
    quantity: formData.quantity,
    unit: formData.unit,
    target_price: formData.target_price,
    delivery_location: formData.delivery_location,
    target_country: formData.target_country,
    target_city: formData.target_city,
    closing_date: formData.closing_date,
    attachments: formData.attachments
    // ✅ No status, buyer_company_id, unit_type - Kernel sets these
  }
});
```

**Error Handling:**
- ✅ Service returns `{success: boolean, data?: Object, error?: string}`
- ✅ Frontend displays service error messages
- ✅ Finally blocks preserved (kill-switch pattern)

---

### 3. Refactored Mobile Wizard (`src/pages/rfq-mobile-wizard.jsx`)

**Removed:**
- ❌ Manual `getOrCreateCompany` import and call
- ❌ Business logic validation
- ❌ Status setting (`status: 'in_review'`)
- ❌ `buyer_company_id` setting
- ❌ Direct database insert

**Added:**
- ✅ `createRFQInReview` import from `@/services/rfqService`
- ✅ Service call with user-inputted fields only
- ✅ Options parameter for `verified_only` and `afrikoni_managed`

**Payload Cleanup:**
```javascript
// ✅ BEFORE: Frontend set business logic fields
const rfqData = {
  title: sanitizeString(formData.title),
  // ... user fields ...
  status: 'in_review', // ❌ Business logic in UI
  buyer_company_id: companyId || null // ❌ Business logic in UI
};

// ✅ AFTER: Frontend only sends user-inputted fields
const result = await createRFQInReview({
  user,
  formData: {
    title: formData.title,
    description: formData.description || formData.title,
    category_id: formData.category_id,
    quantity: formData.quantity,
    unit: formData.unit,
    target_price: formData.target_price,
    delivery_location: formData.delivery_location,
    delivery_deadline: formData.delivery_deadline,
    attachments: formData.attachments
    // ✅ No status, buyer_company_id - Kernel sets these
  },
  options: {
    verified_only: formData.verified_only ?? true,
    afrikoni_managed: formData.afrikoni_managed ?? true
  }
});
```

**Conversation Creation:**
- ✅ Still handled in frontend (UI-specific concern)
- ✅ Uses `companyId` from service response (`newRFQ.buyer_company_id`)

---

## 🎯 Architecture Benefits

### Separation of Concerns

**Before:**
- UI components handled business logic
- Company resolution in frontend
- Status management scattered
- Validation duplicated

**After:**
- UI components handle UI concerns only
- Business logic centralized in service layer
- Single source of truth for RFQ creation
- Consistent validation and error handling

### Maintainability

**Before:**
- Changes to RFQ creation logic required updates in multiple files
- Business logic scattered across components
- Difficult to test business logic

**After:**
- Changes to RFQ creation logic in one place (`rfqService.js`)
- Business logic isolated and testable
- Easier to add new RFQ creation flows

### Error Handling

**Before:**
- Inconsistent error messages
- Business logic errors mixed with UI errors
- Difficult to debug

**After:**
- Consistent error messages from service
- Clear separation of business vs UI errors
- Service returns clean error objects

---

## 📋 Service API

### `createRFQ({ user, formData })`

**Purpose:** Create RFQ with `'open'` status (dashboard flow)

**Parameters:**
- `user` - Authenticated user object (must have `id` and `email`)
- `formData` - User-inputted form data:
  - `title` (required)
  - `description` (required)
  - `quantity` (required)
  - `category_id` (optional)
  - `unit` (optional, defaults to 'pieces')
  - `target_price` (optional)
  - `delivery_location` (optional)
  - `target_country` (optional)
  - `target_city` (optional)
  - `closing_date` (optional, Date object)
  - `attachments` (optional, array of URLs)

**Returns:**
```javascript
{
  success: boolean,
  data?: {
    id: string,
    title: string,
    // ... RFQ object
  },
  error?: string // User-friendly error message
}
```

**Business Logic Handled:**
- Company ID resolution
- Status set to `'open'`
- `buyer_user_id` appended
- `unit_type` derived from `unit`
- Data sanitization
- Validation
- Database insertion
- Notification creation

---

### `createRFQInReview({ user, formData, options })`

**Purpose:** Create RFQ with `'in_review'` status (mobile wizard flow)

**Parameters:**
- `user` - Authenticated user object
- `formData` - User-inputted form data (same as `createRFQ`)
- `options` - Additional options:
  - `verified_only` (boolean, defaults to `true`)
  - `afrikoni_managed` (boolean, defaults to `true`)

**Returns:**
```javascript
{
  success: boolean,
  data?: RFQ object,
  error?: string
}
```

**Business Logic Handled:**
- Company ID resolution
- Status set to `'in_review'`
- `buyer_user_id` appended
- Data sanitization
- Validation
- Database insertion

---

## 🔍 Code Examples

### Dashboard RFQ Creation (Before)

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // ❌ Business logic in UI
  const { getOrCreateCompany } = await import('@/utils/companyHelper');
  const companyId = await getOrCreateCompany(supabase, user);
  
  // ❌ Business logic fields set in UI
  const rfqData = {
    title: sanitizeString(formData.title),
    // ... user fields ...
    status: 'open', // ❌ Should be in service
    buyer_company_id: companyId || null, // ❌ Should be in service
    unit_type: sanitizeString(formData.unit || 'pieces') // ❌ Should be in service
  };

  // ❌ Direct database insert in UI
  const { data: newRFQ, error } = await supabase.from('rfqs').insert(rfqData).select().single();
  
  // ❌ Notification logic in UI
  // ...
};
```

### Dashboard RFQ Creation (After)

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // ✅ UI only validates UI concerns
  if (!formData.title || !formData.description || !formData.quantity) {
    toast.error('Please fill in all required fields');
    return;
  }
  
  setIsLoading(true);
  try {
    // ✅ Delegate all business logic to service
    const result = await createRFQ({
      user,
      formData: {
        // ✅ Only user-inputted fields
        title: formData.title,
        description: formData.description,
        category_id: formData.category_id,
        quantity: formData.quantity,
        unit: formData.unit,
        target_price: formData.target_price,
        delivery_location: formData.delivery_location,
        target_country: formData.target_country,
        target_city: formData.target_city,
        closing_date: formData.closing_date,
        attachments: formData.attachments
      }
    });

    if (!result.success) {
      // ✅ Service returns clean error messages
      toast.error(result.error || 'Failed to create RFQ. Please try again.');
      return;
    }

    toast.success('RFQ created successfully!');
    navigate(`/dashboard/rfqs/${result.data.id}`);
  } catch (error) {
    console.error('[CreateRFQ] Error creating RFQ:', error);
    toast.error(`Failed to create RFQ: ${error.message || 'Please try again'}`);
  } finally {
    // ✅ Kill-switch preserved
    setIsLoading(false);
    setIsLoadingCities(false);
  }
};
```

---

## ✅ Testing Checklist

- [x] Dashboard RFQ creation uses service
- [x] Mobile wizard RFQ creation uses service
- [x] Company ID resolution moved to service
- [x] Status enforcement in service
- [x] `buyer_user_id` appended by service
- [x] Error handling returns clean messages
- [x] Finally blocks preserved (kill-switch)
- [x] No business logic in UI components
- [x] Service handles all derived fields

---

## 🚀 Next Steps

### Recommended Improvements

1. **Consolidate Status**
   - Standardize mobile wizard to use `'open'` status
   - Remove `createRFQInReview` method
   - Use single `createRFQ` method

2. **Add Service Tests**
   - Unit tests for `createRFQ`
   - Test company resolution
   - Test error handling
   - Test validation

3. **Refactor Other Creation Flows**
   - `src/pages/createrfq.jsx`
   - `src/pages/rfq/create.jsx`
   - Use same service pattern

4. **Add Service Methods**
   - `updateRFQ()` - Update RFQ
   - `deleteRFQ()` - Delete RFQ
   - `getRFQ()` - Get RFQ by ID
   - `listRFQs()` - List RFQs with filters

---

## 📝 Summary

✅ **Completed:**
- Created `rfqService.js` with centralized business logic
- Refactored dashboard RFQ creation to use service
- Refactored mobile wizard to use service
- Removed `getOrCreateCompany` leakage from UI
- Cleaned up payloads to only include user-inputted fields
- Preserved error handling and kill-switch patterns

✅ **Architecture:**
- UI components handle UI concerns only
- Service layer handles all business logic
- Clear separation of concerns
- Single source of truth for RFQ creation

✅ **Benefits:**
- Easier to maintain
- Easier to test
- Consistent error handling
- Reusable service methods

---

**End of Kernel Alignment Refactor**
