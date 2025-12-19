import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { sendEmail } from '@/services/emailService';

/**
 * Newsletter popup component
 * Shows after delay or on exit intent
 * Stores consent in localStorage
 */
export default function NewsletterPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    // Check if user has already subscribed or dismissed
    const newsletterDismissed = localStorage.getItem('newsletterPopupDismissed');
    const newsletterSubscribed = localStorage.getItem('newsletterSubscribed');
    const lastPopupTime = localStorage.getItem('newsletterPopupLastShown');
    
    if (newsletterDismissed || newsletterSubscribed) {
      return;
    }
    
    // Prevent showing popup if it was shown in the last 24 hours
    if (lastPopupTime) {
      const timeSinceLastShow = Date.now() - parseInt(lastPopupTime, 10);
      const oneDay = 24 * 60 * 60 * 1000;
      if (timeSinceLastShow < oneDay) {
        return;
      }
    }
    
    // Track if popup is already showing to prevent multiple instances
    let popupShown = false;
    
    // Show popup after 30 seconds (only once)
    const timer = setTimeout(() => {
      if (!popupShown) {
        popupShown = true;
        localStorage.setItem('newsletterPopupLastShown', Date.now().toString());
        setShowPopup(true);
      }
    }, 30000);
    
    // Exit intent detection (mouse leaves top of viewport) - only once
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && !popupShown) {
        popupShown = true;
        localStorage.setItem('newsletterPopupLastShown', Date.now().toString());
        setShowPopup(true);
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
    
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);
  
  const handleDismiss = () => {
    localStorage.setItem('newsletterPopupDismissed', 'true');
    setShowPopup(false);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save to Supabase newsletter table (if exists) or profiles
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .insert({
          email,
          source: 'homepage_popup',
          subscribed_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error && error.code !== '23505') { // Ignore duplicate key errors
        throw error;
      }
      
      // Send welcome email
      const emailResult = await sendEmail({
        to: email,
        subject: 'Welcome to Afrikoni - Africa\'s B2B Trade Engine',
        template: 'newsletterWelcome',
        data: { email }
      });
      
      if (emailResult.success) {
        toast.success('Thank you for subscribing! Welcome email sent to your inbox.', {
          duration: 5000,
          description: 'Check your inbox for the welcome email from hello@afrikoni.com'
        });
      } else {
        console.error('Email send failed:', emailResult.error);
        toast.warning('Subscribed successfully, but welcome email could not be sent.', {
          duration: 8000,
          description: emailResult.error || 'Please check your email settings or contact support.'
        });
      }
      
      localStorage.setItem('newsletterSubscribed', 'true');
      localStorage.setItem('newsletterEmail', email);
      setShowPopup(false);
    } catch (error) {
      // Fallback: store in localStorage if Supabase fails
      localStorage.setItem('newsletterSubscribed', 'true');
      localStorage.setItem('newsletterEmail', email);
      
      // Still try to send welcome email
      const emailResult = await sendEmail({
        to: email,
        subject: 'Welcome to Afrikoni - Africa\'s B2B Trade Engine',
        template: 'newsletterWelcome',
        data: { email }
      });
      
      if (emailResult.success) {
        toast.success('Thank you for subscribing! Welcome email sent to your inbox.', {
          duration: 5000,
          description: 'Check your inbox for the welcome email from hello@afrikoni.com'
        });
      } else {
        console.error('Email send failed:', emailResult.error);
        toast.warning('Subscribed successfully, but welcome email could not be sent.', {
          duration: 8000,
          description: emailResult.error || 'Please check your email settings or contact support.'
        });
      }
      
      setShowPopup(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!showPopup) return null;
  
  return (
    <AnimatePresence>
      {showPopup && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[200] backdrop-blur-sm"
            onClick={handleDismiss}
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-afrikoni-xl max-w-md w-full relative overflow-hidden border-2 border-afrikoni-gold/20">
              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-afrikoni-deep/70 hover:text-afrikoni-deep transition-colors z-10"
                aria-label="Close newsletter popup"
              >
                <X className="w-5 h-5" />
              </button>
              
              {/* Content */}
              <motion.div 
                className="p-6 md:p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <motion.div 
                  className="text-center mb-6"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <motion.div 
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-afrikoni-gold/20 mb-4"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Gift className="w-8 h-8 text-afrikoni-gold" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-afrikoni-chestnut mb-2">
                    Stay Updated with Afrikoni
                  </h3>
                  <p className="text-afrikoni-deep/80 text-sm">
                    Get the latest B2B trade insights, supplier updates, and exclusive offers delivered to your inbox.
                  </p>
                </motion.div>
                
                <motion.form 
                  onSubmit={handleSubmit} 
                  className="space-y-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <motion.div 
                    className="relative"
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/50" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12"
                      required
                    />
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut h-12"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Subscribing...' : 'Subscribe Now'}
                    </Button>
                  </motion.div>
                  
                  <motion.p 
                    className="text-xs text-afrikoni-deep/60 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
                  </motion.p>
                </motion.form>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

