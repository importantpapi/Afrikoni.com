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
import { Search, Filter, Building, MapPin, Star, Shield, Package, Users, MessageCircle, Globe, Bookmark } from 'lucide-react';
import SEO from '@/components/SEO';
import { useSupplierRanking } from '@/hooks/useSupplierRanking';
import RecommendedBadge from '@/components/suppliers/RecommendedBadge';
import { useLanguage } from '@/i18n/LanguageContext';

const AFRICAN_COUNTRIES = [
  'Nigeria', 'South Africa', 'Kenya', 'Egypt', 'Ghana', 'Morocco', 'Ethiopia',
  'Tanzania', 'Uganda', 'Rwanda', 'Senegal', "Côte d'Ivoire", 'Algeria', 'Tunisia',
  'Cameroon', 'Zimbabwe', 'Zambia', 'Botswana'
];

export default function Suppliers() {
  const { language } = useLanguage();
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [supplierStats, setSupplierStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedBusinessType, setSelectedBusinessType] = useState('all');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [buyerCountry, setBuyerCountry] = useState(null);

  const { rankedSuppliers, isLoading: isRanking } = useSupplierRanking(
    suppliers,
    searchQuery,
    buyerCountry
  );

  useEffect(() => {
    if (!authReady || authLoading) {
      loadSuppliers();
      return;
    }
    if (profile?.country) {
      setBuyerCountry(profile.country);
    }
    loadSuppliers();
  }, [authReady, authLoading, profile?.country]);

  useEffect(() => {
    applyFilters();
  }, [selectedCountry, selectedBusinessType, searchQuery]);

  const loadSuppliers = async () => {
    setIsLoading(true);
    try {
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

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .in('id', sellerCompanyIds)
        .eq('verified', true)
        .eq('verification_status', 'verified')
        .not('company_name', 'is', null)
        .not('country', 'is', null)
        .order('trust_score', { ascending: false })
        .limit(100);

      if (error) throw error;
      const suppliersList = data || [];
      setSuppliers(suppliersList);
      await loadSupplierStats(suppliersList);
    } catch (error) {
      setSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSupplierStats = async (suppliersList) => {
    try {
      const companyIds = suppliersList.map(s => s.id);
      if (companyIds.length === 0) return;

      // Batch all queries in parallel instead of N+1
      const [productsRes, reviewsRes] = await Promise.all([
        supabase
          .from('products')
          .select('company_id, category_id, category, min_order_quantity, price_min, currency, status')
          .in('company_id', companyIds),
        supabase
          .from('reviews')
          .select('seller_company_id, rating')
          .in('seller_company_id', companyIds)
      ]);

      const products = productsRes.data || [];
      const reviews = reviewsRes.data || [];

      const statsMap = {};
      for (const supplier of suppliersList) {
        const companyId = supplier.id;
        const companyProducts = products.filter(p => p.company_id === companyId);
        const activeProducts = companyProducts.filter(p => p.status === 'active');
        const companyReviews = reviews.filter(r => r.seller_company_id === companyId);

        const stats = {
          products: activeProducts.length,
          years: 0,
          reviews: companyReviews.length,
          rating: 0,
          responseTime: 'N/A',
          minOrder: 'N/A',
          categories: []
        };

        // Categories from products
        const uniqueCategories = [...new Set(companyProducts.map(p => p.category || p.category_id).filter(Boolean))];
        stats.categories = uniqueCategories.slice(0, 3);

        // Years
        if (supplier.created_at) {
          const yearsSinceCreation = new Date().getFullYear() - new Date(supplier.created_at).getFullYear();
          stats.years = yearsSinceCreation > 0 ? yearsSinceCreation : 0;
        } else if (supplier.year_established) {
          const yearEst = parseInt(supplier.year_established);
          if (!isNaN(yearEst)) stats.years = new Date().getFullYear() - yearEst;
        }

        // Rating
        if (companyReviews.length > 0) {
          const avgRating = companyReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / companyReviews.length;
          stats.rating = Math.round(avgRating * 10) / 10;
        }

        // Min order from products
        const withMoq = companyProducts
          .filter(p => p.min_order_quantity != null)
          .sort((a, b) => (a.min_order_quantity || 0) - (b.min_order_quantity || 0));
        if (withMoq.length > 0) {
          const product = withMoq[0];
          const moq = product.min_order_quantity;
          const price = product.price_min;
          const currency = product.currency || 'USD';
          if (moq && price) {
            const minOrderValue = moq * price;
            if (minOrderValue >= 1000) stats.minOrder = `$${Math.round(minOrderValue / 1000)}K+`;
            else stats.minOrder = `${currency === 'USD' ? '$' : currency} ${Math.round(minOrderValue)}`;
          } else if (moq) {
            stats.minOrder = `MOQ: ${moq}`;
          }
        }

        statsMap[companyId] = stats;
      }
      setSupplierStats(statsMap);
    } catch (error) {
      console.warn('Error loading supplier stats:', error);
    }
  };

  const applyFilters = async () => {
    setIsLoading(true);
    try {
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
        .eq('verified', true)
        .eq('verification_status', 'verified')
        .order('trust_score', { ascending: false });

      const { data, error } = await query.limit(100);
      if (error) throw error;

      let filtered = Array.isArray(data) ? data : [];

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

      setSuppliers(filtered);
    } catch (error) {
      setSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinWaitlist = (e) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    console.log('Supplier waitlist:', waitlistEmail);
    setWaitlistEmail('');
  };

  return (
    <>
      <SEO
        lang={language}
        title="Verified African Suppliers - AI-Trusted Sourcing | AFRIKONI"
        description="Browse the directory of verified African manufacturers, wholesalers, and distributors. Secured cross-border trade with Afrikoni Shield™ verification and escrow."
        url="/suppliers"
      />
      <div className="min-h-screen bg-stone-50">
        <div className="bg-afrikoni-offwhite border-b border-os-accent/20">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-afrikoni-chestnut mb-4">Verified African Suppliers</h1>
            <p className="text-os-lg text-afrikoni-deep mb-6">Connect with trusted suppliers across Africa</p>

            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                <Input
                  placeholder="Search suppliers by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-os-lg"
                />
              </div>
            </div>

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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-os-accent" />
            </div>
          ) : rankedSuppliers.length === 0 ? (
            <Card className="border-os-accent/20">
              <CardContent className="p-12 text-center">
                <Building className="w-16 h-16 text-afrikoni-deep/70 mx-auto mb-4" />
                <h3 className="text-os-xl font-bold text-afrikoni-chestnut mb-2">No suppliers found</h3>
                <p className="text-afrikoni-deep">Try adjusting your filters or search query</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
              {rankedSuppliers.map((supplier, index) => {
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
                  <Card key={supplier.id} className="border-os-accent/20 hover:shadow-os-md transition-shadow relative">
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
                      <div className="h-48 bg-gradient-to-br from-zinc-100 to-zinc-200 overflow-hidden">
                        {supplier.logo_url ? (
                          <img src={supplier.logo_url} alt={supplier.company_name} className="w-full h-full object-cover" width="200" height="200" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building className="w-20 h-20 text-afrikoni-deep/70" />
                          </div>
                        )}
                      </div>

                      <div className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-os-xl font-bold text-afrikoni-chestnut mb-1">{supplier.company_name}</h3>
                            {supplier.verified && (
                              <Badge className="bg-green-100 text-green-700 border-green-300">
                                <Shield className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-os-sm text-afrikoni-deep mb-3">
                          <MapPin className="w-4 h-4" />
                          <span>{supplier.city ? `${supplier.city}, ` : ''}{supplier.country}</span>
                        </div>

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
                            <span className="text-os-sm font-semibold text-afrikoni-chestnut">{stats.rating.toFixed(1)}</span>
                            <span className="text-os-sm text-afrikoni-deep/70">({stats.reviews})</span>
                          </div>
                        )}

                        <p className="text-os-sm text-afrikoni-deep mb-4 line-clamp-2">
                          {supplier.description || 'Verified African supplier on the AFRIKONI platform.'}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 pb-4 border-b border-os-accent/20">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-os-sm">
                              <Package className="w-4 h-4 text-afrikoni-deep/70" />
                              <span className="text-afrikoni-deep font-semibold">{stats.products}</span>
                            </div>
                            <span className="text-os-xs text-afrikoni-deep/60">products</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-os-sm">
                              <Users className="w-4 h-4 text-afrikoni-deep/70" />
                              <span className="text-afrikoni-deep font-semibold">{stats.years}</span>
                            </div>
                            <span className="text-os-xs text-afrikoni-deep/60">years</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-os-sm">
                              <MessageCircle className="w-4 h-4 text-afrikoni-deep/70" />
                              <span className="text-afrikoni-deep font-semibold">{stats.responseTime}</span>
                            </div>
                            <span className="text-os-xs text-afrikoni-deep/60">response</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-os-sm">
                              <Globe className="w-4 h-4 text-afrikoni-deep/70" />
                              <span className="text-afrikoni-deep font-semibold">{stats.minOrder}</span>
                            </div>
                            <span className="text-os-xs text-afrikoni-deep/60">min order</span>
                          </div>
                        </div>

                        <Link to={`/${language}/business/${supplier.id}`}>
                          <Button className="w-full bg-os-accent hover:bg-os-accentDark text-afrikoni-cream uppercase tracking-widest font-black text-[10px]">
                            View Portfolio
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

        <div className="border-t border-os-accent/20 bg-afrikoni-offwhite mt-4">
          <div className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-afrikoni-chestnut mb-4 uppercase tracking-tighter">
                Scale Your African Export Operation
              </h2>
              <p className="text-afrikoni-deep mb-6 max-w-xl">
                Join the infrastructure-grade B2B marketplace. Afrikoni Shield™ handles the trust gap so you can focus on scale.
              </p>
              <Link to={`/${language}/signup`}>
                <Button className="bg-os-accent text-afrikoni-cream hover:bg-os-accentDark px-8 uppercase tracking-widest font-black">
                  Apply as Supplier
                </Button>
              </Link>
            </div>
            <div>
              <Card className="border-os-accent/30 bg-white">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-afrikoni-chestnut mb-2 uppercase tracking-tight">
                    Insider Trade Network
                  </h3>
                  <p className="text-os-sm text-afrikoni-deep/80 mb-4">
                    Get bi-weekly trade intelligence, regulatory updates, and verified buyer leads.
                  </p>
                  <form onSubmit={handleJoinWaitlist} className="flex gap-3">
                    <Input
                      type="email"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      placeholder="Work email"
                      className="flex-1"
                    />
                    <Button type="submit" className="bg-os-accent text-afrikoni-cream">
                      Join
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
