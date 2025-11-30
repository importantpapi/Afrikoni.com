import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export const Popover = ({ children, open: controlledOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;
  const triggerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        open &&
        triggerRef.current &&
        contentRef.current &&
        !triggerRef.current.contains(event.target) &&
        !contentRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, setOpen]);

  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        if (child.type === PopoverTrigger) {
          return React.cloneElement(child, {
            ref: triggerRef,
            onClick: () => setOpen(!open)
          });
        }
        if (child.type === PopoverContent) {
          return open
            ? React.cloneElement(child, {
                ref: contentRef,
                className: cn(child.props.className, 'absolute top-full mt-2 left-0')
              })
            : null;
        }
        return child;
      })}
    </div>
  );
};

export const PopoverTrigger = React.forwardRef(({ asChild, children, onClick, ...props }, ref) => {
  if (asChild) {
    return React.cloneElement(children, { ...props, ref, onClick });
  }
  return (
    <button ref={ref} onClick={onClick} {...props}>
      {children}
    </button>
  );
});

PopoverTrigger.displayName = 'PopoverTrigger';

export const PopoverContent = React.forwardRef(({ children, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'z-50 w-72 rounded-md border border-afrikoni-gold/20 bg-afrikoni-offwhite p-4 text-afrikoni-chestnut shadow-afrikoni outline-none',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

PopoverContent.displayName = 'PopoverContent';
