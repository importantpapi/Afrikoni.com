import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const WorkspaceModeContext = createContext(null);

const STORAGE_KEY = 'afrikoni.workspaceMode';

export function WorkspaceModeProvider({ children, defaultMode = 'simple' }) {
  const [mode, setMode] = useState(() => {
    if (typeof window === 'undefined') return defaultMode;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored || defaultMode;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const value = useMemo(() => ({
    mode,
    setMode,
    isSimple: mode === 'simple',
    isOperator: mode === 'operator',
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
    return { mode: 'simple', setMode: () => {}, isSimple: true, isOperator: false };
  }
  return context;
}
