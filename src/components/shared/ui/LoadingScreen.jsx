import React from 'react';
import { Loader2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/shared/ui/Logo';

/**
 * Unified Loading Screen Component (Horizon 2026)
 * Used across the app for consistent loading states during auth and kernel transitions
 */
export const LoadingScreen = ({
  message = 'Initializing...',
  showLogo = true,
  size = 'lg'
}) => {
  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* 🎬 CINEMATIC DEPTH: Ambient Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-os-accent/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#D4A937]/5 rounded-full blur-[100px] animate-pulse delay-1000" />

      {/* Grid Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="w-full max-w-md text-center z-10">
        {showLogo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex justify-center mb-10"
          >
            <div className="p-4 bg-os-accent/5 rounded-2xl border border-os-accent/10 backdrop-blur-md">
              <Logo type="symbol" size={size} />
            </div>
          </motion.div>
        )}

        <div className="relative mb-8 flex justify-center">
          <div className="absolute inset-0 animate-ping bg-os-accent/10 rounded-full blur-xl scale-50" />
          <Loader2 className="w-12 h-12 animate-spin text-os-accent relative z-10" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <p className="text-os-text-primary text-[11px] font-black uppercase tracking-[0.4em] leading-relaxed">
            {message}
          </p>
          <div className="mt-6 flex justify-center gap-1">
            <span className="w-1 h-1 rounded-full bg-os-accent/40 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-1 rounded-full bg-os-accent/40 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-1 rounded-full bg-os-accent/40 animate-bounce" />
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-12 left-0 right-0 text-center">
        <p className="text-os-text-secondary/10 text-[8px] font-black uppercase tracking-[0.6em] select-none">
          Infrastructure-Grade Trade OS
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
