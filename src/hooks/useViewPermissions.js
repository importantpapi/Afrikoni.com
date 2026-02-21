import { useWorkspaceMode } from '@/contexts/WorkspaceModeContext';

/**
 * useViewPermissions - Global hook for conditional rendering based on trading mode
 * 
 * Returns flags to hide/show UI elements for Sourcing (Buyer) vs Distribution (Seller) views.
 * Part of the Unified Trader strategy.
 */
export const useViewPermissions = () => {
    const { tradingMode } = useWorkspaceMode();

    return {
        // Current mode flags
        isSourcing: tradingMode === 'sourcing',      // Buyer View perspective
        isDistribution: tradingMode === 'distribution', // Seller View perspective

        // Identity flags
        isTrader: true, // In the Unified Trader model, everyone is a Trader

        // Raw mode for logic
        tradingMode
    };
};
