import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Surface } from '@/components/system/Surface';

/**
 * Trade OS Error Boundary
 * Catch localized crashes in widgets/components to prevent full page white screens.
 */
class TradeOSErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Trade OS Component Crash:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            return (
                <Surface variant="panel" className="p-6 border border-os-red/20 bg-red-500/5 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mb-3">
                        <AlertTriangle className="w-5 h-5 text-os-red" />
                    </div>
                    <h3 className="text-os-sm font-bold text-red-600 uppercase tracking-wider mb-1">
                        System Component Error
                    </h3>
                    <p className="text-os-xs text-gray-500 max-w-[250px] mb-4">
                        {this.state.error?.message || 'A localized module failure occurred.'}
                    </p>
                    <button
                        onClick={this.handleReset}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded text-os-xs font-bold uppercase tracking-wide hover:bg-gray-50 transition-colors text-gray-700"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Restart Module
                    </button>
                </Surface>
            );
        }

        return this.props.children;
    }
}

export default TradeOSErrorBoundary;
