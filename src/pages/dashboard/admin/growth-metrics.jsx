/**
 * Growth Metrics Dashboard
 * Admin view of country-specific growth and acquisition metrics
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, Package, FileText, ShoppingCart, 
  Globe, DollarSign, ArrowUp, ArrowDown, Calendar,
  Target, Zap, CheckCircle
} from 'lucide-react';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { TARGET_COUNTRY, getCountryConfig, COUNTRY_CONFIG } from '@/config/countryConfig';
import { getCountryMetrics, updateCountryMetrics, getOnboardingFunnel } from '@/services/acquisitionService';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { toast } from 'sonner';
// NOTE: Admin check done at route level - removed isAdmin import
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import ErrorState from '@/components/shared/ui/ErrorState';
import AccessDenied from '@/components/AccessDenied';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function GrowthMetricsDashboard() {
  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady, isAdmin } = useDashboardKernel();
  const [loading, setLoading] = useState(false); // Local loading state
  const [error, setError] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(TARGET_COUNTRY);
  const [metrics, setMetrics] = useState([]);
  const [funnel, setFunnel] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return <SpinnerWithTimeout message="Loading growth metrics..." ready={isSystemReady} />;
  }
  
  // ✅ KERNEL MIGRATION: Check if user is authenticated
  if (!userId) {
    return <AccessDenied />;
  }
  
  // ✅ KERNEL MIGRATION: Check admin access
  if (!isAdmin) {
    return <AccessDenied />;
  }

  useEffect(() => {
    // ✅ KERNEL MIGRATION: Use canLoadData guard
    if (!canLoadData) {
      return;
    }
    
    loadMetrics();
    loadFunnel();
  }, [canLoadData, selectedCountry]);

  const loadMetrics = async () => {
    try {
      const data = await getCountryMetrics(selectedCountry);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast.error('Failed to load metrics');
    }
  };

  const loadFunnel = async () => {
    if (!canLoadData) {
      return;
    }
    
    try {
      const data = await getOnboardingFunnel(selectedCountry);
      setFunnel(data);
    } catch (error) {
      console.error('Error loading funnel:', error);
      // Don't set error state for funnel as it's secondary data
    }
  };

  const handleUpdateMetrics = async () => {
    setIsUpdating(true);
    try {
      await updateCountryMetrics(selectedCountry);
      toast.success('Metrics updated successfully');
      loadMetrics();
      loadFunnel();
    } catch (error) {
      console.error('Error updating metrics:', error);
      toast.error('Failed to update metrics');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
        </div>
      </>
    );
  }
  
  // ✅ KERNEL MIGRATION: Use ErrorState component for errors
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={() => {
          setError(null);
          loadMetrics();
          loadFunnel();
        }}
      />
    );
  }

  const latestMetrics = metrics[0] || {};
  const config = getCountryConfig();

  // Prepare chart data
  const chartData = metrics.slice(0, 30).reverse().map(m => ({
    date: new Date(m.metric_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    suppliers: m.total_suppliers,
    buyers: m.total_buyers,
    listings: m.total_listings,
    orders: m.total_orders,
    gmv: parseFloat(m.gmv || 0)
  }));

  const funnelData = funnel ? [
    { name: 'Invites Sent', value: funnel.invites_sent, color: '#D4A937' },
    { name: 'Signups', value: funnel.signups_completed, color: '#8B7355' },
    { name: 'Profiles', value: funnel.profiles_completed, color: '#6B8E23' },
    { name: 'Products', value: funnel.products_listed, color: '#2D5016' }
  ] : [];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-afrikoni-text-dark mb-2">Growth Metrics</h1>
            <p className="text-afrikoni-text-dark/70">
              Track acquisition, onboarding, and growth by country
            </p>
          </div>
          <div className="flex items-center gap-4">
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
            <Button
              onClick={handleUpdateMetrics}
              disabled={isUpdating}
              className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut"
            >
              <Zap className="w-4 h-4 mr-2" />
              {isUpdating ? 'Updating...' : 'Update Metrics'}
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-afrikoni-gold" />
                <Badge className="bg-green-50 text-green-700">
                  <ArrowUp className="w-3 h-3 mr-1" />
                  {latestMetrics.new_suppliers_today || 0} today
                </Badge>
              </div>
              <div className="text-3xl font-bold text-afrikoni-text-dark mb-1">
                {latestMetrics.total_suppliers || 0}
              </div>
              <div className="text-sm text-afrikoni-text-dark/70">Total Suppliers</div>
              <div className="text-xs text-afrikoni-text-dark/60 mt-1">
                {latestMetrics.verified_suppliers || 0} verified
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Globe className="w-8 h-8 text-afrikoni-gold" />
                <Badge className="bg-green-50 text-green-700">
                  <ArrowUp className="w-3 h-3 mr-1" />
                  {latestMetrics.new_buyers_today || 0} today
                </Badge>
              </div>
              <div className="text-3xl font-bold text-afrikoni-text-dark mb-1">
                {latestMetrics.total_buyers || 0}
              </div>
              <div className="text-sm text-afrikoni-text-dark/70">Total Buyers</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8 text-afrikoni-gold" />
                <Badge className="bg-green-50 text-green-700">
                  <ArrowUp className="w-3 h-3 mr-1" />
                  {latestMetrics.new_listings_today || 0} today
                </Badge>
              </div>
              <div className="text-3xl font-bold text-afrikoni-text-dark mb-1">
                {latestMetrics.total_listings || 0}
              </div>
              <div className="text-sm text-afrikoni-text-dark/70">Active Listings</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-afrikoni-gold" />
                <Badge className="bg-afrikoni-green text-white">
                  GMV
                </Badge>
              </div>
              <div className="text-3xl font-bold text-afrikoni-text-dark mb-1">
                ${(latestMetrics.gmv || 0).toLocaleString()}
              </div>
              <div className="text-sm text-afrikoni-text-dark/70">Gross Merchandise Value</div>
              <div className="text-xs text-afrikoni-text-dark/60 mt-1">
                {latestMetrics.total_orders || 0} completed orders
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onboarding Funnel */}
        {funnel && (
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Funnel - {selectedCountry}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {funnelData.map((step, idx) => {
                  const prevValue = idx > 0 ? funnelData[idx - 1].value : 100;
                  const conversionRate = prevValue > 0 ? ((step.value / prevValue) * 100).toFixed(1) : 0;
                  return (
                    <div key={idx} className="text-center">
                      <div className="text-3xl font-bold mb-2" style={{ color: step.color }}>
                        {step.value}
                      </div>
                      <div className="text-sm text-afrikoni-text-dark/70 mb-1">{step.name}</div>
                      {idx > 0 && (
                        <div className="text-xs text-afrikoni-text-dark/60">
                          {conversionRate}% conversion
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Growth Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Growth (30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="suppliers" stroke="#D4A937" name="Suppliers" />
                  <Line type="monotone" dataKey="buyers" stroke="#8B7355" name="Buyers" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>GMV & Orders (30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="orders" fill="#D4A937" name="Orders" />
                  <Bar yAxisId="right" dataKey="gmv" fill="#6B8E23" name="GMV ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
