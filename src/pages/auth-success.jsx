/**
 * Email Confirmation Success Page
 * 
 * Clean success page shown after email confirmation.
 * MVP-clean, Amazon-simple, Stripe-clear.
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, LogIn } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function AuthSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-afrikoni-offwhite via-afrikoni-cream to-afrikoni-offwhite flex items-center justify-center py-8 sm:py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-afrikoni-gold/20 shadow-2xl bg-afrikoni-offwhite rounded-xl">
          <CardContent className="p-6 sm:p-8 md:p-10 text-center">
            <div className="flex justify-center mb-6">
              <Logo type="full" size="lg" link={true} showTagline={false} />
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <CheckCircle className="w-20 h-20 mx-auto mb-6 text-green-600" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-4">
                Your email is confirmed ✅
              </h1>
              <p className="text-lg text-afrikoni-deep mb-2">
                Your Afrikoni account is now active.
              </p>
              <p className="text-base text-afrikoni-deep/80 mb-8">
                You can explore Afrikoni freely.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <Button
                onClick={() => navigate('/')}
                variant="primary"
                className="w-full h-12 text-base font-semibold"
              >
                Go to Afrikoni
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="w-full h-12 text-base"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Log in
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

