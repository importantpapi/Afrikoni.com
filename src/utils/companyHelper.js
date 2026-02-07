/**
 * Helper function to get or create company for a user
 * By default returns company ID (or null) for backward compatibility.
 * Pass options.returnError = true to get { companyId, error } instead.
 */
export async function getOrCreateCompany(supabase, userData, options = {}) {
  const returnError = options.returnError === true;

  if (!userData || !userData.id) {
    return returnError ? { companyId: null, error: 'No user data provided' } : null;
  }

  // If user already has company_id, return it immediately (don't verify to avoid RLS issues)
  // The company_id in profile is trusted - if it's wrong, it will be handled by RLS on actual queries
  if (userData.company_id) {
    return returnError ? { companyId: userData.company_id, error: null } : userData.company_id;
  }

  // Always create a fresh company if one doesn't exist
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
        // All new companies start as unverified - admin must approve
        verified: false,
        verification_status: 'unverified'
      })
      .select('id')
      .single();

    if (error) {
      const msg = `Failed to create company: ${error.message}`;
      console.error('[getOrCreateCompany]', msg);
      return returnError ? { companyId: null, error: msg } : null;
    }

    if (!newCompany || !newCompany.id) {
      const msg = 'Company creation returned no ID';
      console.error('[getOrCreateCompany]', msg);
      return returnError ? { companyId: null, error: msg } : null;
    }

    // Update profile with company_id
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userData.id,
          company_id: newCompany.id
        }, { onConflict: 'id' });

      if (profileError) {
        console.warn('[getOrCreateCompany] Error updating profile with company_id:', profileError.message);
      }
    } catch (profileErr) {
      console.warn('[getOrCreateCompany] Exception updating profile:', profileErr);
    }

    return returnError ? { companyId: newCompany.id, error: null } : newCompany.id;
  } catch (err) {
    const msg = `Unexpected error: ${err.message}`;
    console.error('[getOrCreateCompany]', msg);
    return returnError ? { companyId: null, error: msg } : null;
  }
}
