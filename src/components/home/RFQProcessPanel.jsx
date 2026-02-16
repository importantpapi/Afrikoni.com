import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDown, CheckCircle2, Clock, FileText, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';

export default function RFQProcessPanel() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const steps = [
    {
      icon: FileText,
      title: t('rfq.step1Title'),
      description: t('rfq.step1Description'),
      color: 'text-afrikoni-gold'
    },
    {
      icon: ShieldCheck,
      title: t('rfq.step2Title'),
      description: t('rfq.step2Description'),
      color: 'text-afrikoni-chestnut'
    },
    {
      icon: Clock,
      title: t('rfq.step3Title'),
      description: t('rfq.step3Description'),
      color: 'text-afrikoni-gold'
    },
    {
      icon: CheckCircle2,
      title: t('rfq.step4Title'),
      description: t('rfq.step4Description'),
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
            {t('rfq.whatHappensAfter')}
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

