import React, { createContext, useContext, useState } from 'react';

const DashboardContext = createContext({
  activeView: 'all',
  setActiveView: () => {}
});

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within DashboardContextProvider');
  }
  return context;
};

export const DashboardContextProvider = ({ children, initialActiveView = 'all' }) => {
  const [activeView, setActiveView] = useState(initialActiveView);

  return (
    <DashboardContext.Provider value={{ activeView, setActiveView }}>
      {children}
    </DashboardContext.Provider>
  );
};

