import React from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Surface } from '@/components/system/Surface';

import { telemetry } from '@/services/telemetryService';

/**
 * Trade OS Error Boundary
 * catches render errors and displays a "Crash Screen" matching the OS aesthetic.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // ✅ MOBILE FIX: Classify error severity
    const errorString = error?.toString() || '';
    const isRecoverable =
      errorString.includes('Cannot read') ||
      errorString.includes('undefined') ||
      errorString.includes('null') ||
      errorString.includes('QuotaExceededError') ||
      errorString.includes('SecurityError') ||
      errorString.includes('Storage');

    const severity = isRecoverable ? 'RECOVERABLE' : 'CRITICAL';

    console.error(`[Trade OS] ${severity} Error caught by boundary:`, error, errorInfo);
    telemetry.logError(error, {
      componentStack: errorInfo?.componentStack,
      location: window.location.href,
      severity,
      recoverable: isRecoverable
    });
    this.setState({ errorInfo });
  }

  handleReload = () => {
    // ✅ VIBRANIUM STABILIZATION: Safe reload, does NOT clear storage
    telemetry.trackEvent('system_crash_reload');
    window.location.reload();
  };

  handleRetry = () => {
    // ✅ MOBILE FIX: Retry mechanism for recoverable errors
    telemetry.trackEvent('system_error_retry', { retryCount: this.state.retryCount });
    this.setState({ hasError: false, error: null, errorInfo: null, retryCount: this.state.retryCount + 1 });
  };

  handleReset = async () => {
    // ☢️ NUCLEAR OPTION: Only used when everything else fails
    telemetry.trackEvent('system_crash_hard_reset');

    try {
      // Nuclear Option: Clear specific critical keys to force clean state
      localStorage.removeItem('afrikoni_last_company_id');
      localStorage.removeItem('afrikoni_has_session');
    } catch (e) {
      console.warn('[ErrorBoundary] Storage clear failed:', e);
    }

    // Unregister service workers for total reset
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      } catch (e) {
        console.error('[ErrorBoundary] SW unregistration failed:', e);
      }
    }

    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;

      // ✅ MOBILE FIX: Classify error as recoverable or critical
      const isRecoverable =
        this.state.error?.message?.includes('Cannot read') ||
        this.state.error?.message?.includes('undefined') ||
        this.state.error?.message?.includes('null') ||
        this.state.error?.toString().includes('Warning');

      const canRetry = isRecoverable && this.state.retryCount < 3;

      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] text-white p-6 relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] ${isRecoverable ? 'bg-amber-900/10' : 'bg-red-900/10'} rounded-full blur-[120px] pointer-events-none`} />

          <Surface variant="glass" className={`max-w-xl w-full p-8 md:p-12 ${isRecoverable ? 'border-amber-500/20' : 'border-os-red/20'} relative z-10 shadow-2xl ${isRecoverable ? 'shadow-amber-900/20' : 'shadow-red-900/20'}`}>
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full ${isRecoverable ? 'bg-amber-500/10' : 'bg-os-red/10'} flex items-center justify-center mb-6 animate-pulse`}>
                <AlertTriangle className={`w-8 h-8 ${isRecoverable ? 'text-amber-500' : 'text-os-red'}`} />
              </div>

              <h1 className="text-os-2xl font-light tracking-tight mb-2">
                {isRecoverable ? 'System Synchronization Issue' : 'System Encountered a Critical Error'}
              </h1>
              <p className="text-white/60 mb-8 max-w-md">
                {isRecoverable
                  ? 'The dashboard experienced a timing issue during boot. This is typically resolved by retrying the connection.'
                  : 'The Trade OS Kernel encountered an unexpected state and halted execution to protect data integrity.'
                }
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    className="bg-amber-600 hover:bg-amber-700 text-white min-w-[160px]"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Connection
                  </Button>
                )}

                <Button
                  onClick={this.handleReload}
                  className={`${isRecoverable ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'} text-white min-w-[160px]`}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {canRetry ? 'Force Reload' : 'Restart System'}
                </Button>

                {!canRetry && (
                  <Button
                    onClick={() => window.location.href = '/dashboard'}
                    variant="outline"
                    className="border-white/10 hover:bg-white/5 min-w-[160px]"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Return to Dashboard
                  </Button>
                )}
              </div>

              {/* Advanced Recovery (Hidden by default or smaller) */}
              <button
                onClick={this.handleReset}
                className="mt-8 text-os-xs text-white/30 hover:text-red-400 underline transition-colors"
              >
                Clear Cache & Hard Reset
              </button>

              {/* Dev Details */}
              {isDev && this.state.error && (
                <div className="mt-8 p-4 bg-black/50 rounded border border-white/5 text-left w-full overflow-auto max-h-48 text-os-xs font-mono text-white/50">
                  <p className="text-red-400 font-bold mb-2">{this.state.error.toString()}</p>
                  <pre>{this.state.errorInfo?.componentStack}</pre>
                </div>
              )}
            </div>
          </Surface>

          {/* System Status Footer styled directly here for crash mode */}
          <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/20 border border-os-red/20 text-red-400 text-os-xs uppercase font-bold tracking-widest">
              <ShieldAlert className="w-3 h-3" />
              System Lockdown Active
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
