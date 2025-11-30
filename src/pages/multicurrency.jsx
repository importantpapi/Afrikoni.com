import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function MultiCurrency() {
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('NGN');
  const [convertedAmount, setConvertedAmount] = useState('');

  // Hardcoded exchange rates (in production, use a real API)
  const exchangeRates = {
    USD: { NGN: 1500, ZAR: 18, KES: 150, GHS: 12, EGP: 30 },
    NGN: { USD: 0.00067, ZAR: 0.012, KES: 0.1, GHS: 0.008, EGP: 0.02 },
    ZAR: { USD: 0.056, NGN: 83, KES: 8.3, GHS: 0.67, EGP: 1.67 },
    KES: { USD: 0.0067, NGN: 10, ZAR: 0.12, GHS: 0.08, EGP: 0.2 },
    GHS: { USD: 0.083, NGN: 125, ZAR: 1.5, KES: 12.5, EGP: 2.5 },
    EGP: { USD: 0.033, NGN: 50, ZAR: 0.6, KES: 5, GHS: 0.4 }
  };

  const handleConvert = () => {
    if (!amount || isNaN(amount)) {
      setConvertedAmount('');
      return;
    }

    const rate = exchangeRates[fromCurrency]?.[toCurrency] || 1;
    const result = parseFloat(amount) * rate;
    setConvertedAmount(result.toFixed(2));
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="border-afrikoni-gold/20">
          <CardHeader>
            <CardTitle className="text-3xl">Currency Converter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-afrikoni-deep mb-2 block">From</label>
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                    <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                    <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                    <SelectItem value="GHS">GHS - Ghanaian Cedi</SelectItem>
                    <SelectItem value="EGP">EGP - Egyptian Pound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-afrikoni-deep mb-2 block">To</label>
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                    <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                    <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                    <SelectItem value="GHS">GHS - Ghanaian Cedi</SelectItem>
                    <SelectItem value="EGP">EGP - Egyptian Pound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-afrikoni-deep mb-2 block">Amount</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <Button onClick={handleConvert} className="w-full bg-afrikoni-gold hover:bg-amber-700">
              Convert
            </Button>
            {convertedAmount && (
              <div className="p-4 bg-amber-50 rounded-lg">
                <div className="text-sm text-afrikoni-deep mb-1">Converted Amount</div>
                <div className="text-2xl font-bold text-amber-600">
                  {convertedAmount} {toCurrency}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

