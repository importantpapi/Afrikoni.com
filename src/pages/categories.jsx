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
import { useLanguage } from '@/i18n/LanguageContext';

export default function Categories() {
  const { language } = useLanguage();
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

  const filteredCategories = useMemo(() => {
    let categories = B2B_CATEGORIES;
    if (selectedGroup !== 'all') {
      const groupIds = CATEGORY_GROUPS[selectedGroup] || [];
      categories = categories.filter(cat => groupIds.includes(cat.id));
    }
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
    const count = productCounts[categoryId] || 0;
    return count > 0 ? `${count.toLocaleString()}+` : 'Coming soon';
  };

  return (
    <>
      <SEO
        lang={language}
        title="B2B Industry Categories – Verified African Sourcing | AFRIKONI"
        description="Explore 50+ localized B2B categories. From raw materials to finished goods, find verified African suppliers and secured trade workflows."
        url="/categories"
      />
      <div className="min-h-screen bg-afrikoni-offwhite text-os-text-primary">
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <Breadcrumb
            items={[
              { path: `/${language}`, label: 'Home' },
              { path: `/${language}/categories`, label: 'Categories' }
            ]}
          />
        </div>

        <div className="bg-gradient-to-br from-os-accent/10 via-afrikoni-cream to-afrikoni-offwhite border-b border-os-accent/20">
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-os-text-primary mb-4">
                Global Sourcing Intelligence
              </h1>
              <p className="text-os-lg text-os-text-secondary max-w-3xl mb-8">
                Access verified suppliers across {B2B_CATEGORIES.length}+ institutional categories.
              </p>

              <div className="max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-os-text-secondary/60" />
                  <Input
                    type="text"
                    placeholder="Search commodities or industries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-6 text-os-lg border-2 border-os-stroke/40 focus:border-os-accent bg-white/50 backdrop-blur-sm"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-64 flex-shrink-0">
              <Card className="sticky top-24 border-os-stroke/40 bg-white/80 backdrop-blur-sm shadow-sm ring-1 ring-black/5">
                <CardContent className="p-6">
                  <h3 className="font-black uppercase tracking-widest text-[10px] text-os-text-secondary mb-4">Industries</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedGroup('all')}
                      className={`w-full text-left px-4 py-2 rounded-lg text-os-sm font-bold transition-all ${selectedGroup === 'all'
                          ? 'bg-os-accent text-white'
                          : 'text-os-text-secondary hover:bg-os-accent/10'
                        }`}
                    >
                      All
                    </button>
                    {Object.keys(CATEGORY_GROUPS).map((group) => (
                      <button
                        key={group}
                        onClick={() => setSelectedGroup(group)}
                        className={`w-full text-left px-4 py-2 rounded-lg text-os-sm font-bold transition-all ${selectedGroup === group
                            ? 'bg-os-accent text-white'
                            : 'text-os-text-secondary hover:bg-os-accent/10'
                          }`}
                      >
                        {group}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </aside>

            <main className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-os-2xl font-black tracking-tight text-os-text-primary capitalize">
                    {selectedGroup === 'all' ? 'Institutional Directory' : selectedGroup}
                  </h2>
                  <p className="text-os-xs font-black uppercase tracking-widest text-os-text-secondary/60">
                    {filteredCategories.length} Units Found
                  </p>
                </div>
                <div className="flex items-center gap-2 p-1 bg-os-stroke/20 rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'solid' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="w-10 h-10 p-0"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'solid' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="w-10 h-10 p-0"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-os-stroke/20 rounded-[24px] h-64" />
                  ))}
                </div>
              ) : filteredCategories.length === 0 ? (
                <Card className="border-os-stroke/40">
                  <CardContent className="p-12 text-center">
                    <Package className="w-16 h-16 text-os-text-secondary/40 mx-auto mb-4" />
                    <h3 className="text-os-lg font-black text-os-text-primary uppercase tracking-tight">Zero Results</h3>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedGroup('all');
                      }}
                    >
                      Reset Directory
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {filteredCategories.map((category, idx) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                    >
                      <Link to={`/${language}/marketplace?category=${encodeURIComponent(category.name.toLowerCase())}`}>
                        <Card className={`border-os-stroke/40 hover:border-os-accent/40 shadow-sm hover:shadow-os-md transition-all rounded-[24px] overflow-hidden h-full group ${viewMode === 'list' ? 'flex items-center' : ''
                          }`}>
                          <div className={`${viewMode === 'grid' ? 'h-40 w-full' : 'w-32 h-32'} bg-gradient-to-br from-os-accent/5 to-os-accent/10 flex items-center justify-center relative`}>
                            <div className="text-5xl group-hover:scale-110 transition-transform duration-500">{category.icon}</div>
                            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-os-accent border border-os-accent/20">
                              {getProductCount(category.id)}
                            </div>
                          </div>
                          <CardContent className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                            <h3 className="text-lg font-black tracking-tight text-os-text-primary group-hover:text-os-accent transition-colors mb-2">
                              {category.name}
                            </h3>
                            <p className="text-os-xs text-os-text-secondary line-clamp-2 mb-4">
                              {category.description}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {category.subcategories.slice(0, 3).map((sub, i) => (
                                <Badge key={i} variant="outline" className="text-[9px] font-black uppercase tracking-widest border-os-stroke/40">
                                  {sub}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
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
