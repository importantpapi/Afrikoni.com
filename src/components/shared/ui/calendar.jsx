import React from 'react';
import { format } from 'date-fns';

export const Calendar = ({ mode = 'single', selected, onSelect, initialFocus }) => {
  const today = new Date();
  const [viewDate, setViewDate] = React.useState(selected || today);
  
  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const daysInMonth = monthEnd.getDate();
  const firstDayOfWeek = monthStart.getDay();
  
  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  const handleDateClick = (day) => {
    if (!day) return;
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onSelect(date);
  };
  
  const isSelected = (day) => {
    if (!selected || !day) return false;
    return (
      selected.getDate() === day &&
      selected.getMonth() === viewDate.getMonth() &&
      selected.getFullYear() === viewDate.getFullYear()
    );
  };
  
  const isToday = (day) => {
    if (!day) return false;
    return (
      today.getDate() === day &&
      today.getMonth() === viewDate.getMonth() &&
      today.getFullYear() === viewDate.getFullYear()
    );
  };
  
  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
          className="p-1 hover:bg-afrikoni-cream rounded"
        >
          ←
        </button>
        <div className="font-semibold">
          {format(viewDate, 'MMMM yyyy')}
        </div>
        <button
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
          className="p-1 hover:bg-afrikoni-cream rounded"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-os-sm font-medium text-afrikoni-deep/70 p-2">
            {day}
          </div>
        ))}
        {days.map((day, idx) => (
          <button
            key={idx}
            onClick={() => handleDateClick(day)}
            className={`
              p-2 text-os-sm rounded hover:bg-afrikoni-cream
              ${isSelected(day) ? 'bg-os-accent text-afrikoni-creamhover:bg-amber-700' : ''}
              ${isToday(day) && !isSelected(day) ? 'bg-afrikoni-cream font-semibold' : ''}
              ${!day ? 'invisible' : ''}
            `}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
};

