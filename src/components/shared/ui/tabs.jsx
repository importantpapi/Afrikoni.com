import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const TabsContext = React.createContext();

export const Tabs = ({ defaultValue, children, className, variant = 'underline' }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, variant }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className, variant }) => {
  const { variant: contextVariant } = React.useContext(TabsContext);
  const tabsVariant = variant || contextVariant || 'underline';
  
  if (tabsVariant === 'pills') {
    return (
      <div className={cn('inline-flex h-10 items-center justify-center rounded-lg bg-afrikoni-cream p-1 text-afrikoni-deep', className)}>
        {children}
      </div>
    );
  }
  
  return (
    <div className={cn('flex items-center border-b border-os-accent/20', className)}>
      {children}
    </div>
  );
};

export const TabsTrigger = ({ value, children, className }) => {
  const { activeTab, setActiveTab, variant = 'underline' } = React.useContext(TabsContext);
  const isActive = activeTab === value;
  
  if (variant === 'pills') {
    return (
      <button
        type="button"
        onClick={() => setActiveTab(value)}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-os-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-os-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          isActive ? 'bg-afrikoni-offwhite text-os-accent shadow-os-gold' : 'hover:bg-afrikoni-cream text-afrikoni-deep',
          className
        )}
      >
        {children}
      </button>
    );
  }
  
  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={cn(
        'relative inline-flex items-center justify-center whitespace-nowrap px-4 py-3 text-os-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-os-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive ? 'text-os-accent' : 'text-afrikoni-deep hover:text-afrikoni-chestnut',
        className
      )}
    >
      {children}
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-os-accent"
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </button>
  );
};

export const TabsContent = ({ value, children, className }) => {
  const { activeTab } = React.useContext(TabsContext);
  
  return (
    <AnimatePresence mode="wait">
      {activeTab === value && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={cn('mt-4', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

