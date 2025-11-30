# Setup Instructions for AFRIKONI Marketplace

## Prerequisites
- Node.js 18+ installed
- Supabase account and project
- npm or yarn package manager

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://qkeeufeiaphqylsnfhza.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZWV1ZmVpYXBocXlsc25maHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzYwNjYsImV4cCI6MjA4MDAxMjA2Nn0.CaGKQ3C5rz-XP-5r2I8xrHZ7F-5w4Z-1yzxtclddQus
```

## Step 3: Setup Supabase Storage

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Name it: `files`
5. Set it to **Public bucket** (for public file access)
6. Click **Create bucket**

## Step 4: Setup Email Service (Optional but Recommended)

The app uses a placeholder email service. To enable real email sending:

1. Choose an email service (Resend, SendGrid, Mailgun, etc.)
2. Update `src/api/supabaseClient.js` in the `email.send` function
3. Or create a Supabase Edge Function for email sending

Example with Resend:
```javascript
email: {
  send: async ({ to, subject, body }) => {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VITE_RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'noreply@afrikoni.com',
        to,
        subject,
        html: body
      })
    });
    return await response.json();
  }
}
```

## Step 5: Setup AI Services (Optional)

The AI services currently use placeholder logic. To enable real AI features:

1. Get an API key from OpenAI, Anthropic, or your preferred LLM provider
2. Update the AI service files in `src/components/services/`:
   - `AIDescriptionService.js`
   - `AIMatchingService.js`
   - `AIPricingService.js`
   - `AITradeRouteService.js`

Example with OpenAI:
```javascript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [/* your messages */]
  })
});
```

## Step 6: Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Step 7: Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Database Migrations

All database migrations have been applied via Supabase MCP. The following tables are created:

- users
- companies
- categories
- products
- rfqs
- quotes
- orders
- reviews
- messages
- disputes
- trade_financing
- notifications

All tables have Row Level Security (RLS) enabled with appropriate policies.

## Troubleshooting

### Issue: "Missing Supabase environment variables"
- Make sure your `.env` file exists in the root directory
- Check that the variable names start with `VITE_`
- Restart the dev server after adding environment variables

### Issue: "Storage bucket not found"
- Make sure you created the `files` bucket in Supabase Storage
- Verify the bucket is set to public

### Issue: "Authentication errors"
- Check that your Supabase URL and anon key are correct
- Verify RLS policies allow your operations

### Issue: "File upload fails"
- Ensure the `files` bucket exists and is public
- Check Supabase Storage policies allow uploads

## Next Steps

1. Customize the UI/UX to match your brand
2. Set up email service for notifications
3. Configure AI services for enhanced features
4. Add payment gateway integration (Stripe, PayPal, etc.)
5. Set up analytics tracking
6. Configure domain and deploy to production

