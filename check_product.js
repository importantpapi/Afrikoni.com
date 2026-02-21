import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductDetails() {
    const { data, error } = await supabase
        .from('products')
        .select('id, name, status, category_id, country_of_origin')
        .eq('id', 'ac16d5c8-6893-4747-b590-6dbf81f3678c')
        .single();

    if (error) {
        console.error('Error fetching product:', error);
    } else {
        console.log('Product details:', data);
    }
}

checkProductDetails();
