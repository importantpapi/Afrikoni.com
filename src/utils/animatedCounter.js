import { useEffect, useState } from 'react';

export function useAnimatedCounter(targetValue, duration = 2000, prefix = '', suffix = '') {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    const startValue = 0;
    const endValue = parseFloat(targetValue.replace(/[^0-9.]/g, '')) || 0;
    const isDecimal = targetValue.includes('.');
    const decimals = isDecimal ? 1 : 0;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = startValue + (endValue - startValue) * easeOutQuart;
      
      setCount(parseFloat(current.toFixed(decimals)));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    requestAnimationFrame(animate);
  }, [targetValue, duration]);

  // Format the number with prefix/suffix
  const formatValue = (val) => {
    if (targetValue.includes('+')) return `${prefix}${val.toLocaleString()}${suffix}+`;
    if (targetValue.includes(',')) return `${prefix}${val.toLocaleString()}${suffix}`;
    return `${prefix}${val}${suffix}`;
  };

  return formatValue(count);
}

