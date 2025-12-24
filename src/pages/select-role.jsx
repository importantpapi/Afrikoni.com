import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { getDashboardPathForRole, getValidViewModes } from '@/utils/roleHelpers';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Package, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { setLastSelectedRole } from '@/lib/supabase-auth-helpers';

export default function SelectRole() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { user, profile, role: normalizedRole } = await getCurrentUserAndRole(supabase, supabaseHelpers);
        if (!user) {
          navigate('/login');
          return;
        }

        // If not multi-role, just send them to their dashboard
        if (normalizedRole !== 'hybrid') {
          const path = getDashboardPathForRole(normalizedRole);
          navigate(path, { replace: true });
          return;
        }

        setRole(normalizedRole);
      } catch (err) {
        console.error('SelectRole load error:', err);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const handleSelect = async (targetRole) => {
    setSaving(true);
    try {
      const { user, profile } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      if (!user) {
        navigate('/login');
        return;
      }

      // Persist last selected role preference in dedicated table and profile metadata if possible
      try {
        await setLastSelectedRole(user.id, targetRole);
      } catch (prefError) {
        console.warn('Failed to save last_selected_role in preferences:', prefError);
      }

      // Also store locally for quick client-side decisions
      try {
        localStorage.setItem('afr_last_selected_role', targetRole);
      } catch {
        // ignore
      }

      const path = getDashboardPathForRole(targetRole);
      navigate(path, { replace: true });
    } catch (err) {
      console.error('SelectRole save error:', err);
      toast.error('Unable to update role preference. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-afrikoni-offwhite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  if (!role) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-afrikoni-offwhite via-afrikoni-cream to-afrikoni-offwhite flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo type="full" size="lg" link={true} showTagline={true} />
          </div>
          <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">Choose how you want to use Afrikoni today</h1>
          <p className="text-afrikoni-deep/80">
            You have a hybrid account. Select whether you’re acting as a buyer or a seller for this session.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card
            className="border-afrikoni-gold/30 hover:border-afrikoni-gold shadow-afrikoni bg-afrikoni-offwhite cursor-pointer transition-all"
            onClick={() => !saving && handleSelect('buyer')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-afrikoni-chestnut">
                <div className="p-3 rounded-lg bg-afrikoni-cream">
                  <ShoppingCart className="w-6 h-6 text-afrikoni-gold" />
                </div>
                Buyer Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-afrikoni-deep/80">
              <ul className="list-disc list-inside space-y-1">
                <li>Search and compare verified African suppliers.</li>
                <li>Post RFQs and receive quotes.</li>
                <li>Place and track orders with Trade Shield protection.</li>
              </ul>
              <Button
                className="mt-4 w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut font-semibold"
                disabled={saving}
              >
                Continue as Buyer
              </Button>
            </CardContent>
          </Card>

          <Card
            className="border-afrikoni-gold/30 hover:border-afrikoni-gold shadow-afrikoni bg-afrikoni-offwhite cursor-pointer transition-all"
            onClick={() => !saving && handleSelect('seller')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-afrikoni-chestnut">
                <div className="p-3 rounded-lg bg-afrikoni-cream">
                  <Package className="w-6 h-6 text-afrikoni-gold" />
                </div>
                Seller Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-afrikoni-deep/80">
              <ul className="list-disc list-inside space-y-1">
                <li>Publish and manage your product catalog.</li>
                <li>Receive and respond to RFQs from buyers.</li>
                <li>Manage orders, shipping, and payments.</li>
              </ul>
              <Button
                className="mt-4 w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut font-semibold"
                disabled={saving}
              >
                Continue as Seller
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-xs text-afrikoni-deep/70">
          You can switch context any time from your dashboard navigation.
        </p>
      </div>
    </div>
  );
}


