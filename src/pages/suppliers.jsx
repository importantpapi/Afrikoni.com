import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Search, Filter, Building2, MapPin, Star, Shield, Package, Users, MessageCircle, Globe, Bookmark } from 'lucide-react';
import SEO from '@/components/SEO';
import { useSupplierRanking } from '@/hooks/useSupplierRanking';
import RecommendedBadge from '@/components/suppliers/RecommendedBadge';

const AFRICAN_COUNTRIES = [
  'Nigeria', 'South Africa', 'Kenya', 'Egypt', 'Ghana', 'Morocco', 'Ethiopia',
  'Tanzania', 'Uganda', 'Rwanda', 'Senegal', "Côte d'Ivoire", 'Algeria', 'Tunisia',
  'Cameroon', 'Zimbabwe', 'Zambia', 'Botswana'
];

export default function Suppliers() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [supplierStats, setSupplierStats] = useState({}); // Store real stats for each supplier
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedBusinessType, setSelectedBusinessType] = useState('all');
  // ✅ Note: verifiedOnly filter removed - all suppliers on this page are verified
  // Suppliers must be approved by admin before appearing here
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [buyerCountry, setBuyerCountry] = useState(null);

  // ✅ PHASE A: Trust-based ranking (activated)
  const { rankedSuppliers, isLoading: isRanking } = useSupplierRanking(
    suppliers,
    searchQuery,
    buyerCountry
  );

  useEffect(() => {
    // GUARD: Wait for auth to be ready (optional - can load suppliers without auth)
    if (!authReady || authLoading) {
      // Still load suppliers, just skip buyer country
      loadSuppliers();
      return;
    }

    // Load buyer country from profile if available
    if (profile?.country) {
      setBuyerCountry(profile.country);
    }

    loadSuppliers();
  }, [authReady, authLoading, profile?.country]); // ✅ Primitive only - prevents reload on token refresh

  useEffect(() => {
    applyFilters();
  }, [selectedCountry, selectedBusinessType, searchQuery]);

  const loadSuppliers = async () => {
    setIsLoading(true);
    try {
      // ✅ KERNEL COMPLIANCE: Query capability-based instead of role-based
      // First, get company IDs from company_capabilities where can_sell=true
      const { data: sellerCapabilities, error: capError } = await supabase
        .from('company_capabilities')
        .select('company_id')
        .eq('can_sell', true);

      if (capError) throw capError;

      const sellerCompanyIds = sellerCapabilities?.map(c => c.company_id).filter(Boolean) || [];
      
      if (sellerCompanyIds.length === 0) {
        setSuppliers([]);
        setIsLoading(false);
        return;
      }

      // Then query companies with those IDs
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .in('id', sellerCompanyIds)
        // ✅ CRITICAL: Only show verified suppliers - admin must approve before they appear
        .eq('verified', true)
        .eq('verification_status', 'verified')
        // ✅ Initial sort by trust_score (fallback)
        .order('trust_score', { ascending: false })
        .limit(100);

      if (error) throw error;
      // ✅ Ranking happens in useSupplierRanking hook
      const suppliersList = data || [];
      setSuppliers(suppliersList);
      
      // Load real stats for each supplier
      await loadSupplierStats(suppliersList);
    } catch (error) {
      // Error logged (removed for production)
      setSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load real statistics for suppliers (products, years, reviews, response time, min order)
  const loadSupplierStats = async (suppliersList) => {
    try {
      const statsPromises = suppliersList.map(async (supplier) => {
        const companyId = supplier.id;
        const stats = {
          products: 0,
          years: 0,
          reviews: 0,
          rating: 0,
          responseTime: 'N/A',
          minOrder: 'N/A',
          categories: []
        };

        // Get product count
        const { count: productCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('status', 'active');
        stats.products = productCount || 0;

        // Get product categories
        const { data: products } = await supabase
          .from('products')
          .select('category_id, category')
          .eq('company_id', companyId)
          .limit(3);
        if (products) {
          const uniqueCategories = [...new Set(products.map(p => p.category || p.category_id).filter(Boolean))];
          stats.categories = uniqueCategories.slice(0, 3);
        }

        // Calculate years in business from company created_at or year_established
        if (supplier.created_at) {
          const yearsSinceCreation = new Date().getFullYear() - new Date(supplier.created_at).getFullYear();
          stats.years = yearsSinceCreation > 0 ? yearsSinceCreation : 0;
        } else if (supplier.year_established) {
          const yearEst = parseInt(supplier.year_established);
          if (!isNaN(yearEst)) {
            stats.years = new Date().getFullYear() - yearEst;
          }
        }

        // Get reviews and rating
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .eq('seller_company_id', companyId);
        if (reviews && reviews.length > 0) {
          stats.reviews = reviews.length;
          const avgRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
          stats.rating = Math.round(avgRating * 10) / 10; // Round to 1 decimal
        }

        // Calculate average response time from messages (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { data: recentMessages } = await supabase
          .from('messages')
          .select('created_at')
          .eq('sender_company_id', companyId)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (recentMessages && recentMessages.length > 1) {
          // Calculate average time between message responses
          let totalHours = 0;
          let count = 0;
          for (let i = 1; i < recentMessages.length; i++) {
            const timeDiff = new Date(recentMessages[i-1].created_at) - new Date(recentMessages[i].created_at);
            const hours = timeDiff / (1000 * 60 * 60);
            if (hours < 48) { // Only count reasonable response times
              totalHours += hours;
              count++;
            }
          }
          if (count > 0) {
            const avgHours = totalHours / count;
            if (avgHours < 2) {
              stats.responseTime = '< 2 hours';
            } else if (avgHours < 6) {
              stats.responseTime = '< 6 hours';
            } else if (avgHours < 24) {
              stats.responseTime = '< 24 hours';
            } else {
              stats.responseTime = '< 48 hours';
            }
          }
        }

        // Get minimum order from products
        const { data: productPrices } = await supabase
          .from('products')
          .select('min_order_quantity, price_min, currency')
          .eq('company_id', companyId)
          .not('min_order_quantity', 'is', null)
          .order('min_order_quantity', { ascending: true })
          .limit(1);
        
        if (productPrices && productPrices.length > 0) {
          const product = productPrices[0];
          const moq = product.min_order_quantity;
          const price = product.price_min;
          const currency = product.currency || 'USD';
          
          if (moq && price) {
            const minOrderValue = moq * price;
            if (minOrderValue >= 1000) {
              stats.minOrder = `$${Math.round(minOrderValue / 1000)}K+`;
            } else {
              stats.minOrder = `${currency === 'USD' ? '$' : currency} ${Math.round(minOrderValue)}`;
            }
          } else if (moq) {
            stats.minOrder = `MOQ: ${moq}`;
          }
        }

        return { companyId, stats };
      });

      const allStats = await Promise.allSettled(statsPromises);
      const statsMap = {};
      allStats.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          statsMap[result.value.companyId] = result.value.stats;
        }
      });
      setSupplierStats(statsMap);
    } catch (error) {
      console.warn('Error loading supplier stats:', error);
      // Continue with empty stats - will show defaults
    }
  };

  const applyFilters = async () => {
    setIsLoading(true);
    try {
      // ✅ KERNEL COMPLIANCE: Query capability-based instead of role-based
      // First, get company IDs from company_capabilities where can_sell=true
      const { data: sellerCapabilities, error: capError } = await supabase
        .from('company_capabilities')
        .select('company_id')
        .eq('can_sell', true);

      if (capError) throw capError;

      const sellerCompanyIds = sellerCapabilities?.map(c => c.company_id).filter(Boolean) || [];
      
      if (sellerCompanyIds.length === 0) {
        setSuppliers([]);
        setIsLoading(false);
        return;
      }

      let query = supabase
        .from('companies')
        .select('*')
        .in('id', sellerCompanyIds)
        // ✅ CRITICAL: Only show verified suppliers - admin must approve before they appear
        .eq('verified', true)
        .eq('verification_status', 'verified')
        // ✅ Initial sort by trust_score (ranking hook will refine)
        .order('trust_score', { ascending: false });

      const { data, error } = await query.limit(100);
      if (error) throw error;

      let filtered = Array.isArray(data) ? data : [];

      // Client-side filters (applied before ranking)
      if (searchQuery) {
        filtered = filtered.filter(s =>
          s?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s?.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (selectedCountry !== 'all') {
        filtered = filtered.filter(s => s?.country === selectedCountry);
      }

      if (selectedBusinessType !== 'all') {
        filtered = filtered.filter(s => s?.business_type === selectedBusinessType);
      }

      // ✅ Note: verifiedOnly filter removed - all suppliers on this page are already verified
      // (The filter was client-side only and is no longer needed since we filter at DB level)

      // ✅ Trust-based ranking happens in useSupplierRanking hook
      setSuppliers(filtered);
    } catch (error) {
      // Error logged (removed for production)
      setSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinWaitlist = (e) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    // Stub: in future, send to API / CRM
    console.log('Supplier waitlist:', waitlistEmail);
    setWaitlistEmail('');
  };

  return (
    <>
      <SEO
        title="Verified African Suppliers - Become a Supplier on Afrikoni"
        description="Browse verified African suppliers and learn how to become a supplier on Afrikoni. KYC/KYB verification, escrow payments, and Afrikoni Shield™ protection."
        url="/suppliers"
      />
    <div className="min-h-screen bg-stone-50">
      <div className="bg-afrikoni-offwhite border-b border-afrikoni-gold/20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-afrikoni-chestnut mb-4">Verified African Suppliers</h1>
          <p className="text-lg text-afrikoni-deep mb-6">Connect with trusted suppliers across Africa</p>
          
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
              <Input
                placeholder="Search suppliers by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {AFRICAN_COUNTRIES.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedBusinessType} onValueChange={setSelectedBusinessType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="manufacturer">Manufacturer</SelectItem>
                <SelectItem value="wholesaler">Wholesaler</SelectItem>
                <SelectItem value="distributor">Distributor</SelectItem>
                <SelectItem value="trading_company">Trading Company</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading || isRanking ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : rankedSuppliers.length === 0 ? (
          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 text-afrikoni-deep/70 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">No suppliers found</h3>
              <p className="text-afrikoni-deep">Try adjusting your filters or search query</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
            {rankedSuppliers.map((supplier, index) => {
              // Get real stats from database or use sensible defaults
              const realStats = supplierStats[supplier.id] || {};
              const stats = {
                rating: realStats.rating || 0,
                reviews: realStats.reviews || 0,
                products: realStats.products || 0,
                years: realStats.years || 0,
                responseTime: realStats.responseTime || 'N/A',
                minOrder: realStats.minOrder || 'Contact',
                categories: realStats.categories || []
              };

              return (
                <Card key={supplier.id} className="border-afrikoni-gold/20 hover:shadow-lg transition-shadow relative">
                  {/* ✅ PHASE A: Recommended Badge (Top suppliers only) */}
                  {supplier.is_recommended && index < 6 && (
                    <div className="absolute top-4 left-4 z-10">
                      <RecommendedBadge type="recommended" />
                    </div>
                  )}
                  
                  <div className="absolute top-4 right-4 z-10">
                    <button className="p-2 hover:bg-afrikoni-cream rounded-full transition">
                      <Bookmark className="w-5 h-5 text-afrikoni-deep/70" />
                    </button>
                  </div>
                  
                  <CardContent className="p-0">
                    {/* Image */}
                    <div className="h-48 bg-gradient-to-br from-zinc-100 to-zinc-200 overflow-hidden">
                      {supplier.logo_url ? (
                        <img src={supplier.logo_url} alt={supplier.company_name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-20 h-20 text-afrikoni-deep/70" />
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      {/* Name and Verification */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-afrikoni-chestnut mb-1">{supplier.company_name || 'Supplier Name'}</h3>
                          {supplier.verified && (
                            <Badge className="bg-green-100 text-green-700 border-green-300">
                              <Shield className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-sm text-afrikoni-deep mb-3">
                        <MapPin className="w-4 h-4" />
                        <span>{supplier.city ? `${supplier.city}, ` : ''}{supplier.country || 'Location'}</span>
                      </div>

                      {/* Rating */}
                      {stats.reviews > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${star <= Math.round(stats.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-afrikoni-deep/50'}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-afrikoni-chestnut">{stats.rating > 0 ? stats.rating.toFixed(1) : '0.0'}</span>
                          <span className="text-sm text-afrikoni-deep/70">({stats.reviews} {stats.reviews === 1 ? 'review' : 'reviews'})</span>
                        </div>
                      )}

                      {/* Description */}
                      <p className="text-sm text-afrikoni-deep mb-4 line-clamp-2">
                        {supplier.description || 'Leading exporter of premium products and organic agricultural products.'}
                      </p>

                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 pb-4 border-b border-afrikoni-gold/20">
                        {stats.products > 0 && (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Package className="w-4 h-4 text-afrikoni-deep/70" />
                              <span className="text-afrikoni-deep font-semibold">{stats.products}</span>
                            </div>
                            <span className="text-xs text-afrikoni-deep/60">products</span>
                          </div>
                        )}
                        {stats.years > 0 && (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="w-4 h-4 text-afrikoni-deep/70" />
                              <span className="text-afrikoni-deep font-semibold">{stats.years}</span>
                            </div>
                            <span className="text-xs text-afrikoni-deep/60">years</span>
                          </div>
                        )}
                        {stats.responseTime !== 'N/A' && (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm">
                              <MessageCircle className="w-4 h-4 text-afrikoni-deep/70" />
                              <span className="text-afrikoni-deep font-semibold">{stats.responseTime}</span>
                            </div>
                            <span className="text-xs text-afrikoni-deep/60">response</span>
                          </div>
                        )}
                        {stats.minOrder !== 'N/A' && stats.minOrder !== 'Contact' && (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Globe className="w-4 h-4 text-afrikoni-deep/70" />
                              <span className="text-afrikoni-deep font-semibold">{stats.minOrder}</span>
                            </div>
                            <span className="text-xs text-afrikoni-deep/60">min order</span>
                          </div>
                        )}
                      </div>

                      {/* Categories */}
                      {stats.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {stats.categories.map((cat, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs border-afrikoni-gold/30 text-afrikoni-deep">
                              {typeof cat === 'string' ? cat : 'Category'}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* View Profile Button */}
                      <Link to={`/business/${supplier.id}`}>
                        <Button className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream">
                          View Business Profile
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom CTA + waitlist */}
      <div className="border-t border-afrikoni-gold/20 bg-afrikoni-offwhite mt-4">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-12 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-3">
              Ready to become a verified African supplier?
            </h2>
            <p className="text-sm md:text-base text-afrikoni-deep mb-5 max-w-xl">
              Join Afrikoni to access serious buyers across Africa and the world. Afrikoni Shield™ handles
              verification, escrow, and trust so you can focus on fulfilling orders.
            </p>
            <Link to="/signup">
              <Button className="bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-goldLight px-6 md:px-8">
                Start as a Supplier
              </Button>
            </Link>
          </div>
          <div>
            <Card className="border-afrikoni-gold/30 bg-white shadow-sm">
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold text-afrikoni-chestnut mb-2">
                  Join the early access waitlist
                </h3>
                <p className="text-xs md:text-sm text-afrikoni-deep/80 mb-4">
                  Leave your work email and we&apos;ll contact you with onboarding details, fees and pilot opportunities.
                </p>
                <form onSubmit={handleJoinWaitlist} className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="Work email"
                    className="flex-1"
                  />
                  <Button type="submit" className="bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-goldLight">
                    Join waitlist
                  </Button>
                </form>
                <p className="mt-2 text-[11px] text-afrikoni-deep/60">
                  We respect your privacy. No spam, just Afrikoni supplier updates.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
      </>
  );
}

