/**
 * Afrikoni Bushido Manifesto
 * Our core principles that define what we're capable of
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Zap, Heart, Lightbulb, 
  Award, Target, Users, CheckCircle 
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function BushidoManifesto() {
  const principles = [
    {
      number: 1,
      title: 'HONOR IN TRADE',
      description: 'Every deal is sacred. We trade with integrity and trust.',
      icon: Shield,
      color: 'text-afrikoni-gold'
    },
    {
      number: 2,
      title: 'DISCIPLINE IN ACTION',
      description: 'We move with precision, speed, and respect for excellence.',
      icon: Zap,
      color: 'text-afrikoni-gold'
    },
    {
      number: 3,
      title: 'LOYALTY TO THE VISION',
      description: 'We build Afrikoni as one family, one future.',
      icon: Heart,
      color: 'text-afrikoni-gold'
    },
    {
      number: 4,
      title: 'COURAGE IN INNOVATION',
      description: 'We face Africa\'s challenges with bold ideas and fearless creativity.',
      icon: Lightbulb,
      color: 'text-afrikoni-gold'
    },
    {
      number: 5,
      title: 'RESPECT FOR LEGACY',
      description: 'We honor our ancestors by building something eternal.',
      icon: Award,
      color: 'text-afrikoni-gold'
    },
    {
      number: 6,
      title: 'MASTERY OVER MEDIOCRITY',
      description: 'We refine, perfect, and dominate our craft.',
      icon: Target,
      color: 'text-afrikoni-gold'
    },
    {
      number: 7,
      title: 'UNITY IN DIVERSITY',
      description: 'Every nation, tribe, and language adds power to our empire.',
      icon: Users,
      color: 'text-afrikoni-gold'
    }
  ];

  return (
    <section className="relative py-16 md:py-24 bg-gradient-to-br from-afrikoni-chestnut via-afrikoni-deep to-afrikoni-chestnut overflow-hidden">
      {/* Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(212, 168, 87, 0.1) 10px, rgba(212, 168, 87, 0.1) 20px)'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo type="icon" size="lg" link={false} className="text-afrikoni-gold" />
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-afrikoni-gold mb-4">
            AFRIKONI
          </h2>
          
          <p className="text-lg md:text-xl text-afrikoni-gold/90 mb-6 font-semibold tracking-wide">
            TRADE. TRUST. THRIVE.
          </p>
          
          <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-afrikoni-gold mb-6">
            AFRIKONI BUSHIDO MANIFESTO
          </h3>
          
          <p className="text-base md:text-lg text-afrikoni-cream/80 max-w-3xl mx-auto">
            Our code of conduct. The principles that define what we're capable of for you.
          </p>
        </motion.div>

        {/* Principles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {principles.map((principle, idx) => {
            const Icon = principle.icon;
            return (
              <motion.div
                key={principle.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-afrikoni-deep/80 to-afrikoni-chestnut/80 backdrop-blur-sm border-2 border-afrikoni-gold/30 rounded-xl p-6 md:p-8 hover:border-afrikoni-gold hover:shadow-afrikoni-lg transition-all h-full">
                  {/* Number Badge */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-afrikoni-gold rounded-full flex items-center justify-center shadow-lg border-2 border-afrikoni-chestnut">
                    <span className="text-afrikoni-chestnut font-bold text-lg">
                      {principle.number}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="flex justify-center mb-4 mt-2">
                    <div className="w-16 h-16 rounded-full bg-afrikoni-gold/20 flex items-center justify-center border border-afrikoni-gold/30">
                      <Icon className={`w-8 h-8 ${principle.color}`} />
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="text-xl md:text-2xl font-bold font-serif text-afrikoni-gold mb-3 text-center">
                    {principle.title}
                  </h4>

                  {/* Description */}
                  <p className="text-afrikoni-cream/90 text-center leading-relaxed">
                    {principle.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12 md:mt-16"
        >
          <div className="inline-flex items-center gap-2 bg-afrikoni-gold/10 border border-afrikoni-gold/30 rounded-full px-6 py-3">
            <CheckCircle className="w-5 h-5 text-afrikoni-gold" />
            <p className="text-afrikoni-cream font-semibold">
              This is our promise. This is what we're capable of for you.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

