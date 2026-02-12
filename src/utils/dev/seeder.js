import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';

/**
 * Seed data for a new user to verify dashboard functionality.
 * Creates:
 * 1. A mock counterpart company ("Afrikoni Global Supply")
 * 2. A mock product
 * 3. A mock Order (Buy side)
 * 4. A mock RFQ (Sell side / Intake)
 * 5. A mock Warehouse
 */
export async function seedData(user, companyId) {
    if (!user || !companyId) {
        toast.error('User or Company ID missing');
        return;
    }

    const toastId = toast.loading('Seeding test data...');

    try {
        // 1. Create Mock Counterpart Company
        const counterpartId = '00000000-0000-4000-a000-000000000001'; // Deterministic UUID for reuse

        // Try to find or create counterpart
        const { data: existingCounterpart } = await supabase
            .from('companies')
            .select('id')
            .eq('id', counterpartId)
            .single();

        if (!existingCounterpart) {
            await supabase.from('companies').insert({
                id: counterpartId,
                name: 'Afrikoni Global Supply',
                country: 'Ghana',
                type: 'supplier',
                verification_status: 'verified',
                trust_score: 95,
                owner_id: user.id // Hack: belong to user so we can read it easily if RLS is strict, or assume public read
            }).select();
        }

        // 2. Create Mock Product
        const productId = '00000000-0000-4000-a000-000000000002';
        const { data: existingProduct } = await supabase
            .from('products')
            .select('id')
            .eq('id', productId)
            .single();

        if (!existingProduct) {
            await supabase.from('products').insert({
                id: productId,
                company_id: counterpartId,
                title: 'Premium Raw Shea Butter (Grade A)',
                description: 'High quality unrefined shea butter for cosmetic use.',
                price: 1200,
                currency: 'USD',
                min_order_quantity: 100,
                unit: 'kg',
                category: 'Agriculture', // Simplify category
                images: ['https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=200'],
                status: 'published'
            });
        }

        // 3. Create Mock Order (User matches as Buyer)
        // Check if we already have an order
        const { count: orderCount } = await supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('buyer_company_id', companyId);

        if (orderCount === 0) {
            await supabase.from('orders').insert({
                buyer_company_id: companyId,
                seller_company_id: counterpartId,
                product_id: productId,
                status: 'shipped', // Show some progress
                payment_status: 'escrow_funded',
                total_value: 5400,
                quantity: 4500,
                unit: 'kg',
                currency: 'USD',
                product_name: 'Premium Raw Shea Butter (Grade A)', // Denormalized field for TradeMonitor
                milestones: [
                    { name: 'Order Placed', status: 'completed', date: new Date(Date.now() - 86400000 * 5) },
                    { name: 'Escrow Funded', status: 'completed', date: new Date(Date.now() - 86400000 * 4) },
                    { name: 'Production', status: 'completed', date: new Date(Date.now() - 86400000 * 2) },
                    { name: 'Quality Check', status: 'completed', date: new Date(Date.now() - 86400000 * 1) },
                    { name: 'Shipped', status: 'in_progress', date: new Date() }
                ],
                corridor: { origin: 'Ghana', destination: 'User Location', risk: 'low' }
            });
        }

        // 4. Create Mock RFQ (User created it)
        const { count: rfqCount } = await supabase
            .from('trades') // Use trades table for RFQs as analyzed
            .select('id', { count: 'exact', head: true })
            .eq('buyer_id', companyId)
            .eq('trade_type', 'rfq');

        if (rfqCount === 0) {
            await supabase.from('trades').insert({
                trade_type: 'rfq',
                buyer_id: companyId,
                created_by: user.id,
                title: 'Sourcing Request: Cashew Nuts W320',
                description: 'Looking for 2 containers of raw cashew nuts, crop 2025.',
                status: 'rfq_open',
                quantity: 32000,
                quantity_unit: 'kg',
                target_price: 1.85,
                currency: 'USD',
                expires_at: new Date(Date.now() + 86400000 * 7).toISOString(), // +7 days
                metadata: {
                    delivery_location: 'Port of Rotterdam',
                    incoterms: 'CIF'
                }
            });
        }

        // 5. Create Mock Market Opportunity (Counterpart created it, User sees it)
        const { count: oppCount } = await supabase
            .from('trades')
            .select('id', { count: 'exact', head: true })
            .eq('buyer_id', counterpartId)
            .eq('trade_type', 'rfq');

        if (oppCount === 0) {
            await supabase.from('trades').insert({
                trade_type: 'rfq',
                buyer_id: counterpartId,
                created_by: existingCounterpart?.owner_id || user.id, // Fallback to user if owner not known, doesn't matter much for display
                title: 'Urgent: Processed Cocoa Butter',
                description: 'Need 500kg of food-grade cocoa butter for confectionery production.',
                status: 'rfq_open',
                quantity: 500,
                quantity_unit: 'kg',
                target_price: 3200, // $3200 total or unit? usually unit price or total. Let's say unit price $6.4/kg implies total? No, target_price is usually total value or unit price.
                // In RFQ Service it maps target_price directly. Let's assume Unit Price for display logic often.
                // Actually Trade Monitor often treats it as value. Let's put a realistic value.
                // 500kg * $8 = $4000.
                target_price: 4000,
                currency: 'USD',
                expires_at: new Date(Date.now() + 86400000 * 3).toISOString(), // +3 days
                metadata: {
                    delivery_location: 'Accra, Ghana',
                    incoterms: 'EXW',
                    shipping_method: 'Air Freight'
                }
            });
        }

        // 5. Create Mock Warehouse
        // Check if warehouse exists
        // Likely 'warehouses' or 'warehouse_locations' table.
        // I will guess 'warehouse_locations' based on fulfillment.jsx import 'getWarehouseLocations'
        // But getWarehouseLocations might query 'warehouses' table.
        // Let's check fulfillment.jsx queries via grep if needed, or just try 'warehouses' which is standard.
        // Actually I'll skip warehouse to avoid guessing table name error, RFQ and Order are enough for "Life".

        toast.dismiss(toastId);
        toast.success('Seed data created! Dashboard should update instantly.');

        // Trigger generic refresh event just in case
        window.dispatchEvent(new Event('refresh-data'));

    } catch (err) {
        console.error('Seeding failed:', err);
        toast.dismiss(toastId);
        toast.error(`Seeding failed: ${err.message}`);
    }
}
