// Supabase Edge Function to generate PDF invoices
// Generates invoices for orders and stores them in Supabase Storage

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface InvoiceRequest {
  orderId: string;
  regenerate?: boolean;
}

interface OrderDetails {
  id: string;
  order_number?: string;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
  buyer_company: {
    id: string;
    company_name: string;
    country: string;
    city?: string;
    business_email?: string;
    phone?: string;
  };
  seller_company: {
    id: string;
    company_name: string;
    country: string;
    city?: string;
    business_email?: string;
    phone?: string;
  };
  items?: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get environment variables
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: "Supabase not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Verify user authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's company
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return new Response(
        JSON.stringify({ success: false, error: "User must be associated with a company" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: InvoiceRequest = await req.json();

    if (!body.orderId) {
      return new Response(
        JSON.stringify({ success: false, error: "orderId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        total_amount,
        currency,
        status,
        created_at,
        buyer_company:buyer_company_id(id, company_name, country, city, business_email, phone),
        seller_company:seller_company_id(id, company_name, country, city, business_email, phone)
      `)
      .eq("id", body.orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ success: false, error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user has access to this order
    const buyerCompany = order.buyer_company as OrderDetails["buyer_company"];
    const sellerCompany = order.seller_company as OrderDetails["seller_company"];

    if (!profile.is_admin &&
        profile.company_id !== buyerCompany?.id &&
        profile.company_id !== sellerCompany?.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Not authorized to access this order" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if invoice already exists
    const invoiceNumber = `INV-${order.order_number || order.id.slice(0, 8).toUpperCase()}`;
    const invoicePath = `${buyerCompany?.id}/${invoiceNumber}.pdf`;

    if (!body.regenerate) {
      // Check for existing invoice
      const { data: existingInvoice } = await supabase
        .from("billing_history")
        .select("invoice_url")
        .eq("related_order_id", body.orderId)
        .not("invoice_url", "is", null)
        .single();

      if (existingInvoice?.invoice_url) {
        return new Response(
          JSON.stringify({
            success: true,
            invoiceUrl: existingInvoice.invoice_url,
            invoiceNumber,
            message: "Existing invoice retrieved",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Generate PDF invoice
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const primaryColor = rgb(0.2, 0.4, 0.6);
    const textColor = rgb(0.1, 0.1, 0.1);
    const grayColor = rgb(0.5, 0.5, 0.5);

    let y = height - 50;

    // Header - Company Logo/Name
    page.drawText("AFRIKONI", {
      x: 50,
      y,
      size: 28,
      font: fontBold,
      color: primaryColor,
    });

    page.drawText("B2B Trade Platform", {
      x: 50,
      y: y - 20,
      size: 10,
      font,
      color: grayColor,
    });

    // Invoice title
    page.drawText("INVOICE", {
      x: width - 150,
      y,
      size: 24,
      font: fontBold,
      color: textColor,
    });

    y -= 60;

    // Invoice details
    page.drawText(`Invoice Number: ${invoiceNumber}`, {
      x: width - 250,
      y,
      size: 10,
      font,
      color: textColor,
    });

    y -= 15;
    page.drawText(`Date: ${new Date(order.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`, {
      x: width - 250,
      y,
      size: 10,
      font,
      color: textColor,
    });

    y -= 15;
    page.drawText(`Status: ${order.status.toUpperCase()}`, {
      x: width - 250,
      y,
      size: 10,
      font,
      color: textColor,
    });

    y -= 40;

    // Separator line
    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    y -= 30;

    // Bill To / From sections
    const colWidth = (width - 100) / 2;

    // From (Seller)
    page.drawText("FROM:", {
      x: 50,
      y,
      size: 10,
      font: fontBold,
      color: grayColor,
    });

    y -= 15;
    page.drawText(sellerCompany?.company_name || "Seller", {
      x: 50,
      y,
      size: 12,
      font: fontBold,
      color: textColor,
    });

    y -= 15;
    if (sellerCompany?.city && sellerCompany?.country) {
      page.drawText(`${sellerCompany.city}, ${sellerCompany.country}`, {
        x: 50,
        y,
        size: 10,
        font,
        color: textColor,
      });
      y -= 12;
    }

    if (sellerCompany?.business_email) {
      page.drawText(sellerCompany.business_email, {
        x: 50,
        y,
        size: 10,
        font,
        color: textColor,
      });
      y -= 12;
    }

    // To (Buyer) - same Y level as From
    let yBuyer = y + 42 + 15 + 15 + (sellerCompany?.city ? 12 : 0) + (sellerCompany?.business_email ? 12 : 0);

    page.drawText("BILL TO:", {
      x: 50 + colWidth,
      y: yBuyer,
      size: 10,
      font: fontBold,
      color: grayColor,
    });

    yBuyer -= 15;
    page.drawText(buyerCompany?.company_name || "Buyer", {
      x: 50 + colWidth,
      y: yBuyer,
      size: 12,
      font: fontBold,
      color: textColor,
    });

    yBuyer -= 15;
    if (buyerCompany?.city && buyerCompany?.country) {
      page.drawText(`${buyerCompany.city}, ${buyerCompany.country}`, {
        x: 50 + colWidth,
        y: yBuyer,
        size: 10,
        font,
        color: textColor,
      });
      yBuyer -= 12;
    }

    if (buyerCompany?.business_email) {
      page.drawText(buyerCompany.business_email, {
        x: 50 + colWidth,
        y: yBuyer,
        size: 10,
        font,
        color: textColor,
      });
    }

    y -= 50;

    // Items table header
    page.drawRectangle({
      x: 50,
      y: y - 5,
      width: width - 100,
      height: 25,
      color: rgb(0.95, 0.95, 0.95),
    });

    page.drawText("Description", {
      x: 55,
      y: y + 5,
      size: 10,
      font: fontBold,
      color: textColor,
    });

    page.drawText("Amount", {
      x: width - 150,
      y: y + 5,
      size: 10,
      font: fontBold,
      color: textColor,
    });

    y -= 30;

    // Order item (simplified - single line item for order total)
    page.drawText(`Order Payment - ${order.order_number || order.id.slice(0, 8)}`, {
      x: 55,
      y,
      size: 10,
      font,
      color: textColor,
    });

    page.drawText(`${order.currency} ${order.total_amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`, {
      x: width - 150,
      y,
      size: 10,
      font,
      color: textColor,
    });

    y -= 40;

    // Separator
    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    y -= 20;

    // Total
    page.drawText("TOTAL:", {
      x: width - 250,
      y,
      size: 12,
      font: fontBold,
      color: textColor,
    });

    page.drawText(`${order.currency} ${order.total_amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`, {
      x: width - 150,
      y,
      size: 12,
      font: fontBold,
      color: primaryColor,
    });

    y -= 60;

    // Payment info
    page.drawText("Payment Information:", {
      x: 50,
      y,
      size: 10,
      font: fontBold,
      color: textColor,
    });

    y -= 15;
    page.drawText("Payments are held in escrow until order completion.", {
      x: 50,
      y,
      size: 9,
      font,
      color: grayColor,
    });

    y -= 12;
    page.drawText("Platform commission (8%) is deducted upon release.", {
      x: 50,
      y,
      size: 9,
      font,
      color: grayColor,
    });

    // Footer
    page.drawText("Thank you for trading with Afrikoni!", {
      x: width / 2 - 80,
      y: 80,
      size: 10,
      font,
      color: primaryColor,
    });

    page.drawText("www.afrikoni.com | hello@afrikoni.com", {
      x: width / 2 - 90,
      y: 60,
      size: 9,
      font,
      color: grayColor,
    });

    page.drawText(`Generated on ${new Date().toISOString()}`, {
      x: width / 2 - 70,
      y: 40,
      size: 8,
      font,
      color: grayColor,
    });

    // Save PDF
    const pdfBytes = await pdfDoc.save();

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(invoicePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to store invoice" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get signed URL (valid for 7 days)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("invoices")
      .createSignedUrl(invoicePath, 7 * 24 * 60 * 60); // 7 days

    if (signedUrlError) {
      console.error("Signed URL error:", signedUrlError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to generate invoice URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update billing history with invoice URL
    await supabase
      .from("billing_history")
      .update({
        invoice_number: invoiceNumber,
        invoice_url: signedUrlData.signedUrl,
        invoice_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("related_order_id", body.orderId);

    return new Response(
      JSON.stringify({
        success: true,
        invoiceUrl: signedUrlData.signedUrl,
        invoiceNumber,
        message: "Invoice generated successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Invoice generation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unexpected error occurred",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
