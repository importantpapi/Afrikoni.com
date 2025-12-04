/**
 * Email Templates for Afrikoni
 * 
 * Professional, mobile-responsive HTML email templates
 */

const baseStyles = `
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #D4A574 0%, #8B4513 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; }
    .button { display: inline-block; padding: 12px 24px; background: #D4A574; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
    .divider { border-top: 1px solid #e5e5e5; margin: 20px 0; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 20px !important; }
    }
  </style>
`;

const baseTemplate = (content, buttonText = null, buttonLink = null) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${baseStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">AFRIKONI</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Trade. Trust. Thrive.</p>
    </div>
    <div class="content">
      ${content}
      ${buttonText && buttonLink ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${buttonLink}" class="button">${buttonText}</a>
        </div>
      ` : ''}
    </div>
    <div class="footer">
      <p style="margin: 0 0 10px 0;">
        <strong>Afrikoni</strong> - Africa's Leading B2B Marketplace
      </p>
      <p style="margin: 0 0 10px 0;">
        <a href="https://afrikoni.com" style="color: #D4A574; text-decoration: none;">Visit Website</a> | 
        <a href="https://afrikoni.com/help" style="color: #D4A574; text-decoration: none;">Help Center</a> | 
        <a href="mailto:hello@afrikoni.com" style="color: #D4A574; text-decoration: none;">Contact Us</a>
      </p>
      <p style="margin: 0; font-size: 11px; color: #999;">
        You're receiving this email because you have an account with Afrikoni.<br>
        Questions? Reply to this email or contact us at <a href="mailto:hello@afrikoni.com" style="color: #D4A574;">hello@afrikoni.com</a><br>
        © ${new Date().getFullYear()} Afrikoni. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;

export const emailTemplates = {
  /**
   * Welcome Email
   */
  welcome: (data) => {
    const { userName = 'there' } = data;
    const content = `
      <h2 style="color: #8B4513; margin-top: 0;">Welcome to Afrikoni, ${userName}!</h2>
      <p>We're thrilled to have you join Africa's leading B2B marketplace. You're now part of a community connecting verified suppliers and buyers across 54 African countries.</p>
      
      <div class="divider"></div>
      
      <h3 style="color: #8B4513;">Get Started:</h3>
      <ul>
        <li><strong>Complete your profile</strong> - Add your company details and verification documents</li>
        <li><strong>Browse products</strong> - Discover thousands of verified African suppliers</li>
        <li><strong>Create an RFQ</strong> - Get quotes from multiple suppliers</li>
        <li><strong>Start trading</strong> - Protected by Trade Shield escrow</li>
      </ul>
      
      <p>Need help? Check out our <a href="https://afrikoni.com/help" style="color: #D4A574;">Help Center</a> or reply to this email.</p>
    `;
    return baseTemplate(content, 'Go to Dashboard', 'https://afrikoni.com/dashboard');
  },

  /**
   * Order Confirmation
   */
  orderConfirmation: (data) => {
    const { orderNumber, productName, quantity, totalAmount, currency = 'USD', supplierName, estimatedDelivery } = data;
    const content = `
      <h2 style="color: #8B4513; margin-top: 0;">Order Confirmed!</h2>
      <p>Thank you for your order. Your payment has been received and is being held securely in Trade Shield escrow.</p>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order Number:</strong> #${orderNumber}</p>
        <p style="margin: 5px 0;"><strong>Product:</strong> ${productName}</p>
        <p style="margin: 5px 0;"><strong>Quantity:</strong> ${quantity}</p>
        <p style="margin: 5px 0;"><strong>Supplier:</strong> ${supplierName}</p>
        <p style="margin: 5px 0;"><strong>Total Amount:</strong> ${currency} ${totalAmount?.toLocaleString()}</p>
        ${estimatedDelivery ? `<p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>` : ''}
      </div>
      
      <p><strong>What happens next?</strong></p>
      <ol>
        <li>The supplier will prepare and ship your order</li>
        <li>You'll receive tracking information via email</li>
        <li>Once you confirm delivery, payment will be released to the supplier</li>
      </ol>
      
      <p>Your funds are protected by Trade Shield escrow until you confirm satisfaction.</p>
    `;
    return baseTemplate(content, 'View Order', `https://afrikoni.com/dashboard/orders/${data.orderId || ''}`);
  },

  /**
   * RFQ Received
   */
  rfqReceived: (data) => {
    const { title, category, quantity, buyerName, deadline, description } = data;
    const content = `
      <h2 style="color: #8B4513; margin-top: 0;">New RFQ Opportunity!</h2>
      <p>You have received a new Request for Quotation from <strong>${buyerName}</strong>.</p>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Title:</strong> ${title}</p>
        <p style="margin: 5px 0;"><strong>Category:</strong> ${category}</p>
        <p style="margin: 5px 0;"><strong>Quantity:</strong> ${quantity}</p>
        ${deadline ? `<p style="margin: 5px 0;"><strong>Deadline:</strong> ${deadline}</p>` : ''}
        ${description ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${description}</p>` : ''}
      </div>
      
      <p>Submit your competitive quote to win this order. Verified suppliers with faster response times get priority placement.</p>
    `;
    return baseTemplate(content, 'Submit Quote', `https://afrikoni.com/dashboard/rfqs/${data.rfqId || ''}`);
  },

  /**
   * Quote Submitted
   */
  quoteSubmitted: (data) => {
    const { rfqTitle, supplierName, quoteAmount, currency = 'USD', validity } = data;
    const content = `
      <h2 style="color: #8B4513; margin-top: 0;">New Quote Received!</h2>
      <p><strong>${supplierName}</strong> has submitted a quote for your RFQ.</p>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>RFQ:</strong> ${rfqTitle}</p>
        <p style="margin: 5px 0;"><strong>Quote Amount:</strong> ${currency} ${quoteAmount?.toLocaleString()}</p>
        ${validity ? `<p style="margin: 5px 0;"><strong>Valid Until:</strong> ${validity}</p>` : ''}
      </div>
      
      <p>Review all quotes and select the best offer. You can negotiate terms directly with suppliers through our messaging system.</p>
    `;
    return baseTemplate(content, 'View RFQ', `https://afrikoni.com/dashboard/rfqs/${data.rfqId || ''}`);
  },

  /**
   * Payment Received
   */
  paymentReceived: (data) => {
    const { amount, currency = 'USD', orderNumber, buyerName } = data;
    const content = `
      <h2 style="color: #8B4513; margin-top: 0;">Payment Received!</h2>
      <p>Great news! You've received a payment of <strong>${currency} ${amount?.toLocaleString()}</strong> for Order #${orderNumber}.</p>
      
      <div style="background: #f0f9f0; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #4CAF50;">
        <p style="margin: 0;"><strong>Status:</strong> Funds held in Trade Shield escrow</p>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Payment will be released once the buyer confirms delivery and satisfaction.</p>
      </div>
      
      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Prepare and ship the order</li>
        <li>Provide tracking information</li>
        <li>Once buyer confirms, funds will be released to your account</li>
      </ol>
    `;
    return baseTemplate(content, 'View Order', `https://afrikoni.com/dashboard/orders/${data.orderId || ''}`);
  },

  /**
   * Order Shipped
   */
  orderShipped: (data) => {
    const { orderNumber, trackingNumber, carrier, estimatedDelivery, supplierName } = data;
    const content = `
      <h2 style="color: #8B4513; margin-top: 0;">Your Order Has Shipped!</h2>
      <p>Great news! Your order #${orderNumber} from <strong>${supplierName}</strong> has been shipped.</p>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order Number:</strong> #${orderNumber}</p>
        <p style="margin: 5px 0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>
        <p style="margin: 5px 0;"><strong>Carrier:</strong> ${carrier}</p>
        ${estimatedDelivery ? `<p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>` : ''}
      </div>
      
      <p>Track your shipment and update the order status once you receive it. Your payment will be released to the supplier after you confirm delivery.</p>
    `;
    return baseTemplate(content, 'Track Order', `https://afrikoni.com/dashboard/orders/${data.orderId || ''}`);
  },

  /**
   * Dispute Opened
   */
  disputeOpened: (data) => {
    const { orderNumber, disputeReason, openedBy, orderId } = data;
    const content = `
      <h2 style="color: #8B4513; margin-top: 0;">Dispute Opened</h2>
      <p>A dispute has been opened for Order #${orderNumber} by <strong>${openedBy}</strong>.</p>
      
      <div style="background: #fff3cd; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <p style="margin: 0;"><strong>Reason:</strong> ${disputeReason}</p>
      </div>
      
      <p><strong>What happens next?</strong></p>
      <ol>
        <li>Our dispute resolution team will review the case within 48 hours</li>
        <li>We may request additional information or evidence</li>
        <li>A fair resolution will be provided based on our policies</li>
        <li>Funds remain in escrow until resolution</li>
      </ol>
      
      <p>Please respond promptly to help us resolve this quickly. You can add comments and evidence in the dispute details.</p>
    `;
    return baseTemplate(content, 'View Dispute', `https://afrikoni.com/dashboard/orders/${orderId || ''}`);
  },

  /**
   * Default template
   */
  default: (data) => {
    const { title = 'Notification', message = '', buttonText = null, buttonLink = null } = data;
    const content = `
      <h2 style="color: #8B4513; margin-top: 0;">${title}</h2>
      <p>${message}</p>
    `;
    return baseTemplate(content, buttonText, buttonLink);
  }
};

