/**
 * Live Trade Ticker
 * Displays real-time trade statistics and activity
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, Package, DollarSign, Globe } from 'lucide-react';
import { TARGET_COUNTRY, getCountryConfig } from '@/config/countryConfig';
import { supabase } from '@/api/supabaseClient';

export default function LiveTradeTicker() {
  const [stats, setStats] = useState({
    newSuppliers: 0,
    newOrders: 0,
    activeListings: 0,
    totalGMV: 0
  });
  const [tickerItems, setTickerItems] = useState([]);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const config = getCountryConfig();
      const country = TARGET_COUNTRY;

      // Get new suppliers (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: newSuppliers, error: suppliersError } = await supabase
        .from('companies')
        .select('id')
        .eq('country', country)
        .in('role', ['seller', 'hybrid'])
        .gte('created_at', weekAgo.toISOString());

      // Handle 401 errors gracefully (user not authenticated)
      if (suppliersError && suppliersError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (not an error)
        if (suppliersError.status === 401 || suppliersError.message?.includes('JWT')) {
          // User not authenticated - show no data, not fake data
          setStats({
            newSuppliers: 0,
            newOrders: 0,
            activeListings: 0,
            totalGMV: 0
          });
          setTickerItems([]);
          return;
        }
      }

      // Get new orders (today) - handle auth errors
      const today = new Date().toISOString().split('T')[0];
      const { data: newOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount')
        .gte('created_at', today)
        .eq('status', 'processing');

      if (ordersError && ordersError.status === 401) {
        // No fake data - show real counts or zero
        setStats({
          newSuppliers: newSuppliers?.length || 0,
          newOrders: 0,
          activeListings: 0,
          totalGMV: 0
        });
        setTickerItems([]);
        return;
      }

      // Get active listings
      const { data: listings, error: listingsError } = await supabase
        .from('products')
        .select('id')
        .eq('status', 'active');

      if (listingsError && listingsError.status === 401) {
        setStats({
          newSuppliers: newSuppliers?.length || 0,
          newOrders: newOrders?.length || 0,
          activeListings: 0,
          totalGMV: 0
        });
        setTickerItems([]);
        return;
      }

      // Calculate GMV (last 30 days)
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const { data: orders, error: gmvError } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed')
        .gte('created_at', monthAgo.toISOString());

      if (gmvError && gmvError.status === 401) {
        // No fake data - show real counts or zero
        setStats({
          newSuppliers: newSuppliers?.length || 0,
          newOrders: newOrders?.length || 0,
          activeListings: listings?.length || 0,
          totalGMV: 0
        });
        setTickerItems([]);
        return;
      }

      const gmv = orders?.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0) || 0;

      setStats({
        newSuppliers: newSuppliers?.length || 0,
        newOrders: newOrders?.length || 0,
        activeListings: listings?.length || 0,
        totalGMV: gmv
      });

      // Generate ticker items
      const items = [];
      if (newSuppliers && newSuppliers.length > 0) {
        items.push({
          icon: Users,
          text: `${newSuppliers.length} exporters from ${country} joined in last 7 days`,
          color: 'text-blue-600'
        });
      }
      if (newOrders && newOrders.length > 0) {
        items.push({
          icon: Package,
          text: `${newOrders.length} orders shipped today — safe & escrow protected`,
          color: 'text-green-600'
        });
      }
      if (gmv > 0) {
        items.push({
          icon: DollarSign,
          text: `$${(gmv / 1000).toFixed(0)}K in trades completed this month`,
          color: 'text-os-accent'
        });
      }
      // Only show real data - no fake fallbacks
      setTickerItems(items);
    } catch (error) {
      // Silently handle errors - show no data, not fake data
      console.debug('Error loading stats (non-critical):', error);
      setStats({
        newSuppliers: 0,
        newOrders: 0,
        activeListings: 0,
        totalGMV: 0
      });
      setTickerItems([]);
    }
  };

  if (tickerItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-os-accent/10 border-b border-os-accent/20 py-2 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-os-accent font-semibold whitespace-nowrap">
            <TrendingUp className="w-4 h-4" />
            <span>Live Activity</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {tickerItems.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ duration: 0.5, delay: idx * 2 }}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-os-sm text-afrikoni-text-dark">{item.text}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
