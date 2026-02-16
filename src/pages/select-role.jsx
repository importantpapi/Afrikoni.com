// SelectRole.jsx - FIXED VERSION
// Added missing useAuth import

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider'; // ← ADDED THIS IMPORT
import { useCapability } from '@/context/CapabilityContext';
import { Logo } from '@/components/shared/ui/Logo';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { ShoppingCart, Package } from 'lucide-react';
import { toast } from 'sonner';
import { setLastSelectedRole } from '@/lib/supabase-auth-helpers';

export default function SelectRole() {
  // Use centralized AuthProvider
  const { user, profile, authReady, loading: authLoading } = useAuth();
  // ✅ FOUNDATION FIX: Use capabilities instead of roleHelpers
  const capabilities = useCapability();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  
  // Helper function to get dashboard path based on capabilities
  const getDashboardPath = (mode) => {
    if (mode === 'buyer') return '/dashboard';
    if (mode === 'seller') return '/dashboard/products';
    return '/dashboard';
  };

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[SelectRole] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → redirect
    if (!user) {
      navigate('/login');
      return;
    }

    // ✅ FOUNDATION FIX: Check capabilities instead of role
    // Wait for capabilities to be ready
    if (!capabilities.ready) {
      return; // Will retry when capabilities load
    }
    
    // Check if user is hybrid (can buy AND can sell)
    const isHybridCapability = capabilities.can_buy === true && 
                               capabilities.can_sell === true && 
                               capabilities.sell_status === 'approved';
    
    // If not hybrid, redirect to appropriate dashboard
    if (!isHybridCapability) {
      if (capabilities.can_buy) {
        navigate('/dashboard', { replace: true });
      } else if (capabilities.can_sell && capabilities.sell_status === 'approved') {
        navigate('/dashboard/products', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
      return;
    }
  }, [authReady, authLoading, user, profile, capabilities.ready, navigate]);

  const handleSelect = async (targetRole) => {
    // GUARD: Check auth
    if (!authReady || !user) {
      navigate('/login');
      return;
    }

    setSaving(true);
    try {
      // Persist last selected role preference
      try {
        await setLastSelectedRole(user.id, targetRole);
      } catch (prefError) {
        console.warn('Failed to save last_selected_role:', prefError);
      }

      // Store locally for quick client-side decisions
      try {
        localStorage.setItem('afr_last_selected_role', targetRole);
      } catch {
        // ignore
      }

      const path = getDashboardPath(targetRole);
      navigate(path, { replace: true });
    } catch (err) {
      console.error('SelectRole save error:', err);
      toast.error('Unable to update role preference. Please try again.');
      setSaving(false);
    }
  };

  // Show loading while auth is initializing
  if (!authReady || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-afrikoni-offwhite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-os-accent" />
      </div>
    );
  }

  // ✅ FOUNDATION FIX: Check capabilities instead of role
  if (!capabilities.ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-afrikoni-offwhite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-os-accent" />
      </div>
    );
  }
  
  // Check if user is hybrid (can buy AND can sell)
  const isHybridCapability = capabilities.can_buy === true && 
                             capabilities.can_sell === true && 
                             capabilities.sell_status === 'approved';
  
  if (!isHybridCapability) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-afrikoni-offwhite via-afrikoni-cream to-afrikoni-offwhite flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo type="full" size="lg" link={true} showTagline={true} />
          </div>
          <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">Choose how you want to use Afrikoni today</h1>
          <p className="text-afrikoni-deep/80">
            You have a hybrid account. Select whether you're acting as a buyer or a seller for this session.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card
            className="border-os-accent/30 hover:border-os-accent shadow-os-gold bg-afrikoni-offwhite cursor-pointer transition-all"
            onClick={() => !saving && handleSelect('buyer')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-afrikoni-chestnut">
                <div className="p-3 rounded-lg bg-afrikoni-cream">
                  <ShoppingCart className="w-6 h-6 text-os-accent" />
                </div>
                Buyer Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-os-sm text-afrikoni-deep/80">
              <ul className="list-disc list-inside space-y-1">
                <li>Search and compare verified African suppliers.</li>
                <li>Post RFQs and receive quotes.</li>
                <li>Place and track orders with Trade Shield protection.</li>
              </ul>
              <Button
                className="mt-4 w-full bg-os-accent hover:bg-os-accentDark text-afrikoni-chestnut font-semibold"
                disabled={saving}
              >
                Continue as Buyer
              </Button>
            </CardContent>
          </Card>

          <Card
            className="border-os-accent/30 hover:border-os-accent shadow-os-gold bg-afrikoni-offwhite cursor-pointer transition-all"
            onClick={() => !saving && handleSelect('seller')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-afrikoni-chestnut">
                <div className="p-3 rounded-lg bg-afrikoni-cream">
                  <Package className="w-6 h-6 text-os-accent" />
                </div>
                Seller Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-os-sm text-afrikoni-deep/80">
              <ul className="list-disc list-inside space-y-1">
                <li>Publish and manage your product catalog.</li>
                <li>Receive and respond to RFQs from buyers.</li>
                <li>Manage orders, shipping, and payments.</li>
              </ul>
              <Button
                className="mt-4 w-full bg-os-accent hover:bg-os-accentDark text-afrikoni-chestnut font-semibold"
                disabled={saving}
              >
                Continue as Seller
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-os-xs text-afrikoni-deep/70">
          You can switch context any time from your dashboard navigation.
        </p>
      </div>
    </div>
  );
}