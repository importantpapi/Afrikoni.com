import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Package, ChevronRight, Grid, List } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Input } from '@/components/shared/ui/input';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { B2B_CATEGORIES, CATEGORY_GROUPS, searchCategories } from '@/constants/b2bCategories';
import { supabase } from '@/api/supabaseClient';
import SEO from '@/components/SEO';
import { useAnalytics } from '@/hooks/useAnalytics';
import Breadcrumb from '@/components/shared/ui/Breadcrumb';

export default function Categories() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [productCounts, setProductCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { trackPageView } = useAnalytics();

  React.useEffect(() => {
    trackPageView('Categories');
    loadProductCounts();
  }, []);

  const loadProductCounts = async () => {
    try {
      const { data: products } = await supabase
        .from('products')
        .select('category_id')
        .eq('status', 'active');

      if (Array.isArray(products)) {
        const counts = {};
        products.forEach(product => {
          if (product?.category_id) {
            counts[product.category_id] = (counts[product.category_id] || 0) + 1;
          }
        });
        setProductCounts(counts);
      }
    } catch (error) {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  };

  // Filter categories based on search and group
  const filteredCategories = useMemo(() => {
    let categories = B2B_CATEGORIES;

    // Filter by group
    if (selectedGroup !== 'all') {
      const groupIds = CATEGORY_GROUPS[selectedGroup] || [];
      categories = categories.filter(cat => groupIds.includes(cat.id));
    }

    // Filter by search
    if (searchQuery.trim()) {
      categories = searchCategories(searchQuery);
      if (selectedGroup !== 'all') {
        const groupIds = CATEGORY_GROUPS[selectedGroup] || [];
        categories = categories.filter(cat => groupIds.includes(cat.id));
      }
    }

    return categories;
  }, [searchQuery, selectedGroup]);

  const getProductCount = (categoryId) => {
    // Try to match by category name or ID
    const count = productCounts[categoryId] || 0;
    return count > 0 ? `${count.toLocaleString()}+` : 'Coming soon';
  };

  return (
    <>
      <SEO 
        title="Product Categories - Browse All B2B Categories | AFRIKONI"
        description="Browse 50+ B2B product categories across all industries. Find suppliers for agriculture, textiles, electronics, machinery, and more across Africa."
        url="/categories"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <Breadcrumb />
        </div>
        
        {/* Header */}
        <div className="bg-gradient-to-br from-afrikoni-gold/10 via-afrikoni-cream to-afrikoni-offwhite border-b border-afrikoni-gold/20">
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-afrikoni-chestnut mb-4">
                Browse All Categories
              </h1>
              <p className="text-lg md:text-xl text-afrikoni-deep max-w-3xl mb-8">
                Discover products across {B2B_CATEGORIES.length}+ B2B categories. From agriculture to technology, find exactly what you need.
              </p>

              {/* Search Bar */}
              <div className="max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                  <Input
                    type="text"
                    placeholder="Search categories (e.g., agriculture, electronics, machinery)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-6 text-lg border-2 border-afrikoni-gold/30 focus:border-afrikoni-gold bg-afrikoni-cream"
                  />
                </div>
                {searchQuery && (
                  <p className="text-sm text-afrikoni-deep/70 mt-3">
                    {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'} found
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Category Groups */}
            <aside className="lg:w-64 flex-shrink-0">
              <Card className="sticky top-24 border-afrikoni-gold/20">
                <CardContent className="p-6">
                  <h3 className="font-bold text-afrikoni-chestnut mb-4 text-lg">Browse by Industry</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedGroup('all')}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        selectedGroup === 'all'
                          ? 'bg-afrikoni-gold text-afrikoni-chestnut shadow-md'
                          : 'text-afrikoni-deep hover:bg-afrikoni-gold/10'
                      }`}
                    >
                      All Categories
                    </button>
                    {Object.keys(CATEGORY_GROUPS).map((group) => (
                      <button
                        key={group}
                        onClick={() => setSelectedGroup(group)}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          selectedGroup === group
                            ? 'bg-afrikoni-gold text-afrikoni-chestnut shadow-md'
                            : 'text-afrikoni-deep hover:bg-afrikoni-gold/10'
                        }`}
                      >
                        {group}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
              {/* View Mode Toggle */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-afrikoni-chestnut mb-1">
                    {selectedGroup === 'all' ? 'All Categories' : selectedGroup}
                  </h2>
                  <p className="text-sm text-afrikoni-deep/70">
                    {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="p-2"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="p-2"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Categories Grid/List */}
              {isLoading ? (
                <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {[...Array(9)].map((_, i) => (
                    <Card key={i} className="animate-pulse border-afrikoni-gold/20">
                      <div className="h-48 bg-afrikoni-cream" />
                      <CardContent className="p-6 space-y-2">
                        <div className="h-4 bg-afrikoni-cream rounded" />
                        <div className="h-4 bg-afrikoni-cream rounded w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredCategories.length === 0 ? (
                <Card className="border-afrikoni-gold/20">
                  <CardContent className="p-12 text-center">
                    <Package className="w-16 h-16 text-afrikoni-deep/70 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">No categories found</h3>
                    <p className="text-afrikoni-deep mb-4">Try adjusting your search or filter</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedGroup('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {filteredCategories.map((category, idx) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                    >
                      <Link to={`/marketplace?category=${encodeURIComponent(category.name.toLowerCase())}`}>
                        <Card className={`border-afrikoni-gold/20 hover:border-afrikoni-gold/40 transition-all hover:shadow-afrikoni-lg overflow-hidden h-full bg-afrikoni-cream ${
                          viewMode === 'list' ? 'flex' : ''
                        }`}>
                          {viewMode === 'grid' ? (
                            <>
                              <div className="h-48 bg-gradient-to-br from-afrikoni-gold/20 to-afrikoni-gold/5 relative overflow-hidden flex items-center justify-center">
                                <div className="text-6xl">{category.icon}</div>
                                <div className="absolute inset-0 bg-gradient-to-t from-afrikoni-gold/10 to-transparent" />
                              </div>
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-3">
                                  <h3 className="text-xl font-bold text-afrikoni-chestnut line-clamp-2 flex-1">
                                    {category.name}
                                  </h3>
                                </div>
                                <p className="text-sm text-afrikoni-deep mb-4 line-clamp-2 min-h-[2.5rem]">
                                  {category.description}
                                </p>
                                <div className="flex items-center justify-between mb-4">
                                  <Badge variant="outline" className="text-xs">
                                    {getProductCount(category.id)} products
                                  </Badge>
                                  <ChevronRight className="w-4 h-4 text-afrikoni-gold" />
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {category.subcategories.slice(0, 3).map((sub, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {sub}
                                    </Badge>
                                  ))}
                                  {category.subcategories.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{category.subcategories.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </CardContent>
                            </>
                          ) : (
                            <>
                              <div className="w-32 h-32 bg-gradient-to-br from-afrikoni-gold/20 to-afrikoni-gold/5 flex items-center justify-center flex-shrink-0">
                                <div className="text-4xl">{category.icon}</div>
                              </div>
                              <CardContent className="p-6 flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">
                                      {category.name}
                                    </h3>
                                    <p className="text-sm text-afrikoni-deep mb-3">
                                      {category.description}
                                    </p>
                                  </div>
                                  <ChevronRight className="w-5 h-5 text-afrikoni-gold flex-shrink-0 ml-4" />
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-wrap gap-1.5 flex-1">
                                    {category.subcategories.slice(0, 5).map((sub, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {sub}
                                      </Badge>
                                    ))}
                                    {category.subcategories.length > 5 && (
                                      <Badge variant="secondary" className="text-xs">
                                        +{category.subcategories.length - 5} more
                                      </Badge>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="text-xs ml-4">
                                    {getProductCount(category.id)} products
                                  </Badge>
                                </div>
                              </CardContent>
                            </>
                          )}
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
