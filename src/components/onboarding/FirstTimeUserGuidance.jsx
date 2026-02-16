import React, { useState, useEffect } from 'react';
import { X, ChevronRight, CheckCircle2, Lightbulb, Shield, FileText, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent } from '@/components/shared/ui/card';

/**
 * First-Time User Guidance
 * Reduces anxiety and confusion for new buyers and suppliers
 * Shows contextual tooltips and walkthroughs at key moments
 */

// Local storage keys for tracking completed guidance
const STORAGE_KEYS = {
  FIRST_RFQ: 'afrikoni_guidance_first_rfq',
  FIRST_QUOTE: 'afrikoni_guidance_first_quote',
  FIRST_ORDER: 'afrikoni_guidance_first_order',
  DASHBOARD_TOUR: 'afrikoni_guidance_dashboard_tour'
};

export function FirstTimeRFQGuidance({ onDismiss }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has seen this guidance before
    const hasSeenGuidance = localStorage.getItem(STORAGE_KEYS.FIRST_RFQ);
    if (!hasSeenGuidance) {
      setShow(true);
    }
  }, []);

  const steps = [
    {
      title: 'Welcome to Your First RFQ! 🎉',
      description: 'An RFQ (Request for Quotation) helps you find the right African suppliers. We\'ll guide you through it.',
      icon: FileText,
      color: 'blue'
    },
    {
      title: 'What Makes a Good RFQ?',
      description: 'Be specific about: product details, quantity, delivery location, and timeline. Complete RFQs get 3x more responses.',
      icon: Lightbulb,
      color: 'amber'
    },
    {
      title: 'How Afrikoni Protects You',
      description: 'We review every RFQ, match only verified suppliers, and hold payments in escrow until you confirm delivery.',
      icon: Shield,
      color: 'green'
    },
    {
      title: 'What Happens Next?',
      description: 'After submission, we review your RFQ (24-48h), match verified suppliers, and you receive quotes to compare.',
      icon: CheckCircle2,
      color: 'blue'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEYS.FIRST_RFQ, 'true');
    setShow(false);
    if (onDismiss) onDismiss();
  };

  if (!show) return null;

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 right-6 z-50 max-w-md"
      >
        <Card className="border-2 border-os-accent shadow-2xl">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg bg-${step.color}-100`}>
                <Icon className={`w-6 h-6 text-${step.color}-600`} />
              </div>
              <button
                onClick={handleComplete}
                className="text-afrikoni-deep/40 hover:text-afrikoni-deep transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-4">
              <h3 className="font-bold text-afrikoni-chestnut text-os-lg mb-2">
                {step.title}
              </h3>
              <p className="text-os-sm text-afrikoni-deep/80">
                {step.description}
              </p>
            </div>

            {/* Progress indicators */}
            <div className="flex items-center gap-2 mb-4">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-os-accent' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <span className="text-os-xs text-afrikoni-deep/60">
                Step {currentStep + 1} of {steps.length}
              </span>
              <Button
                onClick={handleNext}
                className="bg-os-accent hover:bg-os-accent/90"
                size="sm"
              >
                {currentStep < steps.length - 1 ? (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  'Got it!'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

export function FirstTimeQuoteGuidance({ onDismiss }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasSeenGuidance = localStorage.getItem(STORAGE_KEYS.FIRST_QUOTE);
    if (!hasSeenGuidance) {
      setShow(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEYS.FIRST_QUOTE, 'true');
    setShow(false);
    if (onDismiss) onDismiss();
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gradient-to-br from-amber-50 to-white border-2 border-amber-300 rounded-lg p-4 mb-4 shadow-os-md"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100 flex-shrink-0">
            <Package className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-afrikoni-chestnut">
                Submitting Your First Quote? Here's How to Stand Out:
              </h3>
              <button
                onClick={handleDismiss}
                className="text-afrikoni-deep/40 hover:text-afrikoni-deep transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="text-os-sm text-afrikoni-deep/80 space-y-1.5 mb-3">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Match the RFQ exactly:</strong> Address every requirement the buyer mentioned</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Be complete:</strong> Include pricing, delivery time, payment terms, and certifications</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Show credibility:</strong> Mention similar orders you've fulfilled successfully</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Use templates:</strong> Professional quote templates are available below</span>
              </li>
            </ul>
            <p className="text-os-xs text-afrikoni-deep/60 italic">
              💡 Complete, professional quotes are 2x more likely to win the deal.
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Contextual tooltip that points to specific UI elements
 */
export function ContextualTooltip({ 
  message, 
  position = 'bottom',
  onDismiss,
  storageKey
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (storageKey) {
      const hasSeen = localStorage.getItem(storageKey);
      if (!hasSeen) {
        setShow(true);
      }
    } else {
      setShow(true);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, 'true');
    }
    setShow(false);
    if (onDismiss) onDismiss();
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: position === 'bottom' ? -10 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className={`absolute ${position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'} left-0 right-0 z-50`}
      >
        <div className="bg-blue-600 text-white text-os-xs rounded-lg px-3 py-2 shadow-os-md max-w-xs">
          <div className="flex items-start justify-between gap-2">
            <p>{message}</p>
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          {/* Arrow */}
          <div
            className={`absolute left-4 w-2 h-2 bg-blue-600 transform rotate-45 ${
              position === 'bottom' ? '-top-1' : '-bottom-1'
            }`}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Reset all guidance (for testing or user preference)
 */
export function resetAllGuidance() {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

