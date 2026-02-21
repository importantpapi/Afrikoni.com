import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCompany() {
    const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', '42ad67c0-2bbb-4b96-949c-f1f189b2df97')
        .single();

    if (error) {
        console.error('Error fetching company:', error);
    } else {
        console.log('Company found:', data);
    }
}

checkCompany();
