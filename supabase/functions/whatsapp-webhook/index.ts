import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * AFRIKONI WHATSAPP WEBHOOK v2.0 - Enhanced Onboarding & Security
 * - 5-step onboarding (NAME → ROLE → COMPANY → COUNTRY → PRODUCTS)
 * - Full conversation/message persistence
 * - Fraud detection integration
 * - KYC tier initialization (Tier 0)
 * - Uses WhatsApp Business API (Graph API)
 */

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
const WHATSAPP_VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'afrikoni_verify_2026';
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function classifyIntent(message: string) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${GEMINI_API_KEY}`;
    const systemPrompt = `You are the KoniAI Intent Classifier for Afrikoni WhatsApp. 
    Analyze the incoming message and categorize it into one of the following intents:
    - CREATE_RFQ: User wants to buy something or post a request.
    - TRACK_ORDER: User wants to know where their shipment is.
    - CONTACT_SUPPORT: User has a problem or needs help.
    - GENERAL_INQUIRY: General questions about Afrikoni.
    - ONBOARDING: User is introducing themselves.

    Output ONLY a JSON object: {"intent": "INTENT_NAME", "confidence": 0.0-1.0, "reason": "brief reason"}`;

    const body = {
        contents: [{ role: 'user', parts: [{ text: message }] }],
        system_instruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { response_mime_type: "application/json", temperature: 0.1 }
    };

    const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{"intent": "GENERAL_INQUIRY"}';
    return JSON.parse(textResponse);
}

async function extractRFQFields(message: string) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${GEMINI_API_KEY}`;
    const systemPrompt = `You are the KoniAI RFQ Extractor. 
    Analyze the incoming trade request and extract structured information.
    
    Fields to extract:
    - title: Short descriptive name (e.g., "50 Tons Cocoa Beans")
    - description: Full details
    - quantity: Numeric value
    - quantity_unit: e.g., "tons", "kg", "pieces"
    - target_price: If mentioned, otherwise null
    - category_hint: e.g., "Agricultural", "Tech", "Textile"
    
    Output ONLY valid JSON. If fields are missing, use null.`;

    const body = {
        contents: [{ role: 'user', parts: [{ text: message }] }],
        system_instruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { response_mime_type: "application/json", temperature: 0.1 }
    };

    const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return JSON.parse(textResponse);
}

async function sendWhatsAppMessage(to: string, message: string) {
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
        console.error('[WhatsApp] Missing access token or phone number ID');
        return false;
    }

    try {
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: to.replace('whatsapp:', '').replace('+', ''),
                    type: 'text',
                    text: { body: message }
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error('[WhatsApp] Send error:', error);
            return false;
        }

        return true;
    } catch (e) {
        console.error('[WhatsApp] Send exception:', e);
        return false;
    }
}

async function transcribeAudio(audioUrl: string) {
    if (!OPENAI_API_KEY) {
        console.error("[Whisper] OpenAI API Key missing");
        return null;
    }

    try {
        console.log(`[Whisper] Fetching audio from: ${audioUrl}`);

        // 1. Fetch audio from WhatsApp Media API
        const audioRes = await fetch(audioUrl, {
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`
            }
        });

        if (!audioRes.ok) throw new Error(`Failed to fetch audio: ${audioRes.status}`);
        const audioBlob = await audioRes.blob();

        // 2. Prepare for Whisper API
        const formData = new FormData();
        formData.append('file', audioBlob, 'voice_note.ogg');
        formData.append('model', 'whisper-1');

        console.log(`[Whisper] Sending to OpenAI...`);
        const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
            body: formData
        });

        if (!whisperRes.ok) {
            const err = await whisperRes.text();
            throw new Error(`Whisper API error: ${err}`);
        }

        const data = await whisperRes.json();
        console.log(`[Whisper] Transcription result: ${data.text}`);
        return data.text;
    } catch (e) {
        console.error("[Whisper] Transcription failed:", e);
        return null;
    }
}

async function main(req: Request) {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // Handle WhatsApp webhook verification (GET request)
    if (req.method === 'GET') {
        const url = new URL(req.url);
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');

        if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
            console.log('[WhatsApp] Webhook verified successfully');
            return new Response(challenge, { status: 200 });
        } else {
            console.error('[WhatsApp] Webhook verification failed');
            return new Response('Forbidden', { status: 403 });
        }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        // Parse WhatsApp Business API webhook payload
        const payload = await req.json();
        
        // Extract message data from WhatsApp Business API format
        const entry = payload.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];
        
        if (!message) {
            console.log('[WhatsApp] No message in payload, ignoring');
            return new Response(JSON.stringify({ status: 'success' }), { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const from = message.from; // Phone number without 'whatsapp:' prefix
        let body = message.text?.body || '';
        const messageId = message.id;
        const timestamp = message.timestamp;
        
        // Handle different message types
        let mediaUrl = null;
        let mediaContentType = null;
        
        if (message.type === 'audio') {
            // Get audio URL from WhatsApp Media API
            const mediaResponse = await fetch(
                `https://graph.facebook.com/v18.0/${message.audio.id}`,
                { headers: { 'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}` } }
            );
            const mediaData = await mediaResponse.json();
            mediaUrl = mediaData.url;
            mediaContentType = 'audio/ogg';
            
            console.log(`[WhatsApp Webhook] Audio detected, transcribing...`);
            const transcript = await transcribeAudio(mediaUrl);
            if (transcript) {
                body = transcript;
            }
        } else if (message.type === 'image') {
            const imageResponse = await fetch(
                `https://graph.facebook.com/v18.0/${message.image.id}`,
                { headers: { 'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}` } }
            );
            const imageData = await imageResponse.json();
            mediaUrl = imageData.url;
            mediaContentType = 'image/jpeg';
        }

        console.log(`[WhatsApp Webhook] Received message from ${from}: ${body} (Media: ${mediaContentType})`);

        if (!from || !body) {
            return new Response(JSON.stringify({ status: 'success' }), { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const cleanPhone = '+' + from; // WhatsApp API returns phone without +

        // 1. Resolve User/Profile by Phone
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, role, company_id')
            .eq('phone', cleanPhone)
            .maybeSingle();

        // 2. Resolve or Create Session
        const { data: session } = await supabase
            .from('whatsapp_sessions')
            .select('*')
            .eq('phone_number', cleanPhone)
            .maybeSingle();

        let currentSession = session;
        
        // Create conversation record
        let conversationId = null;
        const { data: existingConv } = await supabase
            .from('conversations')
            .select('id')
            .eq('phone', cleanPhone)
            .eq('status', 'active')
            .maybeSingle();
        
        if (existingConv) {
            conversationId = existingConv.id;
        } else {
            const { data: newConv } = await supabase
                .from('conversations')
                .insert({
                    user_id: profile?.id || null,
                    phone: cleanPhone,
                    status: 'active'
                })
                .select('id')
                .single();
            conversationId = newConv?.id;
        }
        
        // Store incoming message
        const { data: inboundMessage } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                direction: 'inbound',
                body: body,
                media_url: mediaUrl,
                media_type: mediaContentType?.startsWith('audio/') ? 'audio' : 
                           mediaContentType?.startsWith('image/') ? 'image' : 
                           mediaContentType ? 'document' : null
            })
            .select()
            .single();
        
        if (!session && !profile) {
            const { data: newSession } = await supabase
                .from('whatsapp_sessions')
                .insert({
                    phone_number: cleanPhone,
                    current_intent: 'ONBOARDING',
                    state_data: { step: 'AWAITING_NAME' }
                })
                .select()
                .single();
            currentSession = newSession;
        }

        // 3. Log Activity
        await supabase.from('activity_logs').insert({
            user_id: profile?.id || null,
            action: 'whatsapp_message_received',
            metadata: { phone: cleanPhone, message: body, session_id: currentSession?.id }
        });

        let responseMessage = "";

        // ========================================================================
        // STATE MACHINE: ONBOARDING (5-Minute WhatsApp Bot Flow)
        // Implements MASTER_PROMPT_2026 Phase 2 supplier onboarding
        // ========================================================================
        if (currentSession?.current_intent === 'ONBOARDING' && !profile) {
            const state = currentSession.state_data as any;

            if (state.step === 'AWAITING_NAME') {
                const name = body.trim();
                await supabase.from('whatsapp_sessions').update({
                    state_data: { ...state, step: 'AWAITING_ROLE', full_name: name }
                }).eq('id', currentSession.id);
                responseMessage = `Thanks, ${name}! 👋\n\nAre you a:\n1️⃣ BUYER (I want to buy products)\n2️⃣ SELLER (I want to sell products)\n3️⃣ BOTH\n\nReply with 1, 2, or 3.`;
            } else if (state.step === 'AWAITING_ROLE') {
                const roleChoice = body.trim();
                let role = 'buyer';
                if (roleChoice === '2' || roleChoice.toLowerCase().includes('sell')) {
                    role = 'seller';
                } else if (roleChoice === '3' || roleChoice.toLowerCase().includes('both')) {
                    role = 'hybrid';
                }
                
                await supabase.from('whatsapp_sessions').update({
                    state_data: { ...state, step: 'AWAITING_COMPANY', role: role }
                }).eq('id', currentSession.id);
                
                responseMessage = role === 'seller' || role === 'hybrid' 
                    ? `Great! What is the name of your company or business?`
                    : `Perfect! What is your company name?`;
                    
            } else if (state.step === 'AWAITING_COMPANY') {
                const companyName = body.trim();
                await supabase.from('whatsapp_sessions').update({
                    state_data: { ...state, step: 'AWAITING_COUNTRY', company_name: companyName }
                }).eq('id', currentSession.id);
                responseMessage = `Thanks! What country are you based in? 🌍\n\n(e.g., Ghana, Nigeria, Belgium, etc.)`;
                
            } else if (state.step === 'AWAITING_COUNTRY') {
                const country = body.trim();
                await supabase.from('whatsapp_sessions').update({
                    state_data: { ...state, step: 'AWAITING_PRODUCTS', country: country }
                }).eq('id', currentSession.id);
                
                if (state.role === 'seller' || state.role === 'hybrid') {
                    responseMessage = `Perfect! Now tell me: What do you sell? 📦\n\n(e.g., "Cocoa beans, shea butter, textiles")\n\nOr send photos of your products! 📸`;
                } else {
                    responseMessage = `Perfect! What products are you looking to buy? 🛒\n\n(e.g., "Cocoa beans from Ghana")`;
                }
                
            } else if (state.step === 'AWAITING_PRODUCTS') {
                // Handle product photos if media was sent
                let productInfo = body.trim();
                if (mediaUrl && mediaContentType?.startsWith('image/')) {
                    // Use Gemini Vision to extract product info from image
                    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${GEMINI_API_KEY}`;
                    const visionPrompt = `Analyze this product image and extract:
                    - Product name
                    - Category (Agriculture, Textiles, Electronics, etc.)
                    - Visible specifications or details
                    Output as JSON: {"product_name": "...", "category": "...", "description": "..."}`;
                    
                    try {
                        const visionBody = {
                            contents: [{
                                parts: [
                                    { text: visionPrompt },
                                    { inline_data: { mime_type: mediaContentType, data: await fetchImageAsBase64(mediaUrl) } }
                                ]
                            }],
                            generationConfig: { response_mime_type: "application/json" }
                        };
                        
                        const visionRes = await fetch(geminiUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(visionBody)
                        });
                        
                        const visionData = await visionRes.json();
                        const extracted = JSON.parse(visionData.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
                        productInfo = `${extracted.product_name || 'Product'}: ${extracted.description || body}`;
                        
                    } catch (err) {
                        console.error('[Vision] Failed to analyze image:', err);
                    }
                }
                
                // Create user account and company
                const fullName = state.full_name;
                const companyName = state.company_name;
                const country = state.country;
                const role = state.role;
                const placeholderEmail = `whatsapp_${cleanPhone.replace(/\+/g, '')}@afrikoni.chat`;

                const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                    email: placeholderEmail,
                    phone: cleanPhone,
                    password: crypto.randomUUID(),
                    email_confirm: true,
                    phone_confirm: true,
                    user_metadata: { full_name: fullName, registration_source: 'whatsapp' }
                });

                if (authError) {
                    console.error('[WhatsApp Webhook] Auth Error:', authError);
                    responseMessage = `I encountered an error setting up your account. Please try again later.`;
                } else {
                    // Create company and profile
                    const { data: company } = await supabase
                        .from('companies')
                        .insert({
                            company_name: companyName,
                            country: country,
                            owner_id: authUser.user.id,
                            created_via: 'whatsapp'
                        })
                        .select()
                        .single();
                    
                    await supabase
                        .from('profiles')
                        .insert({
                            id: authUser.user.id,
                            full_name: fullName,
                            phone: cleanPhone,
                            company_id: company.id,
                            role: role,
                            country: country,
                            verification_tier: 0, // Start at Tier 0 (Basic)
                            onboarding_completed: true
                        });
                    
                    // Store product info for seller/hybrid
                    if (role === 'seller' || role === 'hybrid') {
                        await supabase
                            .from('company_capabilities')
                            .insert({
                                company_id: company.id,
                                can_sell: true,
                                sell_status: 'pending', // Needs verification
                                products_offered: productInfo
                            });
                    }
                    
                    responseMessage = `🎉 Welcome to Afrikoni, ${fullName}!\n\n✅ Your account is ready\n✅ Company: ${companyName}\n✅ Country: ${country}\n\n${role === 'buyer' ? '🛒 Start buying: Just tell me what you need!\n\nExample: "I need 500kg cocoa butter from Ghana"' : '📦 Your products are under review. We\'ll notify you when approved (usually 24h).\n\nMeanwhile, you can browse buyer requests!'}\n\n💬 Need help? Just ask!`;
                    
                    await supabase.from('whatsapp_sessions').update({
                        user_id: authUser.user.id,
                        company_id: company.id,
                        current_intent: 'IDLE',
                        state_data: { step: 'COMPLETED' }
                    }).eq('id', currentSession.id);
                    
                    // Log successful onboarding
                    await supabase.from('activity_logs').insert({
                        user_id: authUser.user.id,
                        company_id: company.id,
                        action: 'whatsapp_onboarding_completed',
                        metadata: {
                            phone: cleanPhone,
                            role: role,
                            country: country,
                            duration_seconds: Math.floor((Date.now() - new Date(currentSession.created_at).getTime()) / 1000)
                        },
                        severity: 'info'
                    });
                }
            }
        }
        // ========================================================================
        // STATE MACHINE: PRODUCT CONFIRMATION
        // ========================================================================
        else if (currentSession?.current_intent === 'PRODUCT_CONFIRMATION' && profile && !mediaUrl) {
            const state = currentSession.state_data as any;
            const confirmation = body.trim().toLowerCase();

            if (confirmation === 'yes' || confirmation === 'yep' || confirmation === 'y') {
                const product = state.draft_product;
                const imageUrl = state.media_url;

                const { data: category } = await supabase
                    .from('categories')
                    .select('id')
                    .ilike('name', `%${product.category}%`)
                    .limit(1)
                    .maybeSingle();

                const { data: newProduct, error: productError } = await supabase
                    .from('products')
                    .insert({
                        name: product.name,
                        description: product.description,
                        short_description: product.description.substring(0, 100),
                        category_id: category?.id || null,
                        company_id: profile.company_id,
                        specifications: product.specifications,
                        unit_type: product.unit || 'KG',
                        status: 'active'
                    })
                    .select()
                    .single();

                if (productError) {
                    responseMessage = `Couldn't save "${product.name}". Please try again.`;
                } else {
                    if (imageUrl) {
                        await supabase.from('product_images').insert({
                            product_id: newProduct.id,
                            url: imageUrl,
                            is_primary: true
                        });
                    }
                    responseMessage = `Awesome! "${product.name}" has been added to your catalog. 🌍✨`;
                    await supabase.from('whatsapp_sessions').update({
                        current_intent: 'IDLE',
                        state_data: { step: 'COMPLETED' }
                    }).eq('phone_number', cleanPhone);
                }
            } else if (confirmation === 'edit' || confirmation === 'no' || confirmation === 'n') {
                responseMessage = `No problem! Send me a clearer photo or tell me what to change.`;
                await supabase.from('whatsapp_sessions').update({
                    current_intent: 'IDLE'
                }).eq('phone_number', cleanPhone);
            } else {
                responseMessage = `Please reply "Yes" to confirm, or "No" to cancel.`;
            }
        }
        // ========================================================================
        // STATE MACHINE: FALLBACK (MEDIA OR INTENT)
        // ========================================================================
        else {
            if (mediaUrl && profile) {
                responseMessage = `Analyzing your image...`;
                const extractionRes = await fetch(`${SUPABASE_URL}/functions/v1/koniai-extract-product`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageUrl: mediaUrl, company_id: profile.company_id })
                });
                const extracted = await extractionRes.json();
                if (extracted.name) {
                    responseMessage = `I've analyzed the photo!\n\n*Product:* ${extracted.name}\n*Category:* ${extracted.category}\n*Description:* ${extracted.description}\n\nAdd this to your catalog? (Reply "Yes" or "No")`;
                    await supabase.from('whatsapp_sessions').update({
                        current_intent: 'PRODUCT_CONFIRMATION',
                        state_data: { step: 'AWAITING_CONFIRMATION', draft_product: extracted, media_url: mediaUrl }
                    }).eq('phone_number', cleanPhone);
                }
            } else {
                const classification = await classifyIntent(body);
                if (classification.intent === 'CREATE_RFQ') {
                    if (profile && profile.company_id) {
                        responseMessage = `Drafting your RFQ... One moment...`;

                        // 1. Extract fields using Gemini
                        const extracted = await extractRFQFields(body);

                        // 2. Create record in the unified TRADES table
                        const { data: newTrade, error: tradeError } = await supabase
                            .from('trades')
                            .insert({
                                buyer_id: profile.company_id,
                                created_by: profile.id,
                                trade_type: 'rfq',
                                title: extracted.title || body.substring(0, 50),
                                description: extracted.description || body,
                                quantity: extracted.quantity || 0,
                                quantity_unit: extracted.quantity_unit || 'units',
                                target_price: extracted.target_price,
                                status: 'rfq_open' // Automatically published to trigger matchmaking!
                            })
                            .select()
                            .single();

                        if (tradeError) {
                            console.error("[WhatsApp] Trade direct create error:", tradeError);
                            // Fallback to draft
                            await supabase.from('rfq_drafts').upsert({
                                user_id: profile.id,
                                company_id: profile.company_id,
                                draft_data: { original_message: body, intent: classification.intent, source: 'whatsapp' }
                            });
                            responseMessage = `I've saved your request as a draft. You can complete it in your dashboard!`;
                        } else {
                            responseMessage = `🚀 *RFQ Published!*
                            
I've matched your request for "${extracted.title || body.substring(0, 30)}" with our network. 

Top suppliers are being notified via WhatsApp right now!`;
                        }
                    } else if (profile) {
                        // Profile exists but no company_id? Ask for company name
                        responseMessage = `What is the name of your company or business?`;
                        await supabase.from('whatsapp_sessions').upsert({
                            phone_number: cleanPhone,
                            current_intent: 'ONBOARDING',
                            state_data: { step: 'AWAITING_COMPANY', full_name: profile.full_name }
                        });
                    } else {
                        responseMessage = `Let's get you set up first! What is your full name?`;
                        await supabase.from('whatsapp_sessions').upsert({
                            phone_number: cleanPhone,
                            current_intent: 'ONBOARDING',
                            state_data: { step: 'AWAITING_NAME' }
                        });
                    }
                } else if (classification.intent === 'TRACK_ORDER') {
                    responseMessage = profile ? `Checking your shipments, ${profile.full_name}...` : `Tell me your name first!`;
                } else {
                    responseMessage = profile ? `Hi ${profile.full_name}! I'm Koni. How can I help with ${classification.intent.replace('_', ' ')}?` : `Hi! I'm Koni. Please tell me your name to get started!`;
                }
            }
        }

        // Send WhatsApp message via Graph API
        if (responseMessage) {
            const sent = await sendWhatsAppMessage(cleanPhone, responseMessage);
            
            // Store outbound message
            if (sent) {
                await supabase.from('messages').insert({
                    conversation_id: conversationId,
                    direction: 'outbound',
                    body: responseMessage,
                    intent: currentSession?.current_intent || null
                });
            }
        }

        return new Response(JSON.stringify({ status: 'success' }), { 
            headers: { 'Content-Type': 'application/json' }, 
            status: 200 
        });

    } catch (error: any) {
        console.error('[WhatsApp Webhook] Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }
}

serve(main);
