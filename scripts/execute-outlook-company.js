import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing VITE_SUPABASE_URL in .env');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env');
  console.error('\n📋 Get it from: Supabase Dashboard → Settings → API → service_role key');
  console.error('   Then add to .env: SUPABASE_SERVICE_ROLE_KEY=your_key_here\n');
  process.exit(1);
}

const supabaseKey = supabaseServiceKey;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeMigration() {
  try {
    console.log('🚀 Executing migration...\n');

    // Step 1: Insert company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        company_name: 'Afrikoni Outlook Test Company',
        owner_email: 'afrikoni@outlook.com',
        email: 'afrikoni@outlook.com',
        role: 'seller'
      })
      .select('id')
      .single();

    if (companyError) {
      if (companyError.code === '23505') {
        // Company already exists, fetch it
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('email', 'afrikoni@outlook.com')
          .single();
        
        if (existingCompany) {
          console.log('✅ Company already exists, using existing ID:', existingCompany.id);
          var companyId = existingCompany.id;
        } else {
          throw companyError;
        }
      } else {
        throw companyError;
      }
    } else {
      console.log('✅ Company created with ID:', company.id);
      var companyId = company.id;
    }

    // Step 2: Update profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        company_id: companyId,
        role: 'seller'
      })
      .eq('email', 'afrikoni@outlook.com')
      .select();

    if (profileError) {
      throw profileError;
    }

    if (profile && profile.length > 0) {
      console.log('✅ Profile updated successfully');
      console.log('   Updated profiles:', profile.length);
    } else {
      console.log('⚠️  No profile found with email: afrikoni@outlook.com');
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

executeMigration();

