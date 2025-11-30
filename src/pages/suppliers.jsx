import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Building2, MapPin, Star, Shield, Package, Users, MessageCircle, Globe, Bookmark } from 'lucide-react';

const AFRICAN_COUNTRIES = [
  'Nigeria', 'South Africa', 'Kenya', 'Egypt', 'Ghana', 'Morocco', 'Ethiopia',
  'Tanzania', 'Uganda', 'Rwanda', 'Senegal', "Côte d'Ivoire", 'Algeria', 'Tunisia',
  'Cameroon', 'Zimbabwe', 'Zambia', 'Botswana'
];

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedBusinessType, setSelectedBusinessType] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedCountry, selectedBusinessType, verifiedOnly, searchQuery]);

  const loadSuppliers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('role', 'seller')
        .order('trust_score', { ascending: false })
        .limit(100);

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      // Error logged (removed for production)
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('companies')
        .select('*')
        .eq('role', 'seller')
        .order('trust_score', { ascending: false });

      const { data, error } = await query.limit(100);
      if (error) throw error;

      let filtered = data || [];

      if (searchQuery) {
        filtered = filtered.filter(s =>
          s.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (selectedCountry !== 'all') {
        filtered = filtered.filter(s => s.country === selectedCountry);
      }

      if (selectedBusinessType !== 'all') {
        filtered = filtered.filter(s => s.business_type === selectedBusinessType);
      }

      if (verifiedOnly) {
        filtered = filtered.filter(s => s.verified);
      }

      setSuppliers(filtered);
    } catch (error) {
      // Error logged (removed for production)
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : suppliers.length === 0 ? (
          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 text-afrikoni-deep/70 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">No suppliers found</h3>
              <p className="text-afrikoni-deep">Try adjusting your filters or search query</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
            {suppliers.map(supplier => {
              // Mock data for demonstration - in production, this would come from the database
              const mockData = {
                rating: 4.8,
                reviews: 156,
                products: 45,
                years: 12,
                responseTime: '< 2 hours',
                minOrder: '$1,000',
                categories: ['Food & Beverages', 'Organic Products']
              };

              return (
                <Card key={supplier.id} className="border-afrikoni-gold/20 hover:shadow-lg transition-shadow relative">
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
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= Math.round(mockData.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-afrikoni-deep/50'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-afrikoni-chestnut">{mockData.rating}</span>
                        <span className="text-sm text-afrikoni-deep/70">({mockData.reviews} reviews)</span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-afrikoni-deep mb-4 line-clamp-2">
                        {supplier.description || 'Leading exporter of premium products and organic agricultural products.'}
                      </p>

                      {/* Key Metrics */}
                      <div className="grid grid-cols-4 gap-3 mb-4 pb-4 border-b border-afrikoni-gold/20">
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="w-4 h-4 text-afrikoni-deep/70" />
                          <span className="text-afrikoni-deep">{mockData.products} products</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-afrikoni-deep/70" />
                          <span className="text-afrikoni-deep">{mockData.years} years</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MessageCircle className="w-4 h-4 text-afrikoni-deep/70" />
                          <span className="text-afrikoni-deep">{mockData.responseTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="w-4 h-4 text-afrikoni-deep/70" />
                          <span className="text-afrikoni-deep">{mockData.minOrder} min</span>
                        </div>
                      </div>

                      {/* Categories */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {mockData.categories.map((cat, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs border-afrikoni-gold/30 text-afrikoni-deep">
                            {cat}
                          </Badge>
                        ))}
                      </div>

                      {/* View Profile Button */}
                      <Link to={createPageUrl('SupplierProfile') + '?id=' + supplier.id}>
                        <Button className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream">
                          View Profile
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
    </div>
  );
}

