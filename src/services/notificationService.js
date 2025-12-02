import { supabase } from '@/api/supabaseClient';

/**
 * Create a notification for a user or company
 */
export async function createNotification({
  user_id = null,
  company_id = null,
  user_email = null,
  title,
  message,
  type = 'info',
  link = null,
  related_id = null
}) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        company_id,
        user_email,
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
    return data;
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
  const statusMessages = {
    pending: 'Order is pending confirmation',
    processing: 'Order is being processed',
    shipped: 'Order has been shipped',
    delivered: 'Order has been delivered',
    completed: 'Order has been completed',
    cancelled: 'Order has been cancelled'
  };

  // Notify buyer
  if (buyerCompanyId) {
    await createNotification({
      company_id: buyerCompanyId,
      title: 'Order Status Updated',
      message: statusMessages[newStatus] || `Order status changed to ${newStatus}`,
      type: 'order',
      link: `/dashboard/orders/${orderId}`,
      related_id: orderId
    });
  }

  // Notify seller
  if (sellerCompanyId) {
    await createNotification({
      company_id: sellerCompanyId,
      title: 'Order Status Updated',
      message: statusMessages[newStatus] || `Order status changed to ${newStatus}`,
      type: 'order',
      link: `/dashboard/orders/${orderId}`,
      related_id: orderId
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
      await createNotification({
        company_id: receiverCompanyId,
        title: 'New Message',
        message: `You have a new message from ${senderName}`,
        type: 'message',
        link: `/messages?conversation=${conversationId}`,
        related_id: messageId
      });
    }
  } catch (error) {
    // Silently fail - notification creation is not critical
    console.error('Failed to create message notification:', error);
  }
}

