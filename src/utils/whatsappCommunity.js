/**
 * WhatsApp Community Integration
 * Reusable function to open WhatsApp community link
 */

/**
 * Opens the WhatsApp Community link in a new tab
 * Tracks analytics event
 */
export const openWhatsAppCommunity = (source = 'unknown') => {
  const link = import.meta.env.VITE_WHATSAPP_COMMUNITY_LINK || 'https://chat.whatsapp.com/KmhNH1jLkPrHg18ktpNa5v';
  
  // Track analytics
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'join_whatsapp_clicked', {
        source: source,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    // Analytics not available, continue anyway
    if (import.meta.env.DEV) {
      console.log('Analytics not available:', error);
    }
  }
  
  // Open WhatsApp link in new tab
  window.open(link, '_blank', 'noopener,noreferrer');
};

/**
 * Generates QR code data URL for WhatsApp community link
 * Uses a QR code API service
 */
export const generateWhatsAppQRCode = (link) => {
  const whatsappLink = link || import.meta.env.VITE_WHATSAPP_COMMUNITY_LINK || 'https://chat.whatsapp.com/KmhNH1jLkPrHg18ktpNa5v';
  // Using a free QR code API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(whatsappLink)}`;
  return qrCodeUrl;
};

