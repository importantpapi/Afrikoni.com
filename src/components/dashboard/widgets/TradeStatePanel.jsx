import React from 'react';
import { Surface } from '@/components/system/Surface';

export const TradeStatePanel = ({ label, value, subtext, icon: Icon, tone = 'neutral', onClick }) => (
    <Surface
        variant="glass"
        className={`
      p-5 flex flex-col justify-between h-[140px] relative overflow-hidden group cursor-pointer border border-white/5 hover:border-white/10 transition-all
      ${onClick ? 'hover:bg-white/5' : ''}
    `}
        onClick={onClick}
    >
        <div className={`absolute top-0 right-0 p-[50px] bg-gradient-to-br from-transparent to-${tone === 'good' ? 'emerald' : tone === 'bad' ? 'red' : 'amber'}-500/10 blur-[40px] rounded-full translate-x-10 -translate-y-10`} />

        <div className="flex justify-between items-start z-10">
            <div className={`
        w-8 h-8 rounded-lg flex items-center justify-center
        ${tone === 'good' ? 'bg-emerald-500/20 text-emerald-500' :
                    tone === 'bad' ? 'bg-red-500/20 text-red-500' :
                        'bg-[#D4A937]/20 text-[#D4A937]'}
      `}>
                <Icon className="w-4 h-4" />
            </div>
            {tone === 'bad' && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
        </div>

        <div className="z-10">
            <div className="text-2xl font-bold tracking-tight text-afrikoni-deep font-mono">
                {value}
            </div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-gray-600 mt-1">
                {label}
            </div>
        </div>

        {subtext && (
            <div className="z-10 text-[10px] text-gray-500 font-mono mt-2 border-t border-afrikoni-gold/10 pt-2 flex items-center gap-1">
                {subtext}
            </div>
        )}
    </Surface>
);
