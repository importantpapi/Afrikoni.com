/**
 * Choose Service Page - MANDATORY Service Selection
 * 
 * Users must choose exactly ONE service role:
 * - buyer
 * - seller
 * - hybrid
 * - logistics
 * 
 * This choice determines their dashboard and available tools.
 * Only ONE role is active at a time.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Package, Truck, Store } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/ui/Logo';
import { Loader2 } from 'lucide-react';

export default function ChooseService() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user, profile } = await getCurrentUserAndRole(supabase, supabaseHelpers);
        
        if (!user) {
          navigate('/login', { replace: true });
          return;
        }

        // If user already has a role, redirect to their dashboard
        if (profile?.role && ['buyer', 'seller', 'hybrid', 'logistics'].includes(profile.role)) {
          const dashboardPath = `/${profile.role}/dashboard`;
          navigate(dashboardPath, { replace: true });
          return;
        }

        setCurrentRole(profile?.role || null);
      } catch (error) {
        console.error('ChooseService auth check error:', error);
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSelectService = async (role) => {
    if (saving) return;

    setSaving(true);
    try {
      const { user } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      // Save role to profiles.role (single source of truth)
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast.success('Service selected successfully!');

      // Immediately redirect to role-specific dashboard
      const dashboardPath = `/${role}/dashboard`;
      navigate(dashboardPath, { replace: true });
    } catch (error) {
      console.error('ChooseService save error:', error);
      toast.error('Failed to save service selection. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-afrikoni-offwhite">
        <Loader2 className="w-8 h-8 animate-spin text-afrikoni-gold" />
      </div>
    );
  }

  const services = [
    {
      id: 'buyer',
      title: 'Buyer',
      icon: ShoppingCart,
      description: 'Source products from verified African suppliers. Place orders with Trade Shield protection.',
      features: [
        'Search and compare suppliers',
        'Post RFQs and receive quotes',
        'Place protected orders',
        'Track shipments and payments'
      ]
    },
    {
      id: 'seller',
      title: 'Seller',
      icon: Package,
      description: 'Sell your products and services. Respond to RFQs from buyers across Africa.',
      features: [
        'List products in catalog',
        'Respond to buyer RFQs',
        'Manage orders and fulfillment',
        'Track sales and payments'
      ]
    },
    {
      id: 'hybrid',
      title: 'Hybrid',
      icon: Store,
      description: 'Buy from other suppliers and sell your own products. One account for both buying and selling.',
      features: [
        'Access buyer and seller tools',
        'Source products and sell yours',
        'Unified order management',
        'Complete B2B marketplace access'
      ]
    },
    {
      id: 'logistics',
      title: 'Logistics Partner',
      icon: Truck,
      description: 'Provide shipping, customs clearance, and delivery services to buyers and sellers.',
      features: [
        'Offer shipping services',
        'Handle customs clearance',
        'Manage deliveries',
        'Track shipments in real-time'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-afrikoni-offwhite via-afrikoni-cream to-afrikoni-offwhite py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo type="full" size="lg" link={true} showTagline={true} />
          </div>
          <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">
            Choose how you want to use Afrikoni
          </h1>
          <p className="text-lg text-afrikoni-deep/80">
            This defines your dashboard and available tools.
            <br />
            You can change this later, but only one mode is active at a time.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: services.indexOf(service) * 0.1 }}
              >
                <Card
                  className="border-afrikoni-gold/30 hover:border-afrikoni-gold shadow-lg bg-afrikoni-offwhite cursor-pointer transition-all h-full"
                  onClick={() => !saving && handleSelectService(service.id)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-afrikoni-chestnut">
                      <div className="p-3 rounded-lg bg-afrikoni-cream">
                        <Icon className="w-6 h-6 text-afrikoni-gold" />
                      </div>
                      {service.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-afrikoni-deep/80 mb-4">
                      {service.description}
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-afrikoni-deep/70 mb-4">
                      {service.features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                    <Button
                      className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut font-semibold"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        `Continue as ${service.title}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-sm text-afrikoni-deep/70 mt-6">
          You can change your service mode anytime from your account settings.
        </p>
      </div>
    </div>
  );
}

