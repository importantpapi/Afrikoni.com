import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, MapPin, Star, Shield, Phone, Mail, Globe, CheckCircle, Package, Calendar, Users, Award } from 'lucide-react';
import { toast } from 'sonner';
import NewMessageDialog from '../components/messaging/NewMessageDialog';
import SEO from '@/components/SEO';
import { useAnalytics } from '@/hooks/useAnalytics';
import OptimizedImage from '@/components/OptimizedImage';
import { isValidUUID } from '@/utils/security';

export default function SupplierProfile() {
  const [supplier, setSupplier] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    loadData();
    loadUser();
    trackPageView('Supplier Profile');
  }, []);

  const loadUser = async () => {
    try {
      const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
      const { user: userData } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      setUser(userData);
    } catch (error) {
      setUser(null);
    }
  };

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
      const [companiesRes, prodsRes, revsRes] = await Promise.all([
        supabase.from('companies').select('*'),
        supabase.from('products').select('*').eq('status', 'active'),
        supabase.from('reviews').select('*')
      ]);

      if (companiesRes.error) throw companiesRes.error;
      if (prodsRes.error) throw prodsRes.error;
      if (revsRes.error) throw revsRes.error;

      const foundSupplier = companiesRes.data?.find(c => c.id === supplierId);
            if (!foundSupplier) {
              toast.error('Supplier not found');
              navigate(createPageUrl('Suppliers'));
              return;
            }

      setSupplier(foundSupplier);
      setProducts(prodsRes.data?.filter(p => p.company_id === supplierId) || []);
      setReviews(revsRes.data?.filter(r => r.reviewed_company_id === supplierId) || []);
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to load supplier profile');
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  if (!supplier) return null;

  return (
    <>
      <SEO 
        title={supplier.company_name || 'Supplier Profile'}
        description={supplier.description || `View profile for ${supplier.company_name}`}
        url={`/supplier?id=${supplier.id}`}
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
        <Card className="border-2 border-afrikoni-gold/30 shadow-2xl mb-8 bg-afrikoni-offwhite">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo */}
              <div className="w-40 h-40 bg-afrikoni-offwhite rounded-2xl border-4 border-afrikoni-gold/30 shadow-xl flex items-center justify-center flex-shrink-0">
                {supplier.logo_url ? (
                  <OptimizedImage src={supplier.logo_url} alt={supplier.company_name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Building2 className="w-20 h-20 text-afrikoni-gold" />
                )}
              </div>
              
              {/* Company Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-2">{supplier.company_name}</h1>
                    <div className="flex items-center gap-2 text-afrikoni-deep mb-3">
                      <MapPin className="w-4 h-4 text-afrikoni-gold" />
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
                        <Badge className="bg-afrikoni-gold/20 text-afrikoni-gold border-afrikoni-gold-300 flex items-center gap-1">
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
                    <Button onClick={handleContactSupplier} className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream">
                      Contact Supplier
                    </Button>
                    <Button onClick={handleCreateRFQ} variant="outline" className="border-afrikoni-gold text-afrikoni-gold hover:bg-afrikoni-gold/10">
                      Request Quote
                    </Button>
                  </div>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-afrikoni-gold/20">
                  <div>
                    <div className="text-2xl font-bold text-afrikoni-gold mb-1">{supplier.trust_score || 0}</div>
                    <div className="text-sm text-afrikoni-deep">Trust Score</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-afrikoni-chestnut mb-1">{supplier.response_rate || 0}%</div>
                    <div className="text-sm text-afrikoni-deep">Response Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-afrikoni-chestnut mb-1">{supplier.total_orders || 0}</div>
                    <div className="text-sm text-afrikoni-deep">Total Orders</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="w-5 h-5 text-afrikoni-gold fill-afrikoni-gold" />
                      <span className="text-2xl font-bold text-afrikoni-chestnut">{calculateAverageRating()}</span>
                    </div>
                    <div className="text-sm text-afrikoni-deep">{reviews.length} Reviews</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Tabs defaultValue="about">
              <TabsList className="w-full justify-start bg-afrikoni-offwhite border border-afrikoni-gold/20 p-1">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
                <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="about">
                <Card className="border-afrikoni-gold/20">
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
                        <h3 className="font-semibold text-afrikoni-chestnut mb-3">Certifications</h3>
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(supplier?.certifications) && supplier.certifications.map((cert, idx) => (
                            <Badge key={idx} className="bg-green-50 text-green-700 border-green-200">
                              <Award className="w-3 h-3 mr-1" /> {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="products">
                <Card className="border-afrikoni-gold/20">
                  <CardContent className="p-6">
                    {products.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-16 h-16 text-afrikoni-deep/70 mx-auto mb-4" />
                        <p className="text-afrikoni-deep">No products listed yet</p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        {products.map(product => (
                          <Link
                            key={product.id}
                            to={createPageUrl('ProductDetail') + '?id=' + product.id}
                            className="border border-afrikoni-gold/20 rounded-lg p-4 hover:border-afrikoni-gold transition"
                          >
                            <div className="flex gap-3">
                              <div className="w-20 h-20 bg-afrikoni-cream rounded-lg overflow-hidden flex-shrink-0">
                                {product.images?.[0] ? (
                                  <OptimizedImage src={product.images?.[0] || '/placeholder.png'} alt={product.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-8 h-8 text-afrikoni-deep/70" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-afrikoni-chestnut line-clamp-2 mb-1">{product.title}</h4>
                                <div className="text-lg font-bold text-amber-600">${product.price}</div>
                                <div className="text-xs text-afrikoni-deep/70">MOQ: {product.moq} {product.unit}</div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <Card className="border-afrikoni-gold/20">
                  <CardContent className="p-6">
                    {reviews.length === 0 ? (
                      <div className="text-center py-12">
                        <Star className="w-16 h-16 text-afrikoni-deep/70 mx-auto mb-4" />
                        <p className="text-afrikoni-deep">No reviews yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reviews.map(review => (
                          <div key={review.id} className="border-b border-afrikoni-gold/20 pb-4 last:border-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-afrikoni-deep/50'
                                    }`}
                                  />
                                ))}
                              </div>
                              {review.verified_purchase && (
                                <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" /> Verified Purchase
                                </Badge>
                              )}
                            </div>
                            {review.comment && <p className="text-sm text-afrikoni-deep">{review.comment}</p>}
                            {review.quality_rating && (
                              <div className="grid grid-cols-3 gap-3 mt-3 text-xs text-afrikoni-deep/70">
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
            <Card className="border-afrikoni-gold/20">
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {supplier.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-afrikoni-deep/70" />
                    <span className="text-sm text-afrikoni-deep">{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-afrikoni-deep/70" />
                    <span className="text-sm text-afrikoni-deep">{supplier.email}</span>
                  </div>
                )}
                {supplier.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-afrikoni-deep/70" />
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-amber-600 hover:text-amber-700"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-afrikoni-deep/70 mt-0.5" />
                    <span className="text-sm text-afrikoni-deep">{supplier.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-afrikoni-gold/20">
              <CardHeader>
                <CardTitle className="text-lg">Company Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
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

