/**
 * Trade OS Motion Design System
 * 
 * Standardized framer-motion variants for consistent micro-interactions.
 */

export const transitions = {
    spring: { type: 'spring', damping: 25, stiffness: 200 },
    gentle: { type: 'spring', damping: 30, stiffness: 150 },
    quick: { type: 'spring', damping: 20, stiffness: 300 },
    smooth: { duration: 0.3, ease: [0.23, 1, 0.32, 1] }
};

export const variants = {
    staggerContainer: {
        animate: {
            transition: {
                staggerChildren: 0.05
            }
        }
    },

    fadeInUp: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        transition: transitions.spring
    },

    fadeInScale: {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
        transition: transitions.quick
    },

    hoverScale: {
        hover: { scale: 1.02, transition: transitions.quick },
        tap: { scale: 0.98 }
    },

    buttonHover: {
        hover: {
            scale: 1.02,
            boxShadow: '0 0 20px rgba(var(--primary), 0.3)',
            transition: transitions.quick
        },
        tap: { scale: 0.95 }
    },

    glassGlow: {
        initial: { boxShadow: '0 0 0px rgba(var(--primary), 0)' },
        animate: {
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            transition: transitions.smooth
        },
        hover: {
            boxShadow: '0 20px 60px rgba(var(--primary), 0.15)',
            transition: transitions.quick
        }
    }
};
