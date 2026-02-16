/**
 * Business Profile Page
 * Public profile page for businesses/suppliers
 * Route: /business/:id
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { 
  Building, MapPin, Star, Shield, Phone, Mail, Globe, 
  CheckCircle, Package, Calendar, Users, Award, 
  MessageSquare, ExternalLink, ArrowLeft, Image as ImageIcon,
  Camera, X, Edit, Factory, Briefcase, TrendingUp, Heart
} from 'lucide-react';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import OptimizedImage from '@/components/OptimizedImage';
import NewMessageDialog from '@/components/messaging/NewMessageDialog';
import { isValidUUID } from '@/utils/security';
import { motion } from 'framer-motion';
import { getPrimaryImageFromProduct } from '@/utils/productImages';
import { OffPlatformDisclaimerCompact } from '@/components/OffPlatformDisclaimer';
import { useAuth } from '@/contexts/AuthProvider';

export default function BusinessProfile() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isOwner, setIsOwner] = useState(false);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);
  const [hasCompletedTransaction, setHasCompletedTransaction] = useState(false);
  const [isCheckingTransaction, setIsCheckingTransaction] = useState(true);
  const productsPerPage = 12;

  useEffect(() => {
    if (!id || !isValidUUID(id)) {
      toast.error('Invalid business ID');
      navigate('/marketplace');
      return;
    }
    loadBusinessData();
  }, [id]);

  useEffect(() => {
    // Check ownership using auth from context
    if (authReady && user && profile) {
      const companyId = profile?.company_id || null;
      if (companyId === id) {
        setIsOwner(true);
      }
    }
  }, [authReady, user, profile, id]);

  // Check if user has completed a transaction with this supplier
  useEffect(() => {
    const checkTransactionHistory = async () => {
      if (!authReady || !user || !profile?.company_id || !id) {
        setIsCheckingTransaction(false);
        return;
      }

      // Owner always has access
      if (profile.company_id === id) {
        setHasCompletedTransaction(true);
        setIsCheckingTransaction(false);
        return;
      }

      try {
        // Check for completed orders between user's company and this supplier
        // Query 1: User's company is buyer, this business is seller
        const { data: ordersAsBuyer, error: error1 } = await supabase
          .from('orders')
          .select('id')
          .eq('buyer_company_id', profile.company_id)
          .eq('seller_company_id', id)
          .in('status', ['completed', 'delivered', 'closeout'])
          .limit(1);

        if (!error1 && ordersAsBuyer && ordersAsBuyer.length > 0) {
          setHasCompletedTransaction(true);
          setIsCheckingTransaction(false);
          return;
        }

        // Query 2: User's company is seller, this business is buyer
        const { data: ordersAsSeller, error: error2 } = await supabase
          .from('orders')
          .select('id')
          .eq('seller_company_id', profile.company_id)
          .eq('buyer_company_id', id)
          .in('status', ['completed', 'delivered', 'closeout'])
          .limit(1);

        if (!error2 && ordersAsSeller && ordersAsSeller.length > 0) {
          setHasCompletedTransaction(true);
        }

        // Log errors for debugging but don't block
        if (error1) console.warn('Transaction check query 1 error:', error1);
        if (error2) console.warn('Transaction check query 2 error:', error2);
      } catch (err) {
        console.error('Failed to check transaction history:', err);
      } finally {
        setIsCheckingTransaction(false);
      }
    };

    checkTransactionHistory();
  }, [authReady, user, profile, id]);

  const loadBusinessData = async () => {
    try {
      setIsLoading(true);
      
      // Load business data - simplified query without foreign key join
      const { data: businessData, error: businessError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (businessError) {
        console.error('Error loading business:', businessError);
        throw businessError;
      }

      if (!businessData) {
        toast.error('Business not found');
        navigate('/marketplace');
        return;
      }

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('company_id', id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(productsPerPage * 3);

      if (productsError) {
        console.error('Error loading products:', productsError);
        // Don't throw - products are optional
      }

      // Load reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*, reviewer_company_id, reviewed_company_id')
        .eq('reviewed_company_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reviewsError) {
        console.error('Error loading reviews:', reviewsError);
        // Don't throw - reviews are optional
      }

      setBusiness(businessData);
      setProducts(productsData || []);
      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Failed to load business profile:', error);
      toast.error(error.message || 'Failed to load business profile');
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

    const safeReviews = Array.isArray(reviews) ? reviews : [];
    const total = safeReviews.length;
    const sum = safeReviews.reduce((acc, r) => acc + (r?.rating || 0), 0);
    const average = total > 0 ? sum / total : 0;

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    safeReviews.forEach(r => {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-os-accent" />
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
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-12">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-afrikoni-deep hover:text-os-accent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Enhanced Business Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-2 border-os-accent/30 shadow-2xl mb-8 overflow-hidden bg-gradient-to-br from-white via-afrikoni-offwhite to-white">
              {/* Decorative top border */}
              <div className="h-2 bg-gradient-to-r from-os-accent via-os-accent/80 to-os-accent" />
              
              <CardContent className="p-6 md:p-10">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                  {/* Enhanced Logo with Animation */}
                  <motion.div 
                    className="relative group"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-32 h-32 md:w-44 md:h-44 bg-gradient-to-br from-os-accent/20 via-afrikoni-purple/15 to-os-accent/10 rounded-os-lg border-4 border-os-accent/40 shadow-2xl flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
                      
                      {business.logo_url ? (
                        <OptimizedImage 
                          src={business.logo_url} 
                          alt={`${business.company_name} logo`} 
                          className="w-full h-full object-contain p-3 relative z-10" 
                          width={176}
                          height={176}
                          quality={95}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-os-accent/30 to-afrikoni-purple/30">
                          <Building className="w-20 h-20 md:w-24 md:h-24 text-os-accent drop-shadow-os-md" />
                        </div>
                      )}
                    </div>
                    {isOwner && !business.logo_url && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-os-lg opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/dashboard/company-info`)}
                          className="bg-white/95 hover:bg-white text-afrikoni-chestnut shadow-os-md"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Add Logo
                        </Button>
                      </div>
                    )}
                  </motion.div>
                
                {/* Enhanced Company Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div className="flex-1 min-w-0">
                      <motion.div 
                        className="flex flex-wrap items-center gap-3 mb-4"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <h1 className="text-3xl md:text-5xl font-bold text-afrikoni-chestnut leading-tight tracking-tight">
                          {business.company_name}
                        </h1>
                        {(business.verified || business.verification_status === 'verified') && (
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Badge className="bg-gradient-to-r from-os-accent via-os-accent/90 to-os-accent text-white flex items-center gap-2 px-4 py-2 shadow-os-md border-2 border-os-accent/20">
                              <CheckCircle className="w-5 h-5" />
                              <span className="font-bold text-os-base">Verified Supplier</span>
                            </Badge>
                          </motion.div>
                        )}
                        {isOwner && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/dashboard/company-info`)}
                            className="border-2 border-os-accent/40 hover:bg-os-accent/10 text-afrikoni-chestnut font-semibold"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Button>
                        )}
                      </motion.div>
                      
                      <motion.div 
                        className="flex flex-wrap items-center gap-3 md:gap-4 text-os-sm md:text-os-base text-afrikoni-deep/80 mb-5"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        {business.country && (
                          <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-os-accent/15 to-os-accent/5 rounded-os-sm border-2 border-os-accent/30 shadow-sm hover:shadow-md transition-shadow">
                            <MapPin className="w-5 h-5 text-os-accent" />
                            <span className="font-semibold text-afrikoni-chestnut">{business.country}{business.city && `, ${business.city}`}</span>
                          </div>
                        )}
                        {business.year_established && (
                          <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-afrikoni-purple/15 to-afrikoni-purple/5 rounded-os-sm border-2 border-afrikoni-purple/30 shadow-sm hover:shadow-md transition-shadow">
                            <Calendar className="w-5 h-5 text-afrikoni-purple" />
                            <span className="font-semibold text-afrikoni-chestnut">Est. {business.year_established}</span>
                          </div>
                        )}
                        {business.employee_count && (
                          <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-50 to-green-50/5 rounded-os-sm border-2 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                            <Users className="w-5 h-5 text-green-600" />
                            <span className="font-semibold text-afrikoni-chestnut">{business.employee_count}</span>
                          </div>
                        )}
                      </motion.div>

                      {/* Short Description */}
                      {business.description && (
                        <p className="text-os-base text-afrikoni-deep/80 mb-4 line-clamp-2 leading-relaxed">
                          {business.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Enhanced Ratings & Reliability */}
                    <motion.div 
                      className="text-center bg-gradient-to-br from-os-accent/20 via-afrikoni-purple/10 to-os-accent/10 rounded-os-md p-6 border-2 border-os-accent/30 shadow-os-md min-w-[180px]"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex flex-col items-center gap-2 mb-3">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-os-accent to-os-accent/80 flex items-center justify-center shadow-os-md">
                          <Star className="w-9 h-9 text-white fill-white" />
                        </div>
                        <span className="text-4xl font-black text-afrikoni-chestnut tracking-tight">
                          {ratings.average || '0.0'}
                        </span>
                      </div>
                      <div className="text-os-sm font-medium text-afrikoni-deep/70 mb-4 pb-4 border-b border-os-accent/20">
                        {ratings.total} {ratings.total === 1 ? 'review' : 'reviews'}
                      </div>
                      <div className="flex flex-col items-center gap-2 pt-1">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/60 rounded-lg border border-os-accent/20">
                          <Shield className="w-5 h-5 text-os-accent" />
                          <span className="text-os-sm font-bold text-afrikoni-chestnut">
                            {reliabilityScore}%
                          </span>
                        </div>
                        <span className="text-os-xs text-afrikoni-deep/60 font-medium">Reliability</span>
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Contact Button */}
                  <motion.div 
                    className="space-y-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => setShowMessageDialog(true)}
                        className="bg-gradient-to-r from-os-accent to-os-accent/90 hover:from-os-accentDark hover:to-os-accent text-white font-bold shadow-os-md hover:shadow-os-lg transition-all px-8 py-6 text-os-base"
                        size="lg"
                      >
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Contact Supplier
                      </Button>
                      {business.website && (isOwner || hasCompletedTransaction) && (
                        <Button
                          variant="outline"
                          asChild
                          className="border-2 border-os-accent/40 hover:bg-os-accent/10 font-semibold px-6 py-6 text-os-base"
                          size="lg"
                        >
                          <a href={business.website} target="_blank" rel="noopener noreferrer">
                            <Globe className="w-5 h-5 mr-2" />
                            Visit Website
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </a>
                        </Button>
                      )}
                    </div>
                    <OffPlatformDisclaimerCompact />
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="products" className="space-y-8">
            <TabsList className="bg-gradient-to-r from-white via-afrikoni-offwhite to-white border-2 border-os-accent/30 shadow-os-md p-1.5 rounded-os-sm">
              <TabsTrigger 
                value="products" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-os-accent data-[state=active]:to-os-accent/90 data-[state=active]:text-white data-[state=active]:shadow-os-md data-[state=active]:font-bold rounded-lg px-6 py-3 transition-all duration-200"
              >
                <Package className="w-4 h-4 mr-2" />
                Products ({products.length})
              </TabsTrigger>
              <TabsTrigger 
                value="about"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-os-accent data-[state=active]:to-os-accent/90 data-[state=active]:text-white data-[state=active]:shadow-os-md data-[state=active]:font-bold rounded-lg px-6 py-3 transition-all duration-200"
              >
                <Building className="w-4 h-4 mr-2" />
                About
              </TabsTrigger>
              <TabsTrigger 
                value="reviews"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-os-accent data-[state=active]:to-os-accent/90 data-[state=active]:text-white data-[state=active]:shadow-os-md data-[state=active]:font-bold rounded-lg px-6 py-3 transition-all duration-200"
              >
                <Star className="w-4 h-4 mr-2" />
                Reviews ({ratings.total})
              </TabsTrigger>
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
                      <Card className="hover:shadow-os-md transition-shadow cursor-pointer h-full"
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
                            <span className="text-os-lg font-bold text-os-accent">
                              {product.currency || 'USD'} {product.price}
                            </span>
                            {product.categories?.name && (
                              <Badge variant="outline" className="text-os-xs">
                                {product.categories.name}
                              </Badge>
                            )}
                          </div>
                          {product.moq && (
                            <p className="text-os-xs text-afrikoni-deep/70 mt-1">
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

            {/* Gallery Tab */}
            <TabsContent value="gallery">
              {business.gallery_images && Array.isArray(business.gallery_images) && business.gallery_images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {(Array.isArray(business?.gallery_images) ? business.gallery_images : []).map((imageUrl, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="relative group cursor-pointer"
                      onClick={() => setSelectedGalleryImage(imageUrl)}
                    >
                      <div className="aspect-square rounded-os-sm overflow-hidden border-2 border-os-accent/20 hover:border-os-accent/40 transition-all shadow-md hover:shadow-os-lg">
                        <OptimizedImage
                          src={imageUrl}
                          alt={`${business.company_name} gallery image ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          width={400}
                          height={400}
                          quality={85}
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-os-sm flex items-center justify-center">
                        <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <ImageIcon className="w-16 h-16 mx-auto text-afrikoni-deep/30 mb-4" />
                    <p className="text-afrikoni-deep/70 mb-4">No gallery images yet</p>
                    {isOwner && (
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/dashboard/company-info`)}
                        className="border-os-accent text-afrikoni-chestnut hover:bg-os-accent/10"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Add Gallery Images
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Enhanced About Tab */}
            <TabsContent value="about">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-2 border-os-accent/20 shadow-os-md">
                  <CardHeader className="bg-gradient-to-r from-os-accent/10 to-afrikoni-purple/10 border-b border-os-accent/20">
                    <CardTitle className="flex items-center gap-2 text-afrikoni-chestnut">
                      <Factory className="w-5 h-5 text-os-accent" />
                      Company Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {business.description && (
                      <div>
                        <h4 className="font-bold text-os-lg text-afrikoni-chestnut mb-3 flex items-center gap-2">
                          <Heart className="w-5 h-5 text-os-accent" />
                          Our Story
                        </h4>
                        <p className="text-afrikoni-deep/80 leading-relaxed text-os-base">{business.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-os-accent/20">
                      {business.business_type && (
                        <div className="p-4 bg-os-accent/5 rounded-os-sm border border-os-accent/20">
                          <p className="text-os-sm text-afrikoni-deep/60 mb-1 font-medium">Business Type</p>
                          <p className="font-bold text-afrikoni-chestnut">{business.business_type}</p>
                        </div>
                      )}
                      {business.employee_count && (
                        <div className="p-4 bg-afrikoni-purple/5 rounded-os-sm border border-afrikoni-purple/20">
                          <p className="text-os-sm text-afrikoni-deep/60 mb-1 font-medium">Company Size</p>
                          <p className="font-bold text-afrikoni-chestnut">{business.employee_count}</p>
                        </div>
                      )}
                      {/* Contact Info - Gated until transaction completed */}
                      {(isOwner || hasCompletedTransaction) ? (
                        <>
                          {business.phone && (
                            <div className="p-4 bg-afrikoni-green/5 rounded-os-sm border border-afrikoni-green/20">
                              <p className="text-os-sm text-afrikoni-deep/60 mb-1 font-medium flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                Phone
                              </p>
                              <p className="font-bold text-afrikoni-chestnut">{business.phone}</p>
                            </div>
                          )}
                          {business.email && (
                            <div className="p-4 bg-os-accent/5 rounded-os-sm border border-os-accent/20">
                              <p className="text-os-sm text-afrikoni-deep/60 mb-1 font-medium flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                Email
                              </p>
                              <p className="font-bold text-afrikoni-chestnut break-all">{business.email}</p>
                            </div>
                          )}
                        </>
                      ) : (business.phone || business.email) && (
                        <div className="col-span-2 p-5 bg-gradient-to-r from-os-accent/10 to-afrikoni-purple/10 rounded-os-sm border-2 border-os-accent/30">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-os-accent/20 flex items-center justify-center flex-shrink-0">
                              <Shield className="w-5 h-5 text-os-accent" />
                            </div>
                            <div>
                              <h4 className="font-bold text-afrikoni-chestnut mb-1">Contact Info Protected</h4>
                              <p className="text-os-sm text-afrikoni-deep/70 mb-3">
                                Complete your first transaction with this supplier to unlock direct contact details.
                                This protects both buyers and suppliers from spam and fraud.
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => setShowMessageDialog(true)}
                                  className="bg-os-accent hover:bg-os-accentDark text-white"
                                >
                                  <MessageSquare className="w-4 h-4 mr-1" />
                                  Send Message First
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate('/dashboard/rfqs/new')}
                                  className="border-os-accent/40 hover:bg-os-accent/10"
                                >
                                  Create RFQ
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-os-accent/20 shadow-os-md">
                  <CardHeader className="bg-gradient-to-r from-afrikoni-purple/10 to-os-accent/10 border-b border-os-accent/20">
                    <CardTitle className="flex items-center gap-2 text-afrikoni-chestnut">
                      <Award className="w-5 h-5 text-afrikoni-purple" />
                      Certifications & Trust
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {business.certifications && business.certifications.length > 0 ? (
                      <div className="space-y-3 mb-6">
                        {(Array.isArray(business?.certifications) ? business.certifications : []).map((cert, idx) => (
                          <Badge key={idx} variant="outline" className="mr-2 mb-2 px-4 py-2 text-os-sm bg-gradient-to-r from-os-accent/10 to-afrikoni-purple/10 border-os-accent/30">
                            <Award className="w-4 h-4 mr-2 text-os-accent" />
                            <span className="font-semibold">{cert}</span>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-afrikoni-deep/70 text-os-sm mb-6">No certifications listed</p>
                    )}
                    
                    <div className="space-y-4 pt-4 border-t border-os-accent/20">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-os-accent/10 to-os-accent/5 rounded-os-sm border border-os-accent/20">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-os-accent" />
                          <span className="text-os-sm font-medium text-afrikoni-deep/80">Reliability Score</span>
                        </div>
                        <span className="text-os-2xl font-bold text-os-accent">{reliabilityScore}%</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-afrikoni-purple/5 rounded-os-sm border border-afrikoni-purple/20">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-afrikoni-purple" />
                          <span className="text-os-sm font-medium text-afrikoni-deep/80">Response Rate</span>
                        </div>
                        <span className="text-os-xl font-bold text-afrikoni-purple">{business.response_rate || 0}%</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-afrikoni-green/5 rounded-os-sm border border-afrikoni-green/20">
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-afrikoni-green" />
                          <span className="text-os-sm font-medium text-afrikoni-deep/80">Total Orders</span>
                        </div>
                        <span className="text-os-xl font-bold text-afrikoni-green">{business.total_orders || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-6">
              {/* Reviews Summary */}
              <Card className="border-2 border-os-accent/20 shadow-os-md bg-gradient-to-br from-white via-afrikoni-offwhite to-white">
                <CardHeader className="bg-gradient-to-r from-os-accent/10 to-afrikoni-purple/10 border-b border-os-accent/20">
                  <CardTitle className="flex items-center gap-2 text-afrikoni-chestnut">
                    <Star className="w-5 h-5 text-os-accent" />
                    Customer Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Average Rating */}
                    <div className="text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                        <div className="text-5xl font-black text-afrikoni-chestnut">{ratings.average}</div>
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-5 h-5 ${
                                  i < Math.round(parseFloat(ratings.average))
                                    ? 'text-os-accent fill-os-accent'
                                    : 'text-afrikoni-deep/20'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-os-sm text-afrikoni-deep/70">{ratings.total} {ratings.total === 1 ? 'review' : 'reviews'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Rating Breakdown */}
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = ratings.breakdown[star] || 0;
                        const percentage = ratings.total > 0 ? (count / ratings.total) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-3">
                            <span className="text-os-sm font-medium text-afrikoni-deep/70 w-8">{star} <Star className="w-3 h-3 inline text-os-accent fill-os-accent" /></span>
                            <div className="flex-1 h-2 bg-afrikoni-offwhite rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-os-accent to-os-accent/80"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-os-sm text-afrikoni-deep/70 w-12 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reviews List */}
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {(Array.isArray(reviews) ? reviews : []).map((review) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="border border-os-accent/20 hover:shadow-os-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-5 h-5 ${
                                    i < (review.rating || 0)
                                      ? 'text-os-accent fill-os-accent'
                                      : 'text-afrikoni-deep/20'
                                  }`}
                                />
                              ))}
                              <Badge className="bg-gradient-to-r from-green-600 to-green-500 text-white border-green-700 shadow-sm">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified Order
                              </Badge>
                              <Badge variant="outline" className="text-os-xs bg-white">
                                {new Date(review.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </Badge>
                            </div>
                            <span className="text-os-sm text-afrikoni-deep/60">
                              {new Date(review.created_at).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-afrikoni-deep/80 leading-relaxed mb-3">{review.comment}</p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="border-2 border-os-accent/20">
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-os-accent/20 to-afrikoni-purple/20 rounded-full flex items-center justify-center">
                      <Star className="w-10 h-10 text-os-accent" />
                    </div>
                    <h3 className="text-os-xl font-bold text-afrikoni-chestnut mb-2">No reviews yet</h3>
                    <p className="text-afrikoni-deep/70">Be the first to review this supplier!</p>
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

