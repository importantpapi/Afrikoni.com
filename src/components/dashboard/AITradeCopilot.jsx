import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, Send, ChevronRight, Zap, ArrowRight, TrendingUp, Shield, AlertTriangle } from 'lucide-react';

const SUGGESTIONS = [
  { text: 'Create RFQ for 500kg cocoa beans', action: '/dashboard/rfqs/new', priority: 'high' },
  { text: 'Check escrow release conditions', action: '/dashboard/payments', priority: 'medium' },
  { text: 'Review pending supplier verification', action: '/dashboard/kyc', priority: 'high' },
  { text: 'Analyze trade corridor performance', action: '/dashboard/trade-pipeline', priority: 'low' },
];

const RECOMMENDATIONS = [
  {
    icon: TrendingUp,
    title: 'Market Opportunity',
    description: 'Shea butter prices rose 12% this quarter. 8 open RFQs match your supply.',
    action: '/dashboard/supplier-rfqs',
    actionLabel: 'View RFQs',
    type: 'opportunity',
  },
  {
    icon: Shield,
    title: 'Trust Score Boost',
    description: 'Complete document verification to increase trust score from 78 to 85+.',
    action: '/dashboard/kyc',
    actionLabel: 'Verify Now',
    type: 'trust',
  },
  {
    icon: AlertTriangle,
    title: 'Escrow Action Required',
    description: 'Order #A8F2 milestone reached — confirm delivery to release $12,800.',
    action: '/dashboard/payments',
    actionLabel: 'Review',
    type: 'action',
  },
];

export default function AITradeCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('insights');
  const navigate = useNavigate();

  const handleSuggestionClick = (action) => {
    navigate(action);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Trigger */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9990] w-12 h-12 rounded-full bg-[#D4A937] text-white dark:text-[#0A0A0A] shadow-lg shadow-[#D4A937]/25 flex items-center justify-center hover:scale-105 transition-transform"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Sparkles className="w-5 h-5" />
        )}
        {!isOpen && (
          <motion.span
            className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0A0A0A]"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-6 z-[9990] w-[380px] max-h-[560px] bg-white dark:bg-[#0F0F0F] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-[#1E1E1E] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#D4A937] to-[#B8922E] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white dark:text-[#0A0A0A]" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-bold text-gray-900 dark:text-[#F5F0E8]">Trade Copilot</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Intelligence Active</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1A1A1A] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-gray-200 dark:border-[#1E1E1E]">
              {[
                { id: 'insights', label: 'Insights' },
                { id: 'actions', label: 'Actions' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 text-[12px] font-semibold transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-[#D4A937]'
                      : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="copilotTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4A937]"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeTab === 'insights' ? (
                <>
                  {/* AI Recommendations */}
                  {RECOMMENDATIONS.map((rec, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="p-3 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#1E1E1E] hover:border-[#D4A937]/20 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          rec.type === 'opportunity' ? 'bg-emerald-50 dark:bg-emerald-950/30' :
                          rec.type === 'trust' ? 'bg-blue-50 dark:bg-blue-950/30' :
                          'bg-amber-50 dark:bg-amber-950/30'
                        }`}>
                          <rec.icon className={`w-3.5 h-3.5 ${
                            rec.type === 'opportunity' ? 'text-emerald-600 dark:text-emerald-400' :
                            rec.type === 'trust' ? 'text-blue-600 dark:text-blue-400' :
                            'text-amber-600 dark:text-amber-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-gray-900 dark:text-[#F5F0E8] mb-0.5">{rec.title}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{rec.description}</p>
                          <button
                            onClick={() => handleSuggestionClick(rec.action)}
                            className="mt-2 text-[11px] font-semibold text-[#D4A937] hover:text-[#C09830] flex items-center gap-1 transition-colors"
                          >
                            {rec.actionLabel}
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </>
              ) : (
                <>
                  {/* Quick Actions */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider px-1">Suggested Actions</span>
                    <div className="mt-2 space-y-1.5">
                      {SUGGESTIONS.map((suggestion, i) => (
                        <motion.button
                          key={i}
                          onClick={() => handleSuggestionClick(suggestion.action)}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-[#1A1A1A] hover:bg-gray-100 dark:hover:bg-[#222] border border-transparent hover:border-[#D4A937]/20 transition-all group text-left"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            suggestion.priority === 'high' ? 'bg-red-500' :
                            suggestion.priority === 'medium' ? 'bg-amber-500' : 'bg-gray-400'
                          }`} />
                          <span className="text-[13px] text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-[#F5F0E8] transition-colors flex-1">
                            {suggestion.text}
                          </span>
                          <ArrowRight className="w-3 h-3 text-gray-300 dark:text-gray-700 group-hover:text-[#D4A937] transition-colors" />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-200 dark:border-[#1E1E1E]">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#141414] rounded-xl px-3 py-2.5 border border-gray-200 dark:border-[#2A2A2A] focus-within:border-[#D4A937]/30 transition-colors">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything about your trades..."
                  className="flex-1 bg-transparent text-[13px] text-gray-900 dark:text-[#F5F0E8] placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none"
                />
                <button className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-[#D4A937] hover:bg-gray-100 dark:hover:bg-[#1A1A1A] transition-colors">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1.5 text-center">
                Powered by Afrikoni Intelligence Engine
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
