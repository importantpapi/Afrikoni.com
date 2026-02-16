import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Mail, TrendingUp, Gift, Users, Package, ShoppingCart, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    toast.success('Thank you for subscribing!');
    setEmail('');
  };

  // Product images for background
  const productImages = [
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=200',
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=200',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200',
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200'
  ];

  const [emailFocused, setEmailFocused] = useState(false);

  return (
    <div className="bg-gradient-to-br from-os-accent via-os-accentDark to-os-accent py-12 md:py-16 relative overflow-hidden">
      {/* Background Product Images */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 left-10 w-32 h-32 rounded-lg overflow-hidden"
        >
          <img src={productImages[0]} alt="" className="w-full h-full object-cover" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-20 right-20 w-40 h-40 rounded-lg overflow-hidden"
        >
          <img src={productImages[1]} alt="" className="w-full h-full object-cover" />
        </motion.div>
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute bottom-20 left-20 w-36 h-36 rounded-lg overflow-hidden"
        >
          <img src={productImages[2]} alt="" className="w-full h-full object-cover" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute bottom-10 right-10 w-28 h-28 rounded-lg overflow-hidden"
        >
          <img src={productImages[3]} alt="" className="w-full h-full object-cover" />
        </motion.div>
      </div>

      {/* Floating Decorative Icons */}
      <motion.div
        animate={{ y: [0, -10, 0], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-8 md:left-10 top-1/2 -translate-y-1/2 hidden lg:block"
      >
        <Package className="w-12 md:w-16 h-12 md:h-16 text-afrikoni-cream20" />
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute right-8 md:right-10 top-1/2 -translate-y-1/2 hidden lg:block"
      >
        <ShoppingCart className="w-12 md:w-16 h-12 md:h-16 text-afrikoni-cream20" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-4 text-center relative z-10"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Mail className="w-16 h-16 md:w-20 md:h-20 text-afrikoni-creammx-auto mb-5 md:mb-6" />
        </motion.div>
        <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-creammb-3 md:mb-4">Get African Wholesale Deals in Your Inbox</h2>
        <p className="text-os-base md:text-os-lg text-afrikoni-cream90 mb-6 md:mb-8 max-w-2xl mx-auto">
          Join 25,000+ businesses getting exclusive access to verified suppliers, market insights, and special deals across Africa.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-4">
          <Input
            type="email"
            placeholder="Enter your business email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            className={`flex-1 bg-afrikoni-offwhite border-2 ${emailFocused ? 'border-afrikoni-cream ring-4 ring-afrikoni-cream/30' : 'border-afrikoni-cream/50'} text-afrikoni-earth placeholder:text-afrikoni-earth/60 transition-all shadow-os-gold-lg`}
          />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              type="submit" 
              className="bg-afrikoni-chestnut text-afrikoni-cream hover:bg-afrikoni-deep w-full sm:w-auto shadow-os-gold-lg hover:shadow-os-gold-xl transition-shadow"
            >
              Subscribe Free →
            </Button>
          </motion.div>
        </form>
        <div className="flex items-center justify-center gap-2 text-os-xs md:text-os-sm text-afrikoni-cream70 mb-6 md:mb-8">
          <Lock className="w-3 h-3 md:w-4 md:h-4" />
          <span>Free forever • Unsubscribe anytime • No spam, just value</span>
        </div>
        
        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6 mt-8 md:mt-12">
          {[
            { icon: TrendingUp, title: 'Market Insights', desc: 'Weekly African trade trends and opportunities.' },
            { icon: Gift, title: 'Exclusive Deals', desc: 'Special pricing and bulk order opportunities.' },
            { icon: Users, title: 'Supplier Spotlights', desc: 'Featured verified suppliers and new products.' }
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
                className="text-afrikoni-creamtext-center"
              >
                <Icon className="w-7 h-7 md:w-8 md:h-8 text-afrikoni-creammx-auto mb-2" />
                <div className="font-semibold mb-1 text-os-sm md:text-os-base">{feature.title}</div>
                <div className="text-os-xs md:text-os-sm text-afrikoni-cream80">{feature.desc}</div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
