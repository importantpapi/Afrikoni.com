/**
 * Mobile Action Zones Component (Bento Architecture)
 * Distinct colored bento-style blocks for "How It Works" and "Post RFQ"
 * Visual anchors in the middle of the scroll
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowRight, PlayCircle, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';

export default function MobileActionZones() {
  return (
    <section className="md:hidden py-6 bg-afrikoni-offwhite">
      <div className="max-w-[1440px] mx-auto px-4">
        {/* Side-by-side Bento Blocks */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* How It Works Bento Block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <Link to="/how-it-works">
              <Card className="border border-afrikoni-gold/20 bg-gradient-to-br from-white to-afrikoni-offwhite shadow-sm hover:shadow-md transition-all active:scale-[0.98] h-full">
                <CardContent className="p-3">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <PlayCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-afrikoni-chestnut mb-1">
                        How It Works
                      </h3>
                      <p className="text-[10px] text-afrikoni-deep/70 line-clamp-2">
                        Learn the process
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          {/* Post RFQ Bento Block - Primary CTA with Deep Blue/Gold */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Link to="/rfq/create">
              <Card className="border-2 border-afrikoni-gold bg-gradient-to-br from-afrikoni-gold via-afrikoni-gold/90 to-afrikoni-goldDark shadow-lg hover:shadow-xl transition-all active:scale-[0.98] h-full">
                <CardContent className="p-3">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white mb-1">
                        Post RFQ
                      </h3>
                      <p className="text-[10px] text-white/90 line-clamp-2">
                        Get quotes now
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
