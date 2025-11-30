import React from 'react';
import { motion } from 'framer-motion';

export function SimpleChart({ data, labels, height = 200, color = 'orange', secondaryData, secondaryColor = 'green' }) {
  const allValues = secondaryData ? [...data, ...secondaryData] : data;
  const maxValue = Math.max(...allValues, 1);
  const barWidth = 100 / data.length;
  
  const colorClasses = {
    orange: '#f97316',
    blue: '#3b82f6',
    green: '#22c55e',
    purple: '#a855f7'
  };

  const primaryColor = colorClasses[color] || colorClasses.orange;
  const secColor = secondaryData ? (colorClasses[secondaryColor] || colorClasses.green) : null;

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <svg width="100%" height="100%" className="overflow-visible">
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.3" />
          </linearGradient>
          {secColor && (
            <linearGradient id={`gradient-${secondaryColor}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={secColor} stopOpacity="0.8" />
              <stop offset="100%" stopColor={secColor} stopOpacity="0.3" />
            </linearGradient>
          )}
        </defs>
        {data.map((value, index) => {
          const barHeight = (value / maxValue) * (height - 40);
          const x = (index * barWidth) + (barWidth / 2) - 1.5;
          const y = height - barHeight - 20;
          
          return (
            <g key={index}>
              <motion.rect
                initial={{ height: 0, y: height - 20 }}
                animate={{ height: barHeight, y }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.08,
                  ease: "easeOut"
                }}
                x={`${x}%`}
                width="3%"
                fill={`url(#gradient-${color})`}
                rx="3"
                className="hover:opacity-80 transition-opacity"
              />
              {secondaryData && (
                <motion.rect
                  initial={{ height: 0, y: height - 20 }}
                  animate={{ height: (secondaryData[index] / maxValue) * (height - 40), y: height - (secondaryData[index] / maxValue) * (height - 40) - 20 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.08 + 0.1,
                    ease: "easeOut"
                  }}
                  x={`${x + 3.5}%`}
                  width="3%"
                  fill={`url(#gradient-${secondaryColor})`}
                  rx="3"
                  className="hover:opacity-80 transition-opacity"
                />
              )}
              {labels && (
                <text
                  x={`${x + 1.5}%`}
                  y={height - 5}
                  textAnchor="middle"
                  className="text-xs fill-zinc-500"
                  fontSize="10"
                >
                  {labels[index]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
