import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log error to error reporting service in production
    if (import.meta.env.PROD) {
      // Future: Send to error tracking service (Sentry, etc.)
      // errorTracker.captureException(error, { extra: errorInfo });
    } else {
      // Development: Log to console for debugging
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center bg-afrikoni-offwhite p-4">
          <div className="max-w-md w-full text-center bg-white rounded-lg shadow-lg p-8 border border-afrikoni-gold/20">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-afrikoni-chestnut mb-2">Something went wrong</h1>
            <p className="text-afrikoni-deep mb-6">
              {this.props.fallbackMessage || "We're sorry, but something unexpected happened. Please try again."}
            </p>
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left mb-4 p-3 bg-afrikoni-cream rounded text-xs">
                <summary className="cursor-pointer font-semibold mb-2">Error Details (Dev Only)</summary>
                <pre className="whitespace-pre-wrap overflow-auto">{this.state.error.toString()}</pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                variant="primary"
              >
                Retry
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

