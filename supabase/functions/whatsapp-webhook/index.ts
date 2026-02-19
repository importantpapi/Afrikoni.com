import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

async function classifyIntent(message: string, currentSession: any) {
    if (!GEMINI_API_KEY) return { intent: "unknown", data: {} };

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${GEMINI_API_KEY}`;

    const systemInstruction = `You are the Afrikoni One Flow Orchestrator. 
  Your goal is to extract structured trade intent from a WhatsApp message.
  
  INTENTS:
  - create_rfq: User wants to buy or request a quote for a commodity.
  - check_status: User wants to know the status of an existing trade/RFQ.
  - support: User needs help or has a complaint.
  - continue: User is providing missing information for a current flow.
  - confirm: User explicitly typed "CONFIRM" or agreed to proceed.
  
  SCHEMA:
  {
    "intent": "create_rfq" | "check_status" | "support" | "continue" | "confirm" | "unknown",
    "data": { 
      "commodity": string | null,
      "quantity": number | null,
      "unit": string | null,
      "destination": string | null,
      "order_id": string | null
    },
    "confidence": 0-1
  }
  
  CURRENT SESSION STATE: ${JSON.stringify(currentSession?.state_data || {})}
  
  Output ONLY valid JSON.`;

    const body = {
        contents: [{ role: "user", parts: [{ text: message }] }],
        system_instruction: { parts: [{ text: systemInstruction }] },
        generationConfig: { response_mime_type: "application/json", temperature: 0.1 }
    };

    try {
        const res = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const json = await res.json();
        return JSON.parse(json.candidates[0].content.parts[0].text);
    } catch (e) {
        console.error("Gemini classification failed:", e);
        return { intent: "unknown", data: {} };
    }
}

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    try {
        const url = new URL(req.url);

        // 1. WhatsApp Webhook Verification
        if (req.method === "GET") {
            const mode = url.searchParams.get("hub.mode");
            const token = url.searchParams.get("hub.verify_token");
            const challenge = url.searchParams.get("hub.challenge");

            if (mode === "subscribe" && token === Deno.env.get("WHATSAPP_VERIFY_TOKEN")) {
                return new Response(challenge, { status: 200 });
            }
            return new Response("Forbidden", { status: 403 });
        }

        // 2. Handle Incoming Message
        if (req.method === "POST") {
            const payload = await req.json();
            const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
            if (!message) return new Response("No message", { status: 200 });

            const phoneNumber = message.from;
            const text = message.text?.body || "";
            const messageId = message.id;

            // 3. Session & Intent
            let { data: session } = await supabase
                .from("whatsapp_sessions")
                .select("*, conversations(*)")
                .eq("phone_number", phoneNumber)
                .single();

            if (!session) {
                const { data: conv } = await supabase.from("conversations").insert({
                    whatsapp_phone: phoneNumber,
                    platform: "whatsapp",
                    subject: `WhatsApp: ${phoneNumber}`
                }).select().single();

                const { data: newSession } = await supabase.from("whatsapp_sessions").insert({
                    phone_number: phoneNumber,
                    conversation_id: conv.id
                }).select().single();
                session = newSession;
            }

            const analysis = await classifyIntent(text, session);

            // 4. Update Session State & Reply logic
            let replyText = "I'm KoniAI. I can help you trade commodities across Africa instantly. Try saying 'I want to buy 10 tons of cocoa'.";

            const intent = analysis.intent;
            const data = analysis.data;
            const currentState = session.state_data || {};

            if (intent === "create_rfq" || (session.current_intent === "create_rfq" && (intent === "continue" || intent === "unknown"))) {
                const updatedData = { ...currentState, ...data };

                // Basic requirement check for POC
                if (!updatedData.commodity) {
                    replyText = "Which commodity are you looking for? (e.g. Cocoa, Lithium, Cashews)";
                } else if (!updatedData.quantity) {
                    replyText = `How many ${updatedData.commodity} do you need?`;
                } else if (!updatedData.destination) {
                    replyText = `Understood. Where should we ship the ${updatedData.quantity} ${updatedData.unit || 'units'} of ${updatedData.commodity} to? (Port/City)`;
                } else {
                    replyText = `✅ RFQ Draft Ready:\n📦 *Item*: ${updatedData.commodity}\n⚖️ *Qty*: ${updatedData.quantity} ${updatedData.unit || 'units'}\n🚢 *To*: ${updatedData.destination}\n\nType *CONFIRM* to publish this to our verified suppliers.`;
                }

                await supabase.from("whatsapp_sessions").update({
                    current_intent: "create_rfq",
                    state_data: updatedData,
                    last_interaction_at: new Date().toISOString()
                }).eq("id", session.id);
            } else if (intent === "confirm" && session.current_intent === "create_rfq") {
                // TODO: Logic to actually create the RFQ in the kernel
                replyText = "🚀 RFQ Published! I'm now broadcasting your request to our vetted suppliers. You'll receive quotes here as soon as they are ready.";

                await supabase.from("whatsapp_sessions").update({
                    current_intent: null,
                    state_data: {}
                }).eq("id", session.id);
            }

            // 5. Log Message & Intent
            await supabase.from("messages").insert({
                conversation_id: session.conversation_id,
                whatsapp_message_id: messageId,
                sender_type: "user",
                content: text,
                intent: intent,
                extracted_data: data
            });

            // 6. Respond (STUB - Log to console for now)
            console.log(`[WHATSAPP REPLY to ${phoneNumber}]: ${replyText}`);

            return new Response(JSON.stringify({ status: "success", reply: replyText }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        return new Response("Method Not Allowed", { status: 405 });
    } catch (err) {
        console.error("Webhook Error:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
});
