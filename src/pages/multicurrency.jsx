import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Input } from '@/components/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Button } from '@/components/shared/ui/button';

export default function MultiCurrency() {
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('NGN');
  const [convertedAmount, setConvertedAmount] = useState('');

  // Static fallback rates — live rates are served by CurrencyContext/sync-fx-rates Edge Function
  const exchangeRates = {
    USD: { NGN: 1550, ZAR: 18.5, KES: 130, GHS: 13.5, EGP: 48 },
    NGN: { USD: 0.000645, ZAR: 0.012, KES: 0.084, GHS: 0.0087, EGP: 0.031 },
    ZAR: { USD: 0.054, NGN: 83.8, KES: 7.2, GHS: 0.73, EGP: 2.59 },
    KES: { USD: 0.0077, NGN: 11.9, ZAR: 0.139, GHS: 0.104, EGP: 0.37 },
    GHS: { USD: 0.074, NGN: 114.8, ZAR: 1.37, KES: 9.63, EGP: 3.56 },
    EGP: { USD: 0.021, NGN: 32.3, ZAR: 0.386, KES: 2.71, GHS: 0.281 }
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
        <Card className="border-os-accent/20">
          <CardHeader>
            <CardTitle className="text-3xl">Currency Converter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-os-sm font-medium text-afrikoni-deep mb-2 block">From</label>
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
                <label className="text-os-sm font-medium text-afrikoni-deep mb-2 block">To</label>
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
              <label className="text-os-sm font-medium text-afrikoni-deep mb-2 block">Amount</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <Button onClick={handleConvert} className="w-full bg-os-accent hover:bg-amber-700">
              Convert
            </Button>
            {convertedAmount && (
              <div className="p-4 bg-amber-50 rounded-lg">
                <div className="text-os-sm text-afrikoni-deep mb-1">Converted Amount</div>
                <div className="text-os-2xl font-bold text-amber-600">
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

