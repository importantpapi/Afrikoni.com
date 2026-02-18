import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { Building, MapPin, Star, Shield, Phone, Mail, Globe, CheckCircle, Package, Calendar, Users, Award, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import NewMessageDialog from '../components/messaging/NewMessageDialog';
import SEO from '@/components/SEO';
import { useAnalytics } from '@/hooks/useAnalytics';
import OptimizedImage from '@/components/OptimizedImage';
import { isValidUUID } from '@/utils/security';
import { useLanguage } from '@/i18n/LanguageContext';

export default function SupplierProfile() {
  const { language } = useLanguage();
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [supplier, setSupplier] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const { trackPageView } = useAnalytics();
  const navigate = useNavigate();

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[SupplierProfile] Waiting for auth to be ready...');
      return;
    }

    // Now safe to load data (public page, user optional)
    loadData();
    trackPageView('Supplier Profile');
  }, [authReady, authLoading]);

  const loadData = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const supplierId = urlParams.get('id');

    // Security: Validate UUID format
    if (!supplierId || !isValidUUID(supplierId)) {
      toast.error('Invalid supplier ID');
      navigate(createPageUrl('Suppliers'));
      return;
    }

    try {
      // Fix: Load supplier directly by ID instead of loading all companies
      const [companyRes, prodsRes, revsRes] = await Promise.all([
        supabase.from('companies').select('*').eq('id', supplierId).maybeSingle(),
        supabase.from('products').select('*').eq('status', 'active').eq('company_id', supplierId),
        supabase.from('reviews').select('*').eq('reviewed_company_id', supplierId)
      ]);

      if (companyRes.error) throw companyRes.error;
      if (prodsRes.error) throw prodsRes.error;
      if (revsRes.error) throw revsRes.error;

      const foundSupplier = companyRes.data;
      if (!foundSupplier) {
        toast.error('Supplier not found');
        navigate(createPageUrl('Suppliers'));
        return;
      }

      setSupplier(foundSupplier);
      setProducts(prodsRes.data || []);
      setReviews(revsRes.data || []);
    } catch (error) {
      console.error('Failed to load supplier profile:', error);
      toast.error('Failed to load supplier profile. Please try again.', {
        action: {
          label: 'Retry',
          onClick: () => loadData()
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSupplier = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowMessageDialog(true);
  };

  const handleCreateRFQ = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(createPageUrl('CreateRFQ'));
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
        <div className="w-16 h-16 rounded-full border-4 border-os-accent/20 border-t-os-accent animate-spin" />
        <p className="text-os-sm font-black uppercase tracking-widest text-os-accent animate-pulse">
          Authenticating Supplier Credentials
        </p>
      </div>
    );
  }

  if (!supplier) return null;

  // 🏛️ GEO Fact-Density (AI Engine Optimization)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": supplier.company_name,
    "description": supplier.description,
    "logo": supplier.logo_url,
    "url": `${window.location.origin}/${language}/business/${supplier.id}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": supplier.city,
      "addressCountry": supplier.country
    },
    "knowsAbout": products.slice(0, 5).map(p => p.title)
  };

  return (
    <>
      <SEO
        lang={language}
        title={`${supplier.company_name} – Verified Suppliers in ${supplier.country}`}
        description={supplier.description?.substring(0, 160) || `Verified African supplier ${supplier.company_name} based in ${supplier.country}. View products, certifications, and trade history on AFRIKONI.`}
        url={`/business/${supplier.id}`}
        structuredData={organizationSchema}
      />
      <div className="min-h-screen bg-stone-50">
        {/* Hero Banner */}
        <div className="h-64 bg-gradient-to-br from-afrikoni-chestnut via-afrikoni-brown-800 to-afrikoni-brown-700 relative">
          {supplier.cover_image_url && (
            <OptimizedImage src={supplier.cover_image_url} alt="" className="w-full h-full object-cover opacity-30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-afrikoni-chestnut/80 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-10">
          {/* Supplier Header Card */}
          <Card className="border-2 border-os-accent/30 shadow-2xl mb-8 bg-afrikoni-offwhite">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Logo */}
                <div className="w-40 h-40 bg-afrikoni-offwhite rounded-os-md border-4 border-os-accent/30 shadow-os-lg flex items-center justify-center flex-shrink-0">
                  {supplier.logo_url ? (
                    <OptimizedImage src={supplier.logo_url} alt={supplier.company_name} className="w-full h-full object-cover rounded-os-sm" />
                  ) : (
                    <Building className="w-20 h-20 text-os-accent" />
                  )}
                </div>

                {/* Company Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-2">{supplier.company_name}</h1>
                      <div className="flex items-center gap-2 text-afrikoni-deep mb-3">
                        <MapPin className="w-4 h-4 text-os-accent" />
                        <span>{supplier.city && `${supplier.city}, `}{supplier.country}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {supplier.verification_status === 'verified' && (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Verified by Afrikoni Shield™
                          </Badge>
                        )}
                        {supplier.verification_status === 'pending' && (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Verification Pending
                          </Badge>
                        )}
                        {supplier.verification_status === 'rejected' && (
                          <Badge className="bg-red-50 text-red-700 border-red-300 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Verification Rejected
                          </Badge>
                        )}
                        {supplier.verification_status !== 'verified' &&
                          supplier.verification_status !== 'pending' &&
                          supplier.verification_status !== 'rejected' && (
                            <Badge className="bg-slate-50 text-slate-700 border-slate-300 flex items-center gap-1">
                              <Shield className="w-3 h-3" /> Unverified Supplier
                            </Badge>
                          )}
                        {typeof supplier.trust_score === 'number' && supplier.trust_score >= 80 && (
                          <Badge className="bg-os-accent/20 text-os-accent border-os-accent-300 flex items-center gap-1">
                            <Award className="w-3 h-3" /> Trade Shield Eligible
                          </Badge>
                        )}
                        {supplier.business_type && (
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                            {supplier.business_type.replace(/_/g, ' ')}
                          </Badge>
                        )}
                        {supplier.year_established && (
                          <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                            <Calendar className="w-3 h-3 mr-1" /> Est. {supplier.year_established}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button onClick={handleContactSupplier} className="bg-os-accent hover:bg-os-accentDark text-afrikoni-cream">
                        Contact Supplier
                      </Button>
                      <Button onClick={handleCreateRFQ} variant="outline" className="border-os-accent text-os-accent hover:bg-os-accent/10">
                        Request Quote
                      </Button>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-os-accent/20">
                    <div>
                      <div className="text-os-2xl font-bold text-os-accent mb-1">{supplier.trust_score || 0}</div>
                      <div className="text-os-sm text-afrikoni-deep">Trust Score</div>
                    </div>
                    <div>
                      <div className="text-os-2xl font-bold text-afrikoni-chestnut mb-1">{supplier.response_rate || 0}%</div>
                      <div className="text-os-sm text-afrikoni-deep">Response Rate</div>
                    </div>
                    <div>
                      <div className="text-os-2xl font-bold text-afrikoni-chestnut mb-1">{supplier.total_orders || 0}</div>
                      <div className="text-os-sm text-afrikoni-deep">Total Orders</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="w-5 h-5 text-os-accent fill-os-accent" />
                        <span className="text-os-2xl font-bold text-afrikoni-chestnut">{calculateAverageRating()}</span>
                      </div>
                      <div className="text-os-sm text-afrikoni-deep">{reviews.length} Reviews</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Tabs defaultValue="about">
                <TabsList className="w-full justify-start bg-afrikoni-offwhite border border-os-accent/20 p-1">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="about">
                  <Card className="border-os-accent/20">
                    <CardHeader>
                      <CardTitle>Company Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {supplier.description && (
                        <div>
                          <h3 className="font-semibold text-afrikoni-chestnut mb-2">About Us</h3>
                          <p className="text-afrikoni-deep leading-relaxed whitespace-pre-wrap">{supplier.description}</p>
                        </div>
                      )}
                      {supplier.factory_images && supplier.factory_images.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-afrikoni-chestnut mb-3">Factory Images</h3>
                          <div className="grid grid-cols-3 gap-3">
                            {supplier.factory_images.map((img, idx) => (
                              <OptimizedImage key={idx} src={img} alt="Factory" className="w-full h-40 object-cover rounded-lg" />
                            ))}
                          </div>
                        </div>
                      )}
                      {supplier.certifications && supplier.certifications.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-afrikoni-chestnut mb-3 flex items-center gap-2">
                            <Award className="w-5 h-5 text-os-accent" />
                            Certifications & Compliance
                          </h3>
                          <div className="grid sm:grid-cols-2 gap-3">
                            {Array.isArray(supplier?.certifications) && supplier.certifications.map((cert, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <Award className="w-4 h-4 text-green-700 flex-shrink-0" />
                                <span className="text-os-sm font-medium text-green-700">{cert}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional Company Info */}
                      <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-os-accent/20">
                        {supplier.employee_count && (
                          <div>
                            <h4 className="text-os-sm font-semibold text-afrikoni-chestnut mb-1">Company Size</h4>
                            <p className="text-os-sm text-afrikoni-deep">{supplier.employee_count} employees</p>
                          </div>
                        )}
                        {supplier.website && (
                          <div>
                            <h4 className="text-os-sm font-semibold text-afrikoni-chestnut mb-1">Website</h4>
                            <a
                              href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-os-sm text-os-accent hover:underline flex items-center gap-1"
                            >
                              <Globe className="w-3 h-3" />
                              {supplier.website}
                            </a>
                          </div>
                        )}
                        {supplier.email && (
                          <div>
                            <h4 className="text-os-sm font-semibold text-afrikoni-chestnut mb-1">Email</h4>
                            <a
                              href={`mailto:${supplier.email}`}
                              className="text-os-sm text-os-accent hover:underline flex items-center gap-1"
                            >
                              <Mail className="w-3 h-3" />
                              {supplier.email}
                            </a>
                          </div>
                        )}
                        {supplier.phone && (
                          <div>
                            <h4 className="text-os-sm font-semibold text-afrikoni-chestnut mb-1">Phone</h4>
                            <a
                              href={`tel:${supplier.phone}`}
                              className="text-os-sm text-os-accent hover:underline flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              {supplier.phone}
                            </a>
                          </div>
                        )}
                        {supplier.address && (
                          <div className="sm:col-span-2">
                            <h4 className="text-os-sm font-semibold text-afrikoni-chestnut mb-1">Address</h4>
                            <p className="text-os-sm text-afrikoni-deep flex items-start gap-1">
                              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-os-accent" />
                              {supplier.address}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="products">
                  <Card className="border-os-accent/20">
                    <CardContent className="p-6">
                      {products.length === 0 ? (
                        <div className="text-center py-12">
                          <Package className="w-16 h-16 text-afrikoni-deep/70 mx-auto mb-4" />
                          <p className="text-afrikoni-deep">No products listed yet</p>
                        </div>
                      ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {products.map(product => {
                            const primaryImage = Array.isArray(product.images) ? product.images[0] : null;
                            const productPrice = product.price_min || product.price || null;
                            const moq = product.min_order_quantity || product.moq || null;

                            return (
                              <Link
                                key={product.id}
                                to={`/${language}/product/${product.id}`}
                                className="group border border-os-accent/20 rounded-lg overflow-hidden hover:border-os-accent hover:shadow-os-md transition-all bg-white"
                              >
                                <div className="relative h-48 bg-afrikoni-cream overflow-hidden">
                                  {primaryImage ? (
                                    <OptimizedImage
                                      src={primaryImage}
                                      alt={product.title || 'Product'}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="w-16 h-16 text-afrikoni-deep/70" />
                                    </div>
                                  )}
                                  {product.featured && (
                                    <div className="absolute top-2 left-2">
                                      <Badge className="bg-os-accent text-afrikoni-chestnut text-os-xs">⭐ Featured</Badge>
                                    </div>
                                  )}
                                </div>
                                <div className="p-4">
                                  <h4 className="font-semibold text-afrikoni-chestnut line-clamp-2 mb-2 text-os-sm md:text-os-base group-hover:text-os-accent transition-colors">
                                    {product.title || product.name}
                                  </h4>
                                  {product.short_description && (
                                    <p className="text-os-xs text-afrikoni-deep/70 line-clamp-2 mb-3">
                                      {product.short_description}
                                    </p>
                                  )}
                                  <div className="flex items-center justify-between mb-2">
                                    {productPrice ? (
                                      <div className="text-os-lg font-bold text-os-accent">
                                        {product.currency || 'USD'} {parseFloat(productPrice).toLocaleString()}
                                        {product.price_max && product.price_max !== productPrice && (
                                          <span className="text-os-sm text-afrikoni-deep/70"> - {parseFloat(product.price_max).toLocaleString()}</span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-os-sm text-afrikoni-deep/70">Price on request</div>
                                    )}
                                  </div>
                                  {moq && (
                                    <div className="text-os-xs text-afrikoni-deep/70 mb-2">
                                      MOQ: {moq} {product.moq_unit || product.unit || 'units'}
                                    </div>
                                  )}
                                  {product.country_of_origin && (
                                    <div className="flex items-center gap-1 text-os-xs text-afrikoni-deep/70">
                                      <MapPin className="w-3 h-3" />
                                      {product.country_of_origin}
                                    </div>
                                  )}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews">
                  <Card className="border-os-accent/20">
                    <CardContent className="p-6">
                      {reviews.length === 0 ? (
                        <div className="text-center py-12">
                          <Star className="w-16 h-16 text-afrikoni-deep/70 mx-auto mb-4" />
                          <p className="text-afrikoni-deep">No reviews yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {reviews.map(review => (
                            <div key={review.id} className="border-b border-os-accent/20 pb-4 last:border-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-afrikoni-deep/50'
                                        }`}
                                    />
                                  ))}
                                </div>
                                {review.verified_purchase && (
                                  <Badge className="bg-green-50 text-green-700 border-green-200 text-os-xs">
                                    <CheckCircle className="w-3 h-3 mr-1" /> Verified Purchase
                                  </Badge>
                                )}
                              </div>
                              {review.comment && <p className="text-os-sm text-afrikoni-deep">{review.comment}</p>}
                              {review.quality_rating && (
                                <div className="grid grid-cols-3 gap-3 mt-3 text-os-xs text-afrikoni-deep/70">
                                  <div>Quality: {review.quality_rating}/5</div>
                                  {review.communication_rating && <div>Communication: {review.communication_rating}/5</div>}
                                  {review.delivery_rating && <div>Delivery: {review.delivery_rating}/5</div>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-6">
              <Card className="border-os-accent/20">
                <CardHeader>
                  <CardTitle className="text-os-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {supplier.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-afrikoni-deep/70" />
                      <span className="text-os-sm text-afrikoni-deep">{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-afrikoni-deep/70" />
                      <span className="text-os-sm text-afrikoni-deep">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-afrikoni-deep/70" />
                      <a
                        href={supplier.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-os-sm text-amber-600 hover:text-amber-700"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-afrikoni-deep/70 mt-0.5" />
                      <span className="text-os-sm text-afrikoni-deep">{supplier.address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-os-accent/20">
                <CardHeader>
                  <CardTitle className="text-os-lg">Company Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-os-sm">
                  {supplier.employee_count && (
                    <div className="flex justify-between">
                      <span className="text-afrikoni-deep">Company Size</span>
                      <span className="font-semibold text-afrikoni-chestnut">{supplier.employee_count} employees</span>
                    </div>
                  )}
                  {supplier.year_established && (
                    <div className="flex justify-between">
                      <span className="text-afrikoni-deep">Established</span>
                      <span className="font-semibold text-afrikoni-chestnut">{supplier.year_established}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-afrikoni-deep">Business Type</span>
                    <span className="font-semibold text-afrikoni-chestnut">{supplier.business_type?.replace(/_/g, ' ')}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {supplier && (
          <NewMessageDialog
            open={showMessageDialog}
            onOpenChange={setShowMessageDialog}
            recipientCompany={supplier}
            subject="Inquiry about your company"
          />
        )}
      </div>
    </>
  );
}

