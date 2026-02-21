import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listCompanies() {
    const { data, error, count } = await supabase
        .from('companies')
        .select('id, company_name', { count: 'exact' });

    if (error) {
        console.error('Error fetching companies:', error);
    } else {
        console.log(`Total companies: ${count}`);
        console.log('Sample companies:', data.slice(0, 10));
    }
}

listCompanies();
