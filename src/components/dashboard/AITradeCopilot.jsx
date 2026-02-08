import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, ChevronRight, Zap, ArrowRight } from 'lucide-react';

/**
 * AITradeCopilot - Persistent floating AI assistant
 *
 * Always available. Contextual. Explains next best action.
 * Not a chatbot - a trade intelligence copilot.
 */

const SUGGESTIONS = [
  { text: 'Create RFQ for 500kg cocoa beans', action: '/dashboard/rfqs/new' },
  { text: 'Check escrow release conditions', action: '/dashboard/payments' },
  { text: 'Review pending supplier verification', action: '/dashboard/kyc' },
  { text: 'Analyze trade corridor performance', action: '/dashboard/trade-pipeline' },
];

export default function AITradeCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');

  return (
    <>
      {/* Floating Trigger */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9990] w-12 h-12 rounded-full bg-[#D4A937] text-[#0A0A0A] shadow-lg shadow-[#D4A937]/25 flex items-center justify-center hover:scale-105 transition-transform"
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
            className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0A0A0A]"
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
            className="fixed bottom-20 right-6 z-[9990] w-[360px] max-h-[500px] bg-[#0F0F0F] border border-[#2A2A2A] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#1E1E1E] flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#D4A937]/10 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-[#D4A937]" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-[#F5F0E8]">AI Trade Copilot</span>
                <span className="text-[10px] text-emerald-500 ml-2">Online</span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* AI Insights */}
              <div className="p-3 rounded-xl bg-[#141414] border border-[#1E1E1E]">
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap className="w-3.5 h-3.5 text-[#D4A937]" />
                  <span className="text-[11px] font-semibold text-[#D4A937] uppercase tracking-wider">Insights</span>
                </div>
                <p className="text-[13px] text-gray-300 leading-relaxed">
                  Your trust score is <span className="text-emerald-400 font-semibold">78</span>. Complete supplier verification to unlock premium buyer access and faster escrow releases.
                </p>
              </div>

              {/* Quick Actions */}
              <div>
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider px-1">Suggested Actions</span>
                <div className="mt-2 space-y-1.5">
                  {SUGGESTIONS.map((suggestion, i) => (
                    <motion.a
                      key={i}
                      href={suggestion.action}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-[#1A1A1A] hover:bg-[#222] border border-transparent hover:border-[#D4A937]/20 transition-all group"
                    >
                      <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-[#D4A937] transition-colors" />
                      <span className="text-[13px] text-gray-300 group-hover:text-[#F5F0E8] transition-colors flex-1">
                        {suggestion.text}
                      </span>
                      <ArrowRight className="w-3 h-3 text-gray-700 group-hover:text-[#D4A937] transition-colors" />
                    </motion.a>
                  ))}
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[#1E1E1E]">
              <div className="flex items-center gap-2 bg-[#141414] rounded-xl px-3 py-2 border border-[#2A2A2A] focus-within:border-[#D4A937]/30 transition-colors">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything about your trades..."
                  className="flex-1 bg-transparent text-[13px] text-[#F5F0E8] placeholder:text-gray-600 outline-none"
                />
                <button className="p-1.5 rounded-lg text-gray-500 hover:text-[#D4A937] hover:bg-[#1A1A1A] transition-colors">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
