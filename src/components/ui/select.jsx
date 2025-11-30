import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

const SelectContext = React.createContext();

export const Select = ({ children, value, onValueChange }) => {
  const [open, setOpen] = useState(false);
  
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(SelectContext);
  
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setOpen(!open)}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-afrikoni-gold/30 bg-afrikoni-offwhite px-3 py-2 text-sm ring-offset-white placeholder:text-afrikoni-earth/60 text-afrikoni-earth focus:outline-none focus:ring-2 focus:ring-afrikoni-gold focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

export const SelectValue = ({ placeholder }) => {
  const { value } = React.useContext(SelectContext);
  return <span>{value || placeholder}</span>;
};

export const SelectContent = ({ children, className }) => {
  const { open, setOpen } = React.useContext(SelectContext);
  
  if (!open) return null;
  
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      <div className={cn(
        'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-afrikoni-gold/20 bg-afrikoni-offwhite text-afrikoni-chestnut shadow-afrikoni',
        className
      )}>
        <div className="p-1">{children}</div>
      </div>
    </>
  );
};

export const SelectItem = ({ children, value, className, ...props }) => {
  const { onValueChange, setOpen } = React.useContext(SelectContext);
  
  return (
    <div
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-afrikoni-cream focus:bg-afrikoni-cream text-afrikoni-deep',
        className
      )}
      onClick={() => {
        onValueChange(value);
        setOpen(false);
      }}
      {...props}
    >
      {children}
    </div>
  );
};

