/**
 * Centralized Validation Utilities
 * 
 * Provides validation functions for:
 * - Email addresses
 * - Phone numbers
 * - URLs
 * - Numeric values
 * - Required fields
 * - Form validation
 */

/**
 * Validate email format
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate phone number (supports international format)
 */
export function isValidPhone(phone, country = null) {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Basic validation: starts with + and has 10-15 digits
  const phoneRegex = /^\+?[1-9]\d{9,14}$/;
  
  return phoneRegex.test(cleaned);
}

/**
 * Validate URL format
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate numeric value
 */
export function validateNumeric(value, options = {}) {
  const { min = null, max = null, integer = false } = options;
  
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  
  const num = integer ? parseInt(value, 10) : parseFloat(value);
  
  if (isNaN(num)) {
    return null;
  }
  
  if (min !== null && num < min) {
    return null;
  }
  
  if (max !== null && num > max) {
    return null;
  }
  
  return num;
}

/**
 * Validate required field
 */
export function validateRequired(value, fieldName = 'Field') {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return `${fieldName} is required`;
  }
  
  return null;
}

/**
 * Validate product form
 */
export function validateProductForm(formData) {
  const errors = {};
  
  // Title validation
  if (!formData.title || formData.title.trim() === '') {
    errors.title = 'Product title is required';
  }
  
  // Price validation
  if (formData.price_min && formData.price_max) {
    const minPrice = validateNumeric(formData.price_min, { min: 0 });
    const maxPrice = validateNumeric(formData.price_max, { min: 0 });
    
    if (minPrice === null) {
      errors.price_min = 'Minimum price must be a valid number';
    }
    
    if (maxPrice === null) {
      errors.price_max = 'Maximum price must be a valid number';
    }
    
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      errors.price_max = 'Maximum price must be greater than minimum price';
    }
  }
  
  // Lead time validation
  if (formData.lead_time_min_days && formData.lead_time_max_days) {
    const minDays = validateNumeric(formData.lead_time_min_days, { min: 0, integer: true });
    const maxDays = validateNumeric(formData.lead_time_max_days, { min: 0, integer: true });
    
    if (minDays !== null && maxDays !== null && minDays > maxDays) {
      errors.lead_time_max_days = 'Maximum lead time must be greater than minimum';
    }
  }
  
  // MOQ validation
  if (formData.min_order_quantity) {
    const moq = validateNumeric(formData.min_order_quantity, { min: 1, integer: true });
    if (moq === null) {
      errors.min_order_quantity = 'Minimum order quantity must be at least 1';
    }
  }
  
  return errors;
}

/**
 * Validate RFQ form
 */
export function validateRFQForm(formData) {
  const errors = {};
  
  // Title validation
  if (!formData.title || formData.title.trim() === '') {
    errors.title = 'RFQ title is required';
  }
  
  // Description validation
  if (!formData.description || formData.description.trim() === '') {
    errors.description = 'RFQ description is required';
  }
  
  // Quantity validation
  if (!formData.quantity) {
    errors.quantity = 'Quantity is required';
  } else {
    const qty = validateNumeric(formData.quantity, { min: 1, integer: true });
    if (qty === null) {
      errors.quantity = 'Quantity must be at least 1';
    }
  }
  
  // Target price validation
  if (formData.target_price) {
    const price = validateNumeric(formData.target_price, { min: 0 });
    if (price === null) {
      errors.target_price = 'Target price must be a valid number';
    }
  }
  
  return errors;
}

/**
 * Validate company form
 */
export function validateCompanyForm(formData) {
  const errors = {};
  
  // Company name validation
  const nameError = validateRequired(formData.company_name, 'Company name');
  if (nameError) errors.company_name = nameError;
  
  // Country validation
  const countryError = validateRequired(formData.country, 'Country');
  if (countryError) errors.country = countryError;
  
  // Phone validation
  if (formData.phone) {
    if (!isValidPhone(formData.phone, formData.country)) {
      errors.phone = 'Please enter a valid phone number';
    }
  }
  
  // Email validation
  if (formData.business_email) {
    if (!isValidEmail(formData.business_email)) {
      errors.business_email = 'Please enter a valid email address';
    }
  }
  
  // Website validation
  if (formData.website) {
    if (!isValidUrl(formData.website)) {
      errors.website = 'Please enter a valid URL (must start with http:// or https://)';
    }
  }
  
  return errors;
}

/**
 * Validate onboarding form
 */
export function validateOnboardingForm(formData, step) {
  const errors = {};
  
  if (step === 1) {
    // Role selection is handled by UI (button selection)
    // No validation needed
  }
  
  if (step === 2) {
    // Company name validation
    const nameError = validateRequired(formData.company_name, 'Company name');
    if (nameError) errors.company_name = nameError;
    
    // Country validation
    const countryError = validateRequired(formData.country, 'Country');
    if (countryError) errors.country = countryError;
    
    // Phone validation (optional but validate format if provided)
    if (formData.phone) {
      if (!isValidPhone(formData.phone, formData.country)) {
        errors.phone = 'Please enter a valid phone number';
      }
    }
    
    // Website validation (optional but validate format if provided)
    if (formData.website) {
      if (!isValidUrl(formData.website)) {
        errors.website = 'Please enter a valid URL';
      }
    }
  }
  
  return errors;
}

