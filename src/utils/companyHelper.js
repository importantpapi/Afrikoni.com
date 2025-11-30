/**
 * Helper function to get or create company for a user
 * NON-BLOCKING: Always returns a company ID, creates one if needed
 */
export async function getOrCreateCompany(supabase, userData) {
  if (!userData || !userData.id) {
    return null;
  }

  // If user already has company_id, return it
  if (userData.company_id) {
    return userData.company_id;
  }

  // Try to find existing company by owner email
  const { data: existingCompany } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_email', userData.email || userData.business_email)
    .maybeSingle();

  if (existingCompany) {
    // Update profile with company_id
    await supabase
      .from('profiles')
      .upsert({ 
        id: userData.id,
        company_id: existingCompany.id 
      }, { onConflict: 'id' })
      .catch(() => {
        // Silently fail if update doesn't work
      });
    
    return existingCompany.id;
  }

  // Always create a company if one doesn't exist (non-blocking)
  const role = userData.role || userData.user_role || 'buyer';
  const { data: newCompany, error } = await supabase
    .from('companies')
    .insert({
      company_name: userData.company_name || userData.full_name || 'My Company',
      owner_email: userData.email || userData.business_email,
      role: role === 'hybrid' ? 'hybrid' : role === 'logistics_partner' ? 'logistics' : role,
      country: userData.country || '',
      city: userData.city || '',
      phone: userData.phone || '',
      email: userData.business_email || userData.email,
      website: userData.website || '',
      year_established: userData.year_established || '',
      employee_count: userData.company_size || '1-10',
      description: userData.company_description || ''
    })
    .select('id')
    .single();

  if (error || !newCompany) {
    // If creation fails, return null but don't block
    return null;
  }

  // Update profile with company_id
  await supabase
    .from('profiles')
    .upsert({ 
      id: userData.id,
      company_id: newCompany.id 
    }, { onConflict: 'id' })
    .catch(() => {
      // Silently fail if update doesn't work
    });

  return newCompany.id;
}

