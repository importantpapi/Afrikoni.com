/**
 * TELEMETRY SERVICE (The Black Box)
 * 
 * Abstract wrapper for Sentry/PostHog.
 * Currently logs to console in DEV, ready for API keys in PROD.
 */

const isDev = import.meta.env.DEV;

class TelemetryService {
    constructor() {
        this.initialized = false;
        this.user = null;
    }

    init() {
        if (this.initialized) return;

        if (isDev) {
            console.log('[Telemetry] Initialized (Console Mode)');
        } else {
            // Placeholder: Sentry.init({...})
        }
        this.initialized = true;
    }

    identifyUser(user) {
        this.user = user;
        if (isDev) {
            console.log('[Telemetry] User Identified:', user.id);
        } else {
            // Placeholder: Sentry.setUser({ id: user.id, email: user.email })
            // Placeholder: PostHog.identify(user.id)
        }
    }

    logError(error, context = {}) {
        if (isDev) {
            console.error('[Telemetry] Error Captured:', error, context);
        } else {
            // Placeholder: Sentry.captureException(error, { extra: context })
        }
    }

    trackEvent(eventName, properties = {}) {
        if (isDev) {
            console.log(`[Telemetry] Event: ${eventName}`, properties);
        } else {
            // Placeholder: PostHog.capture(eventName, properties)
        }
    }

    breadcrumb(message, category = 'ui') {
        if (isDev) {
            // console.debug(`[Telemetry] Breadcrumb: [${category}] ${message}`);
        } else {
            // Placeholder: Sentry.addBreadcrumb({ message, category })
        }
    }
}

export const telemetry = new TelemetryService();
