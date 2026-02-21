import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
    const { data, error, count } = await supabase
        .from('products')
        .select('id, name, status, company_id', { count: 'exact' });

    if (error) {
        console.error('Error fetching products:', error);
    } else {
        console.log(`Total products: ${count}`);
        console.log('Sample products:', data.slice(0, 10));
    }
}

checkProducts();
