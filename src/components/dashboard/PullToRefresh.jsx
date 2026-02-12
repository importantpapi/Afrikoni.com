import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValue } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

/**
 * PullToRefresh - Kernel-level gesture for mobile
 * Provides official "Operating System" feel for manual data syncing.
 */
const PullToRefresh = ({ children, onRefresh, containerRef }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullProgress, setPullProgress] = useState(0);
    const pullThreshold = 80;

    const y = useMotionValue(0);
    const rotate = useTransform(y, [0, pullThreshold], [0, 360]);
    const scale = useTransform(y, [0, pullThreshold], [0.5, 1]);
    const opacity = useTransform(y, [0, pullThreshold], [0, 1]);

    useEffect(() => {
        const container = containerRef?.current || window;
        let startY = 0;

        const handleTouchStart = (e) => {
            if (container.scrollTop === 0) {
                startY = e.touches[0].pageY;
            } else {
                startY = 0;
            }
        };

        const handleTouchMove = (e) => {
            if (startY === 0 || isRefreshing) return;

            const currentY = e.touches[0].pageY;
            const diff = currentY - startY;

            if (diff > 0 && container.scrollTop === 0) {
                // Apply resistance
                const pull = Math.min(diff * 0.4, pullThreshold + 20);
                y.set(pull);
                setPullProgress(Math.min(pull / pullThreshold, 1));

                // Prevent default only if we are actually pulling with intent
                if (diff > 25) {
                    if (e.cancelable) e.preventDefault();
                }
            }
        };

        const handleTouchEnd = async () => {
            if (y.get() >= pullThreshold && !isRefreshing) {
                setIsRefreshing(true);
                y.set(pullThreshold);

                if (onRefresh) {
                    await onRefresh();
                }

                // Reset after a small delay to show completion
                setTimeout(() => {
                    setIsRefreshing(false);
                    y.set(0);
                    setPullProgress(0);
                }, 300);
            } else {
                y.set(0);
                setPullProgress(0);
            }
            startY = 0;
        };

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [containerRef, isRefreshing, onRefresh, y]);

    return (
        <div className="relative">
            <motion.div
                style={{
                    y,
                    opacity,
                    scale,
                    position: 'absolute',
                    top: '1rem',
                    left: '50%',
                    translateX: '-50%',
                    zIndex: 100
                }}
                className="md:hidden flex items-center justify-center pointer-events-none"
            >
                <div className="w-10 h-10 rounded-full bg-white dark:bg-[#1E1E1E] border border-afrikoni-gold/20 shadow-xl flex items-center justify-center">
                    <motion.div
                        style={{ rotate }}
                        animate={isRefreshing ? { rotate: 360 } : {}}
                        transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
                    >
                        <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'text-[#D4A937]' : 'text-gray-400'}`} />
                    </motion.div>
                </div>
            </motion.div>

            <motion.div style={{ y: isRefreshing ? pullThreshold : y }}>
                {children}
            </motion.div>
        </div>
    );
};

export default PullToRefresh;
