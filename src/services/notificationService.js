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
  },
  verification: {
    approved: { title: 'Verification Approved', message: 'Your supplier verification has been approved' },
    rejected: { title: 'Verification Rejected', message: 'Your verification request requires attention' },
    pending: { title: 'Verification Under Review', message: 'Your verification documents are being reviewed' }
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
async function sendEmailNotification(email, title, message, link, type = 'default') {
  try {
    // Import email service dynamically to avoid loading if not configured
    const { sendEmail } = await import('./emailService');

    // Map notification types to email templates
    const templateMap = {
      'order': 'orderConfirmation',
      'rfq': 'rfqReceived',
      'quote': 'quoteSubmitted',
      'payment': 'paymentReceived',
      'message': 'default',
      'review': 'default',
      'default': 'default'
    };

    const template = templateMap[type] || 'default';

    const result = await sendEmail({
      to: email,
      subject: title,
      template,
      data: {
        title,
        message,
        buttonLink: link ? `${window.location.origin}${link}` : null
      }
    });

    if (!result.success && import.meta.env.DEV) {
      console.log('📧 Email Notification (not sent):', {
        to: email,
        subject: title,
        body: message,
        link: link,
        reason: result.error
      });
    }

    return result.success;
  } catch (error) {
    // Silently fail - email is not critical for app functionality
    if (import.meta.env.DEV) {
      console.error('Failed to send email notification:', error);
    }
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
    // Note: We intentionally avoid using auth.admin here because this code runs on the client
    // and the admin API requires a service key that should never be exposed in the browser.
    // When needed, callers should pass user_email explicitly, or we fall back to company owner email.
    if (!recipientEmail && company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('id, owner_email')
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
        link,
        type // Pass notification type for template selection
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
      .select('id', { count: 'exact' }).limit(0)
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
 * Only notifies sellers who have products in the same category
 */
export async function notifyRFQCreated(rfqId, buyerCompanyId, categoryId = null) {
  try {
    // Get RFQ details to find category
    let rfqCategoryId = categoryId;
    if (!rfqCategoryId) {
      const { data: rfq } = await supabase
        .from('rfqs')
        .select('category_id')
        .eq('id', rfqId)
        .single();
      rfqCategoryId = rfq?.category_id;
    }

    // If no category, notify all sellers (fallback)
    // RFQ notifications are business-critical - always send email
    if (!rfqCategoryId) {
      const { data: sellers } = await supabase
        .from('companies')
        .select('id, owner_email, role')
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
            related_id: rfqId,
            sendEmail: true // RFQ notifications are business-critical, always email
          });
        }
      }
      return;
    }

    // Find sellers who have products in the same category
    // First, get all products in this category
    const { data: productsInCategory } = await supabase
      .from('products')
      .select('company_id')
      .eq('category_id', rfqCategoryId)
      .eq('status', 'active');

    if (!productsInCategory || productsInCategory.length === 0) {
      // Fallback: notify all sellers if no category match found
      // RFQ notifications are business-critical - always send email
      const { data: allSellers } = await supabase
        .from('companies')
        .select('id, owner_email, role')
        .in('role', ['seller', 'hybrid']);

      if (allSellers) {
        for (const seller of allSellers) {
          await createNotification({
            company_id: seller.id,
            user_email: seller.owner_email,
            title: 'New RFQ Available',
            message: 'A new Request for Quotation has been posted',
            type: 'rfq',
            link: `/dashboard/rfqs/${rfqId}`,
            related_id: rfqId,
            sendEmail: true // RFQ notifications are business-critical, always email
          });
        }
      }
      return;
    }

    // Get unique company IDs
    const uniqueCompanyIds = [...new Set(productsInCategory.map(p => p.company_id).filter(Boolean))];

    if (uniqueCompanyIds.length === 0) {
      return;
    }

    // Get company details for these sellers
    const { data: sellers } = await supabase
      .from('companies')
      .select('id, owner_email, role')
      .in('id', uniqueCompanyIds)
      .in('role', ['seller', 'hybrid']);

    if (!sellers || sellers.length === 0) {
      return;
    }

    // Notify only relevant sellers
    // RFQ notifications are business-critical - always send email
    for (const seller of sellers) {
      await createNotification({
        company_id: seller.id,
        user_email: seller.owner_email,
        title: 'New RFQ in Your Category',
        message: 'A new Request for Quotation matching your product category has been posted',
        type: 'rfq',
        link: `/dashboard/rfqs/${rfqId}`,
        related_id: rfqId,
        sendEmail: true // RFQ notifications are business-critical, always email
      });
    }
  } catch (error) {
    console.error('Error notifying sellers about RFQ:', error);
    // Silently fail - notifications are non-critical
  }
}

/**
 * Helper to create notification when quote is submitted
 * RFQ notifications are business-critical - always send email
 */
export async function notifyQuoteSubmitted(quoteId, rfqId, buyerCompanyId) {
  await createNotification({
    company_id: buyerCompanyId,
    title: 'New Quote Received',
    message: 'A supplier has submitted a quote for your RFQ',
    type: 'quote',
    link: `/dashboard/rfqs/${rfqId}`,
    related_id: quoteId,
    sendEmail: true // RFQ responses are business-critical, always email
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
 * 
 * Core principle: Notifications trigger action, not mirror data.
 * Only notify if:
 * - User is NOT currently viewing that conversation
 * - User did NOT send the last message
 * - Email only on first message in conversation
 * 
 * @param {string} messageId - The message ID
 * @param {string} conversationId - The conversation ID
 * @param {string} receiverCompanyId - Company receiving the message
 * @param {string} senderCompanyId - Company sending the message
 * @param {object} options - Additional options
 * @param {string} options.activeConversationId - Currently viewed conversation ID (if user is on /messages)
 * @param {boolean} options.isFirstMessage - Whether this is the first message in the conversation
 */
export async function notifyNewMessage(
  messageId,
  conversationId,
  receiverCompanyId,
  senderCompanyId,
  options = {}
) {
  try {
    const { activeConversationId = null, isFirstMessage = false } = options;

    // Rule 1: Don't notify if user is viewing this conversation
    if (activeConversationId === conversationId) {
      // User is already viewing this conversation - no notification needed
      return;
    }

    // Rule 2: Check if user sent the last message (rapid back-and-forth)
    // If they did, they're likely still engaged - skip notification
    const { data: lastMessage } = await supabase
      .from('messages')
      .select('sender_company_id, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(2)
      .maybeSingle();

    // If last message was from receiver (they sent it), don't notify
    // This prevents notifications during rapid chat
    if (lastMessage && lastMessage.sender_company_id === receiverCompanyId) {
      // Check time difference - if less than 5 minutes, likely still chatting
      const messageTime = new Date(lastMessage.created_at);
      const now = new Date();
      const minutesDiff = (now - messageTime) / (1000 * 60);

      if (minutesDiff < 5) {
        // Recent message from receiver - they're likely still engaged
        return;
      }
    }

    // Get sender company info for better notification message
    let senderName = 'Someone';
    let productContext = null;
    if (senderCompanyId) {
      const { data: senderCompany } = await supabase
        .from('companies')
        .select('id, company_name')
        .eq('id', senderCompanyId)
        .maybeSingle();

      if (senderCompany?.company_name) {
        senderName = senderCompany.company_name;
      }
    }

    // Get conversation context for better notification
    const { data: conversation } = await supabase
      .from('conversations')
      .select('subject, related_to, related_type')
      .eq('id', conversationId)
      .maybeSingle();

    // Build notification message with context
    let notificationMessage = `You have a new message from ${senderName}`;
    if (conversation?.subject) {
      notificationMessage = `${senderName}: ${conversation.subject}`;
    } else if (conversation?.related_type === 'product' && conversation?.related_to) {
      // ✅ KERNEL-SCHEMA ALIGNMENT: Use 'name' instead of 'title' (DB schema uses 'name')
      // Try to get product name
      const { data: product } = await supabase
        .from('products')
        .select('name')
        .eq('id', conversation.related_to)
        .maybeSingle();

      // ✅ KERNEL-SCHEMA ALIGNMENT: Use 'name' instead of 'title' (DB schema uses 'name')
      if (product?.name || product?.title) {
        notificationMessage = `${senderName} sent a message about ${product.name || product.title}`;
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

      // Email logic: Only send email on first message in conversation
      const shouldSendEmail = isFirstMessage;

      await createNotification({
        company_id: receiverCompanyId,
        title: template.title,
        message: notificationMessage,
        type: 'message',
        link: `/messages?conversation=${conversationId}`,
        related_id: messageId,
        sendEmail: shouldSendEmail // Only email on first message
      });
    }
  } catch (error) {
    // Silently fail - notification creation is not critical
    if (import.meta.env.DEV) {
      console.error('Failed to create message notification:', error);
    }
  }
}

/**
 * Helper to create notification when verification status changes
 */
export async function notifyVerificationStatusChange(companyId, status, reviewNotes = null) {
  try {
    const template = NOTIFICATION_TEMPLATES.verification[status] || {
      title: 'Verification Status Updated',
      message: `Your verification status has been updated to ${status}`
    };

    let message = template.message;
    if (status === 'rejected' && reviewNotes) {
      message = `${template.message}. Reason: ${reviewNotes}`;
    } else if (status === 'approved') {
      message = `${template.message}. You can now enjoy all verified supplier benefits including trust badges and increased visibility.`;
    }

    await createNotification({
      company_id: companyId,
      title: template.title,
      message: message,
      type: 'verification',
      link: '/dashboard/verification-center',
      related_id: companyId,
      sendEmail: true // Verification status changes are important, always send email
    });
  } catch (error) {
    // Silently fail - notification creation is not critical
    console.error('Failed to create verification notification:', error);
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

