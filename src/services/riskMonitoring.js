/**
 * Risk Monitoring Service
 * Handles real-time risk detection, alerts, and admin notifications
 */

import { supabase } from '@/api/supabaseClient';
import { sendEmail } from '@/services/emailService';

/**
 * Create admin notification for new user registration
 * Also sends email notification to admins
 */
export async function notifyAdminOfNewRegistration(userId, userEmail, userName, companyName) {
  try {
    // Get all admin users
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id, email')
      .or('is_admin.eq.true,email.eq.hello@afrikoni.com');

    if (!adminProfiles || adminProfiles.length === 0) {
      console.warn('No admin users found to notify');
      return;
    }

    const userNameDisplay = userName || userEmail?.split('@')[0] || 'New User';
    const companyDisplay = companyName || 'No company yet';

    // Create notification for each admin
    const notifications = adminProfiles.map(admin => ({
      user_id: admin.id,
      title: '🎉 New User Registration',
      message: `${userNameDisplay} (${companyDisplay}) just registered on the platform.`,
      type: 'system',
      priority: 'high',
      metadata: {
        new_user_id: userId,
        new_user_email: userEmail,
        new_user_name: userName,
        company_name: companyName,
        action_url: '/dashboard/risk'
      },
      read: false,
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error creating admin notifications:', error);
    } else {
      console.log(`✅ Created ${notifications.length} admin notifications for new registration`);
    }

    // Send email notifications to admins
    for (const admin of adminProfiles) {
      if (admin.email) {
        try {
          await sendEmail({
            to: admin.email,
            subject: `🎉 New User Registration: ${userNameDisplay}`,
            template: 'adminNewUser',
            data: {
              adminName: admin.email.split('@')[0],
              userName: userNameDisplay,
              userEmail: userEmail,
              companyName: companyDisplay,
              registrationDate: new Date().toLocaleString(),
              viewUrl: `${window.location.origin}/dashboard/risk`
            }
          });
        } catch (emailError) {
          console.warn(`Failed to send email to admin ${admin.email}:`, emailError);
          // Don't fail the whole process if one email fails
        }
      }
    }

  } catch (error) {
    console.error('Error in notifyAdminOfNewRegistration:', error);
  }
}

/**
 * Notify admins when a user completes onboarding
 */
export async function notifyAdminOfOnboardingCompletion(userId, userEmail, userName, companyName) {
  try {
    // Get all admin users
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id, email')
      .or('is_admin.eq.true,email.eq.hello@afrikoni.com');

    if (!adminProfiles || adminProfiles.length === 0) {
      console.warn('No admin users found to notify');
      return;
    }

    const userNameDisplay = userName || userEmail?.split('@')[0] || 'New User';
    const companyDisplay = companyName || 'No company';

    // Create notification for each admin
    const notifications = adminProfiles.map(admin => ({
      user_id: admin.id,
      title: '✅ User Completed Onboarding',
      message: `${userNameDisplay} from ${companyDisplay} completed onboarding and is now active.`,
      type: 'system',
      priority: 'medium',
      metadata: {
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
        company_name: companyName,
        action_url: '/dashboard/risk'
      },
      read: false,
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error creating onboarding notifications:', error);
    } else {
      console.log(`✅ Created ${notifications.length} admin notifications for onboarding completion`);
    }

  } catch (error) {
    console.error('Error in notifyAdminOfOnboardingCompletion:', error);
  }
}

/**
 * Create admin notification for critical risk event
 */
export async function notifyAdminOfRiskEvent(eventType, severity, title, description, metadata = {}) {
  try {
    // Get all admin users
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id')
      .or('is_admin.eq.true,email.eq.hello@afrikoni.com');

    if (!adminProfiles || adminProfiles.length === 0) {
      console.warn('No admin users found to notify');
      return;
    }

    // Create notification for each admin
    const notifications = adminProfiles.map(admin => ({
      user_id: admin.id,
      title: `⚠️ ${title}`,
      message: description,
      type: eventType,
      priority: severity,
      metadata: {
        ...metadata,
        action_url: '/dashboard/risk'
      },
      read: false,
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error creating risk notifications:', error);
    } else {
      console.log(`✅ Created ${notifications.length} admin notifications for risk event`);
    }

  } catch (error) {
    console.error('Error in notifyAdminOfRiskEvent:', error);
  }
}

/**
 * Monitor and analyze real-time risk indicators
 */
export async function analyzeRiskIndicators() {
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Check for high-risk patterns
    const risks = [];

    // 1. Check for multiple failed orders from same company
    const { data: failedOrders } = await supabase
      .from('orders')
      .select('buyer_company_id, seller_company_id')
      .eq('payment_status', 'refunded')
      .gte('created_at', twentyFourHoursAgo.toISOString());

    if (failedOrders && failedOrders.length >= 3) {
      risks.push({
        type: 'payment_fraud',
        severity: 'high',
        title: 'Multiple Failed Orders Detected',
        description: `${failedOrders.length} orders failed in the last 24 hours. Possible payment fraud.`
      });
    }

    // 2. Check for high-risk audit logs
    const { data: criticalLogs } = await supabase
      .from('audit_log')
      .select('*')
      .eq('risk_level', 'critical')
      .gte('created_at', twentyFourHoursAgo.toISOString());

    if (criticalLogs && criticalLogs.length > 0) {
      risks.push({
        type: 'security',
        severity: 'critical',
        title: 'Critical Security Events Detected',
        description: `${criticalLogs.length} critical security events in the last 24 hours.`,
        metadata: { event_count: criticalLogs.length }
      });
    }

    // 3. Check for delayed shipments
    const { data: delayedShipments } = await supabase
      .from('shipments')
      .select('*')
      .in('status', ['pending', 'picked_up'])
      .lt('estimated_delivery', new Date().toISOString());

    if (delayedShipments && delayedShipments.length >= 5) {
      risks.push({
        type: 'logistics',
        severity: 'medium',
        title: 'Multiple Delayed Shipments',
        description: `${delayedShipments.length} shipments are delayed and require attention.`
      });
    }

    // 4. Check for unverified companies with high activity
    const { data: unverifiedCompanies } = await supabase
      .from('companies')
      .select('id, company_name, products(count)')
      .eq('verification_status', 'pending')
      .gte('created_at', twentyFourHoursAgo.toISOString());

    if (unverifiedCompanies && unverifiedCompanies.length >= 5) {
      risks.push({
        type: 'compliance',
        severity: 'medium',
        title: 'Pending Verifications Accumulating',
        description: `${unverifiedCompanies.length} companies awaiting verification.`
      });
    }

    // Notify admins of detected risks
    for (const risk of risks) {
      await notifyAdminOfRiskEvent(
        risk.type,
        risk.severity,
        risk.title,
        risk.description,
        risk.metadata || {}
      );
    }

    return risks;

  } catch (error) {
    console.error('Error analyzing risk indicators:', error);
    return [];
  }
}

/**
 * Track user activity patterns for anomaly detection
 */
export async function detectAnomalousActivity(userId, companyId) {
  try {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Check for rapid activity (potential bot/fraud)
    const { data: recentActivity, count } = await supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .eq('actor_user_id', userId)
      .gte('created_at', oneHourAgo.toISOString());

    // If more than 50 actions in 1 hour, flag as suspicious
    if (count && count > 50) {
      await supabase
        .from('audit_log')
        .insert({
          action: 'suspicious_activity_detected',
          entity_type: 'user',
          entity_id: userId,
          actor_user_id: userId,
          actor_company_id: companyId,
          status: 'warning',
          risk_level: 'high',
          metadata: {
            action_count: count,
            time_window: '1_hour',
            reason: 'Unusually high activity rate'
          }
        });

      await notifyAdminOfRiskEvent(
        'security',
        'high',
        'Suspicious User Activity',
        `User ${userId} performed ${count} actions in 1 hour. Possible bot or automated attack.`,
        { user_id: userId, action_count: count }
      );

      return true;
    }

    return false;

  } catch (error) {
    console.error('Error detecting anomalous activity:', error);
    return false;
  }
}

/**
 * Generate daily risk report
 */
export async function generateDailyRiskReport() {
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Aggregate all risk metrics
    const [
      disputes,
      fraudAlerts,
      delayedShipments,
      pendingVerifications,
      failedPayments
    ] = await Promise.all([
      supabase.from('disputes').select('*', { count: 'exact' }).in('status', ['open', 'under_review']),
      supabase.from('audit_log').select('*', { count: 'exact' }).in('risk_level', ['high', 'critical']).gte('created_at', twentyFourHoursAgo.toISOString()),
      supabase.from('shipments').select('*', { count: 'exact' }).in('status', ['pending', 'picked_up']).lt('estimated_delivery', new Date().toISOString()),
      supabase.from('companies').select('*', { count: 'exact' }).eq('verification_status', 'pending'),
      supabase.from('orders').select('*', { count: 'exact' }).eq('payment_status', 'refunded').gte('created_at', twentyFourHoursAgo.toISOString())
    ]);

    const report = {
      date: new Date().toISOString(),
      summary: {
        openDisputes: disputes.count || 0,
        fraudAlerts24h: fraudAlerts.count || 0,
        delayedShipments: delayedShipments.count || 0,
        pendingVerifications: pendingVerifications.count || 0,
        failedPayments24h: failedPayments.count || 0
      },
      overallRiskScore: Math.min(100, Math.round(
        (disputes.count || 0) * 5 +
        (fraudAlerts.count || 0) * 10 +
        (delayedShipments.count || 0) * 2 +
        (failedPayments.count || 0) * 3
      ))
    };

    console.log('📊 Daily Risk Report:', report);

    // Notify admins if overall risk is high
    if (report.overallRiskScore > 50) {
      await notifyAdminOfRiskEvent(
        'system',
        'high',
        'Daily Risk Report - High Risk Detected',
        `Platform risk score: ${report.overallRiskScore}/100. Review required.`,
        report.summary
      );
    }

    return report;

  } catch (error) {
    console.error('Error generating daily risk report:', error);
    return null;
  }
}

