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
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { ShoppingCart, Package, Truck, Store, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/shared/ui/Logo';

export default function ChooseService() {
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // ─────────────────────────────────────────────
  // AUTH GUARD
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!authReady || authLoading) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const existingRole = role || profile?.role;
    if (existingRole && ['buyer', 'seller', 'hybrid', 'logistics'].includes(existingRole)) {
      navigate(`/dashboard/${existingRole}`, { replace: true });
    }
  }, [authReady, authLoading, user, role, profile, navigate]);

  // ─────────────────────────────────────────────
  // 🔥 FINAL ROLE SAVE (RPC — SAFE & IDEMPOTENT)
  // ─────────────────────────────────────────────
  const handleSelectService = async (selectedRole) => {
    if (saving) return;

    if (!authReady || !user) {
      navigate('/login', { replace: true });
      return;
    }

    setSaving(true);

    try {
      const { data, error } = await supabase.rpc('set_user_role', {
        new_role: selectedRole,
      });

      if (error || !data?.ok) {
        console.error('[ChooseService] Role save failed:', error || data);
        throw new Error('Role save failed');
      }

      toast.success('Service selected successfully');
      navigate(`/dashboard/${selectedRole}`, { replace: true });

    } catch (err) {
      console.error('[ChooseService] Error:', err);
      toast.error('Failed to save service selection. Please try again.');
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────
  if (!authReady || authLoading) {
    return <SpinnerWithTimeout message="Loading service selection..." />;
  }

  // ─────────────────────────────────────────────
  // SERVICES CONFIG
  // ─────────────────────────────────────────────
  const services = [
    {
      id: 'buyer',
      title: 'Buyer',
      icon: ShoppingCart,
      description: 'Source products from verified African suppliers.',
    },
    {
      id: 'seller',
      title: 'Seller',
      icon: Package,
      description: 'Sell products and respond to buyer RFQs.',
    },
    {
      id: 'hybrid',
      title: 'Hybrid',
      icon: Store,
      description: 'Buy and sell using one unified account.',
    },
    {
      id: 'logistics',
      title: 'Logistics Partner',
      icon: Truck,
      description: 'Provide shipping and logistics services.',
    },
  ];

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-afrikoni-offwhite via-afrikoni-cream to-afrikoni-offwhite py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Logo type="full" size="lg" showTagline />
          </div>
          <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">
            Choose how you want to use Afrikoni
          </h1>
          <p className="text-afrikoni-deep/80">
            This determines your dashboard and tools.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <Card
                  className="cursor-pointer border-afrikoni-gold/30 hover:border-afrikoni-gold bg-afrikoni-offwhite shadow-lg transition-all"
                  onClick={() => handleSelectService(service.id)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Icon className="w-6 h-6 text-afrikoni-gold" />
                      {service.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{service.description}</p>
                    <Button
                      className="w-full bg-afrikoni-gold text-afrikoni-chestnut"
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

        <p className="text-center text-sm text-afrikoni-deep/70 mt-8">
          You can change this later in your account settings.
        </p>
      </div>
    </div>
  );
}
