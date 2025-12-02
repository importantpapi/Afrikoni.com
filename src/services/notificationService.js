import { supabase } from '@/api/supabaseClient';

/**
 * Notification Templates
 */
const NOTIFICATION_TEMPLATES = {
  order_status: {
    pending: { title: 'Order Pending', message: 'Your order is pending confirmation' },
    processing: { title: 'Order Processing', message: 'Your order is being processed' },
    shipped: { title: 'Order Shipped', message: 'Your order has been shipped' },
    delivered: { title: 'Order Delivered', message: 'Your order has been delivered' },
    completed: { title: 'Order Completed', message: 'Your order has been completed' },
    cancelled: { title: 'Order Cancelled', message: 'Your order has been cancelled' }
  },
  rfq: {
    created: { title: 'New RFQ Available', message: 'A new Request for Quotation has been posted' },
    quote_received: { title: 'New Quote Received', message: 'A supplier has submitted a quote for your RFQ' },
    awarded: { title: 'RFQ Awarded', message: 'Your quote has been awarded' }
  },
  message: {
    new: { title: 'New Message', message: 'You have a new message' }
  },
  review: {
    received: { title: 'New Review', message: 'You received a new review' }
  },
  payment: {
    received: { title: 'Payment Received', message: 'Payment has been received' },
    released: { title: 'Payment Released', message: 'Escrow payment has been released' }
  }
};

/**
 * Get user notification preferences
 */
async function getUserNotificationPreferences(userId, companyId) {
  try {
    // Try to get from profile first
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', userId)
        .maybeSingle();
      
      if (profile?.notification_preferences) {
        const prefs = typeof profile.notification_preferences === 'string'
          ? JSON.parse(profile.notification_preferences)
          : profile.notification_preferences;
        return {
          email: prefs.email !== false,
          in_app: prefs.in_app !== false,
          order_updates: prefs.order_updates !== false,
          new_messages: prefs.new_messages !== false,
          rfq_responses: prefs.rfq_responses !== false,
          reviews: prefs.reviews !== false,
          payments: prefs.payments !== false
        };
      }
    }
    
    // Default preferences (all enabled)
    return {
      email: true,
      in_app: true,
      order_updates: true,
      new_messages: true,
      rfq_responses: true,
      reviews: true,
      payments: true
    };
  } catch (error) {
    // Return defaults on error
    return {
      email: true,
      in_app: true,
      order_updates: true,
      new_messages: true,
      rfq_responses: true,
      reviews: true,
      payments: true
    };
  }
}

/**
 * Send email notification (mock implementation - ready for real email service)
 */
async function sendEmailNotification(email, title, message, link) {
  try {
    // TODO: Integrate with real email service (SendGrid, AWS SES, Resend, etc.)
    // For now, this is a mock that logs the email
    if (import.meta.env.DEV) {
      console.log('📧 Email Notification:', {
        to: email,
        subject: title,
        body: message,
        link: link
      });
    }
    
    // In production, this would call your email service:
    // await emailService.send({
    //   to: email,
    //   subject: title,
    //   html: generateEmailTemplate(title, message, link)
    // });
    
    return true;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    return false;
  }
}

/**
 * Create a notification for a user or company
 * Now supports email notifications based on user preferences
 */
export async function createNotification({
  user_id = null,
  company_id = null,
  user_email = null,
  title,
  message,
  type = 'info',
  link = null,
  related_id = null,
  sendEmail = false, // Optional: force email send
  emailSubject = null // Optional: custom email subject
}) {
  try {
    // Get user email if not provided
    let recipientEmail = user_email;
    if (!recipientEmail && user_id) {
      const { data: user } = await supabase.auth.admin.getUserById(user_id);
      recipientEmail = user?.user?.email;
    }
    if (!recipientEmail && company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('owner_email')
        .eq('id', company_id)
        .maybeSingle();
      recipientEmail = company?.owner_email;
    }

    // Get notification preferences
    const preferences = await getUserNotificationPreferences(user_id, company_id);
    
    // Check if in-app notification should be sent
    const shouldSendInApp = preferences.in_app !== false;
    
    // Check if email should be sent
    let shouldSendEmail = sendEmail || false;
    if (!shouldSendEmail) {
      // Check type-specific preferences
      if (type === 'order' && preferences.order_updates) {
        shouldSendEmail = preferences.email;
      } else if (type === 'message' && preferences.new_messages) {
        shouldSendEmail = preferences.email;
      } else if (type === 'rfq' || type === 'quote') {
        shouldSendEmail = preferences.rfq_responses && preferences.email;
      } else if (type === 'review') {
        shouldSendEmail = preferences.reviews && preferences.email;
      } else if (type === 'payment') {
        shouldSendEmail = preferences.payments && preferences.email;
      }
    }

    // Create in-app notification
    let notification = null;
    if (shouldSendInApp) {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id,
          company_id,
          user_email: recipientEmail,
          title,
          message,
          type,
          link,
          related_id,
          read: false
        })
        .select()
        .single();

      if (error) throw error;
      notification = data;
    }

    // Send email notification if enabled
    if (shouldSendEmail && recipientEmail) {
      await sendEmailNotification(
        recipientEmail,
        emailSubject || title,
        message,
        link ? `${window.location.origin}${link}` : null
      );
    }

    return notification;
  } catch (error) {
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Mark all notifications as read for a user/company
 */
export async function markAllNotificationsAsRead(userId = null, companyId = null) {
  try {
    let query = supabase
      .from('notifications')
      .update({ read: true });

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (companyId) {
      query = query.eq('company_id', companyId);
    } else {
      throw new Error('Either userId or companyId must be provided');
    }

    const { error } = await query.eq('read', false);

    if (error) throw error;
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Get notifications for a user/company
 */
export async function getNotifications(userId = null, companyId = null, limit = 50) {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (companyId) {
      query = query.eq('company_id', companyId);
    } else {
      throw new Error('Either userId or companyId must be provided');
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId = null, companyId = null) {
  try {
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read', false);

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (companyId) {
      query = query.eq('company_id', companyId);
    } else {
      throw new Error('Either userId or companyId must be provided');
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Helper to create notification when RFQ is created
 */
export async function notifyRFQCreated(rfqId, buyerCompanyId) {
  // Notify all sellers about new RFQ
  const { data: sellers } = await supabase
    .from('companies')
    .select('id, owner_email')
    .in('role', ['seller', 'hybrid']);

  if (sellers) {
    for (const seller of sellers) {
      await createNotification({
        company_id: seller.id,
        user_email: seller.owner_email,
        title: 'New RFQ Available',
        message: 'A new Request for Quotation has been posted',
        type: 'rfq',
        link: `/dashboard/rfqs/${rfqId}`,
        related_id: rfqId
      });
    }
  }
}

/**
 * Helper to create notification when quote is submitted
 */
export async function notifyQuoteSubmitted(quoteId, rfqId, buyerCompanyId) {
  await createNotification({
    company_id: buyerCompanyId,
    title: 'New Quote Received',
    message: 'A supplier has submitted a quote for your RFQ',
    type: 'quote',
    link: `/dashboard/rfqs/${rfqId}`,
    related_id: quoteId
  });
}

/**
 * Helper to create notification when order status changes
 */
export async function notifyOrderStatusChange(orderId, newStatus, buyerCompanyId, sellerCompanyId) {
  const template = NOTIFICATION_TEMPLATES.order_status[newStatus] || {
    title: 'Order Status Updated',
    message: `Order status changed to ${newStatus}`
  };

  // Notify buyer
  if (buyerCompanyId) {
    await createNotification({
      company_id: buyerCompanyId,
      title: template.title,
      message: template.message,
      type: 'order',
      link: `/dashboard/orders/${orderId}`,
      related_id: orderId,
      sendEmail: true // Order updates are important, send email
    });
  }

  // Notify seller
  if (sellerCompanyId) {
    await createNotification({
      company_id: sellerCompanyId,
      title: template.title,
      message: template.message,
      type: 'order',
      link: `/dashboard/orders/${orderId}`,
      related_id: orderId,
      sendEmail: true
    });
  }
}

/**
 * Helper to create notification when message is received
 * This ensures every message triggers a notification, even if sent while user is offline
 */
export async function notifyNewMessage(messageId, conversationId, receiverCompanyId, senderCompanyId) {
  try {
    // Get sender company info for better notification message
    let senderName = 'Someone';
    if (senderCompanyId) {
      const { data: senderCompany } = await supabase
        .from('companies')
        .select('company_name')
        .eq('id', senderCompanyId)
        .single();
      
      if (senderCompany?.company_name) {
        senderName = senderCompany.company_name;
      }
    }

    // Check if notification already exists (prevent duplicates)
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('company_id', receiverCompanyId)
      .eq('type', 'message')
      .eq('related_id', messageId)
      .eq('read', false)
      .limit(1)
      .maybeSingle();

    // Only create if it doesn't exist
    if (!existing) {
      const template = NOTIFICATION_TEMPLATES.message.new;
      await createNotification({
        company_id: receiverCompanyId,
        title: template.title,
        message: `You have a new message from ${senderName}`,
        type: 'message',
        link: `/messages?conversation=${conversationId}`,
        related_id: messageId,
        sendEmail: true // Messages are important, send email
      });
    }
  } catch (error) {
    // Silently fail - notification creation is not critical
    console.error('Failed to create message notification:', error);
  }
}

/**
 * Helper to create notification when review is received
 */
export async function notifyReviewReceived(reviewId, companyId, reviewerName) {
  const template = NOTIFICATION_TEMPLATES.review.received;
  await createNotification({
    company_id: companyId,
    title: template.title,
    message: `You received a new review from ${reviewerName}`,
    type: 'review',
    link: `/dashboard/admin/reviews`,
    related_id: reviewId,
    sendEmail: true
  });
}

/**
 * Helper to create notification when payment is received or released
 */
export async function notifyPaymentEvent(orderId, companyId, eventType, amount, currency = 'USD') {
  const template = eventType === 'received' 
    ? NOTIFICATION_TEMPLATES.payment.received
    : NOTIFICATION_TEMPLATES.payment.released;
  
  await createNotification({
    company_id: companyId,
    title: template.title,
    message: `${template.message}: ${currency} ${amount}`,
    type: 'payment',
    link: `/dashboard/orders/${orderId}`,
    related_id: orderId,
    sendEmail: true // Payment events are critical, always send email
  });
}

