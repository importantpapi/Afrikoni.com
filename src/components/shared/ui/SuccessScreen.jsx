import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, ShieldCheck, Download } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Surface } from '@/components/system/Surface';

export default function SuccessScreen({
    title = "Success!",
    message = "Operation completed successfully.",
    primaryAction,
    primaryActionLabel = "Continue",
    secondaryAction,
    secondaryActionLabel = "Close",
    icon: Icon = CheckCircle
}) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center h-full min-h-[400px]">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="relative mb-6"
            >
                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
                <div className="relative w-24 h-24 rounded-full bg-os-surface-1 border border-emerald-500/30 flex items-center justify-center">
                    <Icon className="w-12 h-12 text-emerald-500" />
                </div>
                {/* Decoration rings */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border border-emerald-500/20"
                />
            </motion.div>

            <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl md:text-3xl font-bold text-os-text-primary mb-3"
            >
                {title}
            </motion.h2>

            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-os-text-secondary max-w-md mb-8 leading-relaxed"
            >
                {message}
            </motion.p>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
            >
                {primaryAction && (
                    <Button
                        onClick={primaryAction}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[200px] h-12 text-base shadow-lg shadow-emerald-900/20"
                    >
                        {primaryActionLabel} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                )}
                {secondaryAction && (
                    <Button
                        variant="outline"
                        onClick={secondaryAction}
                        className="min-w-[140px] h-12 text-base border-os-stroke hover:bg-os-surface-2"
                    >
                        {secondaryActionLabel}
                    </Button>
                )}
            </motion.div>
        </div>
    );
}
