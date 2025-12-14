import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle2, Clock, FileText, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function RFQProcessPanel() {
  const [isOpen, setIsOpen] = useState(false);

  const steps = [
    {
      icon: FileText,
      title: 'Submit request',
      description: '2–3 minutes',
      color: 'text-afrikoni-gold'
    },
    {
      icon: ShieldCheck,
      title: 'Afrikoni verifies suppliers & terms',
      description: 'Manual review',
      color: 'text-afrikoni-chestnut'
    },
    {
      icon: Clock,
      title: 'You receive curated quotes',
      description: '24–48 hours',
      color: 'text-afrikoni-gold'
    },
    {
      icon: CheckCircle2,
      title: 'Trade coordinated securely',
      description: 'Protected transaction',
      color: 'text-green-600'
    }
  ];

  return (
    <Card className="border border-afrikoni-gold/20 bg-afrikoni-cream/50">
      <CardContent className="p-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="text-sm md:text-base font-semibold text-afrikoni-chestnut">
            What happens after I post an RFQ?
          </span>
          <ChevronDown 
            className={`w-4 h-4 text-afrikoni-gold transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3 pt-4 border-t border-afrikoni-gold/10">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-afrikoni-gold/10 flex items-center justify-center flex-shrink-0 ${step.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-afrikoni-chestnut">
                          {step.title}
                        </p>
                        <p className="text-xs text-afrikoni-deep/70">
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

