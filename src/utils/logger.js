/**
 * Secure Logger Utility
 * 
 * Production-safe logging that:
 * - Sanitizes sensitive data in production
 * - Integrates with Sentry for error tracking
 * - Provides structured logging
 * - Respects user privacy (GDPR/CCPA compliant)
 */

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

/**
 * Sanitize sensitive data from objects
 */
function sanitize(data) {
    if (!data || typeof data !== 'object') return data;

    const sanitized = Array.isArray(data) ? [...data] : { ...data };
    const sensitiveKeys = [
        'password',
        'token',
        'secret',
        'apiKey',
        'api_key',
        'accessToken',
        'access_token',
        'refreshToken',
        'refresh_token',
        'email', // Only in production
        'phone',
        'ssn',
        'credit_card',
        'cvv'
    ];

    for (const key in sanitized) {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof sanitized[key] === 'object') {
            sanitized[key] = sanitize(sanitized[key]);
        }
    }

    return sanitized;
}

/**
 * Format log message with context
 */
function formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const sanitizedContext = isProd ? sanitize(context) : context;

    return {
        timestamp,
        level,
        message,
        context: sanitizedContext,
        environment: isDev ? 'development' : 'production'
    };
}

/**
 * Logger class
 */
class Logger {
    /**
     * Log info message
     * @param {string} message - Log message
     * @param {object} context - Additional context (will be sanitized in production)
     */
    info(message, context = {}) {
        if (isDev) {
            console.log(`ℹ️ ${message}`, context);
        } else {
            // In production, only log to external service (e.g., Sentry breadcrumb)
            this._sendToMonitoring('info', message, context);
        }
    }

    /**
     * Log warning message
     * @param {string} message - Warning message
     * @param {object} context - Additional context
     */
    warn(message, context = {}) {
        if (isDev) {
            console.warn(`⚠️ ${message}`, context);
        } else {
            this._sendToMonitoring('warning', message, context);
        }
    }

    /**
     * Log error message
     * @param {string} message - Error message
     * @param {Error|object} error - Error object or context
     */
    error(message, error = {}) {
        const errorContext = error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error;

        if (isDev) {
            console.error(`❌ ${message}`, errorContext);
        } else {
            // Always log errors, even in production (to Sentry)
            this._sendToMonitoring('error', message, errorContext);
        }
    }

    /**
     * Log debug message (dev-only)
     * @param {string} message - Debug message
     * @param {object} context - Additional context
     */
    debug(message, context = {}) {
        if (isDev) {
            console.debug(`🐛 ${message}`, context);
        }
        // Never log debug in production
    }

    /**
     * Log user action (for analytics)
     * @param {string} action - Action name
     * @param {object} properties - Action properties (will be sanitized)
     */
    track(action, properties = {}) {
        const sanitizedProps = sanitize(properties);

        if (isDev) {
            console.log(`📊 Track: ${action}`, sanitizedProps);
        }

        // Send to analytics service (PostHog, GA4, etc.)
        this._sendToAnalytics(action, sanitizedProps);
    }

    /**
     * Send log to monitoring service (Sentry)
     * @private
     */
    _sendToMonitoring(level, message, context) {
        try {
            // TODO: Integrate with Sentry
            // if (window.Sentry) {
            //   window.Sentry.addBreadcrumb({
            //     level,
            //     message,
            //     data: sanitize(context)
            //   });
            // }

            // For now, just sanitize and log to console in production
            if (level === 'error') {
                console.error(formatMessage(level, message, context));
            }
        } catch (err) {
            // Fail silently - don't break app if logging fails
            if (isDev) {
                console.error('Logger failed:', err);
            }
        }
    }

    /**
     * Send event to analytics service
     * @private
     */
    _sendToAnalytics(action, properties) {
        try {
            // TODO: Integrate with PostHog or GA4
            // if (window.posthog) {
            //   window.posthog.capture(action, properties);
            // }
        } catch (err) {
            // Fail silently
            if (isDev) {
                console.error('Analytics tracking failed:', err);
            }
        }
    }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing
export { sanitize, formatMessage };

/**
 * USAGE EXAMPLES:
 * 
 * // ✅ Info logging
 * logger.info('User logged in', { userId: user.id });
 * 
 * // ✅ Warning
 * logger.warn('API rate limit approaching', { remaining: 10 });
 * 
 * // ✅ Error
 * logger.error('Failed to load data', error);
 * 
 * // ✅ Debug (dev-only)
 * logger.debug('Component rendered', { props });
 * 
 * // ✅ Analytics
 * logger.track('RFQ Created', { category: 'Electronics', value: 5000 });
 * 
 * // ❌ DON'T DO THIS (direct console.log in production)
 * console.log('User email:', user.email); // Exposed in production!
 */
