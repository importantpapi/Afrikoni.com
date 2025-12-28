import React, { createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

const RadioGroupContext = createContext(null);

export const RadioGroup = ({ value, onValueChange, children, className }) => {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div className={cn('space-y-2', className)}>{children}</div>
    </RadioGroupContext.Provider>
  );
};

export const RadioGroupItem = ({ value, id, className }) => {
  const { value: selectedValue, onValueChange } = useContext(RadioGroupContext);
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      id={id}
      onClick={() => onValueChange(value)}
      className={cn(
        'w-4 h-4 rounded-full border-2 flex items-center justify-center',
        isSelected ? 'border-afrikoni-gold' : 'border-afrikoni-gold/30',
        className
      )}
    >
      {isSelected && <div className="w-2 h-2 rounded-full bg-afrikoni-gold" />}
    </button>
  );
};

