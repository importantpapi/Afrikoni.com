/**
 * RFQ Service - Kernel Architecture
 * 
 * Centralized business logic for RFQ operations.
 * Frontend components should only handle UI concerns and delegate
 * all business logic to this service layer.
 */

import { supabase } from '@/api/supabaseClient';
import { getOrCreateCompany } from '@/utils/companyHelper';
import { sanitizeString, validateNumeric } from '@/utils/security';
import { format } from 'date-fns';

/**
 * Create a new RFQ
 * 
 * This is the Kernel method - handles all business logic:
 * - Company ID resolution
 * - Status enforcement
 * - buyer_user_id appending
 * - Data sanitization
 * - Database insertion
 * 
 * @param {Object} params
 * @param {Object} params.user - Authenticated user object (must have id and email)
 * @param {Object} params.formData - User-inputted form data (title, description, etc.)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function createRFQ({ user, formData }) {
  try {
    // ✅ KERNEL: Validate user
    if (!user || !user.id) {
      return {
        success: false,
        error: 'User authentication required. Please log in.'
      };
    }

    // ✅ KERNEL: Validate required fields
    if (!formData.title || !formData.description || !formData.quantity) {
      return {
        success: false,
        error: 'Please fill in all required fields (title, description, quantity)'
      };
    }

    // ✅ KERNEL: Validate and sanitize numeric fields
    const quantity = validateNumeric(formData.quantity, { min: 1 });
    const targetPrice = formData.target_price 
      ? validateNumeric(formData.target_price, { min: 0 }) 
      : null;

    if (quantity === null || quantity < 1) {
      return {
        success: false,
        error: 'Please enter a valid quantity (must be at least 1)'
      };
    }

    if (formData.target_price && (targetPrice === null || targetPrice < 0)) {
      return {
        success: false,
        error: 'Please enter a valid target price (must be 0 or greater)'
      };
    }

    // ✅ LAZY PROFILE STRATEGY: Resolve company ID with automatic fallback creation
    // If getOrCreateCompany fails, automatically create a minimal company entry
    let companyId;
    let isMinimalProfile = false;
    
    try {
      companyId = await getOrCreateCompany(supabase, user);
    } catch (error) {
      console.warn('[rfqService] getOrCreateCompany failed, attempting lazy profile creation:', error);
      // Fall through to lazy profile creation
    }
    
    // ✅ LAZY PROFILE: If no company ID, create minimal company automatically
    // ✅ FORENSIC FIX: Check for existing company BEFORE INSERT to avoid 23505 duplicate key error
    if (!companyId) {
      try {
        // ✅ FORENSIC FIX: First check if company already exists (handles UNIQUE constraint)
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (existingCompany?.id) {
          // Company already exists - use it
          companyId = existingCompany.id;
          console.log('[rfqService] Found existing company:', companyId);
          
          // Update profile with company_id (non-blocking)
          try {
            await supabase
              .from('profiles')
              .upsert({ 
                id: user.id,
                company_id: companyId 
              }, { onConflict: 'id' });
          } catch (profileErr) {
            console.warn('[rfqService] Failed to update profile with company_id (non-blocking):', profileErr);
          }
        } else {
          // No company exists - create minimal one
          const defaultCompanyName = user.email 
            ? `Company - ${user.email.split('@')[0]}` 
            : `Company - ${user.id.slice(0, 8)}`;
          
          console.log('[rfqService] Creating minimal company profile:', {
            user_id: user.id,
            company_name: defaultCompanyName,
            email: user.email
          });
          
          const { data: newCompany, error: createError } = await supabase
            .from('companies')
            .insert({
              user_id: user.id,
              company_name: defaultCompanyName,
              owner_email: user.email || null,
              email: user.email || null,
              role: 'buyer',
              business_type: 'buyer',
              verified: false,
              verification_status: 'unverified'
            })
            .select('id')
            .single();
          
          if (createError) {
            // ✅ FORENSIC FIX: Handle 23505 duplicate key error gracefully
            const isDuplicateKey = createError.code === '23505' || 
                                  createError.message?.includes('duplicate key') ||
                                  createError.message?.includes('unique constraint');
            
            if (isDuplicateKey) {
              console.warn('[rfqService] Company already exists (race condition), fetching...');
              // Race condition - another request created company, fetch it
              const { data: raceCompany } = await supabase
                .from('companies')
                .select('id')
                .eq('user_id', user.id)
                .single();
              
              if (raceCompany?.id) {
                companyId = raceCompany.id;
              }
            } else {
              console.error('[rfqService] Failed to create minimal company:', createError);
              // Still try to proceed - RFQ creation might work without company_id
            }
          } else if (newCompany && newCompany.id) {
            companyId = newCompany.id;
            isMinimalProfile = true;
            
            // Update profile with company_id (non-blocking)
            try {
              await supabase
                .from('profiles')
                .upsert({ 
                  id: user.id,
                  company_id: companyId 
                }, { onConflict: 'id' });
            } catch (profileErr) {
              console.warn('[rfqService] Failed to update profile with company_id (non-blocking):', profileErr);
            }
            
            console.log('[rfqService] Minimal company created successfully:', companyId);
          }
        }
      } catch (lazyError) {
        console.error('[rfqService] Lazy profile creation failed:', lazyError);
        // Continue anyway - RFQ might still work
      }
    }
    
    // ✅ LAZY PROFILE: Allow RFQ creation even without company_id if absolutely necessary
    // Some edge cases might require this, but prefer to have company_id
    // Note: buyer_company_id can be null in some cases, but it's better to have it

    // ✅ KERNEL: Build RFQ payload (only user-inputted fields)
    // Frontend should NOT set: status, buyer_company_id, buyer_user_id, unit_type
    const rfqData = {
      // User-inputted fields only
      title: sanitizeString(formData.title),
      description: sanitizeString(formData.description),
      category_id: formData.category_id || null,
      quantity: quantity,
      unit: sanitizeString(formData.unit || 'pieces'),
      target_price: targetPrice,
      delivery_location: sanitizeString(formData.delivery_location || ''),
      target_country: sanitizeString(formData.target_country || ''),
      target_city: sanitizeString(formData.target_city || ''),
      expires_at: formData.closing_date 
        ? format(formData.closing_date, 'yyyy-MM-dd') 
        : null,
      attachments: Array.isArray(formData.attachments) 
        ? formData.attachments.filter(url => typeof url === 'string' && url.trim() !== '')
        : [],
      
      // ✅ KERNEL: Business logic fields (set by service, not frontend)
      status: 'open', // Enforced: All RFQs start as 'open'
      buyer_company_id: companyId, // Resolved by Kernel
      buyer_user_id: user.id, // Appended by Kernel
      unit_type: sanitizeString(formData.unit || 'pieces') // Derived from unit
    };

    // ✅ KERNEL: Insert RFQ
    // Handle RLS violations gracefully
    let newRFQ;
    let insertError;
    
    try {
      const { data, error } = await supabase
        .from('rfqs')
        .insert(rfqData)
        .select()
        .single();
      
      newRFQ = data;
      insertError = error;
    } catch (error) {
      insertError = error;
    }

    if (insertError) {
      // ✅ KERNEL ALIGNMENT: Handle 403 Forbidden (RLS violation) gracefully
      const isRLSError = insertError.code === '42501' || 
                        insertError.code === 'PGRST301' ||
                        insertError.message?.includes('permission denied') ||
                        insertError.message?.includes('row-level security') ||
                        insertError.status === 403;
      
      if (isRLSError) {
        console.error('[rfqService] RLS violation when inserting RFQ:', insertError);
        return {
          success: false,
          error: 'Permission denied. Please ensure you are logged in and have permission to create RFQs. If this persists, please contact support.'
        };
      }
      
      console.error('[rfqService] RFQ insert error:', insertError);
      return {
        success: false,
        error: insertError.message || 'Failed to create RFQ. Please try again.'
      };
    }

    // ✅ KERNEL: Create notification (non-blocking)
    try {
      const { error: notifError } = await supabase.from('notifications').insert({
        user_email: user.email,
        company_id: companyId,
        title: 'RFQ Created',
        message: `Your RFQ "${rfqData.title}" is now live`,
        type: 'rfq',
        link: `/dashboard/rfqs/${newRFQ.id}`,
        related_id: newRFQ.id
      });
      if (notifError) {
        console.warn('[rfqService] Notification creation failed (non-blocking):', notifError);
      }
    } catch (notifErr) {
      console.warn('[rfqService] Notification error (non-blocking):', notifErr);
    }

    // ✅ KERNEL: Notify sellers (non-blocking)
    try {
      const { notifyRFQCreated } = await import('@/services/notificationService');
      await notifyRFQCreated(newRFQ.id, companyId);
    } catch (err) {
      console.warn('[rfqService] Seller notification failed (non-blocking):', err);
    }

    return {
      success: true,
      data: newRFQ,
      isMinimalProfile: isMinimalProfile // Flag to indicate if profile was auto-created
    };
  } catch (error) {
    console.error('[rfqService] Unexpected error creating RFQ:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * Create RFQ with 'in_review' status (for mobile wizard)
 * 
 * Note: This maintains backward compatibility with mobile wizard
 * but should eventually be consolidated to use 'open' status.
 * 
 * @param {Object} params
 * @param {Object} params.user - Authenticated user object
 * @param {Object} params.formData - User-inputted form data
 * @param {Object} params.options - Additional options (verified_only, afrikoni_managed, etc.)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function createRFQInReview({ user, formData, options = {} }) {
  try {
    // ✅ KERNEL: Validate user
    if (!user || !user.id) {
      return {
        success: false,
        error: 'User authentication required. Please log in.'
      };
    }

    // ✅ KERNEL: Validate required fields
    if (!formData.title) {
      return {
        success: false,
        error: 'Title is required'
      };
    }

    // ✅ KERNEL: Resolve company ID
    const companyId = await getOrCreateCompany(supabase, user);
    
    if (!companyId) {
      return {
        success: false,
        error: 'Company profile incomplete. Please complete your company profile to create RFQs.'
      };
    }

    // ✅ KERNEL: Validate and sanitize
    const quantity = parseFloat(formData.quantity) || 0;
    const targetPrice = formData.target_price ? parseFloat(formData.target_price) : null;

    // ✅ KERNEL: Build RFQ payload
    const rfqData = {
      // User-inputted fields
      title: sanitizeString(formData.title),
      description: sanitizeString(formData.description || formData.title),
      category_id: formData.category_id || null,
      quantity: quantity,
      unit: sanitizeString(formData.unit || 'pieces'),
      target_price: targetPrice,
      delivery_location: sanitizeString(formData.delivery_location || ''),
      delivery_deadline: formData.delivery_deadline 
        ? format(formData.delivery_deadline, 'yyyy-MM-dd') 
        : null,
      expires_at: formData.delivery_deadline 
        ? format(formData.delivery_deadline, 'yyyy-MM-dd') 
        : null,
      attachments: formData.attachments || [],
      
      // ✅ KERNEL: Business logic fields
      status: 'in_review', // Mobile wizard uses 'in_review'
      buyer_company_id: companyId,
      buyer_user_id: user.id,
      verified_only: options.verified_only ?? true,
      afrikoni_managed: options.afrikoni_managed ?? true
    };

    // ✅ KERNEL: Insert RFQ
    const { data: newRFQ, error } = await supabase
      .from('rfqs')
      .insert(rfqData)
      .select()
      .single();

    if (error) {
      console.error('[rfqService] RFQ insert error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create RFQ. Please try again.'
      };
    }

    return {
      success: true,
      data: newRFQ
    };
  } catch (error) {
    console.error('[rfqService] Unexpected error creating RFQ:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred. Please try again.'
    };
  }
}
