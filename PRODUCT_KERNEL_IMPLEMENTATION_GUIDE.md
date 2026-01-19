# Product Creation Kernel Implementation Guide

**Date:** January 20, 2026  
**Pattern:** Kernel Architecture (based on RFQ flow)  
**Goal:** Centralize product creation logic into service layer

---

## 🎯 Overview

This guide shows how to refactor product creation to use the **Kernel Architecture** pattern, similar to how RFQ creation was refactored. The kernel pattern separates business logic from UI components, making code more maintainable, testable, and consistent.

---

## 📋 Kernel Architecture Pattern

### **What is the Kernel?**

The **Kernel** is a centralized service layer that:
- ✅ Handles all business logic
- ✅ Manages database operations
- ✅ Enforces validation rules
- ✅ Handles errors consistently
- ✅ Provides clean API to UI components

### **RFQ Kernel Example**

**Before (Direct DB in Component):**
```javascript
// ❌ BAD: Business logic in component
const handleSubmit = async () => {
  const companyId = await getOrCreateCompany(supabase, user);
  const { data, error } = await supabase
    .from('rfqs')
    .insert({ title, description, company_id: companyId, ... });
  if (error) throw error;
  navigate('/dashboard/rfqs');
};
```

**After (Kernel Pattern):**
```javascript
// ✅ GOOD: Business logic in service
import { createRFQ } from '@/services/rfqService';

const handleSubmit = async () => {
  const result = await createRFQ({ user, formData });
  if (!result.success) {
    toast.error(result.error);
    return;
  }
  navigate(`/dashboard/rfqs/${result.data.id}`);
};
```

---

## 🔧 Step-by-Step Implementation

### **Step 1: Create `productService.js`**

Create a new service file: `src/services/productService.js`

```javascript
import { supabase } from '@/api/supabaseClient';
import { sanitizeString } from '@/utils/security';
import { checkProductLimit } from '@/utils/subscriptionLimits';
import { autoAssignCategory } from '@/utils/productCategoryIntelligence';

/**
 * Product Service - Kernel Architecture
 * Centralizes all product creation/update logic
 */

/**
 * Create a new product
 * @param {Object} params - Product creation parameters
 * @param {Object} params.user - Authenticated user object
 * @param {Object} params.formData - Product form data
 * @param {string} params.companyId - Company ID (from kernel)
 * @param {boolean} params.publish - Whether to publish immediately
 * @returns {Promise<{success: boolean, data?: Object, error?: string, isMinimalProfile?: boolean}>}
 */
export async function createProduct({ user, formData, companyId, publish = false }) {
  try {
    // ✅ KERNEL: Validate inputs
    if (!user || !user.id) {
      return {
        success: false,
        error: 'User authentication required'
      };
    }

    if (!companyId) {
      return {
        success: false,
        error: 'Company profile required. Please complete your company profile first.'
      };
    }

    // ✅ KERNEL: Check product limit
    const limitInfo = await checkProductLimit(companyId);
    if (!limitInfo.canAdd) {
      return {
        success: false,
        error: limitInfo.message || 'Product limit reached',
        needsUpgrade: limitInfo.needsUpgrade
      };
    }

    // ✅ KERNEL: Validate required fields
    if (!formData.title || !formData.title.trim()) {
      return {
        success: false,
        error: 'Product title is required'
      };
    }

    if (!formData.category_id) {
      // ✅ KERNEL: Auto-assign category if missing
      try {
        const autoCategoryId = await autoAssignCategory(
          supabase,
          formData.title,
          formData.description || formData.short_description || '',
          null
        );
        if (autoCategoryId) {
          formData.category_id = autoCategoryId;
        }
      } catch (error) {
        console.warn('[productService] Auto-category assignment failed:', error);
      }

      // Still require category
      if (!formData.category_id) {
        return {
          success: false,
          error: 'Please select a category'
        };
      }
    }

    // ✅ KERNEL: Validate pricing
    const priceMin = formData.price_min ? parseFloat(formData.price_min) : null;
    const priceMax = formData.price_max ? parseFloat(formData.price_max) : null;
    
    if (!priceMin && !priceMax) {
      return {
        success: false,
        error: 'Please enter at least one price (minimum or maximum)'
      };
    }

    if (priceMin && priceMin <= 0) {
      return {
        success: false,
        error: 'Minimum price must be greater than 0'
      };
    }

    if (priceMax && priceMax <= 0) {
      return {
        success: false,
        error: 'Maximum price must be greater than 0'
      };
    }

    if (priceMin && priceMax && priceMin > priceMax) {
      return {
        success: false,
        error: 'Minimum price cannot be greater than maximum price'
      };
    }

    // ✅ KERNEL: Validate publish requirements
    if (publish) {
      if (!formData.description || !formData.description.trim()) {
        return {
          success: false,
          error: 'Product description is required for publishing'
        };
      }
      if (!formData.images || formData.images.length === 0) {
        return {
          success: false,
          error: 'At least one product image is required for publishing'
        };
      }
    }

    // ✅ KERNEL: Calculate completeness score
    const completenessScore = calculateCompletenessScore(formData);

    // ✅ KERNEL: Calculate price (use price_min if available, otherwise price_max)
    const price = priceMin || priceMax || 0;

    // ✅ KERNEL: Prepare product data
    const productData = {
      company_id: companyId,
      title: sanitizeString(formData.title),
      short_description: sanitizeString(formData.short_description || ''),
      description: sanitizeString(formData.description || ''),
      category_id: formData.category_id,
      subcategory_id: formData.subcategory_id || null,
      country_of_origin: formData.country_of_origin || null,
      min_order_quantity: formData.min_order_quantity ? parseFloat(formData.min_order_quantity) : null,
      moq_unit: formData.moq_unit || 'pieces',
      price: price,
      price_min: priceMin,
      price_max: priceMax,
      currency: formData.currency || 'USD',
      lead_time_min_days: formData.lead_time_min_days ? parseInt(formData.lead_time_min_days) : null,
      lead_time_max_days: formData.lead_time_max_days ? parseInt(formData.lead_time_max_days) : null,
      supply_ability_qty: formData.supply_ability_qty ? parseFloat(formData.supply_ability_qty) : null,
      supply_ability_unit: formData.supply_ability_unit || null,
      packaging_details: sanitizeString(formData.packaging_details || ''),
      shipping_terms: formData.shipping_terms || [],
      certifications: formData.certifications || [],
      specifications: formData.specifications || {},
      is_standardized: formData.is_standardized || false,
      completeness_score: completenessScore,
      status: publish ? 'active' : (formData.status || 'draft'),
      featured: formData.featured || false,
      published_at: publish ? new Date().toISOString() : null,
      views: 0,
      inquiries: 0
    };

    // ✅ KERNEL: Insert product
    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert(productData)
      .select('id')
      .single();

    if (insertError) {
      console.error('[productService] Product insert error:', insertError);
      
      // ✅ KERNEL: Handle RLS errors gracefully
      const isRLSError = insertError.code === '42501' || 
                        insertError.code === 'PGRST301' ||
                        insertError.message?.includes('permission denied') ||
                        insertError.message?.includes('row-level security') ||
                        insertError.status === 403;
      
      if (isRLSError) {
        return {
          success: false,
          error: 'Permission denied. Please ensure you are logged in and have permission to create products. If this persists, please contact support.'
        };
      }

      return {
        success: false,
        error: insertError.message || 'Failed to create product. Please try again.'
      };
    }

    if (!newProduct || !newProduct.id) {
      return {
        success: false,
        error: 'Product creation failed. No product ID returned.'
      };
    }

    // ✅ KERNEL: Save images to product_images table
    let imagesSaved = false;
    if (formData.images && formData.images.length > 0) {
      try {
        const imageRecords = formData.images.map((img, index) => ({
          product_id: newProduct.id,
          url: typeof img === 'string' ? img : (img.url || img),
          alt_text: typeof img === 'string' ? formData.title : (img.alt_text || formData.title),
          is_primary: typeof img === 'object' ? (img.is_primary || index === 0) : (index === 0),
          sort_order: typeof img === 'object' ? (img.sort_order !== undefined ? img.sort_order : index) : index
        }));

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imageRecords);

        if (imagesError) {
          console.error('[productService] Failed to save product images:', imagesError);
          // Don't fail the whole operation - product is saved, images can be added later
        } else {
          imagesSaved = true;
        }
      } catch (imageError) {
        console.error('[productService] Image save error:', imageError);
        // Product is saved, images can be added later
      }
    }

    // ✅ KERNEL: Return success with product data
    return {
      success: true,
      data: {
        id: newProduct.id,
        ...productData
      },
      imagesSaved: imagesSaved
    };

  } catch (error) {
    console.error('[productService] Unexpected error creating product:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * Update an existing product
 * @param {Object} params - Product update parameters
 * @param {Object} params.user - Authenticated user object
 * @param {string} params.productId - Product ID to update
 * @param {Object} params.formData - Updated product form data
 * @param {string} params.companyId - Company ID (from kernel)
 * @param {boolean} params.publish - Whether to publish
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function updateProduct({ user, productId, formData, companyId, publish = false }) {
  try {
    // ✅ KERNEL: Validate inputs
    if (!user || !user.id) {
      return {
        success: false,
        error: 'User authentication required'
      };
    }

    if (!productId) {
      return {
        success: false,
        error: 'Product ID is required'
      };
    }

    if (!companyId) {
      return {
        success: false,
        error: 'Company profile required'
      };
    }

    // ✅ KERNEL: Verify product ownership
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id, company_id')
      .eq('id', productId)
      .single();

    if (fetchError || !existingProduct) {
      return {
        success: false,
        error: 'Product not found'
      };
    }

    if (existingProduct.company_id !== companyId) {
      return {
        success: false,
        error: 'You do not have permission to update this product'
      };
    }

    // ✅ KERNEL: Validate required fields (same as create)
    if (!formData.title || !formData.title.trim()) {
      return {
        success: false,
        error: 'Product title is required'
      };
    }

    // ✅ KERNEL: Calculate completeness score
    const completenessScore = calculateCompletenessScore(formData);

    // ✅ KERNEL: Calculate price
    const priceMin = formData.price_min ? parseFloat(formData.price_min) : null;
    const priceMax = formData.price_max ? parseFloat(formData.price_max) : null;
    const price = priceMin || priceMax || 0;

    // ✅ KERNEL: Prepare update data
    const updateData = {
      title: sanitizeString(formData.title),
      short_description: sanitizeString(formData.short_description || ''),
      description: sanitizeString(formData.description || ''),
      category_id: formData.category_id || null,
      subcategory_id: formData.subcategory_id || null,
      country_of_origin: formData.country_of_origin || null,
      min_order_quantity: formData.min_order_quantity ? parseFloat(formData.min_order_quantity) : null,
      moq_unit: formData.moq_unit || 'pieces',
      price: price,
      price_min: priceMin,
      price_max: priceMax,
      currency: formData.currency || 'USD',
      lead_time_min_days: formData.lead_time_min_days ? parseInt(formData.lead_time_min_days) : null,
      lead_time_max_days: formData.lead_time_max_days ? parseInt(formData.lead_time_max_days) : null,
      supply_ability_qty: formData.supply_ability_qty ? parseFloat(formData.supply_ability_qty) : null,
      supply_ability_unit: formData.supply_ability_unit || null,
      packaging_details: sanitizeString(formData.packaging_details || ''),
      shipping_terms: formData.shipping_terms || [],
      certifications: formData.certifications || [],
      specifications: formData.specifications || {},
      is_standardized: formData.is_standardized || false,
      completeness_score: completenessScore,
      status: publish ? 'active' : (formData.status || 'draft'),
      featured: formData.featured || false,
      published_at: publish ? new Date().toISOString() : null
    };

    // ✅ KERNEL: Update product
    const { error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId);

    if (updateError) {
      console.error('[productService] Product update error:', updateError);
      return {
        success: false,
        error: updateError.message || 'Failed to update product. Please try again.'
      };
    }

    // ✅ KERNEL: Update images (delete old, insert new)
    if (formData.images && formData.images.length > 0) {
      try {
        // Delete existing images
        await supabase
          .from('product_images')
          .delete()
          .eq('product_id', productId);

        // Insert new images
        const imageRecords = formData.images.map((img, index) => ({
          product_id: productId,
          url: typeof img === 'string' ? img : (img.url || img),
          alt_text: typeof img === 'string' ? formData.title : (img.alt_text || formData.title),
          is_primary: typeof img === 'object' ? (img.is_primary || index === 0) : (index === 0),
          sort_order: typeof img === 'object' ? (img.sort_order !== undefined ? img.sort_order : index) : index
        }));

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imageRecords);

        if (imagesError) {
          console.error('[productService] Failed to update product images:', imagesError);
          // Product is updated, images can be fixed later
        }
      } catch (imageError) {
        console.error('[productService] Image update error:', imageError);
      }
    }

    return {
      success: true,
      data: {
        id: productId,
        ...updateData
      }
    };

  } catch (error) {
    console.error('[productService] Unexpected error updating product:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * Helper: Calculate product completeness score
 * @param {Object} formData - Product form data
 * @returns {number} Completeness score (0-100)
 */
function calculateCompletenessScore(formData) {
  let score = 0;
  if (formData.description && formData.description.trim().length > 100) score += 25;
  if (formData.images && formData.images.length > 0) score += 25;
  if (formData.min_order_quantity && parseFloat(formData.min_order_quantity) > 0) score += 15;
  if (formData.price_min || formData.price_max) score += 15;
  if (formData.specifications && Object.keys(formData.specifications || {}).length > 0) score += 10;
  if (formData.certifications && formData.certifications.length > 0) score += 10;
  return Math.min(score, 100);
}
```

---

### **Step 2: Refactor Main Product Form**

Update `src/pages/dashboard/products/new.jsx`:

**Before:**
```javascript
const handleSave = async (publish = false) => {
  try {
    // Check product limit
    const limitInfo = await checkProductLimit(companyId);
    if (!limitInfo.canAdd) {
      toast.error(limitInfo.message);
      return;
    }

    // Validate fields
    if (!formData.title) {
      toast.error('Product title is required');
      return;
    }

    // ... 100+ lines of validation and business logic ...

    // Insert product
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select('id')
      .single();
    
    if (error) throw error;

    // Insert images
    await supabase.from('product_images').insert(imageRecords);

    toast.success('Product saved');
    navigate('/dashboard/products');
  } catch (error) {
    toast.error('Failed to save product');
  }
};
```

**After:**
```javascript
import { createProduct, updateProduct } from '@/services/productService';

const handleSave = async (publish = false) => {
  setIsSaving(true);
  
  try {
    // ✅ KERNEL ALIGNMENT: Delegate all business logic to productService
    const result = productId
      ? await updateProduct({
          user,
          productId,
          formData,
          companyId: profileCompanyId,
          publish
        })
      : await createProduct({
          user,
          formData,
          companyId: profileCompanyId,
          publish
        });

    if (!result.success) {
      // ✅ KERNEL ALIGNMENT: Service returns clean error messages
      toast.error(result.error || 'Failed to save product. Please try again.');
      
      // Handle upgrade prompt if needed
      if (result.needsUpgrade) {
        setShowLimitGuard(true);
      }
      
      return;
    }

    // ✅ SUCCESS: Show success message
    toast.success(publish ? 'Product published successfully!' : 'Product saved as draft');
    
    // ✅ KERNEL ALIGNMENT: Small delay before navigation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // ✅ NAVIGATION: Redirect to products list
    navigate('/dashboard/products');
    
  } catch (error) {
    // ✅ CRITICAL FIX: Catch all errors, show toast, and log for debugging
    console.error('[ProductForm] Error saving product:', error);
    toast.error(`Failed to save product: ${error.message || 'Please try again'}`);
  } finally {
    // ✅ STATE MANAGEMENT FIX: Always reset loading state
    setIsSaving(false);
  }
};
```

**Key Changes:**
- ✅ Removed all business logic from component
- ✅ Removed direct database operations
- ✅ Removed validation logic (moved to service)
- ✅ Component now only handles UI concerns
- ✅ Clean error handling
- ✅ Proper state management (finally block)

---

### **Step 3: Consolidate Legacy Forms**

Update legacy product creation pages to redirect to main form:

**`src/pages/addproduct.jsx`:**
```javascript
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Legacy Product Creation Page - Redirect to Centralized Dashboard Flow
 * 
 * This page has been deprecated in favor of the centralized product creation
 * flow at /dashboard/products/new which uses the Kernel Architecture.
 * 
 * All product creation logic has been moved to:
 * - Service Layer: src/services/productService.js
 * - UI Component: src/pages/dashboard/products/new.jsx
 */

export default function AddProduct() {
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ KERNEL ALIGNMENT: Redirect to centralized dashboard product creation
    navigate('/dashboard/products/new', { replace: true });
  }, [navigate]);

  // Show minimal loading state during redirect
  return (
    <div className="min-h-screen bg-afrikoni-offwhite flex items-center justify-center">
      <div className="text-center">
        <p className="text-afrikoni-deep">Redirecting to product creation...</p>
      </div>
    </div>
  );
}
```

**Apply same pattern to:**
- `src/pages/addproduct-simple.jsx`
- `src/pages/addproduct-smart.jsx`
- `src/pages/addproduct-alibaba.jsx`

---

### **Step 4: Update Route References**

Update `src/utils/index.js`:

**Before:**
```javascript
'AddProduct': '/products/add',
```

**After:**
```javascript
'AddProduct': '/dashboard/products/new',
```

Update other files that reference `/products/add`:
- `src/pages/dashboard/sales.jsx` (Line 325)
- `src/components/shared/ui/EmptyState.jsx` (Line 44)

---

### **Step 5: Add Route Redirects (Optional)**

Add redirects in `src/App.jsx`:

```javascript
// Legacy product creation routes - redirect to main form
<Route path="/products/add" element={<Navigate to="/dashboard/products/new" replace />} />
<Route path="/products/add-simple" element={<Navigate to="/dashboard/products/new" replace />} />
<Route path="/products/add-smart" element={<Navigate to="/dashboard/products/new" replace />} />
<Route path="/products/add-alibaba" element={<Navigate to="/dashboard/products/new" replace />} />
```

---

## ✅ Benefits of Kernel Architecture

### **1. Separation of Concerns**
- ✅ UI components handle presentation only
- ✅ Business logic centralized in service
- ✅ Easier to test and maintain

### **2. Consistency**
- ✅ Single source of truth for validation
- ✅ Consistent error handling
- ✅ Uniform data transformation

### **3. Reusability**
- ✅ Service can be used by multiple components
- ✅ API endpoints can use same service
- ✅ Mobile apps can use same logic

### **4. Maintainability**
- ✅ Changes to business logic in one place
- ✅ Easier to add features (e.g., audit logging)
- ✅ Easier to debug issues

### **5. Testability**
- ✅ Service functions can be unit tested
- ✅ Components can be tested with mocked service
- ✅ Integration tests easier to write

---

## 🔄 Migration Checklist

- [ ] Create `src/services/productService.js`
- [ ] Implement `createProduct()` function
- [ ] Implement `updateProduct()` function
- [ ] Add `calculateCompletenessScore()` helper
- [ ] Refactor `src/pages/dashboard/products/new.jsx`
- [ ] Remove business logic from component
- [ ] Update error handling
- [ ] Update state management (finally blocks)
- [ ] Replace legacy forms with redirects
- [ ] Update route references in `src/utils/index.js`
- [ ] Update route references in other files
- [ ] Add route redirects in `App.jsx` (optional)
- [ ] Test product creation flow
- [ ] Test product update flow
- [ ] Test error scenarios
- [ ] Test product limit checking
- [ ] Test image upload
- [ ] Verify RLS policies work correctly

---

## 📊 Before vs After Comparison

| Aspect | Before | After |
|--------|--------|-------|
| **Business Logic** | In component (100+ lines) | In service (centralized) |
| **Validation** | Scattered in component | Centralized in service |
| **Error Handling** | Inconsistent | Consistent |
| **Database Ops** | Direct in component | In service layer |
| **Testability** | Hard (component tests) | Easy (service tests) |
| **Reusability** | None | High (multiple consumers) |
| **Maintainability** | Low (duplicated code) | High (single source) |

---

## 🎯 Next Steps

1. **Implement `productService.js`** (Step 1)
2. **Refactor main form** (Step 2)
3. **Consolidate legacy forms** (Step 3)
4. **Update route references** (Step 4)
5. **Test thoroughly** (Step 5)

---

**This kernel pattern aligns product creation with RFQ creation, creating a consistent, maintainable architecture across the platform.**
