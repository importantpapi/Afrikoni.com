/**
 * Helper function to get or create company for a user
 * NON-BLOCKING: Always returns a company ID, creates one if needed
 */
export async function getOrCreateCompany(supabase, userData) {
  if (!userData || !userData.id) {
    return null;
  }

  // If user already has company_id, return it immediately (don't verify to avoid RLS issues)
  // The company_id in profile is trusted - if it's wrong, it will be handled by RLS on actual queries
  if (userData.company_id) {
    return userData.company_id;
  }

  // Always create a fresh company if one doesn't exist (non-blocking)
  const role = userData.role || userData.user_role || 'buyer';
  
  try {
    // Convert year_established to integer or null (database expects integer, not empty string)
    let yearEstablished = null;
    if (userData.year_established) {
      const year = typeof userData.year_established === 'string' 
        ? parseInt(userData.year_established.trim(), 10) 
        : userData.year_established;
      if (!isNaN(year) && year > 1900 && year <= new Date().getFullYear()) {
        yearEstablished = year;
      }
    }

    const { data: newCompany, error } = await supabase
      .from('companies')
      .insert({
        company_name: userData.company_name || userData.full_name || 'My Company',
        owner_email: userData.email || userData.business_email || null,
        role: role === 'hybrid' ? 'hybrid' : role === 'logistics_partner' ? 'logistics' : role || null,
        country: userData.country || null,
        city: userData.city || null,
        phone: userData.phone || null,
        email: userData.business_email || userData.email || null,
        website: userData.website || null,
        year_established: yearEstablished, // INTEGER: null or valid year
        employee_count: userData.company_size || '1-10',
        description: userData.company_description || null,
        // ✅ CRITICAL: All new companies start as unverified - admin must approve before they appear on verified suppliers page
        verified: false,
        verification_status: 'unverified'
      })
      .select('id')
      .single();

    if (error) {
      // Log error but don't block - return null
      console.warn('[getOrCreateCompany] Error creating company:', error.message || error);
      return null;
    }

    if (!newCompany || !newCompany.id) {
      console.warn('[getOrCreateCompany] Company created but no ID returned');
      return null;
    }

    // Update profile with company_id (non-blocking)
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: userData.id,
          company_id: newCompany.id 
        }, { onConflict: 'id' });
      
      if (profileError) {
        // Log but don't block - company was created successfully
        console.warn('[getOrCreateCompany] Error updating profile with company_id:', profileError.message);
      }
    } catch (profileErr) {
      console.warn('[getOrCreateCompany] Exception updating profile:', profileErr);
    }

    return newCompany.id;
  } catch (err) {
    // Catch any unexpected errors and return null (non-blocking)
    console.error('[getOrCreateCompany] Unexpected error:', err);
    return null;
  }
}

