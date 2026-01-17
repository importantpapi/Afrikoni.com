/**
 * Trust Engine Admin Panel
 * Visibility into trust-driven decision making
 * Shows scores, tiers, and decision inputs for governance
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { 
  Shield, TrendingUp, Award, AlertCircle, Search,
  Eye, BarChart3, CheckCircle, XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
// PHASE 5B: Admin pages use route-level admin check (ProtectedRoute requireAdmin)

function TrustEngineInner() {
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setIsLoading(true);

      // Load suppliers with scores
      const { data: suppliersData, error } = await supabase
        .from('companies')
        .select('*')
        .eq('role', 'seller')
        .order('trust_score', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Calculate rank scores for each
      const withScores = await Promise.all(
        suppliersData.map(async (supplier) => {
          const { data: rankScore } = await supabase
            .rpc('calculate_supplier_rank_score', {
              company_id_param: supplier.id
            });

          const { data: tier } = await supabase
            .rpc('get_supplier_tier', {
              company_id_param: supplier.id
            });

          return {
            ...supplier,
            rank_score: rankScore || 0,
            tier: tier || 'C'
          };
        })
      );

      setSuppliers(withScores);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast.error('Failed to load supplier data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    tierA: suppliers.filter(s => s.tier === 'A').length,
    tierB: suppliers.filter(s => s.tier === 'B').length,
    tierC: suppliers.filter(s => s.tier === 'C').length,
    avgTrustScore: suppliers.length > 0
      ? (suppliers.reduce((sum, s) => sum + (s.trust_score || 0), 0) / suppliers.length).toFixed(1)
      : 0
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'A': return 'bg-green-100 text-green-800 border-green-300';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'C': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="p-8">
          <p className="text-afrikoni-deep/60">Loading trust engine data...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">Trust Engine</h1>
          <p className="text-afrikoni-deep/70">
            Admin visibility into trust-driven decision making
          </p>
        </div>

        {/* Info Banner */}
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">How the Trust Engine Works</p>
                <p className="text-blue-800">
                  Supplier rankings use: <strong>Trust Score (45%)</strong>, Relevance (25%), Responsiveness (20%), Pricing (10%). 
                  RFQ matching adds category and capacity weighting. Deal priority uses inverse trust (lower trust = higher priority for verification).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-afrikoni-deep/60">Tier A (75+)</p>
                  <p className="text-2xl font-bold text-afrikoni-chestnut">{stats.tierA}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-afrikoni-deep/60">Tier B (50-74)</p>
                  <p className="text-2xl font-bold text-afrikoni-chestnut">{stats.tierB}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-afrikoni-deep/60">Tier C (&lt;50)</p>
                  <p className="text-2xl font-bold text-afrikoni-chestnut">{stats.tierC}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-afrikoni-gold" />
                </div>
                <div>
                  <p className="text-sm text-afrikoni-deep/60">Avg Trust Score</p>
                  <p className="text-2xl font-bold text-afrikoni-chestnut">{stats.avgTrustScore}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-afrikoni-deep/40" />
              <Input
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Suppliers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Supplier Rankings & Tiers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-afrikoni-offwhite">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold">Company</th>
                    <th className="text-center p-3 text-sm font-semibold">Tier</th>
                    <th className="text-center p-3 text-sm font-semibold">Trust Score</th>
                    <th className="text-center p-3 text-sm font-semibold">Rank Score</th>
                    <th className="text-center p-3 text-sm font-semibold">Reviews</th>
                    <th className="text-center p-3 text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((supplier, index) => (
                    <motion.tr
                      key={supplier.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-t hover:bg-afrikoni-offwhite/50 transition-colors"
                    >
                      <td className="p-3">
                        <div>
                          <p className="font-semibold text-afrikoni-chestnut">
                            {supplier.company_name}
                          </p>
                          <p className="text-xs text-afrikoni-deep/60">
                            {supplier.country}
                          </p>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className={getTierColor(supplier.tier)}>
                          <strong>Tier {supplier.tier}</strong>
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-semibold">{supplier.trust_score || 50}</span>
                        <span className="text-xs text-afrikoni-deep/60">/100</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-semibold text-afrikoni-gold">
                          {supplier.rank_score?.toFixed(1) || '0.0'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {supplier.approved_reviews_count || 0}
                      </td>
                      <td className="p-3 text-center">
                        {supplier.verification_status === 'verified' ? (
                          <CheckCircle className="w-5 h-5 text-green-600 inline" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-400 inline" />
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function TrustEngine() {
  // PHASE 5B: Admin check done at route level with ProtectedRoute requireAdmin
  return <TrustEngineInner />;
}

