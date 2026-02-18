# 🚀 AFRIKONI – GOOGLE CLOUD TRADE-OS UPGRADE
## "Fix-it-Now" Master Implementation Plan (Demo → Trade-OS Grade)

**Date**: February 17, 2026  
**Implementation Type**: Production-Ready Build  
**Target**: Upgrade from 3.1/10 to 8.5/10 Trade-OS Score  
**Backbone**: Google Cloud Platform + Google Apps Script

---

## 📊 EXECUTIVE SUMMARY

**Current State**: Demo-Grade (3.1/10)
- ❌ Hardcoded FX rates (6 months old)
- ❌ 60% English-only core features
- ❌ No geo-driven business logic
- ❌ No payment integration

**Target State**: Trade-OS Grade (8.5/10)
- ✅ Real-time FX with 3% buffer + 24h lock
- ✅ Auto-translated FR/PT/AR (Google Cloud Translation)
- ✅ Geo-intelligent compliance (Maps API)
- ✅ SEO-optimized (Rich Snippets + hreflang)

**Implementation Timeline**: 4 weeks  
**Cost**: $0-$300/month (Google Cloud Free Tier + Pay-as-you-go)  
**Developer Effort**: 1 full-stack engineer

---

## 🎯 TASK 1: THE "FREE" GOOGLE FX ENGINE

### Overview
Replace hardcoded FX rates with real-time Google Finance data via Google Apps Script Web App.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE FX ENGINE FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Google Sheets (54 African currencies)                      │
│     └─ =GOOGLEFINANCE("CURRENCY:USDNGN") → 1,850              │
│     └─ =GOOGLEFINANCE("CURRENCY:USDKES") → 130                │
│     └─ Updates every 20 minutes (Google Finance refresh)       │
│                                                                 │
│  2. Google Apps Script (Web App API)                           │
│     └─ Reads Sheet data                                        │
│     └─ Adds 3% volatility buffer                               │
│     └─ Returns JSON: { "NGN": 1905.5, "KES": 133.9, ... }     │
│                                                                 │
│  3. Supabase Edge Function (Cron Job)                          │
│     └─ Fetches from Apps Script every hour                     │
│     └─ Locks rates in exchange_rates table (valid 24h)         │
│                                                                 │
│  4. Frontend (CurrencyContext.jsx)                             │
│     └─ Reads locked rates from Supabase                        │
│     └─ Shows "Rate locked until 18:30 WAT" in UI               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 1.1: Create Google Sheets FX Database

**File**: `Afrikoni_FX_Rates` (Google Sheets)

**Structure**:
```
| Currency Code | Base (USD=1) | Formula                           | Buffer Rate (3%) | Last Updated        |
|---------------|--------------|-----------------------------------|------------------|---------------------|
| NGN           | 1850         | =GOOGLEFINANCE("CURRENCY:USDNGN") | 1905.5          | =NOW()              |
| GHS           | 12.5         | =GOOGLEFINANCE("CURRENCY:USDGHS") | 12.875          | =NOW()              |
| KES           | 130          | =GOOGLEFINANCE("CURRENCY:USDKES") | 133.9           | =NOW()              |
| ZAR           | 18.5         | =GOOGLEFINANCE("CURRENCY:USDZAR") | 19.055          | =NOW()              |
| EGP           | 48           | =GOOGLEFINANCE("CURRENCY:USDEGP") | 49.44           | =NOW()              |
| XOF           | 600          | =GOOGLEFINANCE("CURRENCY:USDXOF") | 618             | =NOW()              |
| XAF           | 600          | =GOOGLEFINANCE("CURRENCY:USDXAF") | 618             | =NOW()              |
| MAD           | 10           | =GOOGLEFINANCE("CURRENCY:USDMAD") | 10.3            | =NOW()              |
| TZS           | 2500         | =GOOGLEFINANCE("CURRENCY:USDTZS") | 2575            | =NOW()              |
| UGX           | 3700         | =GOOGLEFINANCE("CURRENCY:USDUGX") | 3811            | =NOW()              |
| ETB           | 55           | =GOOGLEFINANCE("CURRENCY:USDETB") | 56.65           | =NOW()              |
| RWF           | 1300         | =GOOGLEFINANCE("CURRENCY:USDRWF") | 1339            | =NOW()              |
| ZMW           | 25           | =GOOGLEFINANCE("CURRENCY:USDZMW") | 25.75           | =NOW()              |
| BWP           | 13.5         | =GOOGLEFINANCE("CURRENCY:USDBWP") | 13.905          | =NOW()              |
| MZN           | 64           | =GOOGLEFINANCE("CURRENCY:USDMZN") | 65.92           | =NOW()              |
| AOA           | 850          | =GOOGLEFINANCE("CURRENCY:USDAOA") | 875.5           | =NOW()              |
| ... (40+ more currencies)                                                                            |
```

**Formula for Buffer Rate (Column D)**:
```
=C2 * 1.03
```

**Setup Instructions**:
1. Create new Google Sheet: https://sheets.google.com
2. Name it: `Afrikoni_FX_Rates`
3. Copy structure above
4. Set update frequency: **Every 20 minutes** (Google Finance auto-refresh)
5. Share → Anyone with link → Viewer

---

### Step 1.2: Google Apps Script Web App

**File**: `fxRatesAPI.gs` (Apps Script)

```javascript
/**
 * AFRIKONI FX ENGINE - GOOGLE APPS SCRIPT WEB APP
 * Provides real-time FX rates with 3% volatility buffer
 * Updates: Every 20 minutes (Google Finance refresh rate)
 */

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  
  // Read all currency data (starting from row 2, skip header)
  const data = sheet.getRange('A2:E100').getValues();
  
  const rates = {};
  const metadata = {
    lastUpdated: new Date().toISOString(),
    bufferPercentage: 3,
    source: 'Google Finance',
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h lock
  };
  
  data.forEach(row => {
    const [currencyCode, baseRate, googleRate, bufferRate, lastUpdated] = row;
    
    // Skip empty rows
    if (!currencyCode) return;
    
    rates[currencyCode] = {
      base: parseFloat(baseRate) || 0,
      buffered: parseFloat(bufferRate) || 0,
      raw: parseFloat(googleRate) || 0,
      lastUpdated: lastUpdated ? lastUpdated.toISOString() : metadata.lastUpdated
    };
  });
  
  const response = {
    success: true,
    metadata,
    rates
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function (run manually to verify)
 */
function testAPI() {
  const result = doGet({});
  Logger.log(result.getContent());
}

/**
 * CORS Handler (if needed for direct frontend calls)
 */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}
```

**Deployment Steps**:

1. **Open Apps Script Editor**:
   - In Google Sheets: `Extensions → Apps Script`

2. **Paste Code Above**:
   - Replace `Code.gs` content

3. **Test Locally**:
   ```
   Run → testAPI
   Check Logs → Should see JSON with all rates
   ```

4. **Deploy as Web App**:
   ```
   Deploy → New deployment
   Type: Web app
   Execute as: Me
   Who has access: Anyone
   Deploy
   ```

5. **Copy Web App URL**:
   ```
   https://script.google.com/macros/s/AKfycbz.../exec
   ```

6. **Save URL** → Will use in Supabase Edge Function

---

### Step 1.3: Supabase Database Schema (Exchange Rates Table)

**File**: `supabase/migrations/20260217_exchange_rates_table.sql`

```sql
-- ============================================================================
-- Afrikoni FX Engine - Exchange Rates Table
-- Purpose: Store locked FX rates with 24-hour validity
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Currency info
  currency_code varchar(3) NOT NULL UNIQUE, -- NGN, GHS, KES, etc.
  base_rate numeric(15,8) NOT NULL, -- Raw Google Finance rate
  buffered_rate numeric(15,8) NOT NULL, -- Rate with 3% buffer
  
  -- Metadata
  buffer_percentage numeric(5,2) DEFAULT 3.00,
  source varchar(50) DEFAULT 'Google Finance',
  
  -- Locking mechanism (24-hour validity)
  locked_at timestamp NOT NULL DEFAULT now(),
  valid_until timestamp NOT NULL DEFAULT (now() + interval '24 hours'),
  
  -- Audit trail
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_exchange_rates_currency ON public.exchange_rates(currency_code);
CREATE INDEX idx_exchange_rates_valid ON public.exchange_rates(valid_until);

-- Function to check if rate is still valid
CREATE OR REPLACE FUNCTION is_rate_valid(currency varchar(3))
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.exchange_rates
    WHERE currency_code = currency
    AND valid_until > now()
  );
END;
$$;

-- Function to auto-update timestamp on row change
CREATE OR REPLACE FUNCTION update_exchange_rates_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_exchange_rates_timestamp
BEFORE UPDATE ON public.exchange_rates
FOR EACH ROW
EXECUTE FUNCTION update_exchange_rates_timestamp();

-- Enable RLS (if needed)
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read rates (public data)
CREATE POLICY "Anyone can view exchange rates"
  ON public.exchange_rates FOR SELECT
  USING (true);

-- Policy: Only service role can update rates (backend only)
CREATE POLICY "Service role can update rates"
  ON public.exchange_rates FOR ALL
  USING (auth.role() = 'service_role');
```

**Apply Migration**:
```bash
cd supabase/migrations
psql $DATABASE_URL -f 20260217_exchange_rates_table.sql
```

---

### Step 1.4: Supabase Edge Function (FX Sync)

**File**: `supabase/functions/sync-fx-rates/index.ts`

```typescript
/**
 * AFRIKONI FX SYNC - SUPABASE EDGE FUNCTION
 * Fetches rates from Google Apps Script and stores in database
 * Trigger: Cron job (every hour) OR manual API call
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GOOGLE_FX_API = Deno.env.get('GOOGLE_FX_API_URL'); // Apps Script URL
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface FXRate {
  base: number;
  buffered: number;
  raw: number;
  lastUpdated: string;
}

interface GoogleFXResponse {
  success: boolean;
  metadata: {
    lastUpdated: string;
    bufferPercentage: number;
    source: string;
    validUntil: string;
  };
  rates: Record<string, FXRate>;
}

serve(async (req) => {
  try {
    // 1. Fetch rates from Google Apps Script
    console.log('Fetching FX rates from Google...');
    const googleResponse = await fetch(GOOGLE_FX_API || '');
    
    if (!googleResponse.ok) {
      throw new Error(`Google API error: ${googleResponse.statusText}`);
    }
    
    const data: GoogleFXResponse = await googleResponse.json();
    
    if (!data.success) {
      throw new Error('Google FX API returned unsuccessful response');
    }
    
    // 2. Initialize Supabase client (service role for write access)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // 3. Upsert rates into database
    const upsertPromises = Object.entries(data.rates).map(([currencyCode, rate]) => {
      return supabase
        .from('exchange_rates')
        .upsert({
          currency_code: currencyCode,
          base_rate: rate.raw,
          buffered_rate: rate.buffered,
          buffer_percentage: data.metadata.bufferPercentage,
          source: data.metadata.source,
          locked_at: new Date().toISOString(),
          valid_until: data.metadata.validUntil
        }, {
          onConflict: 'currency_code'
        });
    });
    
    const results = await Promise.all(upsertPromises);
    
    // 4. Count successes/failures
    const successCount = results.filter(r => !r.error).length;
    const failureCount = results.filter(r => r.error).length;
    
    console.log(`FX Sync Complete: ${successCount} success, ${failureCount} failed`);
    
    // 5. Return response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'FX rates synced successfully',
        stats: {
          totalCurrencies: Object.keys(data.rates).length,
          successfulUpdates: successCount,
          failedUpdates: failureCount,
          lastUpdated: data.metadata.lastUpdated,
          validUntil: data.metadata.validUntil
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('FX Sync Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
```

**Deno Config**: `supabase/functions/sync-fx-rates/deno.json`

```json
{
  "importMap": "../import_map.json"
}
```

**Deploy Edge Function**:
```bash
supabase functions deploy sync-fx-rates --no-verify-jwt
```

**Set Environment Variables**:
```bash
supabase secrets set GOOGLE_FX_API_URL="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
```

**Setup Cron Job** (Run every hour):

```sql
-- In Supabase Dashboard → Database → Extensions
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule FX sync every hour
SELECT cron.schedule(
  'hourly-fx-sync',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-fx-rates',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

---

### Step 1.5: Frontend Integration (CurrencyContext.jsx)

**File**: `src/contexts/CurrencyContext.jsx`

Replace the existing `loadExchangeRates` function:

```javascript
import { supabase } from '@/api/supabaseClient';

// ... existing code ...

const loadExchangeRates = async () => {
  setRatesLoading(true);
  try {
    // 1. Fetch locked rates from Supabase
    const { data: rates, error } = await supabase
      .from('exchange_rates')
      .select('currency_code, buffered_rate, valid_until')
      .gt('valid_until', new Date().toISOString()); // Only get valid rates
    
    if (error) {
      console.error('Failed to load FX rates from database:', error);
      // Fallback to approximate rates
      setExchangeRates(getApproximateRates());
      setRatesLoading(false);
      return;
    }
    
    // 2. Convert to { NGN: 1905.5, GHS: 12.875, ... } format
    const ratesMap = {};
    let earliestExpiry = null;
    
    rates.forEach(rate => {
      ratesMap[rate.currency_code] = rate.buffered_rate;
      
      // Track earliest expiry for UI message
      const expiry = new Date(rate.valid_until);
      if (!earliestExpiry || expiry < earliestExpiry) {
        earliestExpiry = expiry;
      }
    });
    
    // 3. Add USD base rate (always 1)
    ratesMap['USD'] = 1;
    
    setExchangeRates(ratesMap);
    
    // 4. Store rate validity for UI message
    if (earliestExpiry) {
      localStorage.setItem('afrikoni_fx_valid_until', earliestExpiry.toISOString());
    }
    
    console.log(`✅ FX rates loaded: ${Object.keys(ratesMap).length} currencies`);
    
  } catch (error) {
    console.error('Failed to load exchange rates:', error);
    setExchangeRates(getApproximateRates());
  } finally {
    setRatesLoading(false);
  }
};

// Add function to show rate validity in UI
const getRateValidityMessage = () => {
  const validUntil = localStorage.getItem('afrikoni_fx_valid_until');
  if (!validUntil) return null;
  
  const expiryDate = new Date(validUntil);
  const now = new Date();
  
  if (expiryDate <= now) {
    return 'FX rates expired - refreshing...';
  }
  
  const hoursRemaining = Math.floor((expiryDate - now) / (1000 * 60 * 60));
  const minutesRemaining = Math.floor(((expiryDate - now) % (1000 * 60 * 60)) / (1000 * 60));
  
  return `Rate locked for ${hoursRemaining}h ${minutesRemaining}m`;
};

// Export new function
export { getRateValidityMessage };
```

---

### Step 1.6: UI Component (Rate Lock Badge)

**File**: `src/components/shared/FXRateLockBadge.jsx`

```javascript
import React from 'react';
import { Clock } from 'lucide-react';
import { getRateValidityMessage } from '@/contexts/CurrencyContext';

export function FXRateLockBadge({ className = '' }) {
  const [validityMessage, setValidityMessage] = React.useState(null);
  
  React.useEffect(() => {
    // Update every minute
    const updateMessage = () => {
      setValidityMessage(getRateValidityMessage());
    };
    
    updateMessage();
    const interval = setInterval(updateMessage, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (!validityMessage) return null;
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium ${className}`}>
      <Clock className="w-3.5 h-3.5" />
      <span>{validityMessage}</span>
    </div>
  );
}
```

**Usage** (Add to product cards, checkout pages):

```javascript
import { FXRateLockBadge } from '@/components/shared/FXRateLockBadge';

// In product card:
<div className="price-section">
  <span className="text-2xl font-bold">{formatPrice(product.price_min, product.currency)}</span>
  <FXRateLockBadge />
</div>
```

---

### ✅ TASK 1 VERIFICATION CHECKLIST

- [ ] Google Sheet created with GOOGLEFINANCE formulas
- [ ] Apps Script deployed as Web App (URL copied)
- [ ] Supabase `exchange_rates` table created
- [ ] Edge Function `sync-fx-rates` deployed
- [ ] Environment variable `GOOGLE_FX_API_URL` set
- [ ] Cron job scheduled (hourly sync)
- [ ] CurrencyContext.jsx updated to use database rates
- [ ] FXRateLockBadge component created
- [ ] Badge added to 3+ key pages (marketplace, product, checkout)
- [ ] Manual test: Run sync function, verify rates in database
- [ ] Manual test: Refresh frontend, verify rates display with lock badge

---

## 🌍 TASK 2: DASHBOARD & FORM TRANSLATION (GOOGLE CLOUD TRANSLATION)

### Overview
Auto-translate all English-only strings in dashboards, forms, and error messages to FR/PT/AR using Google Cloud Translation API.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              TRANSLATION AUTOMATION FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Scan Script (Node.js)                                      │
│     └─ Finds hardcoded English strings in:                     │
│        • src/pages/dashboard/**/*.jsx                          │
│        • src/components/forms/**/*.jsx                         │
│        • toast.error/toast.success calls                       │
│                                                                 │
│  2. Google Cloud Translation API                               │
│     └─ Translates each string to FR, PT, AR                    │
│     └─ Returns: { en: "...", fr: "...", pt: "...", ar: "..." }│
│                                                                 │
│  3. Update translations.js                                     │
│     └─ Merges new keys into existing file                      │
│     └─ Maintains alphabetical order                            │
│                                                                 │
│  4. Replace Hardcoded Strings                                  │
│     └─ "Submit Order" → {t('order.submit')}                    │
│     └─ toast.error("Failed") → toast.error(t('error.failed')) │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 2.1: Setup Google Cloud Translation API

**Prerequisites**:
1. Google Cloud Project (if not exist): https://console.cloud.google.com
2. Enable Translation API:
   ```
   APIs & Services → Enable APIs → Search "Cloud Translation API" → Enable
   ```
3. Create Service Account:
   ```
   IAM & Admin → Service Accounts → Create
   Name: afrikoni-translator
   Role: Cloud Translation API User
   Create Key → JSON → Download
   ```
4. Save JSON as: `google-cloud-key.json` (root directory)
5. Add to `.gitignore`:
   ```
   google-cloud-key.json
   ```

---

### Step 2.2: Translation Automation Script

**File**: `scripts/auto-translate-dashboard.js`

```javascript
/**
 * AFRIKONI AUTO-TRANSLATOR
 * Scans codebase for hardcoded English strings and translates to FR/PT/AR
 * Uses: Google Cloud Translation API
 */

const fs = require('fs');
const path = require('path');
const { Translate } = require('@google-cloud/translate').v2;

// Initialize Google Cloud Translation
const translate = new Translate({
  keyFilename: path.join(__dirname, '../google-cloud-key.json')
});

const TARGET_LANGUAGES = ['fr', 'pt', 'ar'];

// Patterns to find hardcoded strings
const PATTERNS = {
  toastError: /toast\.error\(['"`](.*?)['"`]\)/g,
  toastSuccess: /toast\.success\(['"`](.*?)['"`]\)/g,
  buttonLabels: /<Button[^>]*>\s*([A-Z][a-z\s]+)\s*<\/Button>/g,
  labels: /<Label[^>]*>\s*([A-Z][a-z\s]+)\s*<\/Label>/g,
  headings: /<h[1-6][^>]*>\s*([A-Z][a-z\s]+)\s*<\/h[1-6]>/g,
  placeholders: /placeholder=['"`]([A-Z][a-z\s]+)['"`]/g
};

const SCAN_DIRECTORIES = [
  'src/pages/dashboard',
  'src/components/forms',
  'src/components/modals'
];

/**
 * Extract hardcoded English strings from file
 */
function extractStringsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const strings = new Set();
  
  Object.values(PATTERNS).forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const str = match[1].trim();
      // Only keep strings that look like user-facing text
      if (str.length > 2 && /[a-zA-Z]/.test(str) && !str.includes('$')) {
        strings.add(str);
      }
    }
  });
  
  return Array.from(strings);
}

/**
 * Translate strings to target languages
 */
async function translateStrings(strings) {
  const translations = {};
  
  for (const targetLang of TARGET_LANGUAGES) {
    console.log(`Translating ${strings.length} strings to ${targetLang.toUpperCase()}...`);
    
    const [translated] = await translate.translate(strings, targetLang);
    const translatedArray = Array.isArray(translated) ? translated : [translated];
    
    strings.forEach((originalString, index) => {
      const key = generateKey(originalString);
      
      if (!translations[key]) {
        translations[key] = { en: originalString };
      }
      
      translations[key][targetLang] = translatedArray[index];
    });
  }
  
  return translations;
}

/**
 * Generate translation key from English string
 * "Save Changes" → "common.saveChanges"
 */
function generateKey(str) {
  // Determine category
  let category = 'common';
  
  if (str.toLowerCase().includes('error')) category = 'error';
  else if (str.toLowerCase().includes('success')) category = 'success';
  else if (str.toLowerCase().includes('order')) category = 'order';
  else if (str.toLowerCase().includes('payment')) category = 'payment';
  else if (str.toLowerCase().includes('dashboard')) category = 'dashboard';
  else if (str.toLowerCase().includes('form')) category = 'form';
  
  // Convert to camelCase key
  const key = str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(' ')
    .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  
  return `${category}.${key}`;
}

/**
 * Scan all target directories
 */
function scanAllFiles() {
  const allStrings = new Set();
  
  SCAN_DIRECTORIES.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    
    if (!fs.existsSync(dirPath)) {
      console.warn(`Directory not found: ${dir}`);
      return;
    }
    
    const files = fs.readdirSync(dirPath, { recursive: true });
    
    files.forEach(file => {
      if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts')) {
        const filePath = path.join(dirPath, file);
        const strings = extractStringsFromFile(filePath);
        strings.forEach(s => allStrings.add(s));
      }
    });
  });
  
  return Array.from(allStrings);
}

/**
 * Main execution
 */
async function main() {
  console.log('🌍 AFRIKONI AUTO-TRANSLATOR');
  console.log('===========================\n');
  
  // 1. Scan for hardcoded strings
  console.log('1. Scanning codebase for hardcoded English strings...');
  const strings = scanAllFiles();
  console.log(`   Found ${strings.length} unique strings\n`);
  
  if (strings.length === 0) {
    console.log('✅ No hardcoded strings found!');
    return;
  }
  
  // 2. Translate strings
  console.log('2. Translating to FR, PT, AR...');
  const translations = await translateStrings(strings);
  console.log(`   Generated ${Object.keys(translations).length} translation keys\n`);
  
  // 3. Load existing translations.js
  console.log('3. Merging with existing translations...');
  const translationsPath = path.join(__dirname, '../src/i18n/translations.js');
  const existingContent = fs.readFileSync(translationsPath, 'utf-8');
  
  // 4. Generate new translations object
  const newTranslations = {
    en: {},
    fr: {},
    pt: {},
    ar: {}
  };
  
  Object.entries(translations).forEach(([key, values]) => {
    newTranslations.en[key] = values.en;
    newTranslations.fr[key] = values.fr;
    newTranslations.pt[key] = values.pt;
    newTranslations.ar[key] = values.ar;
  });
  
  // 5. Write to temporary file for review
  const outputPath = path.join(__dirname, '../src/i18n/new-translations.json');
  fs.writeFileSync(outputPath, JSON.stringify(newTranslations, null, 2), 'utf-8');
  
  console.log(`   ✅ New translations saved to: src/i18n/new-translations.json`);
  console.log(`   ⚠️  Review before merging into translations.js\n`);
  
  // 6. Print sample replacement suggestions
  console.log('4. Sample replacement suggestions:');
  Object.entries(translations).slice(0, 5).forEach(([key, values]) => {
    console.log(`   "${values.en}" → {t('${key}')}`);
  });
  
  console.log('\n✅ Translation complete!');
  console.log(`\nNext steps:`);
  console.log(`1. Review: src/i18n/new-translations.json`);
  console.log(`2. Merge into: src/i18n/translations.js`);
  console.log(`3. Run: npm run replace-hardcoded-strings`);
}

main().catch(console.error);
```

**Install Dependencies**:
```bash
npm install @google-cloud/translate
```

**Run Script**:
```bash
node scripts/auto-translate-dashboard.js
```

---

### Step 2.3: String Replacement Script

**File**: `scripts/replace-hardcoded-strings.js`

```javascript
/**
 * AFRIKONI STRING REPLACER
 * Replaces hardcoded English strings with {t('key')} calls
 */

const fs = require('fs');
const path = require('path');

// Load translation mappings
const translations = require('../src/i18n/new-translations.json');

// Build reverse lookup: "Save Changes" → "common.saveChanges"
const englishToKey = {};
Object.keys(translations.en).forEach(key => {
  englishToKey[translations.en[key]] = key;
});

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let replacements = 0;
  
  // Replace toast messages
  Object.entries(englishToKey).forEach(([english, key]) => {
    const patterns = [
      new RegExp(`toast\\.error\\(['"\`]${escapeRegex(english)}['"\`]\\)`, 'g'),
      new RegExp(`toast\\.success\\(['"\`]${escapeRegex(english)}['"\`]\\)`, 'g'),
      new RegExp(`<Button[^>]*>\\s*${escapeRegex(english)}\\s*</Button>`, 'g'),
      new RegExp(`<Label[^>]*>\\s*${escapeRegex(english)}\\s*</Label>`, 'g'),
      new RegExp(`placeholder=['"\`]${escapeRegex(english)}['"\`]`, 'g')
    ];
    
    patterns.forEach(pattern => {
      if (pattern.test(content)) {
        // Determine replacement based on pattern type
        if (pattern.source.includes('toast')) {
          content = content.replace(pattern, (match) => {
            const method = match.includes('error') ? 'error' : 'success';
            return `toast.${method}(t('${key}'))`;
          });
        } else if (pattern.source.includes('Button')) {
          content = content.replace(pattern, `<Button>{t('${key}')}</Button>`);
        } else if (pattern.source.includes('Label')) {
          content = content.replace(pattern, `<Label>{t('${key}')}</Label>`);
        } else if (pattern.source.includes('placeholder')) {
          content = content.replace(pattern, `placeholder={t('${key}')}`);
        }
        replacements++;
      }
    });
  });
  
  // Add import if needed and replacements were made
  if (replacements > 0 && !content.includes("from 'react-i18next'") && !content.includes('useLanguage')) {
    // Check if file uses react-i18next or our custom hook
    if (content.includes('import React')) {
      content = content.replace(
        /import React[^;]+;/,
        (match) => `${match}\nimport { useTranslation } from 'react-i18next';`
      );
      
      // Add const { t } = useTranslation(); after first function declaration
      content = content.replace(
        /(export (?:default )?function [^(]+\([^)]*\)\s*{)/,
        (match) => `${match}\n  const { t } = useTranslation();`
      );
    }
  }
  
  if (replacements > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`   ✅ ${path.basename(filePath)}: ${replacements} replacements`);
  }
  
  return replacements;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function processDirectory(dir) {
  let totalReplacements = 0;
  
  const files = fs.readdirSync(dir, { recursive: true });
  
  files.forEach(file => {
    if ((file.endsWith('.jsx') || file.endsWith('.js')) && !file.includes('node_modules')) {
      const filePath = path.join(dir, file);
      totalReplacements += replaceInFile(filePath);
    }
  });
  
  return totalReplacements;
}

console.log('🔄 AFRIKONI STRING REPLACER');
console.log('===========================\n');

const directories = [
  'src/pages/dashboard',
  'src/components/forms',
  'src/components/modals'
];

let grandTotal = 0;

directories.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  console.log(`Processing: ${dir}`);
  const count = processDirectory(dirPath);
  grandTotal += count;
  console.log();
});

console.log(`✅ Total replacements: ${grandTotal}`);
```

**Run Script**:
```bash
node scripts/replace-hardcoded-strings.js
```

---

### Step 2.4: RTL (Right-to-Left) CSS Fixes

**File**: `src/index.css`

Add RTL-safe CSS utilities:

```css
/* ============================================================================
   RTL (Right-to-Left) Support for Arabic
   ============================================================================ */

/* Logical properties (replace physical properties) */
[dir="rtl"] {
  /* Margin/Padding */
  --space-start: margin-inline-start;
  --space-end: margin-inline-end;
  --pad-start: padding-inline-start;
  --pad-end: padding-inline-end;
  
  /* Border */
  --border-start: border-inline-start;
  --border-end: border-inline-end;
}

/* Text alignment */
[dir="rtl"] .text-left {
  text-align: right !important;
}

[dir="rtl"] .text-right {
  text-align: left !important;
}

/* Float direction */
[dir="rtl"] .float-left {
  float: right !important;
}

[dir="rtl"] .float-right {
  float: left !important;
}

/* Flexbox direction */
[dir="rtl"] .flex-row {
  flex-direction: row-reverse;
}

/* Icons (should not flip) */
[dir="rtl"] .icon-no-flip {
  transform: scaleX(-1);
}

/* Dropdown menus */
[dir="rtl"] .dropdown-menu {
  right: auto;
  left: 0;
}

/* Input fields with icons */
[dir="rtl"] input[type="search"] {
  padding-inline-start: 2.5rem;
  padding-inline-end: 1rem;
}

/* Breadcrumbs */
[dir="rtl"] .breadcrumb-separator {
  transform: rotate(180deg);
}
```

---

### ✅ TASK 2 VERIFICATION CHECKLIST

- [ ] Google Cloud Translation API enabled
- [ ] Service account key downloaded (`google-cloud-key.json`)
- [ ] Auto-translate script runs successfully
- [ ] Review `new-translations.json` output
- [ ] Merge translations into `translations.js`
- [ ] String replacement script runs successfully
- [ ] Test dashboard in French (FR)
- [ ] Test dashboard in Portuguese (PT)
- [ ] Test dashboard in Arabic (AR) with RTL
- [ ] Verify no hardcoded strings in error messages
- [ ] Verify forms display in selected language
- [ ] Verify toast notifications translate correctly

---

## 🗺️ TASK 3: GOOGLE GEO-INTELLIGENCE (LOCATION + TRADE BLOCS)

### Overview
Replace IP-based detection with Google Maps Geolocation API and implement trade bloc filtering + country-specific compliance.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              GEO-INTELLIGENCE ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Google Maps Geolocation API                                │
│     └─ User location → { lat, lng, country: "NG" }            │
│                                                                 │
│  2. Trade Bloc Detection                                       │
│     └─ Nigeria → ECOWAS                                        │
│     └─ Kenya → EAC                                             │
│     └─ South Africa → SADC                                     │
│                                                                 │
│  3. Marketplace Filtering                                      │
│     └─ Show ECOWAS products first (regional preference)       │
│     └─ Apply corridor-specific pricing                         │
│                                                                 │
│  4. Compliance Automation                                      │
│     └─ Nigeria → Require "CAC Certificate"                    │
│     └─ Kenya → Require "KRA PIN"                              │
│     └─ South Africa → Require "CIPC Registration"            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 3.1: Google Maps Geolocation Setup

**Get API Key**:
1. Google Cloud Console → APIs & Services
2. Enable: **Geolocation API** + **Geocoding API**
3. Credentials → Create API Key
4. Restrict API Key → HTTP referrers (add your domain)
5. Copy API Key

**Add to .env**:
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...your_key_here
```

---

### Step 3.2: Enhanced Geo Detection

**File**: `src/utils/geoDetectionGoogle.js`

```javascript
/**
 * AFRIKONI GEO-INTELLIGENCE
 * Uses Google Maps Geolocation + Geocoding APIs
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Trade bloc mappings
export const TRADE_BLOCS = {
  ECOWAS: ['BJ', 'BF', 'CV', 'CI', 'GM', 'GH', 'GN', 'GW', 'LR', 'ML', 'NE', 'NG', 'SN', 'SL', 'TG'],
  EAC: ['BI', 'KE', 'RW', 'SS', 'TZ', 'UG'],
  SADC: ['AO', 'BW', 'CD', 'SZ', 'LS', 'MG', 'MW', 'MU', 'MZ', 'NA', 'SC', 'ZA', 'TZ', 'ZM', 'ZW'],
  COMESA: ['BI', 'KM', 'CD', 'DJ', 'EG', 'ER', 'ET', 'KE', 'LY', 'MG', 'MW', 'MU', 'RW', 'SC', 'SD', 'SS', 'SZ', 'TN', 'UG', 'ZM', 'ZW'],
  AMU: ['DZ', 'LY', 'MR', 'MA', 'TN']
};

/**
 * Get user location using Google Maps Geolocation API
 */
export async function getUserLocationGoogle() {
  try {
    // 1. Get approximate location from browser's geolocation
    const position = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 5000,
        maximumAge: 300000 // 5 minutes cache
      });
    });
    
    const { latitude, longitude } = position.coords;
    
    // 2. Reverse geocode to get country
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding API error');
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results[0]) {
      throw new Error('No results from Geocoding API');
    }
    
    // 3. Extract country code
    const addressComponents = data.results[0].address_components;
    const countryComponent = addressComponents.find(comp => 
      comp.types.includes('country')
    );
    
    if (!countryComponent) {
      throw new Error('Country not found in geocoding result');
    }
    
    const countryCode = countryComponent.short_name;
    const countryName = countryComponent.long_name;
    
    // 4. Determine trade bloc
    const tradeBloc = getTradeBloc(countryCode);
    
    // 5. Get compliance requirements
    const complianceReqs = getComplianceRequirements(countryCode);
    
    return {
      success: true,
      countryCode,
      countryName,
      latitude,
      longitude,
      tradeBloc,
      complianceRequirements: complianceReqs,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Google geolocation failed:', error);
    
    // Fallback to IP-based detection
    return await fallbackIPDetection();
  }
}

/**
 * Determine trade bloc from country code
 */
export function getTradeBloc(countryCode) {
  const blocs = [];
  
  Object.entries(TRADE_BLOCS).forEach(([blocName, countries]) => {
    if (countries.includes(countryCode)) {
      blocs.push(blocName);
    }
  });
  
  return blocs.length > 0 ? blocs : ['NONE'];
}

/**
 * Get country-specific compliance requirements
 */
export function getComplianceRequirements(countryCode) {
  const requirements = {
    NG: {
      business: ['CAC Certificate', 'TIN', 'Company Directors ID'],
      imports: ['Form M', 'NAFDAC Approval (if applicable)', 'SON Certificate'],
      exports: ['NXP Form', 'Export Permit'],
      kycLevel: 'enhanced' // Higher due diligence
    },
    KE: {
      business: ['Certificate of Incorporation', 'KRA PIN', 'Business Permit'],
      imports: ['IDF (Import Declaration Form)', 'KEBS Certificate'],
      exports: ['EDF (Export Declaration Form)'],
      kycLevel: 'standard'
    },
    ZA: {
      business: ['CIPC Registration', 'Tax Clearance Certificate', 'BEE Certificate'],
      imports: ['Customs Declaration', 'SABS Certificate (if applicable)'],
      exports: ['Export Declaration'],
      kycLevel: 'standard'
    },
    GH: {
      business: ['Company Registration Certificate', 'TIN', 'Operating License'],
      imports: ['Import Declaration', 'Ghana Standards Authority Certificate'],
      exports: ['Export Declaration', 'Certificate of Origin'],
      kycLevel: 'standard'
    },
    // Add more countries...
    DEFAULT: {
      business: ['Business Registration', 'Tax Certificate'],
      imports: ['Customs Declaration'],
      exports: ['Export Declaration'],
      kycLevel: 'basic'
    }
  };
  
  return requirements[countryCode] || requirements.DEFAULT;
}

/**
 * Fallback to IP-based detection
 */
async function fallbackIPDetection() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    return {
      success: true,
      countryCode: data.country_code,
      countryName: data.country_name,
      latitude: data.latitude,
      longitude: data.longitude,
      tradeBloc: getTradeBloc(data.country_code),
      complianceRequirements: getComplianceRequirements(data.country_code),
      timestamp: new Date().toISOString(),
      method: 'fallback-ip'
    };
  } catch (error) {
    console.error('Fallback detection also failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if two countries are in same trade bloc
 */
export function areSameTrade Bloc(country1, country2) {
  const blocs1 = getTradeBloc(country1);
  const blocs2 = getTradeBloc(country2);
  
  return blocs1.some(bloc => blocs2.includes(bloc));
}

/**
 * Calculate trade corridor difficulty
 */
export function getCorridorDifficulty(originCountry, destCountry) {
  // Same trade bloc = Easy
  if (areSameTradeBloc(originCountry, destCountry)) {
    return {
      level: 'easy',
      estimatedDays: 3-7,
      customsDuty: 0, // ECOWAS/EAC/SADC free trade
      fxRestrictions: false
    };
  }
  
  // Different African trade blocs = Medium
  const isOriginAfrican = Object.values(TRADE_BLOCS).flat().includes(originCountry);
  const isDestAfrican = Object.values(TRADE_BLOCS).flat().includes(destCountry);
  
  if (isOriginAfrican && isDestAfrican) {
    return {
      level: 'medium',
      estimatedDays: 7-14,
      customsDuty: 0.05, // 5% duty
      fxRestrictions: originCountry === 'NG' || destCountry === 'NG' // Nigeria has FX controls
    };
  }
  
  // Africa ↔ International = Hard
  return {
    level: 'hard',
    estimatedDays: 14-30,
    customsDuty: 0.10, // 10% duty
    fxRestrictions: true
  };
}
```

---

### Step 3.3: Marketplace Trade Bloc Filtering

**File**: `src/pages/marketplace.jsx`

Add trade bloc filtering logic:

```javascript
import { getUserLocationGoogle, getTradeBloc, areSameTradeBloc } from '@/utils/geoDetectionGoogle';

// ... existing code ...

const [userGeoData, setUserGeoData] = useState(null);
const [preferRegional, setPreferRegional] = useState(true);

// Detect user location on mount
useEffect(() => {
  const detectLocation = async () => {
    const geoData = await getUserLocationGoogle();
    if (geoData.success) {
      setUserGeoData(geoData);
      localStorage.setItem('afrikoni_geo_data', JSON.stringify(geoData));
    }
  };
  
  // Check cache first
  const cached = localStorage.getItem('afrikoni_geo_data');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      // Cache valid for 24 hours
      if (new Date() - new Date(parsed.timestamp) < 24 * 60 * 60 * 1000) {
        setUserGeoData(parsed);
        return;
      }
    } catch (e) {
      // Invalid cache, detect fresh
    }
  }
  
  detectLocation();
}, []);

// Filter products by trade bloc
const filteredProducts = useMemo(() => {
  if (!products || !userGeoData || !preferRegional) {
    return products;
  }
  
  // Sort: Same trade bloc first, then others
  return [...products].sort((a, b) => {
    const aSameBloc = areSameTradeBloc(a.country_of_origin, userGeoData.countryCode);
    const bSameBloc = areSameTradeBloc(b.country_of_origin, userGeoData.countryCode);
    
    if (aSameBloc && !bSameBloc) return -1;
    if (!aSameBloc && bSameBloc) return 1;
    return 0;
  });
}, [products, userGeoData, preferRegional]);

// Add UI toggle
<div className="flex items-center gap-2 mb-4">
  <input
    type="checkbox"
    id="regional-preference"
    checked={preferRegional}
    onChange={(e) => setPreferRegional(e.target.checked)}
  />
  <label htmlFor="regional-preference" className="text-sm">
    Prioritize {userGeoData?.tradeBloc[0]} suppliers (regional trade bloc)
  </label>
</div>
```

---

### Step 3.4: Dynamic Verification Center

**File**: `src/pages/dashboard/verification-center.jsx`

Update document requirements based on user country:

```javascript
import { getUserLocationGoogle, getComplianceRequirements } from '@/utils/geoDetectionGoogle';

// ... existing code ...

const [requiredDocs, setRequiredDocs] = useState([]);

useEffect(() => {
  const loadRequirements = async () => {
    // Get user country
    const geoData = JSON.parse(localStorage.getItem('afrikoni_geo_data') || '{}');
    
    if (!geoData.countryCode) {
      const fresh = await getUserLocationGoogle();
      geoData.countryCode = fresh.countryCode;
    }
    
    // Get compliance requirements
    const reqs = getComplianceRequirements(geoData.countryCode);
    
    // Set required documents
    setRequiredDocs(reqs.business);
  };
  
  loadRequirements();
}, []);

// Dynamic document upload UI
<div className="space-y-4">
  <h3 className="text-lg font-semibold">
    Required Documents ({userGeoData?.countryName || 'Your Country'})
  </h3>
  
  {requiredDocs.map((docType, index) => (
    <div key={index} className="border rounded-lg p-4">
      <label className="block text-sm font-medium mb-2">
        {docType}
        <span className="text-red-500 ml-1">*</span>
      </label>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="block w-full"
      />
      <p className="text-xs text-gray-500 mt-1">
        Required for verification in {userGeoData?.countryName}
      </p>
    </div>
  ))}
</div>
```

---

### ✅ TASK 3 VERIFICATION CHECKLIST

- [ ] Google Maps API key obtained and added to `.env`
- [ ] Geolocation API enabled in Google Cloud
- [ ] `geoDetectionGoogle.js` file created
- [ ] Marketplace filtering by trade bloc implemented
- [ ] Verification Center shows country-specific documents
- [ ] Test geolocation in Nigeria (should require CAC Certificate)
- [ ] Test geolocation in Kenya (should require KRA PIN)
- [ ] Test marketplace filter (ECOWAS products first for Nigerian user)
- [ ] Verify corridor difficulty calculation
- [ ] Cache geo data for 24 hours to reduce API calls

---

## 🔍 TASK 4: SEO & DISCOVERY (GOOGLE SEARCH CONSOLE & SCHEMA)

### Overview
Make products discoverable in Google Search and AI Overviews with JSON-LD structured data and multilingual SEO.

### Step 4.1: Product JSON-LD Schema

**File**: `src/components/seo/ProductSchema.jsx`

```javascript
import React from 'react';
import { Helmet } from 'react-helmet-async';

export function ProductSchema({ product, supplier }) {
  if (!product) return null;
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || `${product.name} from ${supplier?.company_name || 'verified supplier'}`,
    "image": product.product_images?.[0]?.image_url || '',
    "brand": {
      "@type": "Organization",
      "name": supplier?.company_name || 'Afrikoni Supplier'
    },
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": product.price_min,
      "highPrice": product.price_max || product.price_min,
      "priceCurrency": product.currency || 'USD',
      "availability": product.status === 'active' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": supplier?.company_name || 'African Supplier',
        "address": {
          "@type": "PostalAddress",
          "addressCountry": product.country_of_origin || supplier?.country
        }
      }
    },
    "aggregateRating": product.rating ? {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.review_count || 1
    } : undefined
  };
  
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}
```

**Usage** in `src/pages/productdetails.jsx`:

```javascript
import { ProductSchema } from '@/components/seo/ProductSchema';

// In component:
<ProductSchema product={product} supplier={supplier} />
```

---

### Step 4.2: Multilingual Hreflang Tags

**File**: `src/components/seo/HreflangTags.jsx`

```javascript
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

export function HreflangTags() {
  const location = useLocation();
  const baseUrl = 'https://afrikoni.com';
  const currentPath = location.pathname;
  
  const languages = [
    { code: 'en', region: 'gb' },
    { code: 'fr', region: 'fr' },
    { code: 'pt', region: 'pt' },
    { code: 'ar', region: 'sa' }
  ];
  
  return (
    <Helmet>
      {/* Default language */}
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl}${currentPath}`} />
      
      {/* Language variants */}
      {languages.map(({ code, region }) => (
        <link
          key={code}
          rel="alternate"
          hrefLang={`${code}-${region}`}
          href={`${baseUrl}/${code}${currentPath}`}
        />
      ))}
    </Helmet>
  );
}
```

**Usage** in `src/App.jsx`:

```javascript
import { HreflangTags } from '@/components/seo/HreflangTags';

// In App component:
<HreflangTags />
```

---

### Step 4.3: Google Search Console Setup

**Manual Steps**:

1. **Verify Ownership**:
   ```
   Google Search Console → Add Property → https://afrikoni.com
   Verification method: HTML file upload OR DNS TXT record
   ```

2. **Submit Sitemap**:
   ```
   Sitemaps → Add Sitemap → https://afrikoni.com/sitemap.xml
   ```

3. **Enable International Targeting**:
   ```
   Settings → International Targeting
   Select country: Nigeria (or primary market)
   ```

4. **Request Indexing** (for key pages):
   ```
   URL Inspection → Enter product URL → Request Indexing
   ```

---

### Step 4.4: Generate Dynamic Sitemap

**File**: `public/sitemap.xml` (generated dynamically)

**Script**: `scripts/generate-sitemap.js`

```javascript
/**
 * Generate XML sitemap for all products and pages
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function generateSitemap() {
  const baseUrl = 'https://afrikoni.com';
  const languages = ['en', 'fr', 'pt', 'ar'];
  
  // Static pages
  const staticPages = [
    '', // homepage
    '/marketplace',
    '/suppliers',
    '/buyer-hub',
    '/supplier-hub',
    '/pricing',
    '/help',
    '/contact'
  ];
  
  // Fetch all active products
  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at')
    .eq('status', 'active');
  
  // Build XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;
  
  // Add static pages (all languages)
  staticPages.forEach(page => {
    languages.forEach(lang => {
      const url = lang === 'en' ? `${baseUrl}${page}` : `${baseUrl}/${lang}${page}`;
      xml += `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
`;
      
      // Add alternate language versions
      languages.forEach(altLang => {
        const altUrl = altLang === 'en' ? `${baseUrl}${page}` : `${baseUrl}/${altLang}${page}`;
        xml += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${altUrl}" />
`;
      });
      
      xml += `  </url>
`;
    });
  });
  
  // Add product pages
  products.forEach(product => {
    languages.forEach(lang => {
      const url = lang === 'en' 
        ? `${baseUrl}/products/${product.id}`
        : `${baseUrl}/${lang}/products/${product.id}`;
      
      xml += `  <url>
    <loc>${url}</loc>
    <lastmod>${product.updated_at}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
`;
      
      languages.forEach(altLang => {
        const altUrl = altLang === 'en' 
          ? `${baseUrl}/products/${product.id}`
          : `${baseUrl}/${altLang}/products/${product.id}`;
        xml += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${altUrl}" />
`;
      });
      
      xml += `  </url>
`;
    });
  });
  
  xml += `</urlset>`;
  
  // Write to public directory
  fs.writeFileSync('public/sitemap.xml', xml, 'utf-8');
  console.log('✅ Sitemap generated with', products.length, 'products');
}

generateSitemap().catch(console.error);
```

**Run Script**:
```bash
node scripts/generate-sitemap.js
```

**Add to package.json**:
```json
{
  "scripts": {
    "generate-sitemap": "node scripts/generate-sitemap.js"
  }
}
```

---

### ✅ TASK 4 VERIFICATION CHECKLIST

- [ ] `ProductSchema.jsx` component created
- [ ] JSON-LD schema added to all product pages
- [ ] `HreflangTags.jsx` component created
- [ ] Hreflang tags added to App.jsx
- [ ] Google Search Console property added
- [ ] Sitemap generated with multilingual URLs
- [ ] Sitemap submitted to Google Search Console
- [ ] Test rich snippet with Google Rich Results Test
- [ ] Verify hreflang implementation with hreflang checker
- [ ] Monitor coverage in Google Search Console (after 48-72 hours)

---

## ✅ TASK 5: THE "NO-LEAK" VERIFICATION

### Full System Test

**Test Scenario**: Mozambique user in Portuguese

**Step-by-Step Verification**:

1. **Open Browser** (Incognito mode):
   ```
   https://afrikoni.com/?test_location=MZ&lang=pt
   ```

2. **Verify Geolocation**:
   - [ ] Country detected: Mozambique (MZ)
   - [ ] Trade bloc shown: SADC
   - [ ] Marketplace shows SADC products first

3. **Verify Currency**:
   - [ ] Default currency: MZN (Mozambican Metical)
   - [ ] Price displays: "65.92 MT" (with 3% buffer)
   - [ ] FX lock badge shows: "Taxa bloqueada por 23h 45m"

4. **Verify Language**:
   - [ ] Dashboard labels in Portuguese
   - [ ] Form placeholders in Portuguese
   - [ ] Error messages in Portuguese
   - [ ] Toast notifications in Portuguese

5. **Verify RTL (Arabic test)**:
   - [ ] Switch language to Arabic
   - [ ] Page direction: dir="rtl"
   - [ ] Text alignment: right-to-left
   - [ ] Icons not flipped
   - [ ] Dropdowns open from right

6. **Verify Compliance**:
   - [ ] Verification Center requires Mozambique-specific docs
   - [ ] No CAC Certificate shown (Nigeria-specific)
   - [ ] Customs guidance shows SADC info

7. **Verify SEO**:
   - [ ] View page source → JSON-LD schema present
   - [ ] Hreflang tags present: pt-pt, en-gb, fr-fr, ar-sa
   - [ ] Meta description in Portuguese

8. **Verify Trade Corridor**:
   - [ ] Select product from South Africa (ZA)
   - [ ] Corridor difficulty: "Easy" (both SADC)
   - [ ] Estimated delivery: "3-7 days"
   - [ ] Customs duty: "0% (SADC free trade)"

---

## 📊 IMPLEMENTATION TIMELINE

| Week | Tasks | Deliverables |
|------|-------|--------------|
| **Week 1** | Task 1: Google FX Engine | Google Sheet + Apps Script + Edge Function + DB migration |
| **Week 2** | Task 2: Auto-translation | Translation scripts + Updated translations.js + String replacements |
| **Week 3** | Task 3: Geo-intelligence | Google Maps integration + Trade bloc filtering + Dynamic compliance |
| **Week 4** | Task 4 + 5: SEO + Testing | JSON-LD + Hreflang + Sitemap + Full verification |

**Total Duration**: 4 weeks  
**Parallel Work Possible**: Yes (FX + Translation can run simultaneously)

---

## 💰 COST ESTIMATE

| Service | Free Tier | Estimated Monthly Cost |
|---------|-----------|------------------------|
| **Google Sheets** | Unlimited | $0 |
| **Google Apps Script** | 20 calls/min | $0 |
| **Google Cloud Translation** | First 500K chars free | $20-$50 (after free tier) |
| **Google Maps Geolocation** | $0.005/request | $10-$30 (2K-6K requests) |
| **Google Maps Geocoding** | $0.005/request | $10-$30 (2K-6K requests) |
| **Supabase** | 500MB DB, 2GB bandwidth | $0 (within free tier) |
| **Total** | - | **$40-$140/month** |

**Optimization Tips**:
- Cache geolocation for 24 hours → Reduce by 95%
- Batch translation requests → Stay in free tier
- Use Apps Script (free) instead of paid FX APIs

---

## 🎯 SUCCESS METRICS

After implementation, track:

| Metric | Before | Target | Measurement |
|--------|--------|--------|-------------|
| **FX Accuracy** | 6-month-old rates | Real-time (20min delay) | Compare to actual rates |
| **Language Coverage** | 40% dashboard FR/PT | 95% dashboard FR/PT | Count translated strings |
| **Geo-Driven UX** | 0% personalization | 80% geo-aware | User testing |
| **SEO Visibility** | 0 rich snippets | 1K+ product snippets | Google Search Console |
| **User Trust** | Complaints about FX | <1% FX complaints | Support tickets |
| **Regional Preference** | Random sorting | 70% regional clicks | Analytics tracking |

---

## 🚨 ROLLBACK PLAN

If any task fails:

**Task 1 (FX) Rollback**:
- Keep existing `getApproximateRates()` fallback
- Remove Edge Function
- Delete `exchange_rates` table

**Task 2 (Translation) Rollback**:
- Keep English-only strings
- Remove translation key imports
- Revert to original files (use Git)

**Task 3 (Geo) Rollback**:
- Fall back to IP-based detection
- Remove trade bloc filtering
- Keep generic compliance docs

**Task 4 (SEO) Rollback**:
- Remove JSON-LD scripts
- Remove hreflang tags
- Keep static sitemap

---

## 📋 POST-IMPLEMENTATION

**Week 5: Monitoring**
- Monitor Google Cloud API usage
- Check FX sync cron job (hourly)
- Review translation quality (user feedback)
- Track SEO indexing progress

**Week 6-8: Optimization**
- Optimize API calls (caching)
- Refine translations based on feedback
- Add more country-specific compliance
- Expand trade corridor rules

**Week 12: ROI Analysis**
- Measure user satisfaction (surveys)
- Track conversion rate improvement
- Calculate cost per transaction
- Report to stakeholders

---

**END OF IMPLEMENTATION PLAN**

**Status**: ✅ **READY TO BUILD**  
**Difficulty**: Medium (4 weeks, 1 engineer)  
**Risk**: Low (all fallbacks in place)  
**Impact**: **HIGH** (3.1/10 → 8.5/10 Trade-OS Score)

**Next Action**: Approve budget → Begin Week 1 (Google FX Engine)
