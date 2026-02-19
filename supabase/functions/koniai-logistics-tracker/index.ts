import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * AFRIKONI LOGISTICS TRACKER (Predictive AI)
 * 
 * This function:
 * 1. Polls active shipments from the database.
 * 2. Simulates real-time tracking updates from DHL/Maersk (Mock).
 * 3. Uses Gemini 3 to analyze transit patterns and predict delays.
 * 4. Updates the shipment status and logs risk events.
 */

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock DHL Status Generator
function getMockDHLStatus(shipment: { created_at: string; origin_country?: string; destination_country?: string }) {
    const hoursInTransit = (Date.now() - new Date(shipment.created_at).getTime()) / (1000 * 60 * 60);
    const origin = shipment.origin_country || 'Nigeria';
    const dest = shipment.destination_country || 'Ghana';

    if (hoursInTransit < 24) return { status: 'picked_up', location: `${origin} Sort Facility`, description: 'Shipment picked up' };
    if (hoursInTransit < 48) return { status: 'in_transit', location: `${origin} International Airport`, description: 'Processed at export facility' };
    if (hoursInTransit < 72) return { status: 'in_transit', location: 'Transit Hub - Dubai', description: 'Arrived at transit hub' };
    if (hoursInTransit < 96) return { status: 'in_transit', location: `${dest} International Airport`, description: 'Arrived at destination country' };
    if (hoursInTransit > 96 && hoursInTransit < 120) return { status: 'customs_hold', location: `${dest} Customs`, description: 'Clearance event - awaiting documentation' }; // Artificial delay
    return { status: 'out_for_delivery', location: `${dest} Delivery Center`, description: 'Out for delivery' };
}

async function predictDelayRisk(shipment: { origin_country?: string; destination_country?: string; carrier?: string; created_at: string }, currentStatus: { status: string; location: string; description: string }) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `You are the KoniAI Logistics Risk Engine.
    Analyze the following shipment for potential delays based on the current status and regional logistics knowledge.

    Shipment Details:
    - Origin: ${shipment.origin_country || 'Unknown'}
    - Destination: ${shipment.destination_country || 'Unknown'}
    - Carrier: ${shipment.carrier}
    - Current Status: ${currentStatus.status}
    - Location: ${currentStatus.location}
    - Description: ${currentStatus.description}
    - Hours in Transit: ${((Date.now() - new Date(shipment.created_at).getTime()) / 3600000).toFixed(1)}

    Predict the risk of delay (High/Medium/Low) and provide a reason.
    If "Customs", assume High Risk for West Africa.
    
    Output JSON ONLY: {"risk_level": "High|Medium|Low", "reason": "Short explanation", "estimated_delay_hours": number}`;

    try {
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json", temperature: 0.1 }
            })
        });

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        return JSON.parse(textResponse);
    } catch (e) {
        console.error("Gemini Error:", e);
        return { risk_level: 'Low', reason: 'AI Analysis Failed', estimated_delay_hours: 0 };
    }
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        // 1. Fetch Active Shipments
        const { data: shipments, error } = await supabase
            .from('shipments')
            .select('*')
            .neq('status', 'delivered')
            .neq('status', 'cancelled')
            .limit(10); // Process batch of 10 for demo

        if (error) throw error;

        const updates = [];

        for (const shipment of shipments) {
            // 2. Mock DHL Update
            const mockStatus = getMockDHLStatus(shipment);

            // Only proceed if status is different or it's a risk check
            // For demo, we always check

            // 3. AI Risk Prediction
            const riskAnalysis = await predictDelayRisk(shipment, mockStatus);

            // 4. Update Database
            // Add tracking event
            await supabase.from('shipment_tracking_events').insert({
                shipment_id: shipment.id,
                event_type: mockStatus.status,
                status: mockStatus.status,
                location: mockStatus.location,
                description: mockStatus.description,
                notes: `AI Risk Assessment: ${riskAnalysis.risk_level} - ${riskAnalysis.reason}`,
                event_timestamp: new Date().toISOString()
            });

            // Update shipment status if changed
            if (shipment.status !== mockStatus.status) {
                await supabase.from('shipments').update({
                    status: mockStatus.status,
                    updated_at: new Date().toISOString()
                }).eq('id', shipment.id);
            }

            // Log if High Risk
            if (riskAnalysis.risk_level === 'High') {
                // Trigger Alert (Mock - would be WhatsApp in production)
                console.log(`[ALERT] High Risk detected for ${shipment.tracking_number}: ${riskAnalysis.reason}`);
            }

            updates.push({
                tracking_number: shipment.tracking_number,
                new_status: mockStatus.status,
                risk: riskAnalysis
            });
        }

        return new Response(JSON.stringify({ success: true, processed: updates.length, updates }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Tracker Error:', error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
