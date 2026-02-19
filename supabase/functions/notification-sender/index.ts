/**
 * Notification Sender Service
 * 
 * Processes dispatch_notifications queue and sends SMS/WhatsApp messages.
 * Integrates with Twilio for production, logs to console in development.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface NotificationRecord {
  id: string;
  trade_id?: string;
  provider_id?: string;
  notification_type: "sms" | "whatsapp" | "push";
  message_body: string;
  recipient: string | null;
  status: "pending" | "sent" | "delivered" | "failed";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
  const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
  const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: "Supabase not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // ========================================================================
    // FETCH PENDING NOTIFICATIONS
    // ========================================================================
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from("dispatch_notifications")
      .select("*")
      .eq("status", "pending")
      .limit(10); // Process in batches

    if (fetchError) {
      console.error("[NotificationSender] Failed to fetch notifications:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No pending notifications",
          processed: 0,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[NotificationSender] Processing ${pendingNotifications.length} notifications`);

    // ========================================================================
    // SEND NOTIFICATIONS
    // ========================================================================
    const results = await Promise.all(
      pendingNotifications.map(async (notification: NotificationRecord) => {
        try {
          if (notification.notification_type === "sms") {
            await sendSMS(notification, {
              TWILIO_ACCOUNT_SID,
              TWILIO_AUTH_TOKEN,
              TWILIO_PHONE_NUMBER,
            });
          } else if (notification.notification_type === "whatsapp") {
            await sendWhatsApp(notification, {
              TWILIO_ACCOUNT_SID,
              TWILIO_AUTH_TOKEN,
              TWILIO_PHONE_NUMBER,
            });
          } else {
            console.log(`[NotificationSender] Unsupported type: ${notification.notification_type}`);
            return { id: notification.id, success: false, error: "Unsupported notification type" };
          }

          // Mark as sent
          await supabase
            .from("dispatch_notifications")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
            })
            .eq("id", notification.id);

          return { id: notification.id, success: true };
        } catch (error) {
          console.error(`[NotificationSender] Failed to send ${notification.id}:`, error);

          // Mark as failed
          await supabase
            .from("dispatch_notifications")
            .update({
              status: "failed",
              sent_at: new Date().toISOString(),
            })
            .eq("id", notification.id);

          return { id: notification.id, success: false, error: error.message };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        sent: successCount,
        failed: failureCount,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[NotificationSender] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ============================================================================
// NOTIFICATION ADAPTERS
// ============================================================================

async function sendSMS(
  notification: NotificationRecord,
  config: {
    TWILIO_ACCOUNT_SID?: string;
    TWILIO_AUTH_TOKEN?: string;
    TWILIO_PHONE_NUMBER?: string;
  }
) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = config;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn("[SMS] Twilio not configured - logging message instead");
    console.log(`[SMS] To: ${notification.recipient}`);
    console.log(`[SMS] Message: ${notification.message_body}`);
    return; // Don't throw error in development
  }

  if (!notification.recipient) {
    throw new Error("Phone number missing");
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  const body = new URLSearchParams({
    To: notification.recipient,
    From: TWILIO_PHONE_NUMBER,
    Body: notification.message_body,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio SMS failed: ${error}`);
  }

  const result = await response.json();
  console.log(`[SMS] Sent successfully: ${result.sid}`);
}

async function sendWhatsApp(
  notification: NotificationRecord,
  config: {
    TWILIO_ACCOUNT_SID?: string;
    TWILIO_AUTH_TOKEN?: string;
    TWILIO_PHONE_NUMBER?: string;
  }
) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = config;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn("[WhatsApp] Twilio not configured - logging message instead");
    console.log(`[WhatsApp] To: ${notification.recipient}`);
    console.log(`[WhatsApp] Message: ${notification.message_body}`);
    return; // Don't throw error in development
  }

  if (!notification.recipient) {
    throw new Error("Phone number missing");
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  const body = new URLSearchParams({
    To: `whatsapp:${notification.recipient}`,
    From: `whatsapp:${TWILIO_PHONE_NUMBER}`,
    Body: notification.message_body,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio WhatsApp failed: ${error}`);
  }

  const result = await response.json();
  console.log(`[WhatsApp] Sent successfully: ${result.sid}`);
}
