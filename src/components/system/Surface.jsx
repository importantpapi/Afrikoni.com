import React from 'react';
import { motion } from 'framer-motion';

export const Surface = ({
    children,
    variant = 'glass',
    className = '',
    onClick,
    ...props
}) => {

    const variants = {
        glass: "bg-white/5 backdrop-blur-md border border-white/10 shadow-xl shadow-black/20",
        panel: "bg-[#0E0E0E] border border-white/5 shadow-inner shadow-black/50",
        card: "bg-[#141414] border border-white/5 hover:border-white/10 transition-colors shadow-lg",
        ghost: "bg-transparent border border-dashed border-white/10 hover:bg-white/5 transition-colors"
    };

    const Component = onClick ? motion.div : 'div';

    return (
        <Component
            className={`rounded-xl ${variants[variant] || variants.glass} ${className} overflow-hidden`}
            onClick={onClick}
            {...(onClick ? { whileHover: { scale: 1.005 }, whileTap: { scale: 0.995 } } : {})}
            {...props}
        >
            {children}
        </Component>
    );
};
