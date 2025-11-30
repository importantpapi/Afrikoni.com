import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';
import SEO from '@/components/SEO';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      // Error logged (removed for production)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Product Categories - Browse by Category"
        description="Browse products by category. Find exactly what you're looking for across all product categories on AFRIKONI."
        url="/categories"
      />
      <div className="min-h-screen bg-stone-50">
      <div className="bg-afrikoni-offwhite border-b border-afrikoni-gold/20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-5xl font-bold text-afrikoni-chestnut mb-4">Browse by Category</h1>
          <p className="text-xl text-afrikoni-deep">Discover products across all major industries</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-afrikoni-cream" />
                <CardContent className="p-6 space-y-2">
                  <div className="h-4 bg-afrikoni-cream rounded" />
                  <div className="h-4 bg-afrikoni-cream rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link key={category.id} to={createPageUrl('Products') + '?category=' + category.id} className="group">
                <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold transition-all duration-300 hover:shadow-xl overflow-hidden h-full">
                  <CardContent className="p-0">
                    {category.image_url ? (
                      <div className="h-48 bg-gradient-to-br from-zinc-100 to-zinc-200 overflow-hidden">
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
                        <Package className="w-20 h-20 text-amber-600" />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-afrikoni-chestnut group-hover:text-amber-600 transition mb-2">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-afrikoni-deep line-clamp-2">{category.description}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
        {!isLoading && categories.length === 0 && (
          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-afrikoni-deep/70 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">No categories yet</h3>
              <p className="text-afrikoni-deep">Categories will appear here once they are added</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </>
  );
}

