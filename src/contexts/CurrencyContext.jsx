import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../api/supabaseClient';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => {
    // Get from localStorage or default to USD
    if (typeof window !== 'undefined') {
      return localStorage.getItem('afrikoni_selected_currency') || 'USD';
    }
    return 'USD';
  });

  const [exchangeRates, setExchangeRates] = useState({});
  const [ratesLoading, setRatesLoading] = useState(false);

  // Load exchange rates on mount and when currency changes
  useEffect(() => {
    loadExchangeRates();
    // Refresh rates every hour
    const interval = setInterval(loadExchangeRates, 3600000);
    return () => clearInterval(interval);
  }, []);

  const loadExchangeRates = async () => {
    setRatesLoading(true);
    try {
      // Fetch from Supabase exchange_rates table which contains the "locked" rates with 3% buffer
      // If rates are expired, we trust the background process (GAS) will update them,
      // but we always use the latest "locked" rate from the table.
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('currency_code, final_rate');

      if (error) throw error;

      if (data && data.length > 0) {
        const rates = {};
        data.forEach(item => {
          rates[item.currency_code] = item.final_rate;
        });
        // Ensure USD is ALWAYS 1
        rates['USD'] = 1;
        setExchangeRates(rates);
      } else {
        // Fallback to approximate rates if table is empty
        console.warn('No exchange rates found in Supabase, using approximate rates');
        setExchangeRates(getApproximateRates());
      }
    } catch (error) {
      console.warn('Failed to load exchange rates from Supabase, using approximate rates:', error);
      setExchangeRates(getApproximateRates());
    } finally {
      setRatesLoading(false);
    }
  };

  // Approximate exchange rates (fallback)
  const getApproximateRates = () => {
    return {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      NGN: 1550,
      GHS: 13.5,
      KES: 130,
      ZAR: 18.5,
      EGP: 48,
      MAD: 10,
      XOF: 600,
      TZS: 2500,
      ETB: 55,
      AOA: 850,
      XAF: 600,
      UGX: 3700,
      DZD: 135,
      SDG: 600,
      MZN: 64,
      MGA: 4500,
      RWF: 1300,
      GNF: 8600,
      ZWL: 1500,
      ZMW: 25,
      MWK: 1700,
      BWP: 13.5,
      GMD: 67,
      LRD: 190,
      SLL: 22000,
      MRU: 40,
      NAD: 18.5,
      LSL: 18.5,
      ERN: 15,
      DJF: 178,
      SSP: 600,
      CDF: 2800,
      STN: 22,
      SCR: 13.5,
      CVE: 101,
      KMF: 450,
      MUR: 45,
      SOS: 570,
      BIF: 2900,
      SZL: 18.5,
      LYD: 4.8,
      TND: 3.1,
      CAD: 1.35,
      BRL: 5.0,
      CNY: 7.2,
      INR: 83,
      AED: 3.67,
      SAR: 3.75
    };
  };

  const setCurrency = (newCurrency) => {
    setCurrencyState(newCurrency);
    if (typeof window !== 'undefined') {
      localStorage.setItem('afrikoni_selected_currency', newCurrency);
    }
  };

  // Convert price from one currency to another
  const convertPrice = (amount, fromCurrency = 'USD', toCurrency = currency) => {
    if (!amount || amount === 0) return 0;
    if (fromCurrency === toCurrency) return amount;

    // Convert to USD first if needed
    let amountInUSD = amount;
    if (fromCurrency !== 'USD') {
      const fromRate = exchangeRates[fromCurrency] || 1;
      amountInUSD = amount / fromRate;
    }

    // Convert from USD to target currency
    if (toCurrency === 'USD') {
      return amountInUSD;
    }

    const toRate = exchangeRates[toCurrency] || 1;
    return amountInUSD * toRate;
  };

  // Format price with currency symbol
  const formatPrice = (amount, fromCurrency = 'USD', showSymbol = true) => {
    if (amount === null || amount === undefined) return 'Price on request';

    const convertedAmount = convertPrice(amount, fromCurrency, currency);
    const formatted = convertedAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    if (!showSymbol) return formatted;

    const symbol = getCurrencySymbol(currency);
    return `${symbol}${formatted}`;
  };

  // Get currency symbol
  const getCurrencySymbol = (curr = currency) => {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      NGN: '₦',
      GHS: '₵',
      KES: 'KSh',
      ZAR: 'R',
      EGP: 'E£',
      MAD: 'DH',
      XOF: 'CFA',
      TZS: 'TSh',
      ETB: 'Br',
      AOA: 'Kz',
      XAF: 'FCFA',
      UGX: 'USh',
      DZD: 'DA',
      SDG: 'SDG',
      MZN: 'MT',
      MGA: 'Ar',
      RWF: 'RF',
      GNF: 'FG',
      ZWL: 'Z$',
      ZMW: 'ZK',
      MWK: 'MK',
      BWP: 'P',
      GMD: 'D',
      LRD: '$',
      SLL: 'Le',
      MRU: 'UM',
      NAD: 'N$',
      LSL: 'L',
      ERN: 'Nfk',
      DJF: 'Fdj',
      SSP: 'SSP',
      CDF: 'FC',
      STN: 'Db',
      SCR: 'SR',
      CVE: '$',
      KMF: 'CF',
      MUR: 'Rs',
      SOS: 'Sh',
      BIF: 'FBu',
      SZL: 'L',
      LYD: 'LD',
      TND: 'DT',
      CAD: 'C$',
      BRL: 'R$',
      CNY: '¥',
      INR: '₹',
      AED: 'AED',
      SAR: 'SR'
    };
    return symbols[curr] || curr;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        convertPrice,
        formatPrice,
        getCurrencySymbol,
        exchangeRates,
        ratesLoading
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Fallback if not wrapped in provider
    return {
      currency: 'USD',
      setCurrency: () => { },
      convertPrice: (amount) => amount,
      formatPrice: (amount) => `$${amount?.toLocaleString() || '0.00'}`,
      getCurrencySymbol: () => '$',
      exchangeRates: {},
      ratesLoading: false
    };
  }
  return context;
}

