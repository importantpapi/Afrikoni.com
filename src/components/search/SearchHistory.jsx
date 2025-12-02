import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, TrendingUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const MAX_HISTORY_ITEMS = 10;
const STORAGE_KEY = 'afrikoni_search_history';

export default function SearchHistory({ onSelectSearch, onClearHistory }) {
  const [history, setHistory] = useState([]);
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    loadHistory();
    loadTrending();
  }, []);

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setHistory(parsed.slice(0, MAX_HISTORY_ITEMS));
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  const loadTrending = async () => {
    // Mock trending searches - in production, this would come from analytics
    const mockTrending = [
      { query: 'coffee beans', count: 245 },
      { query: 'cocoa powder', count: 189 },
      { query: 'shea butter', count: 156 },
      { query: 'palm oil', count: 134 },
      { query: 'cashew nuts', count: 112 },
    ];
    setTrending(mockTrending);
  };

  const addToHistory = (query) => {
    if (!query || !query.trim()) return;

    const trimmedQuery = query.trim().toLowerCase();
    const updated = [
      { query: trimmedQuery, timestamp: new Date().toISOString() },
      ...history.filter(item => item.query !== trimmedQuery)
    ].slice(0, MAX_HISTORY_ITEMS);

    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const removeFromHistory = (query) => {
    const updated = history.filter(item => item.query !== query);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
    if (onClearHistory) onClearHistory();
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (history.length === 0 && trending.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Recent Searches */}
      {history.length > 0 && (
        <Card className="border-afrikoni-gold/20 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-afrikoni-gold" />
                <h3 className="font-semibold text-afrikoni-text-dark">Recent Searches</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-xs text-afrikoni-deep/70 hover:text-afrikoni-deep"
              >
                Clear
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {history.map((item, idx) => (
                  <motion.div
                    key={item.query}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-afrikoni-gold/10 hover:border-afrikoni-gold pr-1"
                      onClick={() => onSelectSearch(item.query)}
                    >
                      <Search className="w-3 h-3 mr-1" />
                      {item.query}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(item.query);
                        }}
                        className="ml-1 hover:bg-afrikoni-gold/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trending Searches */}
      {trending.length > 0 && (
        <Card className="border-afrikoni-gold/20 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-afrikoni-gold" />
              <h3 className="font-semibold text-afrikoni-text-dark">Trending Searches</h3>
            </div>
            <div className="space-y-2">
              {trending.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectSearch(item.query)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-afrikoni-gold/5 transition-colors text-left"
                >
                  <span className="text-sm text-afrikoni-text-dark">{item.query}</span>
                  <Badge variant="outline" className="text-xs">
                    {item.count}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Export function to add to history from outside
export const addSearchToHistory = (query) => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const history = saved ? JSON.parse(saved) : [];
    const trimmedQuery = query.trim().toLowerCase();
    
    const updated = [
      { query: trimmedQuery, timestamp: new Date().toISOString() },
      ...history.filter(item => item.query !== trimmedQuery)
    ].slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save search history:', error);
  }
};

