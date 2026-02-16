import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/api/supabaseClient';

export default function SearchSuggestions({ 
  query, 
  onSelectSuggestion, 
  showHistory = true,
  showTrending = true 
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [trending, setTrending] = useState([]);
  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2) {
      loadSuggestions(debouncedQuery);
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    if (showHistory) loadHistory();
    if (showTrending) loadTrending();
  }, [showHistory, showTrending]);

  const loadSuggestions = async (searchQuery) => {
    setIsLoading(true);
    try {
      // ✅ KERNEL-SCHEMA ALIGNMENT: Use 'name' instead of 'title' (DB schema uses 'name')
      // Search products
      const { data: products } = await supabase
        .from('products')
        .select('name, id')
        .ilike('name', `%${searchQuery}%`)
        .eq('status', 'active')
        .limit(5);

      // Search categories
      const { data: categories } = await supabase
        .from('categories')
        .select('name, id')
        .ilike('name', `%${searchQuery}%`)
        .limit(3);

      // Search companies
      const { data: companies } = await supabase
        .from('companies')
        .select('company_name, id')
        .ilike('company_name', `%${searchQuery}%`)
        .eq('verified', true)
        .limit(3);

      // ✅ KERNEL-SCHEMA ALIGNMENT: Use 'name' instead of 'title' (DB schema uses 'name')
      const combined = [
        ...(products || []).map(p => ({ type: 'product', text: p.name || p.title, id: p.id })),
        ...(categories || []).map(c => ({ type: 'category', text: c.name, id: c.id })),
        ...(companies || []).map(c => ({ type: 'company', text: c.company_name, id: c.id })),
      ].slice(0, 8);

      setSuggestions(combined);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem('afrikoni_search_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        setHistory(parsed.slice(0, 5));
      }
    } catch (error) {
      // Silently fail
    }
  };

  const loadTrending = () => {
    // Mock trending - in production, use analytics
    setTrending([
      { query: 'coffee beans', count: 245 },
      { query: 'cocoa powder', count: 189 },
      { query: 'shea butter', count: 156 },
    ]);
  };

  if (!query && !showHistory && !showTrending) {
    return null;
  }

  const hasContent = suggestions.length > 0 || (showHistory && history.length > 0) || (showTrending && trending.length > 0);

  if (!hasContent && !isLoading) {
    return null;
  }

  return (
    <AnimatePresence>
      {hasContent && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="w-full"
          style={{ position: 'relative', zIndex: 9000 }}
        >
          <Card className="border-os-accent/20 bg-white shadow-os-md-lg rounded-os-md" style={{ position: 'relative', zIndex: 9000 }}>
            <CardContent className="p-4">
              {/* Search Suggestions */}
              {suggestions.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="w-4 h-4 text-os-accent" />
                    <span className="text-os-xs font-semibold text-afrikoni-text-dark/70 uppercase">
                      Suggestions
                    </span>
                  </div>
                  <div className="space-y-1">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSelectSuggestion(suggestion.text, suggestion.type, suggestion.id)}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-os-accent/5 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-afrikoni-deep/50 group-hover:text-os-accent" />
                          <span className="text-os-sm text-afrikoni-text-dark">{suggestion.text}</span>
                          <Badge variant="outline" className="text-os-xs">
                            {suggestion.type}
                          </Badge>
                        </div>
                        <ArrowRight className="w-4 h-4 text-afrikoni-deep/30 group-hover:text-os-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Searches */}
              {showHistory && history.length > 0 && !query && (
                <div className="mb-4 border-t border-os-accent/10 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-os-accent" />
                    <span className="text-os-xs font-semibold text-afrikoni-text-dark/70 uppercase">
                      Recent
                    </span>
                  </div>
                  <div className="space-y-1">
                    {history.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSelectSuggestion(item.query)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-os-accent/5 transition-colors text-left"
                      >
                        <Clock className="w-4 h-4 text-afrikoni-deep/50" />
                        <span className="text-os-sm text-afrikoni-text-dark">{item.query}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Searches */}
              {showTrending && trending.length > 0 && !query && (
                <div className="border-t border-os-accent/10 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-os-accent" />
                    <span className="text-os-xs font-semibold text-afrikoni-text-dark/70 uppercase">
                      Trending
                    </span>
                  </div>
                  <div className="space-y-1">
                    {trending.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSelectSuggestion(item.query)}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-os-accent/5 transition-colors text-left"
                      >
                        <span className="text-os-sm text-afrikoni-text-dark">{item.query}</span>
                        <Badge variant="outline" className="text-os-xs">
                          {item.count}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-os-accent mx-auto" />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

