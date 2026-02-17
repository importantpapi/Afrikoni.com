import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles, Target, Zap, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Surface } from '@/components/system/Surface';

const TOUR_STEPS = {
    buyer: [
        {
            title: "Global Sourcing Hub",
            content: "Access verified suppliers across 54 African countries. Use the OS-Search to find specific commodities.",
            icon: Target,
            target: "search-bar"
        },
        {
            title: "Trade Readiness",
            content: "Monitor your compliance status and capital flow in real-time. The higher your score, the faster your trades settle.",
            icon: ShieldCheck,
            target: "status-bar"
        },
        {
            title: "AI Co-Pilot",
            content: "Our kernel analyzes market trends and risk factors to suggest the best trade opportunities.",
            icon: Zap,
            target: "ai-insights"
        }
    ],
    seller: [
        {
            title: "Sales Command Center",
            content: "Manage RFQs from global buyers and list your inventory for instant discovery.",
            icon: Target,
            target: "sales-stats"
        },
        {
            title: "Reliability Score",
            content: "Your seller rating directly impacts your placement in the global corridor search.",
            icon: ShieldCheck,
            target: "seller-rating"
        }
    ],
    logistics: [
        {
            title: "Fleet Intelligence",
            content: "Track shipments across the trans-African highway network with automated status updates.",
            icon: Navigation,
            target: "fleet-map"
        }
    ]
};

export function OnboardingTour({ role = 'buyer', onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const steps = TOUR_STEPS[role] || TOUR_STEPS.buyer;

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const step = steps[currentStep];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="max-w-md w-full"
                >
                    <Surface variant="glass" className="p-0 overflow-hidden border-os-accent/30 shadow-[0_32px_120px_rgba(212,169,55,0.15)]">
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-br from-os-accent/10 to-transparent border-b border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-os-accent" />
                                    <span className="text-os-xs font-bold uppercase tracking-[0.2em] text-os-accent">OS Calibration</span>
                                </div>
                                <button onClick={onComplete} className="text-os-muted hover:text-white transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <h3 className="text-os-xl font-semibold text-white">{step.title}</h3>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-os-sm bg-os-accent/10 border border-os-accent/20 text-os-accent shrink-0">
                                    <step.icon className="w-6 h-6" />
                                </div>
                                <p className="text-os-sm text-os-muted leading-relaxed">
                                    {step.content}
                                </p>
                            </div>

                            {/* Progress Dots */}
                            <div className="flex items-center gap-1.5 mt-8">
                                {steps.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1 rounded-full transition-all ${i === currentStep ? 'w-6 bg-os-accent' : 'w-2 bg-white/10'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-white/5 flex items-center justify-between border-t border-white/5">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handlePrev}
                                disabled={currentStep === 0}
                                className="text-os-xs text-os-muted hover:text-white"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleNext}
                                className="bg-os-accent hover:bg-os-accent-dark text-black font-bold text-os-xs"
                            >
                                {currentStep === steps.length - 1 ? 'Finish' : 'Next Step'} <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </Surface>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
