import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthProvider';

export function SovereignIdentity({ size = "md", className = "" }) {
    const { user } = useAuth();

    // 🧬 GENETIC HASH: Generate a visual fingerprint based on user UUID
    const fingerprint = useMemo(() => {
        if (!user?.id) return { color1: '#D4A937', color2: '#FFD700', paths: [] };

        const hash = user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const colors = [
            ['#D4A937', '#F3E5C7'], // Gold
            ['#007AFF', '#5AC8FA'], // Cobalt
            ['#34C759', '#30D158'], // Emerald
            ['#FF3B30', '#FF453A'], // Crimson
            ['#5856D6', '#AF52DE'], // Indigo
        ];

        const colorPair = colors[hash % colors.length];

        // Generate abstract geometric paths
        const paths = Array.from({ length: 3 }, (_, i) => {
            const offset = (hash * (i + 1)) % 360;
            return {
                rotate: offset,
                scale: 0.8 + ((hash % 10) / 20),
                opacity: 0.3 + ((hash % 5) / 10),
            };
        });

        return {
            color1: colorPair[0],
            color2: colorPair[1],
            paths,
            nodeId: `NODE-${user.id.slice(0, 8).toUpperCase()}`
        };
    }, [user?.id]);

    const sizes = {
        sm: "w-12 h-12",
        md: "w-24 h-24",
        lg: "w-48 h-48",
        xl: "w-64 h-64"
    };

    return (
        <div className={`relative flex flex-col items-center justify-center ${className}`}>
            <div className={`relative ${sizes[size]} group`}>
                {/* Outer Glow */}
                <div
                    className="absolute inset-0 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"
                    style={{ background: `linear-gradient(45deg, ${fingerprint.color1}, ${fingerprint.color2})` }}
                />

                {/* Core Token */}
                <motion.div
                    className="relative w-full h-full rounded-os-md border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden flex items-center justify-center"
                    animate={{ rotateY: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                    {/* Internal Abstract Geometry */}
                    {fingerprint.paths.map((p, i) => (
                        <motion.div
                            key={i}
                            className="absolute inset-0 rounded-full border border-os-accent/20"
                            initial={false}
                            animate={{
                                rotate: [p.rotate, p.rotate + 360],
                                scale: [p.scale, p.scale * 1.1, p.scale]
                            }}
                            transition={{
                                rotate: { duration: 10 + i * 5, repeat: Infinity, ease: "linear" },
                                scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }
                            }}
                            style={{ borderColor: fingerprint.color1, opacity: p.opacity }}
                        />
                    ))}

                    {/* Center Symbol */}
                    <div className="relative z-10 font-black text-white/80 tracking-tighter text-os-xs md:text-os-xs uppercase">
                        {user?.id ? 'OS' : '??'}
                    </div>
                </motion.div>
            </div>

            {size !== "sm" && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 text-center"
                >
                    <span className="text-os-xs font-mono text-os-text-secondary/60 uppercase tracking-[0.3em]">
                        Sovereign Node
                    </span>
                    <div className="text-os-xs font-black text-os-text-primary tracking-widest mt-1">
                        {fingerprint.nodeId}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
