/**
 * KoniAI Hero Section
 * Visual hero component for KoniAI Hub page
 */

import React from 'react';
import { motion } from 'framer-motion';
import KoniAILogo from './KoniAILogo';
import KoniAIBadge from './KoniAIBadge';
import { Sparkles, TrendingUp, Globe, Zap } from 'lucide-react';

export default function KoniAIHero() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-afrikoni-gold/20 via-afrikoni-goldDark/10 to-afrikoni-chestnut/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4A937' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Content */}
      <div className="relative px-6 py-12 md:px-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <KoniAILogo size="large" />
                <KoniAIBadge />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-afrikoni-chestnut mb-3">
                The Intelligence Behind African Trade
              </h1>
              <p className="text-lg md:text-xl text-afrikoni-deep/80 leading-relaxed">
                Ask, connect, and grow faster with KoniAI. Your built-in trade brain that helps buyers and sellers work smarter, not harder.
              </p>
            </div>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap gap-3"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-afrikoni-gold/30">
              <Sparkles className="w-4 h-4 text-afrikoni-gold" />
              <span className="text-sm font-medium text-afrikoni-chestnut">AI Product Assistant</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-afrikoni-gold/30">
              <Globe className="w-4 h-4 text-afrikoni-gold" />
              <span className="text-sm font-medium text-afrikoni-chestnut">Smart Supplier Finder</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-afrikoni-gold/30">
              <Zap className="w-4 h-4 text-afrikoni-gold" />
              <span className="text-sm font-medium text-afrikoni-chestnut">Instant RFQ Replies</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-afrikoni-gold/30">
              <TrendingUp className="w-4 h-4 text-afrikoni-gold" />
              <span className="text-sm font-medium text-afrikoni-chestnut">Growth Analytics</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-afrikoni-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-afrikoni-goldDark/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
    </div>
  );
}

