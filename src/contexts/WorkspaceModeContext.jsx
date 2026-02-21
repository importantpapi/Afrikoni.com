import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { secureStorage } from '@/utils/secureStorage';

const WorkspaceModeContext = createContext(null);

const STORAGE_KEY = 'afrikoni_workspace_mode';
const TRADING_MODE_KEY = 'afrikoni_trading_mode';

export function WorkspaceModeProvider({ children, defaultMode = 'simple' }) {
  const [mode, setMode] = useState(() => {
    if (typeof window === 'undefined') return defaultMode;
    const stored = secureStorage.get(STORAGE_KEY);
    return stored || defaultMode;
  });

  const [tradingMode, setTradingMode] = useState(() => {
    if (typeof window === 'undefined') return 'sourcing';
    const stored = secureStorage.get(TRADING_MODE_KEY);
    return stored || 'sourcing';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    secureStorage.set(STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    secureStorage.set(TRADING_MODE_KEY, tradingMode);
  }, [tradingMode]);

  const value = useMemo(() => ({
    mode,
    setMode,
    isSimple: mode === 'simple',
    isTrade: mode === 'trade',
    isPro: mode === 'pro',
    tradingMode,
    setTradingMode,
    isSourcing: tradingMode === 'sourcing',
    isDistribution: tradingMode === 'distribution',
    // Flow Mapping for the 2026 Journey
    flowStages: [
      { id: 'intent', label: 'Intent', description: 'Discovery & RFQ', active: true },
      { id: 'match', label: 'Match', description: 'AI Proposal Review', active: true },
      { id: 'contract', label: 'Contract', description: 'Agreements & Escrow', active: true },
      { id: 'move', label: 'Move', description: 'Forensic Logistics', active: true },
      { id: 'pay', label: 'Pay', description: 'PAPSS Settlement', active: true },
      { id: 'trust', label: 'Trust', description: 'Verification & Ledger', active: true }
    ]
  }), [mode, tradingMode]);

  return (
    <WorkspaceModeContext.Provider value={value}>
      {children}
    </WorkspaceModeContext.Provider>
  );
}

export function useWorkspaceMode() {
  const context = useContext(WorkspaceModeContext);
  if (!context) {
    return { mode: 'simple', setMode: () => { }, isSimple: true, isOperator: false };
  }
  return context;
}
