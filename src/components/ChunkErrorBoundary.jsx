import React from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Surface } from '@/components/system/Surface';
import { telemetry } from '@/services/telemetryService';

/**
 * ChunkErrorBoundary
 * 
 * specialized error boundary to catch "Failed to fetch dynamically imported module"
 * errors which happen when a user is on an old version and tries to navigate
 * to a route whose chunk has been deleted on the server (new deployment).
 */
class ChunkErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, isChunkError: false };
    }

    static getDerivedStateFromError(error) {
        const errorString = error?.toString() || '';
        // Detect Vite/Webpack chunk loading errors
        const isChunkError =
            errorString.includes('Failed to fetch dynamically imported module') ||
            errorString.includes('Importing a module script failed') ||
            errorString.includes('loading chunk');

        return { hasError: true, isChunkError };
    }

    componentDidCatch(error, errorInfo) {
        // Log to telemetry
        telemetry.logError(error, {
            componentStack: errorInfo?.componentStack,
            isChunkError: this.state.isChunkError,
            action: 'auto_recovery_ui_shown'
        });
    }

    handleReload = () => {
        telemetry.trackEvent('chunk_error_recovery_reload');
        // Force hard reload to get new chunks
        window.location.reload(true);
    };

    render() {
        if (this.state.hasError) {
            // If it's a chunk error, show the "Update Available" style UI
            if (this.state.isChunkError) {
                return (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
                        <Surface variant="glass" className="max-w-md w-full p-8 border-amber-500/20">
                            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <RefreshCw className="w-8 h-8 text-amber-500 animate-spin-slow" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">New Update Available</h2>
                            <p className="text-os-muted mb-6">
                                A new version of the Trade OS has been deployed. Please refresh to load the latest features.
                            </p>
                            <Button
                                onClick={this.handleReload}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium"
                            >
                                Update Now
                            </Button>
                        </Surface>
                    </div>
                );
            }

            // For other localized errors (non-chunk), show a "Connection Interrupted" fallback
            // This prevents a render loop while still providing a recovery path
            return (
                <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
                    <WifiOff className="w-12 h-12 text-os-muted mb-4" />
                    <h3 className="text-lg font-medium mb-2">Connection Interrupted</h3>
                    <p className="text-os-muted text-sm mb-6 max-w-xs text-center">
                        The connection to the dashboard interface was lost or interrupted.
                    </p>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        Retry Connection
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ChunkErrorBoundary;
