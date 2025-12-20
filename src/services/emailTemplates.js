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
   * Newsletter Welcome Email - What Afrikoni is trying to do
   */
  newsletterWelcome: (data) => {
    const { email } = data;
    const content = `
      <h2 style="color: #8B4513; margin-top: 0;">Welcome to the Afrikoni Community!</h2>
      <p style="font-size: 16px; line-height: 1.8;">Thank you for subscribing to Afrikoni updates. We're excited to have you join us on this journey.</p>
      
      <div class="divider"></div>
      
      <h3 style="color: #8B4513; margin-top: 30px;">What We're Building at Afrikoni</h3>
      <p style="font-size: 15px; line-height: 1.8;">Afrikoni is more than a marketplace—we're building Africa's trusted B2B trade engine. Our mission is to connect verified African suppliers with global buyers through a platform that prioritizes trust, security, and real business outcomes.</p>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #D4A574;">
        <h4 style="color: #8B4513; margin-top: 0;">Our Vision:</h4>
        <p style="margin: 0; font-size: 15px; line-height: 1.8;">To make African trade accessible, secure, and profitable for businesses worldwide. We believe every African supplier deserves access to global markets, and every buyer deserves verified, reliable partners.</p>
      </div>
      
      <h3 style="color: #8B4513; margin-top: 30px;">What You'll Get</h3>
      <ul style="font-size: 15px; line-height: 1.8;">
        <li><strong>B2B Trade Insights</strong> - Weekly updates on African trade trends, market opportunities, and industry news</li>
        <li><strong>Supplier Spotlights</strong> - Discover new verified suppliers and their products</li>
        <li><strong>Exclusive Offers</strong> - Special deals and early access to new features</li>
        <li><strong>Platform Updates</strong> - Be the first to know about new tools, features, and improvements</li>
      </ul>
      
      <div class="divider"></div>
      
      <p style="font-size: 15px; line-height: 1.8; margin-top: 25px;"><strong>Ready to start trading?</strong> Visit our marketplace to browse verified suppliers or post a trade request (RFQ) to get matched with the right partners.</p>
      
      <p style="font-size: 14px; color: #666; margin-top: 20px;">Questions? Reply to this email anytime. We're here to help you succeed in African trade.</p>
    `;
    return baseTemplate(content, 'Explore Marketplace', 'https://afrikoni.com/marketplace');
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
   * Password Reset
   */
  passwordReset: (data) => {
    const { resetLink, userName = 'there', expiresIn = '24 hours' } = data;
    const content = `
      <h2 style="color: #8B4513; margin-top: 0;">Password Reset Request</h2>
      <p>Hello ${userName},</p>
      <p>We received a request to reset your password for your Afrikoni account.</p>
      
      <div style="background: #fff3cd; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <p style="margin: 0;"><strong>Important:</strong> This link will expire in ${expiresIn}.</p>
        <p style="margin: 5px 0 0 0; font-size: 14px;">If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
      </div>
      
      <p>Click the button below to reset your password:</p>
    `;
    return baseTemplate(content, 'Reset Password', resetLink);
  },

  /**
   * Account Verification
   */
  accountVerification: (data) => {
    const { verificationLink, userName = 'there' } = data;
    const content = `
      <h2 style="color: #8B4513; margin-top: 0;">Verify Your Email Address</h2>
      <p>Hello ${userName},</p>
      <p>Thank you for signing up with Afrikoni! Please verify your email address to complete your account setup.</p>
      
      <p>Click the button below to verify your email:</p>
    `;
    return baseTemplate(content, 'Verify Email', verificationLink);
  },

  /**
   * Order Cancelled
   */
  orderCancelled: (data) => {
    const { orderNumber, reason, refundAmount, currency = 'USD' } = data;
    const content = `
      <h2 style="color: #8B4513; margin-top: 0;">Order Cancelled</h2>
      <p>Your order #${orderNumber} has been cancelled.</p>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order Number:</strong> #${orderNumber}</p>
        ${reason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
        ${refundAmount ? `<p style="margin: 5px 0;"><strong>Refund Amount:</strong> ${currency} ${refundAmount?.toLocaleString()}</p>` : ''}
      </div>
      
      ${refundAmount ? `
        <p><strong>Refund Information:</strong></p>
        <p>If a payment was made, your refund will be processed within 5-10 business days. You'll receive a confirmation email once the refund is complete.</p>
      ` : ''}
      
      <p>If you have any questions, please contact our support team.</p>
    `;
    return baseTemplate(content, 'View Order Details', `https://afrikoni.com/dashboard/orders/${data.orderId || ''}`);
  },

  /**
   * Order Delivered
   */
  orderDelivered: (data) => {
    const { orderNumber, supplierName } = data;
    const content = `
      <h2 style="color: #8B4513; margin-top: 0;">Order Delivered!</h2>
      <p>Great news! Your order #${orderNumber} from <strong>${supplierName}</strong> has been delivered.</p>
      
      <div style="background: #f0f9f0; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #4CAF50;">
        <p style="margin: 0;"><strong>Next Steps:</strong></p>
        <ol style="margin: 10px 0 0 20px; padding: 0;">
          <li>Inspect your order to ensure everything is correct</li>
          <li>Confirm delivery in your dashboard</li>
          <li>Leave a review to help other buyers</li>
          <li>Payment will be released to the supplier after confirmation</li>
        </ol>
      </div>
      
      <p>If there are any issues with your order, please open a dispute within 48 hours.</p>
    `;
    return baseTemplate(content, 'Confirm Delivery', `https://afrikoni.com/dashboard/orders/${data.orderId || ''}`);
  },

  /**
   * Payment Released
   */
  paymentReleased: (data) => {
    const { orderNumber, amount, currency = 'USD' } = data;
    const content = `
      <h2 style="color: #8B4513; margin-top: 0;">Payment Released</h2>
      <p>Your payment of <strong>${currency} ${amount?.toLocaleString()}</strong> for Order #${orderNumber} has been released from escrow.</p>
      
      <div style="background: #f0f9f0; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #4CAF50;">
        <p style="margin: 0;"><strong>Status:</strong> Payment successfully transferred</p>
        <p style="margin: 5px 0 0 0; font-size: 14px;">The buyer has confirmed delivery and satisfaction. Funds have been released to your account.</p>
      </div>
      
      <p>Thank you for being a trusted supplier on Afrikoni!</p>
    `;
    return baseTemplate(content, 'View Order', `https://afrikoni.com/dashboard/orders/${data.orderId || ''}`);
  },

  /**
   * Contact Form Submission (Admin Notification)
   * Professional Afrikoni-themed email with enhanced visibility
   */
  contactSubmission: (data) => {
    const { name, email, category, subject, message, attachments = [], submissionDate } = data;
    
    // Determine priority badge color based on category
    let priorityColor = '#D4A574'; // Default gold
    let priorityText = 'Normal';
    if (['complaint', 'dispute', 'fraud', 'security'].includes(category?.toLowerCase())) {
      priorityColor = '#DC2626'; // Red for high priority
      priorityText = 'High Priority';
    } else if (['support', 'technical', 'billing'].includes(category?.toLowerCase())) {
      priorityColor = '#F59E0B'; // Orange for medium priority
      priorityText = 'Medium Priority';
    }
    
    const content = `
      <div style="background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center; margin-bottom: 0;">
        <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 12px 24px; border-radius: 50px; margin-bottom: 15px;">
          <span style="font-size: 32px; margin-right: 10px;">📧</span>
        </div>
        <h2 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">New Contact Form Submission</h2>
        <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Requires immediate attention</p>
      </div>

      <div style="background: #FFFFFF; padding: 0; border: 1px solid #E5E5E5; border-top: none;">
        <!-- Priority Badge -->
        <div style="background: ${priorityColor}; color: white; padding: 12px 24px; text-align: center; font-weight: 700; font-size: 14px; letter-spacing: 0.5px; text-transform: uppercase;">
          ${priorityText} • ${category || 'General Inquiry'}
        </div>

        <!-- Submission Details Card -->
        <div style="background: linear-gradient(to right, #F5F5DC 0%, #FAF0E6 100%); padding: 30px; border-bottom: 2px solid #D4A574;">
          <h3 style="color: #8B4513; margin: 0 0 20px 0; font-size: 20px; font-weight: 700; display: flex; align-items: center;">
            <span style="background: #D4A574; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 18px;">👤</span>
            Contact Information
          </h3>
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <tr style="background: #8B4513; color: white;">
              <td style="padding: 12px 20px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; width: 160px;">Field</td>
              <td style="padding: 12px 20px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Details</td>
            </tr>
            <tr style="border-bottom: 1px solid #F0F0F0;">
              <td style="padding: 16px 20px; font-weight: 600; color: #8B4513; background: #FAF0E6;">Name:</td>
              <td style="padding: 16px 20px; color: #333; font-size: 15px; font-weight: 500;">${name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F0F0F0;">
              <td style="padding: 16px 20px; font-weight: 600; color: #8B4513; background: #FAF0E6;">Email:</td>
              <td style="padding: 16px 20px;">
                <a href="mailto:${email}" style="color: #D4A574; text-decoration: none; font-weight: 600; font-size: 15px; border-bottom: 2px solid #D4A574; padding-bottom: 2px;">${email}</a>
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #F0F0F0;">
              <td style="padding: 16px 20px; font-weight: 600; color: #8B4513; background: #FAF0E6;">Category:</td>
              <td style="padding: 16px 20px;">
                <span style="background: ${priorityColor}; color: white; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;">
                  ${category || 'General'}
                </span>
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #F0F0F0;">
              <td style="padding: 16px 20px; font-weight: 600; color: #8B4513; background: #FAF0E6;">Subject:</td>
              <td style="padding: 16px 20px; color: #333; font-size: 15px; font-weight: 500;">${subject || 'No subject provided'}</td>
            </tr>
            <tr>
              <td style="padding: 16px 20px; font-weight: 600; color: #8B4513; background: #FAF0E6;">Submitted:</td>
              <td style="padding: 16px 20px; color: #666; font-size: 14px;">
                <span style="background: #F5F5DC; padding: 4px 12px; border-radius: 4px; font-weight: 600;">${submissionDate}</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Message Content Card -->
        <div style="background: #FFFFFF; padding: 30px; border-bottom: 2px solid #D4A574;">
          <h3 style="color: #8B4513; margin: 0 0 20px 0; font-size: 20px; font-weight: 700; display: flex; align-items: center;">
            <span style="background: #D4A574; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 18px;">💬</span>
            Message Content
          </h3>
          <div style="background: linear-gradient(to bottom, #FAF0E6 0%, #F5F5DC 100%); padding: 24px; border-radius: 8px; border-left: 4px solid #D4A574; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <div style="white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.8; color: #333; font-size: 15px; font-weight: 400;">
${message.replace(/\n/g, '\n')}
            </div>
          </div>
        </div>

        ${attachments.length > 0 ? `
        <!-- Attachments Card -->
        <div style="background: #FFF8DC; padding: 30px; border-bottom: 2px solid #D4A574; border-left: 4px solid #F59E0B;">
          <h3 style="color: #8B4513; margin: 0 0 20px 0; font-size: 20px; font-weight: 700; display: flex; align-items: center;">
            <span style="background: #F59E0B; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 18px;">📎</span>
            Attachments (${attachments.length})
          </h3>
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <ul style="margin: 0; padding: 0; list-style: none;">
              ${attachments.map((att, idx) => `
                <li style="padding: 12px 16px; margin-bottom: ${idx < attachments.length - 1 ? '8px' : '0'}; background: #FAF0E6; border-radius: 6px; border-left: 3px solid #D4A574;">
                  <a href="${att.url || att}" style="color: #8B4513; text-decoration: none; font-weight: 600; font-size: 14px; word-break: break-all; display: flex; align-items: center;">
                    <span style="margin-right: 8px; font-size: 18px;">📄</span>
                    ${att.name || att.url || att}
                  </a>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
        ` : ''}

        <!-- Action Required Card -->
        <div style="background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%); padding: 30px; text-align: center;">
          <div style="background: rgba(255, 255, 255, 0.15); padding: 20px; border-radius: 8px; border: 2px solid rgba(255, 255, 255, 0.3);">
            <div style="font-size: 48px; margin-bottom: 15px;">⚡</div>
            <h3 style="color: #FFFFFF; margin: 0 0 10px 0; font-size: 22px; font-weight: 700;">Action Required</h3>
            <p style="color: rgba(255, 255, 255, 0.95); margin: 0; font-size: 16px; line-height: 1.6;">
              Review this submission in the <strong>Risk & Compliance Dashboard</strong> and respond to the user within <strong>24-48 hours</strong>.
            </p>
          </div>
        </div>
      </div>
    `;
    return baseTemplate(content, 'View in Risk Dashboard', 'https://afrikoni.com/dashboard/risk?tab=contact');
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
  },

  adminNewUser: (data) => {
    const { adminName, userName, userEmail, companyName, registrationDate, viewUrl } = data;
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New User Registration</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #D4A937 0%, #C9A961 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 New User Registration</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hello ${adminName || 'Admin'},</p>
          <p style="font-size: 16px; margin-bottom: 20px;">A new user has just registered on Afrikoni:</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Name:</strong> ${userName}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${userEmail}</p>
            <p style="margin: 10px 0;"><strong>Company:</strong> ${companyName}</p>
            <p style="margin: 10px 0;"><strong>Registered:</strong> ${registrationDate}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${viewUrl || 'https://afrikoni.com/dashboard/risk'}" style="display: inline-block; background: #D4A937; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">View in Afrikoni Shield</a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">This is an automated notification from Afrikoni Shield™.</p>
        </div>
      </body>
      </html>
    `;
  }
};

