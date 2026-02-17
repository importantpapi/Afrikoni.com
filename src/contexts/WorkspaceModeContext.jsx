import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { secureStorage } from '@/utils/secureStorage';

const WorkspaceModeContext = createContext(null);

const STORAGE_KEY = 'afrikoni_workspace_mode';

export function WorkspaceModeProvider({ children, defaultMode = 'simple' }) {
  const [mode, setMode] = useState(() => {
    if (typeof window === 'undefined') return defaultMode;
    const stored = secureStorage.get(STORAGE_KEY);
    // Canonical modes: simple | trade | pro
    return stored || defaultMode;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    secureStorage.set(STORAGE_KEY, mode);
  }, [mode]);

  const value = useMemo(() => ({
    mode,
    setMode,
    isSimple: mode === 'simple',
    isTrade: mode === 'trade',
    isPro: mode === 'pro',
    // Flow Mapping for the 2026 Journey
    flowStages: [
      { id: 'intent', label: 'Intent', description: 'Discovery & RFQ', active: true },
      { id: 'match', label: 'Match', description: 'AI Proposal Review', active: true },
      { id: 'contract', label: 'Contract', description: 'Agreements & Escrow', active: true },
      { id: 'move', label: 'Move', description: 'Forensic Logistics', active: true },
      { id: 'pay', label: 'Pay', description: 'PAPSS Settlement', active: true },
      { id: 'trust', label: 'Trust', description: 'Verification & Ledger', active: true }
    ]
  }), [mode]);

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
