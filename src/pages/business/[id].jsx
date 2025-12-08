/**
 * Business Profile Page
 * Public profile page for businesses/suppliers
 * Route: /business/:id
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, MapPin, Star, Shield, Phone, Mail, Globe, 
  CheckCircle, Package, Calendar, Users, Award, 
  MessageSquare, ExternalLink, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import OptimizedImage from '@/components/OptimizedImage';
import NewMessageDialog from '@/components/messaging/NewMessageDialog';
import { isValidUUID } from '@/utils/security';
import { motion } from 'framer-motion';
import { getPrimaryImageFromProduct } from '@/utils/productImages';
import { OffPlatformDisclaimerCompact } from '@/components/OffPlatformDisclaimer';

export default function BusinessProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  useEffect(() => {
    if (!id || !isValidUUID(id)) {
      toast.error('Invalid business ID');
      navigate('/marketplace');
      return;
    }
    loadBusinessData();
  }, [id]);

  const loadBusinessData = async () => {
    try {
      setIsLoading(true);
      
      const [businessRes, productsRes, reviewsRes] = await Promise.all([
        supabase
          .from('companies')
          .select('*')
          .eq('id', id)
          .single(),
        supabase
          .from('products')
          .select('*, categories(name)')
          .eq('company_id', id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(productsPerPage * 3), // Load more for pagination
        supabase
          .from('reviews')
          .select('*, reviewer_company_id, reviewed_company_id')
          .eq('reviewed_company_id', id)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      if (businessRes.error) throw businessRes.error;
      if (!businessRes.data) {
        toast.error('Business not found');
        navigate('/marketplace');
        return;
      }

      setBusiness(businessRes.data);
      setProducts(productsRes.data || []);
      setReviews(reviewsRes.data || []);
    } catch (error) {
      toast.error('Failed to load business profile');
      navigate('/marketplace');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate ratings
  const calculateRatings = () => {
    if (!reviews || reviews.length === 0) {
      return {
        average: 0,
        total: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const average = sum / total;

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const rating = r.rating || 0;
      if (rating >= 1 && rating <= 5) {
        breakdown[rating]++;
      }
    });

    return { average: average.toFixed(1), total, breakdown };
  };

  const ratings = calculateRatings();

  // Paginate products
  const paginatedProducts = products.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );
  const totalPages = Math.ceil(products.length / productsPerPage);

  // Calculate reliability score (placeholder function)
  const calculateReliabilityScore = () => {
    if (!business) return 50;
    
    let score = 50; // Base score
    
    // Verified status adds 30 points
    if (business.verified || business.verification_status === 'verified') {
      score += 30;
    }
    
    // Trust score from database
    if (business.trust_score) {
      score = (score + business.trust_score) / 2;
    }
    
    // Response rate adds up to 10 points
    if (business.response_rate) {
      score += (business.response_rate / 10);
    }
    
    // Total orders adds up to 10 points
    if (business.total_orders) {
      score += Math.min(business.total_orders / 10, 10);
    }
    
    return Math.min(Math.round(score), 100);
  };

  const reliabilityScore = calculateReliabilityScore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-afrikoni-offwhite flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  if (!business) return null;

  return (
    <>
      <SEO 
        title={`${business.company_name} - Business Profile | Afrikoni`}
        description={business.description || `View ${business.company_name}'s profile, products, and certifications on Afrikoni B2B marketplace.`}
        url={`/business/${id}`}
      />
      
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Hero Banner */}
        <div className="h-64 bg-gradient-to-br from-afrikoni-chestnut via-afrikoni-brown-800 to-afrikoni-brown-700 relative">
          {business.cover_image_url && (
            <OptimizedImage 
              src={business.cover_image_url} 
              alt="" 
              className="w-full h-full object-cover opacity-30" 
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-afrikoni-chestnut/80 to-transparent" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-10 pb-12">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-afrikoni-deep hover:text-afrikoni-gold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Business Header Card */}
          <Card className="border-2 border-afrikoni-gold/30 shadow-2xl mb-8 bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Logo */}
                <div className="w-40 h-40 bg-afrikoni-offwhite rounded-2xl border-4 border-afrikoni-gold/30 shadow-xl flex items-center justify-center flex-shrink-0">
                  {business.logo_url ? (
                    <OptimizedImage 
                      src={business.logo_url} 
                      alt={business.company_name} 
                      className="w-full h-full object-cover rounded-xl" 
                    />
                  ) : (
                    <Building2 className="w-20 h-20 text-afrikoni-gold" />
                  )}
                </div>
                
                {/* Company Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-3xl font-bold text-afrikoni-chestnut">
                          {business.company_name}
                        </h1>
                        {(business.verified || business.verification_status === 'verified') && (
                          <Badge className="bg-afrikoni-gold text-white flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Verified Supplier
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-afrikoni-deep/70">
                        {business.country && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {business.country}
                            {business.city && `, ${business.city}`}
                          </div>
                        )}
                        {business.year_established && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Est. {business.year_established}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Ratings & Reliability */}
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="w-5 h-5 text-afrikoni-gold fill-afrikoni-gold" />
                        <span className="text-2xl font-bold text-afrikoni-chestnut">
                          {ratings.average}
                        </span>
                        <span className="text-sm text-afrikoni-deep/70">
                          ({ratings.total} reviews)
                        </span>
                      </div>
                      <div className="text-xs text-afrikoni-deep/70">
                        Reliability: {reliabilityScore}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Contact Button */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => setShowMessageDialog(true)}
                        className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-white"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Contact Supplier
                      </Button>
                      {business.website && (
                        <Button
                          variant="outline"
                          asChild
                        >
                          <a href={business.website} target="_blank" rel="noopener noreferrer">
                            <Globe className="w-4 h-4 mr-2" />
                            Visit Website
                            <ExternalLink className="w-3 h-3 ml-2" />
                          </a>
                        </Button>
                      )}
                    </div>
                    <OffPlatformDisclaimerCompact />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="products" className="space-y-6">
            <TabsList className="bg-white border border-afrikoni-gold/20">
              <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({ratings.total})</TabsTrigger>
            </TabsList>

            {/* Products Tab */}
            <TabsContent value="products">
              {paginatedProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {paginatedProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full"
                        onClick={() => navigate(`/product?id=${product.id}`)}
                      >
                        <div className="aspect-square bg-afrikoni-offwhite rounded-t-lg overflow-hidden">
                          {(() => {
                            const imageUrl = getPrimaryImageFromProduct(product);
                            return imageUrl ? (
                              <OptimizedImage
                                src={imageUrl}
                                alt={product.title || 'Product'}
                                className="w-full h-full object-cover"
                                width={400}
                                height={400}
                                quality={85}
                                placeholder="/product-placeholder.svg"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-16 h-16 text-afrikoni-deep/30" />
                              </div>
                            );
                          })()}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-afrikoni-chestnut mb-2 line-clamp-2">
                            {product.title}
                          </h3>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-afrikoni-gold">
                              {product.currency || 'USD'} {product.price}
                            </span>
                            {product.categories?.name && (
                              <Badge variant="outline" className="text-xs">
                                {product.categories.name}
                              </Badge>
                            )}
                          </div>
                          {product.moq && (
                            <p className="text-xs text-afrikoni-deep/70 mt-1">
                              MOQ: {product.moq} {product.unit || 'pieces'}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Package className="w-16 h-16 mx-auto text-afrikoni-deep/30 mb-4" />
                    <p className="text-afrikoni-deep/70">No products available</p>
                  </CardContent>
                </Card>
              )}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-afrikoni-deep">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* About Tab */}
            <TabsContent value="about">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {business.description && (
                      <div>
                        <h4 className="font-semibold text-afrikoni-chestnut mb-2">About</h4>
                        <p className="text-afrikoni-deep/70">{business.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      {business.business_type && (
                        <div>
                          <p className="text-sm text-afrikoni-deep/60">Business Type</p>
                          <p className="font-medium">{business.business_type}</p>
                        </div>
                      )}
                      {business.employee_count && (
                        <div>
                          <p className="text-sm text-afrikoni-deep/60">Company Size</p>
                          <p className="font-medium">{business.employee_count}</p>
                        </div>
                      )}
                      {business.phone && (
                        <div>
                          <p className="text-sm text-afrikoni-deep/60">Phone</p>
                          <p className="font-medium">{business.phone}</p>
                        </div>
                      )}
                      {business.email && (
                        <div>
                          <p className="text-sm text-afrikoni-deep/60">Email</p>
                          <p className="font-medium">{business.email}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Certifications & Trust</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {business.certifications && business.certifications.length > 0 ? (
                      <div className="space-y-2">
                        {business.certifications.map((cert, idx) => (
                          <Badge key={idx} variant="outline" className="mr-2 mb-2">
                            <Award className="w-3 h-3 mr-1" />
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-afrikoni-deep/70 text-sm">No certifications listed</p>
                    )}
                    
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-afrikoni-deep/70">Reliability Score</span>
                        <span className="font-bold text-afrikoni-gold">{reliabilityScore}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-afrikoni-deep/70">Response Rate</span>
                        <span className="font-medium">{business.response_rate || 0}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-afrikoni-deep/70">Total Orders</span>
                        <span className="font-medium">{business.total_orders || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < (review.rating || 0)
                                    ? 'text-afrikoni-gold fill-afrikoni-gold'
                                    : 'text-afrikoni-deep/20'
                                }`}
                              />
                            ))}
                            <span className="text-sm text-afrikoni-deep/70 ml-2">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-afrikoni-deep/80">{review.comment}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Star className="w-16 h-16 mx-auto text-afrikoni-deep/30 mb-4" />
                    <p className="text-afrikoni-deep/70">No reviews yet</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Message Dialog */}
        {showMessageDialog && (
          <NewMessageDialog
            isOpen={showMessageDialog}
            onClose={() => setShowMessageDialog(false)}
            recipientCompanyId={id}
            recipientCompanyName={business.company_name}
          />
        )}
      </div>
    </>
  );
}

