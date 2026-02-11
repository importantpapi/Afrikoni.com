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
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Trade OS] Critical Error caught by boundary:', error, errorInfo);
    telemetry.logError(error, {
      componentStack: errorInfo?.componentStack,
      location: window.location.href
    });
    this.setState({ errorInfo });
  }

  handleReload = () => {
    telemetry.trackEvent('system_crash_reload');
    window.location.reload();
  };

  handleReset = () => {
    telemetry.trackEvent('system_crash_hard_reset');
    // Clear local storage if kernel state is corrupted
    localStorage.removeItem('afrikoni_auth_token');
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('active_trade_session'); // Clear persisted trade state too
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;

      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] text-white p-6 relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none" />

          <Surface variant="glass" className="max-w-xl w-full p-8 md:p-12 border-red-500/20 relative z-10 shadow-2xl shadow-red-900/20">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 animate-pulse">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>

              <h1 className="text-2xl font-light tracking-tight mb-2">
                System Encountered a Critical Error
              </h1>
              <p className="text-white/60 mb-8 max-w-md">
                The Trade OS Kernel encountered an unexpected state and halted execution to protect data integrity.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button
                  onClick={this.handleReload}
                  className="bg-red-600 hover:bg-red-700 text-white min-w-[160px]"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Restart System
                </Button>

                <Button
                  onClick={() => window.location.href = '/dashboard'}
                  variant="outline"
                  className="border-white/10 hover:bg-white/5 min-w-[160px]"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Return to Dashboard
                </Button>
              </div>

              {/* Advanced Recovery (Hidden by default or smaller) */}
              <button
                onClick={this.handleReset}
                className="mt-8 text-xs text-white/30 hover:text-red-400 underline transition-colors"
              >
                Clear Cache & Hard Reset
              </button>

              {/* Dev Details */}
              {isDev && this.state.error && (
                <div className="mt-8 p-4 bg-black/50 rounded border border-white/5 text-left w-full overflow-auto max-h-48 text-[10px] font-mono text-white/50">
                  <p className="text-red-400 font-bold mb-2">{this.state.error.toString()}</p>
                  <pre>{this.state.errorInfo?.componentStack}</pre>
                </div>
              )}
            </div>
          </Surface>

          {/* System Status Footer styled directly here for crash mode */}
          <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/20 border border-red-500/20 text-red-400 text-[10px] uppercase font-bold tracking-widest">
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
