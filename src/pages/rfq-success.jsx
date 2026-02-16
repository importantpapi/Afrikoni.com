import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent } from '@/components/shared/ui/card';
import { CheckCircle, Clock, Users, Shield, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RFQSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rfqId = searchParams.get('id');
  const [rfq, setRfq] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (rfqId) {
      loadRFQ();
    }
  }, [rfqId]);

  const loadRFQ = async () => {
    try {
      const { data, error } = await supabase
        .from('rfqs')
        .select('*')
        .eq('id', rfqId)
        .single();

      if (error) throw error;
      setRfq(data);
    } catch (error) {
      console.error('Failed to load RFQ:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-afrikoni-offwhite flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-os-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-afrikoni-offwhite py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-os-accent/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-os-accent" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-afrikoni-chestnut mb-3">
            Your RFQ has been received
          </h1>
          {rfq && (
            <p className="text-os-lg text-afrikoni-deep">
              "{rfq.title}" is now being reviewed
            </p>
          )}
        </motion.div>

        {/* What Happens Next */}
        <Card className="border-os-accent/30 shadow-os-md mb-6">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-os-xl font-bold text-afrikoni-chestnut mb-6">
              What happens next?
            </h2>
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-os-accent/10 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-os-accent" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-afrikoni-chestnut mb-1">
                    Afrikoni reviews the request
                  </h3>
                  <p className="text-os-sm text-afrikoni-deep">
                    Our team reviews your RFQ to ensure it's complete and matches with the right suppliers.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-os-accent/10 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-os-accent" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-afrikoni-chestnut mb-1">
                    Verified suppliers are matched
                  </h3>
                  <p className="text-os-sm text-afrikoni-deep">
                    We match your request with verified suppliers who can fulfill your requirements.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-os-accent/10 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-os-accent" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-afrikoni-chestnut mb-1">
                    You'll receive responses in your dashboard
                  </h3>
                  <p className="text-os-sm text-afrikoni-deep">
                    All supplier quotes and communications will appear in your dashboard. You control who sees your contact information.
                  </p>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button
            onClick={() => navigate('/dashboard/rfqs')}
            className="bg-os-accent hover:bg-os-accentDark text-afrikoni-chestnut font-semibold text-os-base min-h-[52px] px-8"
          >
            Go to Dashboard
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>

        {/* Trust Note */}
        <div className="mt-8 text-center">
          <p className="text-os-sm text-afrikoni-deep/70">
            Your RFQ is private. Only verified suppliers matched by Afrikoni can respond.
          </p>
        </div>
      </div>
    </div>
  );
}

