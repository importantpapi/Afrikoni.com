# RFQ Schema Alignment Fixes - Complete Summary

**Date:** January 20, 2026  
**Status:** ✅ Complete

## Overview

This document summarizes all schema alignment fixes applied to ensure the RFQ form data correctly maps to the database schema.

---

## ✅ Fix 1: Data Mapping - target_country and target_city

### Issue
Need to ensure form data is saved directly to `target_country` and `target_city` columns in `public.rfqs` table.

### Solution
Updated `handleSubmit` to explicitly map these fields:

```javascript
const rfqData = {
  // ... other fields ...
  // ✅ FIX: Save target_country and target_city directly to database columns
  target_country: sanitizeString(formData.target_country || ''),
  target_city: sanitizeString(formData.target_city || ''),
  // ... rest of fields ...
};
```

**Key Points:**
- ✅ `target_country` - Saved directly from `formData.target_country`
- ✅ `target_city` - Saved directly from `formData.target_city`
- ✅ Both sanitized before saving
- ✅ Empty strings handled gracefully

**File Modified:**
- `src/pages/dashboard/rfqs/new.jsx` (Lines 406-408)

---

## ✅ Fix 2: Status Check - 'open' (lowercase)

### Issue
Database has strict check constraint requiring status to be exactly 'open' (lowercase).

### Solution
Ensured status is exactly 'open' (lowercase):

```javascript
const rfqData = {
  // ... other fields ...
  // ✅ FIX: Ensure status is exactly 'open' (lowercase) - database has strict check constraint
  status: 'open',
  // ... rest of fields ...
};
```

**Key Points:**
- ✅ Hardcoded as `'open'` (lowercase string literal)
- ✅ No dynamic status assignment
- ✅ Matches database check constraint

**File Modified:**
- `src/pages/dashboard/rfqs/new.jsx` (Line 415)

---

## ✅ Fix 3: Attachments - Array of Strings (text[])

### Issue
Attachments must be sent as array of strings matching `text[]` type in schema.

### Solution
Added validation to ensure attachments is always an array of strings:

```javascript
const rfqData = {
  // ... other fields ...
  // ✅ FIX: Ensure attachments is sent as array of strings (text[] type in schema)
  attachments: Array.isArray(formData.attachments) 
    ? formData.attachments.filter(url => typeof url === 'string' && url.trim() !== '')
    : [],
  // ... rest of fields ...
};
```

**Key Points:**
- ✅ Validates `Array.isArray()` before processing
- ✅ Filters out non-string values
- ✅ Filters out empty strings
- ✅ Defaults to empty array if not an array

**File Modified:**
- `src/pages/dashboard/rfqs/new.jsx` (Lines 410-413)

---

## ✅ Fix 4: Category Mapping

### Issue
Category dropdown should use `cat.id` for value and `cat.name` for label. When displaying selected value, find the name in categories array so user doesn't see UUID code.

### Solution
Already implemented correctly:

```javascript
<Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
  <SelectTrigger>
    {/* ✅ SCHEMA ALIGNMENT FIX: Category mapping - use cat.id for value, cat.name for label
        When displaying selected value, find the name in categories array so user doesn't see UUID code */}
    <SelectValue 
      placeholder="Select category"
      displayValue={formData.category_id && categories.length > 0 
        ? categories.find(cat => cat.id === formData.category_id)?.name 
        : undefined}
    />
  </SelectTrigger>
  <SelectContent>
    {categories.map(cat => (
      <SelectItem key={cat.id} value={cat.id}>
        {/* ✅ SCHEMA ALIGNMENT FIX: Use cat.id for value (UUID), cat.name for label (display) */}
        {cat.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Key Points:**
- ✅ `value={cat.id}` - Stores UUID in form data
- ✅ `{cat.name}` - Displays readable name in dropdown
- ✅ `displayValue` prop - Shows selected category name (not UUID)
- ✅ Safe lookup with `categories.find()` and optional chaining

**File Modified:**
- `src/pages/dashboard/rfqs/new.jsx` (Lines 597-612)

---

## ✅ Fix 5: Loading States - Try/Catch/Finally

### Issue
Need to wrap submit logic in try/catch/finally block. In finally block, set both `setIsLoading(false)` and `setIsLoadingCities(false)` to ensure UI never stays stuck.

### Solution
Enhanced error handling with comprehensive finally block:

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // ... validation logic ...
  
  setIsLoading(true);
  try {
    // ... RFQ creation logic ...
    
    toast.success('RFQ created successfully!');
    navigate(`/dashboard/rfqs/${newRFQ.id}`);
  } catch (error) {
    // ✅ CRITICAL FIX: Catch all errors, show toast, and immediately set loading to false
    console.error('[CreateRFQ] Error creating RFQ:', error);
    toast.error(`Failed to create RFQ: ${error.message || 'Please try again'}`);
    setIsLoading(false); // ✅ CRITICAL: Set loading to false so button becomes clickable again
    setIsLoadingCities(false); // ✅ CRITICAL: Also reset city loading state
  } finally {
    // ✅ SCHEMA ALIGNMENT FIX: Wrap submit logic in try/catch/finally block
    // In finally block, set both setIsLoading(false) and setIsLoadingCities(false)
    // This ensures the UI never stays stuck in a loading state if a database error occurs
    setIsLoading(false);
    setIsLoadingCities(false);
  }
};
```

**Key Points:**
- ✅ **Finally block is the "Safety Valve"** - Always executes
- ✅ `setIsLoading(false)` in finally - Guaranteed cleanup
- ✅ `setIsLoadingCities(false)` in finally - Also reset city loading
- ✅ Both also set in catch block - Immediate recovery
- ✅ Prevents UI from staying stuck in loading state

**File Modified:**
- `src/pages/dashboard/rfqs/new.jsx` (Lines 390-470)

---

## 📋 Complete RFQ Data Schema Mapping

### Database Columns → Form Data Mapping

```javascript
{
  title: sanitizeString(formData.title),                    // TEXT
  description: sanitizeString(formData.description),        // TEXT
  category_id: formData.category_id || null,                // UUID (nullable)
  quantity: quantity,                                       // NUMERIC
  unit: sanitizeString(formData.unit || 'pieces'),          // TEXT
  unit_type: sanitizeString(formData.unit || 'pieces'),    // TEXT
  target_price: targetPrice,                                // NUMERIC (nullable)
  delivery_location: sanitizeString(formData.delivery_location || ''), // TEXT
  target_country: sanitizeString(formData.target_country || ''),       // TEXT ✅
  target_city: sanitizeString(formData.target_city || ''),             // TEXT ✅
  expires_at: formData.closing_date ? format(...) : null,  // TIMESTAMPTZ (nullable)
  attachments: Array.isArray(...) ? [...] : [],            // text[] ✅
  status: 'open',                                           // TEXT (check constraint) ✅
  buyer_company_id: companyId || null                      // UUID (nullable)
}
```

---

## 🧪 Testing Checklist

- [x] target_country saved to database column
- [x] target_city saved to database column
- [x] status is exactly 'open' (lowercase)
- [x] attachments is array of strings
- [x] attachments filters out non-strings
- [x] attachments filters out empty strings
- [x] Category dropdown shows names (not UUIDs)
- [x] Category selection stores UUID correctly
- [x] Loading states reset in finally block
- [x] Both setIsLoading and setIsLoadingCities reset
- [x] UI never stays stuck in loading state

---

## 🔍 Schema Validation

### Attachments Validation:
```javascript
// ✅ Valid: Array of strings
attachments: ['https://example.com/file1.jpg', 'https://example.com/file2.pdf']

// ✅ Valid: Empty array
attachments: []

// ❌ Invalid: Non-array (converted to empty array)
attachments: null → []

// ❌ Invalid: Array with non-strings (filtered out)
attachments: ['url1', 123, null, ''] → ['url1']
```

### Status Validation:
```javascript
// ✅ Valid: Exactly 'open' (lowercase)
status: 'open'

// ❌ Invalid: Any other value
status: 'Open' → Database constraint violation
status: 'OPEN' → Database constraint violation
status: 'closed' → Database constraint violation
```

---

## ✅ Summary

All schema alignment fixes have been implemented:

1. ✅ **Data Mapping** - target_country and target_city saved directly to database columns
2. ✅ **Status Check** - Exactly 'open' (lowercase) to match database constraint
3. ✅ **Attachments** - Array of strings (text[]) with validation
4. ✅ **Category Mapping** - cat.id for value, cat.name for label and display
5. ✅ **Loading States** - Try/catch/finally with both loading states reset

The RFQ form now correctly aligns with the database schema and provides robust error handling to prevent UI deadlocks.
