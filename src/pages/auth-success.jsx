/**
 * Email Confirmation Success Page
 * Institutional design - celebrates success with restraint
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import AuthLayout from '@/components/auth/AuthLayout';

export default function AuthSuccess() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="Email confirmed"
      subtitle="Your Afrikoni account is now active and ready to use"
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
          >
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </motion.div>
          <p className="text-[14px] text-gray-600 leading-relaxed">
            You can now access all features of your account
          </p>
        </div>

        <Button
          onClick={() => navigate('/dashboard')}
          className="w-full h-[52px] bg-os-accent hover:bg-os-accent-dark active:bg-os-accent-dark text-white font-semibold text-[15px] rounded-[14px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(212,169,55,0.15)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_6px_16px_rgba(212,169,55,0.2)] active:shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
        >
          Go to dashboard
          <ArrowRight className="w-[18px] h-[18px] ml-2" />
        </Button>
      </motion.div>
    </AuthLayout>
  );
}

