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

export const SelectValue = ({ placeholder, displayValue }) => {
  const { value } = React.useContext(SelectContext);
  // Use displayValue if provided, otherwise show value or placeholder
  return <span>{displayValue || value || placeholder}</span>;
};

export const SelectContent = ({ children, className }) => {
  const { open, setOpen } = React.useContext(SelectContext);
  const contentRef = React.useRef(null);
  
  React.useEffect(() => {
    if (open) {
      // Close on escape key
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          setOpen(false);
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, setOpen]);
  
  if (!open) return null;
  
  return (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onClick={() => setOpen(false)}
        role="button"
        tabIndex={0}
        aria-label="Close dropdown"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(false);
          }
        }}
      />
      <div 
        ref={contentRef}
        className={cn(
          'absolute z-50 min-w-[8rem] w-full sm:w-auto max-h-[300px] sm:max-h-[400px] overflow-y-auto rounded-md border border-afrikoni-gold/20 bg-afrikoni-offwhite text-afrikoni-chestnut shadow-afrikoni',
          className
        )}
        onClick={(e) => {
          // Prevent clicks inside content from closing dropdown
          e.stopPropagation();
        }}
        style={{
          maxWidth: 'calc(100vw - 2rem)',
        }}
      >
        <div className="p-1">{children}</div>
      </div>
    </>
  );
};

export const SelectItem = ({ children, value, className, ...props }) => {
  const { onValueChange, setOpen } = React.useContext(SelectContext);
  
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onValueChange && value !== undefined) {
      onValueChange(value);
    }
    setOpen(false);
  };
  
  return (
    <div
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-afrikoni-cream focus:bg-afrikoni-cream text-afrikoni-deep transition-colors',
        className
      )}
      onClick={handleClick}
      onMouseDown={(e) => {
        // Prevent focus loss
        e.preventDefault();
      }}
      {...props}
    >
      {children}
    </div>
  );
};

