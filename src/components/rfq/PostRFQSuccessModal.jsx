/**
 * Post-RFQ Success Modal - 2026 UX
 * Shows what happens next after RFQ submission
 * Displays matched suppliers, timeline, and engagement options
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Clock, MessageSquare, Bell, X, 
  Sparkles, TrendingUp, Shield, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Dialog, DialogContent } from '@/components/shared/ui/dialog';

export default function PostRFQSuccessModal({ 
  open, 
  onClose, 
  rfqData = {},
  matchedSuppliers = [],
  rfqId 
}) {
  const [currentStep, setCurrentStep] = useState(0);

  const timeline = [
    {
      time: 'Now',
      title: 'RFQ Posted Successfully',
      description: `${matchedSuppliers.length} verified suppliers notified`,
      icon: CheckCircle2,
      status: 'complete',
      color: 'text-emerald-600'
    },
    {
      time: '24 hours',
      title: 'Quotes Start Arriving',
      description: 'Expect 3-5 competitive quotes',
      icon: MessageSquare,
      status: 'pending',
      color: 'text-os-accent'
    },
    {
      time: '48 hours',
      title: 'Review & Compare',
      description: 'Chat with suppliers, negotiate terms',
      icon: TrendingUp,
      status: 'pending',
      color: 'text-blue-600'
    },
    {
      time: '72 hours',
      title: 'Accept Best Quote',
      description: 'Fund escrow & start trade',
      icon: Shield,
      status: 'pending',
      color: 'text-purple-600'
    }
  ];

  useEffect(() => {
    if (open) {
      // Animate through steps
      const interval = setInterval(() => {
        setCurrentStep(prev => (prev < timeline.length - 1 ? prev + 1 : prev));
      }, 800);
      return () => clearInterval(interval);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-os-bg">
        {/* Header with close button */}
        <div className="relative p-8 pb-6 bg-gradient-to-br from-os-accent/10 via-os-bg to-os-bg">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-os-surface/50 transition-colors"
          >
            <X className="w-5 h-5 text-os-text-secondary" />
          </button>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-center text-os-text-primary mb-2"
          >
            RFQ Posted Successfully!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center text-os-text-secondary"
          >
            {rfqData.title || 'Your sourcing request'}
          </motion.p>
        </div>

        <div className="p-8 pt-4 space-y-8">
          {/* Matched Suppliers Preview */}
          {matchedSuppliers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-os-surface/50 rounded-2xl p-6 border border-os-stroke"
            >
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-os-accent" />
                <h3 className="font-bold text-os-text-primary">
                  {matchedSuppliers.length} Suppliers Matched
                </h3>
              </div>

              <div className="flex items-center gap-4">
                {/* Supplier Avatars */}
                <div className="flex -space-x-3">
                  {matchedSuppliers.slice(0, 5).map((supplier, idx) => (
                    <motion.div
                      key={supplier.supplier_id}
                      initial={{ scale: 0, x: -20 }}
                      animate={{ scale: 1, x: 0 }}
                      transition={{ delay: 0.4 + (idx * 0.1) }}
                      className="relative"
                    >
                      <div className="w-12 h-12 rounded-full bg-os-accent/20 border-2 border-os-bg flex items-center justify-center text-os-accent font-bold overflow-hidden">
                        {supplier.logo_url ? (
                          <img 
                            src={supplier.logo_url} 
                            alt={supplier.company_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          supplier.company_name?.charAt(0) || '?'
                        )}
                      </div>
                      {supplier.verified && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-os-bg flex items-center justify-center">
                          <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {matchedSuppliers.length > 5 && (
                    <div className="w-12 h-12 rounded-full bg-os-surface border-2 border-os-bg flex items-center justify-center text-os-text-secondary text-sm font-bold">
                      +{matchedSuppliers.length - 5}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-sm text-os-text-secondary">
                    All verified suppliers with avg response time <strong className="text-os-accent">{'<'} 24 hours</strong>
                  </p>
                </div>
              </div>

              {/* Top Match Highlight */}
              {matchedSuppliers[0] && matchedSuppliers[0].match_score >= 80 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-4 pt-4 border-t border-os-stroke"
                >
                  <div className="flex items-start gap-3">
                    <div className="px-2 py-1 rounded-full bg-os-accent/10 text-os-accent text-xs font-bold">
                      🎯 Perfect Match
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-os-text-primary text-sm">
                        {matchedSuppliers[0].company_name}
                      </p>
                      <p className="text-xs text-os-text-secondary">
                        {matchedSuppliers[0].match_reasons?.join(' • ')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Timeline */}
          <div>
            <h3 className="font-bold text-os-text-primary mb-4">What Happens Next</h3>
            <div className="space-y-4">
              {timeline.map((step, idx) => {
                const isActive = idx <= currentStep;
                const Icon = step.icon;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: isActive ? 1 : 0.4, x: 0 }}
                    transition={{ delay: 0.5 + (idx * 0.1) }}
                    className="flex items-start gap-4 group"
                  >
                    <div className={`
                      relative flex-shrink-0 w-10 h-10 rounded-full 
                      flex items-center justify-center
                      transition-all duration-300
                      ${isActive 
                        ? 'bg-os-accent/20 ring-2 ring-os-accent/50' 
                        : 'bg-os-surface border border-os-stroke'
                      }
                    `}>
                      <Icon className={`w-5 h-5 ${isActive ? step.color : 'text-os-text-secondary/50'}`} />
                      {idx < timeline.length - 1 && (
                        <div className={`
                          absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-6
                          transition-colors duration-300
                          ${isActive ? 'bg-os-accent/30' : 'bg-os-stroke'}
                        `} />
                      )}
                    </div>

                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-bold text-os-text-secondary">
                          {step.time}
                        </span>
                        {step.status === 'complete' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                            Complete
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-os-text-primary">{step.title}</p>
                      <p className="text-sm text-os-text-secondary">{step.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Engagement Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="bg-gradient-to-br from-os-accent/10 to-transparent rounded-2xl p-6 border border-os-accent/20"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-os-accent/20 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-os-accent" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-os-text-primary mb-2">
                  Never Miss a Quote
                </h4>
                <p className="text-sm text-os-text-secondary mb-4">
                  Get instant WhatsApp notifications when suppliers respond. Average response time: 4 hours.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="group"
                  onClick={() => {
                    // TODO: Open WhatsApp notification setup
                    console.log('Enable WhatsApp notifications');
                  }}
                >
                  Enable WhatsApp Alerts
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              className="flex-1 bg-os-accent hover:bg-os-accentDark"
              onClick={() => {
                window.location.href = `/dashboard/rfqs?highlight=${rfqId}`;
              }}
            >
              <Clock className="w-4 h-4 mr-2" />
              Track RFQ Progress
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
