import React, { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Textarea } from '@/components/shared/ui/textarea';
import { Label } from '@/components/shared/ui/label';
import { Sparkles, Building, MapPin, Star, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { AIMatchingService } from '@/components/services/AIMatchingService';
import { Link } from 'react-router-dom';


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
    setMatches([]); // Clear previous matches to show "thinking" state if needed

    try {
      // ✅ SCALABLE ARCHITECTURE: Delegated to server-side RPC via Service
      const result = await AIMatchingService.findMatchingSuppliers({
        requirements
      });

      setMatches(result.matches || []);

      if (result.matches?.length > 0) {
        toast.success(`Found ${result.matches.length} verified suppliers!`);
      } else {
        toast.info('No matching suppliers found yet. Try simpler keywords.');
      }
    } catch (error) {
      console.error('Matchmaking Error:', error);
      toast.error('Unable to connect to Trade Intelligence Engine.');
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-afrikoni-chestnut">Smart Supplier Matching</h1>
            <div className="group relative">
              <Shield className="w-5 h-5 text-os-accent cursor-help" />
              <div className="absolute left-full ml-3 top-0 w-64 p-3 bg-white shadow-xl rounded-lg border border-os-stroke opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-os-xs leading-relaxed">
                <p className="font-bold mb-1">How it works:</p>
                Our "Smart Matching" algorithm uses historical trade data, verification status, and fulfillment reliability scores to connect you with the most compatible African suppliers.
              </div>
            </div>
          </div>
          <p className="text-os-lg text-afrikoni-deep">Direct sourcing from verified African industries, powered by smart trade analytics.</p>
        </div>

        <Card className="border-os-accent/20 mb-6">
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
              className="bg-os-accent hover:bg-amber-700"
            >
              <Sparkles className={`w-4 h-4 mr-2 ${isMatching ? 'animate-spin' : ''}`} />
              {isMatching ? 'Finding Matches...' : 'Find Matching Suppliers'}
            </Button>
          </CardContent>
        </Card>

        {matches.length > 0 && (
          <div>
            <h2 className="text-os-2xl font-bold text-afrikoni-chestnut mb-4">Matched Suppliers</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {Array.isArray(matches) && matches.map((match, idx) => (
                <Card key={idx} className="border-os-accent/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-zinc-100 to-zinc-200 rounded-os-sm flex items-center justify-center flex-shrink-0">
                        {match.supplier?.logo_url ? (
                          <img src={match.supplier.logo_url} alt={match.supplier.company_name} className="w-full h-full object-cover rounded-os-sm" loading="lazy" decoding="async" />
                        ) : (
                          <Building className="w-8 h-8 text-afrikoni-deep/70" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-afrikoni-chestnut mb-1">{match.supplier?.company_name}</h3>
                        <div className="flex items-center gap-2 text-os-sm text-afrikoni-deep mb-2">
                          <MapPin className="w-3.5 h-3.5" />
                          {match.supplier?.city}, {match.supplier?.country}
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="text-os-sm font-semibold">{match.match_score}/100</span>
                          <span className="text-os-xs text-afrikoni-deep/70">Match Score</span>
                        </div>
                      </div>
                    </div>
                    {match.reason && (
                      <p className="text-os-sm text-afrikoni-deep mb-4">{match.reason}</p>
                    )}
                    <div className="flex items-center gap-2 mb-4">
                      {match.supplier?.verified && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-os-xs rounded flex items-center gap-1">
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

