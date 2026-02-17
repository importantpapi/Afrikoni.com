import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// Simple coordinate mapping for key trade hubs (approximate for stylized map)
const HUBS = {
    Lagos: { x: 48, y: 55, region: 'Africa' },
    Accra: { x: 45, y: 54, region: 'Africa' },
    Nairobi: { x: 60, y: 60, region: 'Africa' },
    Cairo: { x: 55, y: 35, region: 'Africa' },
    Joburg: { x: 55, y: 80, region: 'Africa' },
    London: { x: 47, y: 22, region: 'Europe' },
    Dubai: { x: 65, y: 40, region: 'Middle East' },
    Shanghai: { x: 85, y: 35, region: 'Asia' },
    NewYork: { x: 25, y: 30, region: 'Americas' },
};

const CORRIDORS = [
    { from: 'Lagos', to: 'London', volume: 'high', active: true },
    { from: 'Accra', to: 'NewYork', volume: 'medium', active: true },
    { from: 'Nairobi', to: 'Dubai', volume: 'high', active: true },
    { from: 'Cairo', to: 'Shanghai', volume: 'medium', active: false },
    { from: 'Joburg', to: 'London', volume: 'low', active: true },
];

export default function TradeMap({ className = '' }) {
    // Generate stylized map dots
    const mapDots = useMemo(() => {
        const dots = [];
        for (let i = 0; i < 100; i++) {
            dots.push({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                opacity: Math.random() * 0.3 + 0.1,
            });
        }
        return dots;
    }, []);

    return (
        <div className={`relative w-full aspect-[2/1] bg-[#050505] rounded-os-sm overflow-hidden border border-white/5 ${className}`}>
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            {/* Styled World Map (Abstract Dots) */}
            <div className="absolute inset-0 pointer-events-none">
                {mapDots.map((dot) => (
                    <div
                        key={dot.id}
                        className="absolute w-1 h-1 rounded-full bg-white transition-opacity duration-[3s]"
                        style={{
                            left: `${dot.x}%`,
                            top: `${dot.y}%`,
                            opacity: dot.opacity,
                        }}
                    />
                ))}
                {/* Continent Outlines (Simplistic SVG for aesthetics) */}
                <svg className="absolute inset-0 w-full h-full opacity-20 text-white fill-current pointer-events-none">
                    {/* Placeholder for actual map SVG path - simplistic Africa shape for effect */}
                    <path d="M45,40 Q55,30 65,40 T60,70 T45,60 T45,40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </svg>
            </div>

            {/* Active Corridors (Flow Arcs) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {CORRIDORS.filter(c => c.active).map((route, i) => {
                    const start = HUBS[route.from];
                    const end = HUBS[route.to];
                    if (!start || !end) return null;

                    // Calculate control point for curve
                    const midX = (start.x + end.x) / 2;
                    const midY = (start.y + end.y) / 2 - 15; // Curve Upwards

                    return (
                        <g key={`${route.from}-${route.to}`}>
                            {/* The Path */}
                            <motion.path
                                d={`M${start.x},${start.y} Q${midX},${midY} ${end.x},${end.y}`}
                                fill="none"
                                stroke="url(#gradient-gold)"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 2, delay: i * 0.5, ease: "easeInOut" }}
                            />
                            {/* Moving Particle */}
                            <motion.circle
                                r="2"
                                fill="var(--os-accent)"
                                initial={{ offsetDistance: "0%" }}
                                animate={{ offsetDistance: "100%" }}
                                style={{ offsetPath: `path('M${start.x},${start.y} Q${midX},${midY} ${end.x},${end.y}')` }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: i * 0.8 }}
                            />
                        </g>
                    );
                })}
                <defs>
                    <linearGradient id="gradient-gold" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(212, 175, 55, 0)" />
                        <stop offset="50%" stopColor="rgba(212, 175, 55, 1)" />
                        <stop offset="100%" stopColor="rgba(212, 175, 55, 0)" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Hub Points */}
            {Object.entries(HUBS).map(([name, pos]) => (
                <div
                    key={name}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                    <div className="relative">
                        <div className="w-2 h-2 bg-koni-gold rounded-full relative z-10" />
                        <div className="absolute inset-0 bg-koni-gold rounded-full animate-ping opacity-50" />

                        {/* Hover Tooltip */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 border border-white/10 px-2 py-1 rounded text-os-xs text-white whitespace-nowrap z-20 pointer-events-none">
                            {name}
                        </div>
                    </div>
                </div>
            ))}

            {/* Legend / Overlay */}
            <div className="absolute bottom-4 left-4 flex gap-4">
                <div className="flex items-center gap-2 text-os-xs text-white/60 bg-black/50 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-koni-gold animate-pulse" />
                    <span>Active Trade Flows</span>
                </div>
                <div className="flex items-center gap-2 text-os-xs text-white/60 bg-black/50 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full border border-white/40" />
                    <span>Hub Node</span>
                </div>
            </div>
        </div>
    );
}
