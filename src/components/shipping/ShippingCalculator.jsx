/**
 * Shipping Calculator Component
 * Calculates shipping costs for different routes (air, sea, local) across Africa
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plane, Ship, Truck, MapPin, Package, Calculator, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

// African countries list
const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 'Cape Verde',
  'Central African Republic', 'Chad', 'Comoros', 'Congo', 'DR Congo', "Côte d'Ivoire", 'Djibouti',
  'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana',
  'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi',
  'Mali', 'Mauritania', 'Mauritania', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria',
  'Rwanda', 'São Tomé and Príncipe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia',
  'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
];

// Logistics partners database
const LOGISTICS_PARTNERS = {
  air: [
    { name: 'DHL Express', baseRate: 15, perKg: 8, coverage: 'Pan-African', reliability: 0.95 },
    { name: 'FedEx Africa', baseRate: 12, perKg: 7, coverage: 'Pan-African', reliability: 0.92 },
    { name: 'Aramex', baseRate: 10, perKg: 6, coverage: 'Middle East & Africa', reliability: 0.90 },
    { name: 'AfriLogistics Express', baseRate: 8, perKg: 5, coverage: 'West Africa', reliability: 0.88 }
  ],
  sea: [
    { name: 'Maersk Line', baseRate: 500, perKg: 0.5, coverage: 'Pan-African', reliability: 0.93 },
    { name: 'CMA CGM', baseRate: 450, perKg: 0.45, coverage: 'Pan-African', reliability: 0.91 },
    { name: 'MSC Africa', baseRate: 400, perKg: 0.4, coverage: 'Pan-African', reliability: 0.89 },
    { name: 'East Africa Shipping Co.', baseRate: 350, perKg: 0.35, coverage: 'East Africa', reliability: 0.87 }
  ],
  local: [
    { name: 'Pan-African Logistics', baseRate: 200, perKg: 1.5, coverage: 'Pan-African', reliability: 0.85 },
    { name: 'South African Freight', baseRate: 180, perKg: 1.2, coverage: 'Southern Africa', reliability: 0.83 },
    { name: 'West Africa Transport', baseRate: 150, perKg: 1.0, coverage: 'West Africa', reliability: 0.80 },
    { name: 'Ghana Cargo Services', baseRate: 120, perKg: 0.8, coverage: 'West Africa', reliability: 0.78 }
  ]
};

// Calculate shipping cost based on route, weight, and method
const calculateShippingCost = (method, origin, destination, weight, volume = null) => {
  const partners = LOGISTICS_PARTNERS[method] || [];
  if (partners.length === 0) return null;

  // Base distance multiplier (simplified - in production, use actual distance API)
  const getDistanceMultiplier = (origin, destination) => {
    // Same country
    if (origin === destination) return 1;
    
    // Same region (simplified)
    const regions = {
      'West': ['Nigeria', 'Ghana', 'Senegal', 'Côte d\'Ivoire', 'Mali', 'Burkina Faso'],
      'East': ['Kenya', 'Tanzania', 'Uganda', 'Ethiopia', 'Rwanda'],
      'South': ['South Africa', 'Zimbabwe', 'Zambia', 'Botswana', 'Namibia'],
      'North': ['Egypt', 'Morocco', 'Algeria', 'Tunisia']
    };
    
    // Cross-region shipping costs more
    return 1.5;
  };

  const distanceMultiplier = getDistanceMultiplier(origin, destination);
  const weightInKg = parseFloat(weight) || 1;
  
  // Calculate costs for each partner
  return partners.map(partner => {
    const baseCost = partner.baseRate * distanceMultiplier;
    const weightCost = partner.perKg * weightInKg;
    const totalCost = baseCost + weightCost;
    
    // Add volume-based cost if provided
    const volumeCost = volume ? (volume * 0.1) : 0;
    
    return {
      ...partner,
      cost: Math.round(totalCost + volumeCost),
      estimatedDays: method === 'air' ? 3 : method === 'sea' ? 21 : 7,
      currency: 'USD'
    };
  });
};

export default function ShippingCalculator({ 
  defaultOrigin = '', 
  defaultDestination = '',
  defaultWeight = '',
  onCalculate = null,
  compact = false 
}) {
  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState(defaultDestination);
  const [weight, setWeight] = useState(defaultWeight);
  const [volume, setVolume] = useState('');
  const [method, setMethod] = useState('air');
  const [results, setResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    if (!origin || !destination || !weight) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCalculating(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const calculatedResults = calculateShippingCost(method, origin, destination, weight, volume);
      setResults(calculatedResults);
      setIsCalculating(false);
      
      if (onCalculate && calculatedResults) {
        onCalculate({
          method,
          origin,
          destination,
          weight,
          volume,
          results: calculatedResults
        });
      }
      
      toast.success('Shipping costs calculated');
    }, 500);
  };

  const getMethodIcon = (m) => {
    switch (m) {
      case 'air': return Plane;
      case 'sea': return Ship;
      case 'local': return Truck;
      default: return Package;
    }
  };

  const getMethodLabel = (m) => {
    switch (m) {
      case 'air': return 'Air Freight';
      case 'sea': return 'Sea Freight';
      case 'local': return 'Road Transport';
      default: return m;
    }
  };

  if (compact) {
    return (
      <Card className="border-afrikoni-gold/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5 text-afrikoni-gold" />
            Shipping Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Origin</Label>
              <Select value={origin} onValueChange={setOrigin}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="From" />
                </SelectTrigger>
                <SelectContent>
                  {AFRICAN_COUNTRIES.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Destination</Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="To" />
                </SelectTrigger>
                <SelectContent>
                  {AFRICAN_COUNTRIES.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Weight (kg)</Label>
              <Input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="air">Air</SelectItem>
                  <SelectItem value="sea">Sea</SelectItem>
                  <SelectItem value="local">Road</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={handleCalculate} 
            className="w-full bg-afrikoni-gold hover:bg-afrikoni-gold/90"
            disabled={isCalculating}
            size="sm"
          >
            {isCalculating ? 'Calculating...' : 'Calculate'}
          </Button>
          {results && (
            <div className="pt-2 border-t">
              <p className="text-xs font-semibold mb-1">Best Option:</p>
              <div className="flex items-center justify-between">
                <span className="text-sm">{results[0]?.name}</span>
                <span className="text-sm font-bold text-afrikoni-gold">
                  ${results[0]?.cost}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-afrikoni-gold/20 shadow-premium bg-white rounded-afrikoni-lg">
      <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
        <CardTitle className="text-xl font-bold text-afrikoni-text-dark flex items-center gap-2">
          <Calculator className="w-6 h-6 text-afrikoni-gold" />
          Shipping Cost Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Origin & Destination */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="origin" className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-afrikoni-gold" />
              Origin Country
            </Label>
            <Select value={origin} onValueChange={setOrigin}>
              <SelectTrigger className="border-afrikoni-gold/30">
                <SelectValue placeholder="Select origin country" />
              </SelectTrigger>
              <SelectContent>
                {AFRICAN_COUNTRIES.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="destination" className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-afrikoni-gold" />
              Destination Country
            </Label>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger className="border-afrikoni-gold/30">
                <SelectValue placeholder="Select destination country" />
              </SelectTrigger>
              <SelectContent>
                {AFRICAN_COUNTRIES.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Weight & Volume */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="weight" className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-afrikoni-gold" />
              Weight (kg) *
            </Label>
            <Input
              id="weight"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Enter weight in kilograms"
              className="border-afrikoni-gold/30"
            />
          </div>
          <div>
            <Label htmlFor="volume" className="mb-2">Volume (m³) - Optional</Label>
            <Input
              id="volume"
              type="number"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              placeholder="Enter volume in cubic meters"
              className="border-afrikoni-gold/30"
            />
          </div>
        </div>

        {/* Shipping Method */}
        <div>
          <Label className="mb-3 block">Shipping Method</Label>
          <RadioGroup value={method} onValueChange={setMethod} className="grid grid-cols-3 gap-4">
            <div>
              <RadioGroupItem value="air" id="air" className="peer sr-only" />
              <Label
                htmlFor="air"
                className="flex flex-col items-center justify-between rounded-lg border-2 border-afrikoni-gold/30 bg-white p-4 hover:bg-afrikoni-gold/5 cursor-pointer peer-data-[state=checked]:border-afrikoni-gold peer-data-[state=checked]:bg-afrikoni-gold/10"
              >
                <Plane className="w-6 h-6 text-afrikoni-gold mb-2" />
                <span className="text-sm font-semibold">Air Freight</span>
                <span className="text-xs text-afrikoni-text-dark/70">Fast (3-7 days)</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="sea" id="sea" className="peer sr-only" />
              <Label
                htmlFor="sea"
                className="flex flex-col items-center justify-between rounded-lg border-2 border-afrikoni-gold/30 bg-white p-4 hover:bg-afrikoni-gold/5 cursor-pointer peer-data-[state=checked]:border-afrikoni-gold peer-data-[state=checked]:bg-afrikoni-gold/10"
              >
                <Ship className="w-6 h-6 text-afrikoni-gold mb-2" />
                <span className="text-sm font-semibold">Sea Freight</span>
                <span className="text-xs text-afrikoni-text-dark/70">Economical (14-30 days)</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="local" id="local" className="peer sr-only" />
              <Label
                htmlFor="local"
                className="flex flex-col items-center justify-between rounded-lg border-2 border-afrikoni-gold/30 bg-white p-4 hover:bg-afrikoni-gold/5 cursor-pointer peer-data-[state=checked]:border-afrikoni-gold peer-data-[state=checked]:bg-afrikoni-gold/10"
              >
                <Truck className="w-6 h-6 text-afrikoni-gold mb-2" />
                <span className="text-sm font-semibold">Road Transport</span>
                <span className="text-xs text-afrikoni-text-dark/70">Regional (5-14 days)</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Calculate Button */}
        <Button
          onClick={handleCalculate}
          disabled={isCalculating || !origin || !destination || !weight}
          className="w-full bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal"
          size="lg"
        >
          {isCalculating ? (
            <>
              <Calculator className="w-5 h-5 mr-2 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Calculator className="w-5 h-5 mr-2" />
              Calculate Shipping Cost
            </>
          )}
        </Button>

        {/* Results */}
        {results && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-4 border-t border-afrikoni-gold/20"
          >
            <h3 className="font-semibold text-afrikoni-text-dark flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-afrikoni-gold" />
              Shipping Options ({getMethodLabel(method)})
            </h3>
            <div className="space-y-3">
              {results.map((option, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-4 rounded-lg border-2 ${
                    idx === 0 
                      ? 'border-afrikoni-gold bg-afrikoni-gold/5' 
                      : 'border-afrikoni-gold/20 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-afrikoni-text-dark">{option.name}</h4>
                        {idx === 0 && (
                          <Badge className="bg-afrikoni-gold text-white text-xs">Best Value</Badge>
                        )}
                      </div>
                      <p className="text-xs text-afrikoni-text-dark/70">{option.coverage}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-afrikoni-gold">
                        ${option.cost}
                      </div>
                      <div className="text-xs text-afrikoni-text-dark/70">{option.currency}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-afrikoni-text-dark/70 mt-3 pt-3 border-t border-afrikoni-gold/10">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {option.estimatedDays} days
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {Math.round(option.reliability * 100)}% reliable
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="p-3 bg-afrikoni-ivory rounded-lg border border-afrikoni-gold/20">
              <p className="text-xs text-afrikoni-text-dark/70">
                💡 <strong>Note:</strong> These are estimated costs. Final pricing may vary based on customs, 
                insurance, and specific route requirements. Contact the logistics partner for exact quotes.
              </p>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

