/**
 * Supplier Performance Dashboard
 * View performance metrics and analytics
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Package, AlertTriangle, Star, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/layouts/DashboardLayout';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { 
  getSupplierPerformance,
  calculateSupplierPerformance
} from '@/lib/supabaseQueries/products';
import { toast } from 'sonner';
import { CardSkeleton } from '@/components/ui/skeletons';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PerformanceDashboard() {
  const [performance, setPerformance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { user, companyId: userCompanyId } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      
      if (!user || !userCompanyId) {
        navigate('/login');
        return;
      }

      setCompanyId(userCompanyId);

      // Calculate and get performance
      await calculateSupplierPerformance(userCompanyId);
      const perf = await getSupplierPerformance(userCompanyId);
      setPerformance(perf);
    } catch (error) {
      console.error('Error loading performance data:', error);
      toast.error('Failed to load performance data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <CardSkeleton count={3} />
      </DashboardLayout>
    );
  }

  const metrics = [
    {
      label: 'On-Time Delivery Rate',
      value: performance?.on_time_delivery_rate?.toFixed(1) || '0',
      unit: '%',
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Average Response Time',
      value: performance?.response_time_hours?.toFixed(1) || '0',
      unit: ' hours',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Dispute Rate',
      value: performance?.dispute_rate?.toFixed(2) || '0',
      unit: '%',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      label: 'Average Rating',
      value: performance?.average_rating?.toFixed(1) || '0',
      unit: '/5',
      icon: Star,
      color: 'text-afrikoni-gold',
      bgColor: 'bg-afrikoni-gold/20'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-afrikoni-text-dark mb-2">Performance Metrics</h1>
          <p className="text-afrikoni-text-dark/70">Track your supplier performance and KPIs</p>
        </motion.div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-full ${metric.bgColor}`}>
                      <metric.icon className={`w-6 h-6 ${metric.color}`} />
                    </div>
                  </div>
                  <p className="text-sm text-afrikoni-text-dark/70 mb-1">{metric.label}</p>
                  <p className={`text-3xl font-bold ${metric.color}`}>
                    {metric.value}{metric.unit}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Key Performance Indicators</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-afrikoni-text-dark/70 mb-2">On-Time Delivery</p>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-green-600 h-4 rounded-full"
                        style={{ width: `${performance?.on_time_delivery_rate || 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-afrikoni-text-dark/60 mt-1">
                      {performance?.on_time_delivery_rate?.toFixed(1) || 0}% of orders delivered on time
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-afrikoni-text-dark/70 mb-2">Average Rating</p>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-afrikoni-gold h-4 rounded-full"
                        style={{ width: `${((performance?.average_rating || 0) / 5) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-afrikoni-text-dark/60 mt-1">
                      {performance?.average_rating?.toFixed(1) || 0} / 5.0 average rating
                    </p>
                  </div>
                </div>
              </div>

              {performance?.last_calculated_at && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-afrikoni-text-dark/60">
                    Last calculated: {new Date(performance.last_calculated_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

