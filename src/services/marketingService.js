/**
 * Marketing Service
 * Email/SMS templates, outreach scripts, and campaign management
 */

import { TARGET_COUNTRY, getCountryConfig } from '@/config/countryConfig';

/**
 * Generate supplier outreach email template
 */
export function generateSupplierOutreachEmail(country = null, supplierName = 'Supplier') {
  const targetCountry = country || TARGET_COUNTRY;
  const config = getCountryConfig();
  
  return {
    subject: `Join Afrikoni: Sell Your Products from ${targetCountry} to the World`,
    body: `Dear ${supplierName},

We're reaching out because you're an established exporter/manufacturer in ${targetCountry}, and we believe Afrikoni can help you reach more global buyers.

Why Join Afrikoni?
✓ Verified Payment & Escrow Protection
✓ Export-Ready Logistics Network
✓ Global Buyer Network
✓ AI-Powered Support (KoniAI)
✓ Multiple Payment Options (${config.currency} or USD)

Special Offer for ${targetCountry} Suppliers:
• First 50 suppliers: Lifetime 6% commission (instead of 8%)
• List 3+ products in first month: Free Verified Badge ($99 value)
• Refer a supplier: Both get 1 month free Growth subscription

Get started: https://afrikoni.com/supplier-acquisition/${targetCountry}

Questions? Reply to this email or visit our website.

Best regards,
Afrikoni Team`
  };
}

/**
 * Generate LinkedIn outreach script
 */
export function generateLinkedInOutreach(country = null) {
  const targetCountry = country || TARGET_COUNTRY;
  const config = getCountryConfig();
  
  return {
    connectionRequest: `Hi! I noticed you're in ${targetCountry}'s export/manufacturing sector. We're building Afrikoni, a B2B marketplace connecting ${targetCountry} suppliers with global buyers. Would love to connect and share how we can help grow your export business.`,
    
    messageTemplate: `Hi [Name],

I came across your profile and see you're involved in [industry] in ${targetCountry}. 

We're launching Afrikoni, a B2B marketplace specifically designed to help ${targetCountry} suppliers reach global buyers with:
• Secure escrow payments
• Verified buyer network
• Export logistics support
• AI-powered deal assistance

We're offering special incentives for early ${targetCountry} suppliers. Would you be interested in a quick 15-minute call to learn more?

Best,
[Your Name]
Afrikoni Team`
  };
}

/**
 * Generate SMS template
 */
export function generateSMSTemplate(country = null, type = 'supplier_invite') {
  const targetCountry = country || TARGET_COUNTRY;
  
  const templates = {
    supplier_invite: `Hi! Join Afrikoni to sell from ${targetCountry} to the world. Verified buyers, escrow payments, export logistics. Special offer for early suppliers. Visit: afrikoni.com/supplier-acquisition/${targetCountry}`,
    
    onboarding_reminder: `Hi! Complete your Afrikoni profile to start receiving orders. List your first product today: afrikoni.com/dashboard/products/new`,
    
    rfq_match: `New RFQ match! A buyer is looking for products you supply. Check it out: afrikoni.com/dashboard/rfqs`,
    
    order_update: `Your order status has been updated. Check details: afrikoni.com/dashboard/orders`
  };
  
  return templates[type] || templates.supplier_invite;
}

/**
 * Generate social media post content
 */
export function generateSocialMediaPost(type = 'supplier_spotlight', country = null) {
  const targetCountry = country || TARGET_COUNTRY;
  const config = getCountryConfig();
  
  const posts = {
    supplier_spotlight: {
      platform: 'LinkedIn',
      content: `🌟 Spotlight: ${targetCountry} Suppliers on Afrikoni 🌟

We're proud to feature exporters from ${targetCountry} who are connecting with global buyers through our platform.

Why ${targetCountry} suppliers choose Afrikoni:
✅ Secure escrow payments
✅ Verified buyer network
✅ Export logistics support
✅ AI-powered assistance

Join the network: afrikoni.com/supplier-acquisition/${targetCountry}

#AfricanTrade #B2B #Export #${targetCountry} #Afrikoni`,
      hashtags: ['AfricanTrade', 'B2B', 'Export', targetCountry.replace(' ', ''), 'Afrikoni']
    },
    
    success_story: {
      platform: 'LinkedIn',
      content: `🎉 Success Story: ${targetCountry} Supplier Completes First Trade 🎉

[Company Name] from ${targetCountry} just completed their first international order through Afrikoni!

Key highlights:
• $[Amount] order value
• Escrow-protected payment
• Smooth logistics coordination
• 5-star buyer review

Ready to start your export journey? Join Afrikoni today.

#SuccessStory #AfricanTrade #B2B #${targetCountry}`,
      hashtags: ['SuccessStory', 'AfricanTrade', 'B2B', targetCountry.replace(' ', '')]
    },
    
    logistics_announcement: {
      platform: 'LinkedIn',
      content: `🚚 Logistics Hub: ${targetCountry} 🚚

Afrikoni now offers comprehensive shipping solutions from ${targetCountry}:
• Sea freight to global destinations
• Air freight for urgent shipments
• Road transport for regional delivery
• Full tracking and insurance

Logistics partners wanted! Join our network: afrikoni.com/logistics-partner-onboarding

#Logistics #Shipping #${targetCountry} #Afrikoni`,
      hashtags: ['Logistics', 'Shipping', targetCountry.replace(' ', ''), 'Afrikoni']
    },
    
    buyer_campaign: {
      platform: 'LinkedIn',
      content: `🛒 Buy Authentic Products from ${targetCountry} 🛒

Looking for [popular products]? Source directly from verified ${targetCountry} suppliers on Afrikoni:
• Quality guaranteed
• Escrow protection
• Transparent pricing
• Export-ready logistics

Special offer: First 50 orders get waived escrow fees!

Browse suppliers: afrikoni.com/marketplace?country=${targetCountry}

#Sourcing #B2B #${targetCountry} #AfricanProducts`,
      hashtags: ['Sourcing', 'B2B', targetCountry.replace(' ', ''), 'AfricanProducts']
    }
  };
  
  return posts[type] || posts.supplier_spotlight;
}

/**
 * Generate content calendar (3 months)
 */
export function generateContentCalendar(country = null) {
  const targetCountry = country || TARGET_COUNTRY;
  const calendar = [];
  const today = new Date();
  
  const postTypes = [
    'supplier_spotlight',
    'success_story',
    'logistics_announcement',
    'buyer_campaign',
    'supplier_spotlight',
    'success_story'
  ];
  
  for (let week = 0; week < 12; week++) {
    const date = new Date(today);
    date.setDate(date.getDate() + (week * 7));
    
    const postType = postTypes[week % postTypes.length];
    const post = generateSocialMediaPost(postType, targetCountry);
    
    calendar.push({
      week: week + 1,
      date: date.toISOString().split('T')[0],
      type: postType,
      platform: post.platform,
      content: post.content,
      hashtags: post.hashtags
    });
  }
  
  return calendar;
}

/**
 * Generate product brochure template
 */
export function generateProductBrochureTemplate(productData) {
  return {
    title: `${productData.name} - ${productData.supplier}`,
    sections: [
      {
        heading: 'Product Overview',
        content: productData.description
      },
      {
        heading: 'Specifications',
        content: productData.specifications || 'Available upon request'
      },
      {
        heading: 'Pricing',
        content: `${productData.currency} ${productData.price} per ${productData.unit}`
      },
      {
        heading: 'Minimum Order Quantity',
        content: `${productData.moq} ${productData.unit}`
      },
      {
        heading: 'Delivery',
        content: productData.delivery_time || 'As per agreement'
      },
      {
        heading: 'Why Buy from Afrikoni?',
        content: '✓ Verified Supplier\n✓ Escrow Protection\n✓ Quality Guaranteed\n✓ Export-Ready Logistics'
      }
    ]
  };
}

export default {
  generateSupplierOutreachEmail,
  generateLinkedInOutreach,
  generateSMSTemplate,
  generateSocialMediaPost,
  generateContentCalendar,
  generateProductBrochureTemplate
};
