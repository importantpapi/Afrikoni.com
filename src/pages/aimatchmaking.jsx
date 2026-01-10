import React, { useState } from 'react';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Textarea } from '@/components/shared/ui/textarea';
import { Label } from '@/components/shared/ui/label';
import { Sparkles, Building2, MapPin, Star, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { AIMatchingService } from '@/components/services/AIMatchingService';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AIMatchmaking() {
  const [requirements, setRequirements] = useState('');
  const [matches, setMatches] = useState([]);
  const [isMatching, setIsMatching] = useState(false);

  const handleFindMatches = async () => {
    if (!requirements.trim()) {
      toast.error('Please describe your requirements');
      return;
    }

    setIsMatching(true);
    try {
      const [suppliersRes, productsRes] = await Promise.all([
        supabase.from('companies').select('*').eq('role', 'seller'),
        supabase.from('products').select('*').eq('status', 'active')
      ]);

      if (suppliersRes.error) throw suppliersRes.error;
      if (productsRes.error) throw productsRes.error;

      const suppliers = Array.isArray(suppliersRes.data) ? suppliersRes.data : [];
      const products = Array.isArray(productsRes.data) ? productsRes.data : [];

      const result = await AIMatchingService.findMatchingSuppliers({
        requirements,
        suppliers,
        products
      });

      setMatches(result.matches || []);
      toast.success(`Found ${result.matches?.length || 0} matching suppliers!`);
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to find matches');
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">AI Supplier Matchmaking</h1>
          <p className="text-lg text-afrikoni-deep">Describe your needs and let AI find the perfect suppliers</p>
        </div>

        <Card className="border-afrikoni-gold/20 mb-6">
          <CardHeader>
            <CardTitle>Describe Your Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="requirements">What are you looking for?</Label>
              <Textarea
                id="requirements"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="e.g. I need 1000 units of organic coffee beans from Ethiopia, certified organic, FOB shipping, payment terms 30 days..."
                rows={6}
              />
            </div>
            <Button
              onClick={handleFindMatches}
              disabled={isMatching}
              className="bg-afrikoni-gold hover:bg-amber-700"
            >
              <Sparkles className={`w-4 h-4 mr-2 ${isMatching ? 'animate-spin' : ''}`} />
              {isMatching ? 'Finding Matches...' : 'Find Matching Suppliers'}
            </Button>
          </CardContent>
        </Card>

        {matches.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-afrikoni-chestnut mb-4">Matched Suppliers</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {Array.isArray(matches) && matches.map((match, idx) => (
                <Card key={idx} className="border-afrikoni-gold/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-zinc-100 to-zinc-200 rounded-xl flex items-center justify-center flex-shrink-0">
                        {match.supplier?.logo_url ? (
                          <img src={match.supplier.logo_url} alt={match.supplier.company_name} className="w-full h-full object-cover rounded-xl" loading="lazy" decoding="async" />
                        ) : (
                          <Building2 className="w-8 h-8 text-afrikoni-deep/70" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-afrikoni-chestnut mb-1">{match.supplier?.company_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-afrikoni-deep mb-2">
                          <MapPin className="w-3.5 h-3.5" />
                          {match.supplier?.city}, {match.supplier?.country}
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="text-sm font-semibold">{match.match_score}/100</span>
                          <span className="text-xs text-afrikoni-deep/70">Match Score</span>
                        </div>
                      </div>
                    </div>
                    {match.reason && (
                      <p className="text-sm text-afrikoni-deep mb-4">{match.reason}</p>
                    )}
                    <div className="flex items-center gap-2 mb-4">
                      {match.supplier?.verified && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                    <Link to={`/business/${match.supplier?.id}`}>
                      <Button variant="outline" className="w-full">View Business Profile</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

