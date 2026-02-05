# Afrikoni Platform Enhancements - Integration Guide

## Overview

This guide covers the deployment and configuration of three major platform enhancements:

1. **Smile ID Verification** - Automated KYC/KYB for African businesses
2. **KoniAI+** - AI-powered trade assistant
3. **Trade Workflow Visualizer** - Visual order progress tracking

---

## Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- Supabase project linked (`supabase link --project-ref your-project-ref`)
- OpenAI API key (for KoniAI+ features)
- Smile ID credentials (for verification features)

---

## 1. Database Migration

Run the verification schema migration:

```bash
# Apply the migration
supabase db push

# Or manually run the migration
supabase migration up
```

The migration creates:
- `verification_status` enum
- Verification fields on `companies` table
- KYC fields on `profiles` table
- `verification_jobs` table for audit trail
- Helper functions for webhook processing

---

## 2. Deploy Edge Functions

### Deploy All Functions

```bash
# Deploy all edge functions at once
supabase functions deploy smile-id-webhook
supabase functions deploy koniai-chat
supabase functions deploy koniai-generate-rfq
supabase functions deploy koniai-analyze-quote
```

### Set Required Secrets

```bash
# OpenAI API Key (required for KoniAI+)
supabase secrets set OPENAI_API_KEY=sk-your-openai-api-key

# Smile ID API Key (required for verification webhook)
supabase secrets set SMILE_ID_API_KEY=your-smile-id-api-key

# Smile ID Partner ID
supabase secrets set SMILE_ID_PARTNER_ID=your-partner-id
```

### Verify Deployment

```bash
# List deployed functions
supabase functions list

# Check function logs
supabase functions logs smile-id-webhook --tail
supabase functions logs koniai-chat --tail
```

---

## 3. Configure Webhook URLs

### Smile ID Webhook

1. Log in to [Smile ID Portal](https://portal.smileidentity.com)
2. Go to Settings → Webhooks
3. Add webhook URL: `https://your-project.supabase.co/functions/v1/smile-id-webhook`
4. Save and test the webhook

### Frontend Configuration

Update your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Smile ID
VITE_SMILE_ID_API_URL=https://api.smileidentity.com/v1
VITE_SMILE_ID_PARTNER_ID=your-partner-id
VITE_SMILE_ID_API_KEY=your-api-key
VITE_SMILE_ID_CALLBACK_URL=https://your-project.supabase.co/functions/v1/smile-id-webhook

# Feature Flags
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_VERIFICATION=true
```

---

## 4. Feature Usage

### Smile ID Verification

```javascript
import { verifyBusiness, verifyIdentity } from '@/services/VerificationService';

// Verify a business
await verifyBusiness({
  companyId: 'uuid',
  registrationNumber: 'RC123456',  // e.g., CAC number for Nigeria
  countryCode: 'NG',
  companyName: 'Acme Trading Ltd'
});

// Verify an individual's identity
await verifyIdentity({
  companyId: 'uuid',
  userId: 'user-uuid',
  idType: 'NIN',  // or 'BVN', 'PASSPORT'
  idNumber: '12345678901',
  countryCode: 'NG',
  personalInfo: {
    first_name: 'John',
    last_name: 'Doe',
    dob: '1990-01-15'
  }
});
```

### KoniAI+ Chat

The `KoniAIChat` component is automatically mounted globally in `App.jsx`. Users will see a floating chat button on all pages.

For programmatic use:

```javascript
import KoniAIService from '@/services/KoniAIService';

// Generate RFQ from natural language
const result = await KoniAIService.generateRFQ({
  description: 'I need 500kg of organic shea butter from Ghana',
  buyerCountry: 'US'
});

// Analyze quotes
const analysis = await KoniAIService.analyzeQuotes({
  quotes: [...],
  rfq: {...},
  preferences: { priority: 'balanced' }
});
```

### Trade Workflow Visualizer

```jsx
import TradeWorkflowVisualizer from '@/components/trade/TradeWorkflowVisualizer';

// Full variant (vertical timeline)
<TradeWorkflowVisualizer
  status={order.status}
  paymentStatus={order.payment_status}
  isCrossBorder={true}
  hasQualityCheck={true}
  estimatedDelivery={order.estimated_delivery}
  variant="full"
/>

// Compact variant (horizontal stepper)
<TradeWorkflowVisualizer
  status={order.status}
  variant="compact"
/>

// Minimal variant (progress bar only)
<TradeWorkflowVisualizer
  status={order.status}
  variant="minimal"
/>
```

---

## 5. Supported Countries

### Business Verification

| Country | Code | ID Type | Registration Body |
|---------|------|---------|-------------------|
| Nigeria | NG | CAC | Corporate Affairs Commission |
| South Africa | ZA | CIPC | Companies and IP Commission |
| Kenya | KE | BRS | Business Registration Service |
| Ghana | GH | RGD | Registrar General's Dept |
| Egypt | EG | GAFI | General Authority for Investment |
| Morocco | MA | RC | Registre du Commerce |
| Tanzania | TZ | BRELA | Business Registrations Agency |
| Uganda | UG | URSB | Registration Services Bureau |
| Rwanda | RW | RDB | Rwanda Development Board |
| Ethiopia | ET | MoTI | Ministry of Trade |
| Ivory Coast | CI | RC | Registre du Commerce |
| Senegal | SN | NINEA | National ID for Enterprises |
| Cameroon | CM | RC | Registre du Commerce |
| Zambia | ZM | PACRA | Patents & Companies Agency |
| Zimbabwe | ZW | ZIA | Zimbabwe Investment Authority |
| Malawi | MW | RG | Registrar General |
| Botswana | BW | CIPA | Companies & IP Authority |
| Namibia | NA | BIPA | Business & IP Authority |
| Mauritius | MU | CBRD | Corporate & Business Reg Dept |
| Angola | AO | IRSEA | Commercial Societies Registry |

---

## 6. Testing

### Test Verification Flow

1. Create a test company in the dashboard
2. Navigate to Settings → Verification
3. Enter test business registration number
4. Check Supabase logs for webhook processing

### Test KoniAI+

1. Click the floating chat button
2. Type: "I need to source coffee beans from Ethiopia"
3. Verify structured RFQ is generated

### Test Workflow Visualizer

1. Create or view an existing order
2. Verify the workflow visualizer shows correct status
3. Test different order statuses

---

## 7. Troubleshooting

### Edge Function Errors

```bash
# Check function logs
supabase functions logs koniai-chat --tail

# Test function locally
supabase functions serve koniai-chat
```

### Verification Webhook Issues

- Verify webhook URL is correct in Smile ID portal
- Check that `SMILE_ID_API_KEY` secret is set
- Review `verification_jobs` table for error details

### KoniAI+ Not Responding

- Verify `OPENAI_API_KEY` secret is set
- Check OpenAI API quota and billing
- Review edge function logs for errors

---

## 8. Security Considerations

1. **API Keys**: Never expose API keys in frontend code
2. **Webhook Validation**: Implement signature verification for Smile ID webhooks
3. **Rate Limiting**: Consider adding rate limits to AI endpoints
4. **Data Privacy**: Verification data is sensitive - review RLS policies

---

## Support

For issues or questions:
- GitHub: https://github.com/importantpapi/Afrikoni.com/issues
- Smile ID: https://docs.smileidentity.com
- OpenAI: https://platform.openai.com/docs
