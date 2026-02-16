import React, { useState } from 'react';
import { Play, Activity, Users, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SimulationState({
    title = "No Active Trades",
    description = "The trade kernel is waiting. Activate a simulation to see the OS in action.",
    onActivate
}) {
    const [isSimulating, setIsSimulating] = useState(false);

    const handleActivate = () => {
        setIsSimulating(true);
        // Simulate delay or setup
        setTimeout(() => {
            if (onActivate) onActivate();
        }, 1500);
    };

    return (
        <div className="relative w-full h-[400px] border border-dashed border-white/10 rounded-os-md overflow-hidden flex items-center justify-center bg-black/20">

            {/* Background Grid Animation */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            </div>

            <div className="relative z-10 text-center max-w-md px-6">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group relative">
                    <div className="absolute inset-0 rounded-full border border-koni-gold/30 animate-ping opacity-0 group-hover:opacity-100" />
                    <Activity className="w-8 h-8 text-white/40 group-hover:text-koni-gold transition-colors" />
                </div>

                <h3 className="text-os-xl font-medium text-white mb-2">{title}</h3>
                <p className="text-white/60 mb-8 leading-relaxed">
                    {description}
                </p>

                {!isSimulating ? (
                    <button
                        onClick={handleActivate}
                        className="group relative inline-flex items-center gap-3 px-6 py-3 bg-koni-gold text-black font-medium rounded-lg hover:bg-white transition-all shadow-os-md hover:shadow-koni-gold/20"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Initialize Simulation</span>
                    </button>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-1">
                            <span className="w-1 h-4 bg-koni-gold animate-[pulse_0.5s_ease-in-out_infinite]" />
                            <span className="w-1 h-6 bg-koni-gold animate-[pulse_0.5s_ease-in-out_0.1s_infinite]" />
                            <span className="w-1 h-3 bg-koni-gold animate-[pulse_0.5s_ease-in-out_0.2s_infinite]" />
                        </div>
                        <span className="text-os-xs font-mono text-koni-gold uppercase tracking-wider">
                            Booting Trade Kernel...
                        </span>
                    </div>
                )}

                <div className="mt-12 flex items-center justify-center gap-8 opacity-40">
                    <div className="flex items-center gap-2 text-os-xs text-white/60">
                        <Globe className="w-3 h-3" />
                        <span>Global Corridors</span>
                    </div>
                    <div className="flex items-center gap-2 text-os-xs text-white/60">
                        <Users className="w-3 h-3" />
                        <span>Verified Partners</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
