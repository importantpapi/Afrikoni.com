/**
 * Supplier Onboarding Tracker
 * Track invites → signups → profile completion → product listing
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Mail, UserCheck, Package, ArrowRight, 
  Clock, CheckCircle, XCircle, TrendingUp, Send
} from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { TARGET_COUNTRY, COUNTRY_CONFIG } from '@/config/countryConfig';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { isAdmin } from '@/utils/permissions';
import { useAuth } from '@/contexts/AuthProvider';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import AccessDenied from '@/components/AccessDenied';

const FUNNEL_STAGES = [
  { key: 'invited', label: 'Invited', icon: Mail, color: 'bg-blue-500' },
  { key: 'signed_up', label: 'Signed Up', icon: UserCheck, color: 'bg-yellow-500' },
  { key: 'profile_complete', label: 'Profile Complete', icon: CheckCircle, color: 'bg-green-500' },
  { key: 'products_listed', label: 'Products Listed', icon: Package, color: 'bg-purple-500' }
];

export default function OnboardingTracker() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(false); // Local loading state
  const [selectedCountry, setSelectedCountry] = useState(TARGET_COUNTRY);
  const [funnelData, setFunnelData] = useState(null);
  const [stuckUsers, setStuckUsers] = useState([]);

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[OnboardingTracker] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → set no access
    if (!user) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    // Check admin access
    const admin = isAdmin(user);
    setHasAccess(admin);
    setLoading(false);
    
    if (admin) {
      loadFunnelData();
      loadStuckUsers();
    }
  }, [authReady, authLoading, user, profile, role, selectedCountry]);

  const loadFunnelData = async () => {
    try {
      // Get acquisition events for country
      const { data: events } = await supabase
        .from('acquisition_events')
        .select('*')
        .eq('country', selectedCountry)
        .eq('type', 'supplier_invite');

      const invited = events?.length || 0;

      // Get signups (companies created in country)
      const { data: companies } = await supabase
        .from('companies')
        .select('id, created_at, owner_email')
        .eq('country', selectedCountry)
        .in('role', ['seller', 'hybrid']);

      const signedUp = companies?.length || 0;

      // Get profiles completed (have company info)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, company_id, onboarding_completed')
        .eq('onboarding_completed', true);

      const profileComplete = profiles?.filter(p => 
        companies?.some(c => c.id === p.company_id)
      )?.length || 0;

      // Get products listed
      const { data: products } = await supabase
        .from('products')
        .select('id, company_id, status')
        .eq('status', 'active');

      const productsListed = products?.filter(p => 
        companies?.some(c => c.id === p.company_id)
      )?.length || 0;

      setFunnelData({
        invited,
        signed_up: signedUp,
        profile_complete: profileComplete,
        products_listed: productsListed
      });
    } catch (error) {
      console.error('Error loading funnel data:', error);
      toast.error('Failed to load funnel data');
    }
  };

  const loadStuckUsers = async () => {
    try {
      // Find users stuck at different stages
      const { data: events } = await supabase
        .from('acquisition_events')
        .select('email, created_at')
        .eq('country', selectedCountry)
        .eq('type', 'supplier_invite')
        .order('created_at', { ascending: false })
        .limit(50);

      const stuck = [];
      for (const event of events || []) {
        // Check if they signed up
        const { data: company } = await supabase
          .from('companies')
          .select('id, created_at')
          .eq('owner_email', event.email)
          .maybeSingle();

        if (!company) {
          stuck.push({ ...event, stage: 'invited', days: Math.floor((Date.now() - new Date(event.created_at)) / (1000 * 60 * 60 * 24)) });
          continue;
        }

        // Check if profile complete
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('company_id', company.id)
          .maybeSingle();

        if (!profile?.onboarding_completed) {
          stuck.push({ ...event, stage: 'signed_up', days: Math.floor((Date.now() - new Date(company.created_at)) / (1000 * 60 * 60 * 24)) });
          continue;
        }

        // Check if products listed
        const { data: products } = await supabase
          .from('products')
          .select('id')
          .eq('company_id', company.id)
          .limit(1);

        if (!products || products.length === 0) {
          stuck.push({ ...event, stage: 'profile_complete', days: Math.floor((Date.now() - new Date(company.created_at)) / (1000 * 60 * 60 * 24)) });
        }
      }

      setStuckUsers(stuck.slice(0, 20));
    } catch (error) {
      console.error('Error loading stuck users:', error);
    }
  };

  const sendReminder = async (email, stage) => {
    try {
      // In production, this would trigger an email/SMS
      toast.success(`Reminder sent to ${email} for ${stage} stage`);
      // Track reminder event
      await supabase.from('acquisition_events').insert({
        type: 'supplier_invite',
        country: selectedCountry,
        email,
        source: 'reminder_automation',
        metadata: { stage, action: 'reminder_sent' }
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Failed to send reminder');
    }
  };

  // Wait for auth to be ready
  if (!authReady || authLoading) {
    return <SpinnerWithTimeout message="Loading onboarding tracker..." />;
  }

  if (loading) {
    return (
      <DashboardLayout currentRole="admin">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
        </div>
      </DashboardLayout>
    );
  }

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const calculateConversion = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current / previous) * 100).toFixed(1);
  };

  return (
    <DashboardLayout currentRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-afrikoni-text-dark mb-2">Onboarding Tracker</h1>
            <p className="text-afrikoni-text-dark/70">
              Monitor supplier onboarding funnel and identify bottlenecks
            </p>
          </div>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(COUNTRY_CONFIG).map((country) => (
                <SelectItem key={country.name} value={country.name}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Funnel Visualization */}
        {funnelData && (
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Funnel - {selectedCountry}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {FUNNEL_STAGES.map((stage, idx) => {
                  const value = funnelData[stage.key] || 0;
                  const prevValue = idx > 0 ? funnelData[FUNNEL_STAGES[idx - 1].key] || 0 : value;
                  const conversion = calculateConversion(value, prevValue);
                  const width = prevValue > 0 ? (value / prevValue) * 100 : 0;

                  return (
                    <div key={stage.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${stage.color} flex items-center justify-center text-white`}>
                            <stage.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-afrikoni-text-dark">{stage.label}</div>
                            <div className="text-sm text-afrikoni-text-dark/70">
                              {value} suppliers
                              {idx > 0 && ` (${conversion}% conversion)`}
                            </div>
                          </div>
                        </div>
                        {idx < FUNNEL_STAGES.length - 1 && (
                          <ArrowRight className="w-5 h-5 text-afrikoni-text-dark/30" />
                        )}
                      </div>
                      {idx > 0 && (
                        <div className="h-2 bg-afrikoni-gold/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${width}%` }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className={`h-full ${stage.color}`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stuck Users */}
        <Card>
          <CardHeader>
            <CardTitle>Users Needing Follow-up</CardTitle>
            <p className="text-sm text-afrikoni-text-dark/70">
              Suppliers who haven't progressed in the onboarding funnel
            </p>
          </CardHeader>
          <CardContent>
            {stuckUsers.length === 0 ? (
              <div className="text-center py-8 text-afrikoni-text-dark/70">
                No stuck users found. Great job! 🎉
              </div>
            ) : (
              <div className="space-y-3">
                {stuckUsers.map((user, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 border border-afrikoni-gold/20 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Mail className="w-5 h-5 text-afrikoni-text-dark/50" />
                      <div>
                        <div className="font-medium text-afrikoni-text-dark">{user.email}</div>
                        <div className="text-sm text-afrikoni-text-dark/70">
                          Stuck at: <Badge variant="outline">{user.stage}</Badge>
                          {' • '}
                          {user.days} days ago
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendReminder(user.email, user.stage)}
                      className="border-afrikoni-gold text-afrikoni-gold hover:bg-afrikoni-gold/10"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Reminder
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
