# AFRIKONI Marketplace - Supabase Migration

**Version:** 1.0.0

This project has been migrated from Base44 to Supabase. All database operations, authentication, and file storage now use Supabase.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```
   VITE_SUPABASE_URL=https://qkeeufeiaphqylsnfhza.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZWV1ZmVpYXBocXlsc25maHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzYwNjYsImV4cCI6MjA4MDAxMjA2Nn0.CaGKQ3C5rz-XP-5r2I8xrHZ7F-5w4Z-1yzxtclddQus
   ```

3. **Setup Supabase Storage**
   - Go to your Supabase dashboard
   - Navigate to Storage
   - Create a bucket named `files` with public access enabled

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

## Database Schema

All tables have been created via migrations:
- `users` - User profiles
- `companies` - Company information
- `categories` - Product categories
- `products` - Product listings
- `rfqs` - Request for Quotes
- `quotes` - Supplier quotes
- `orders` - Order management
- `reviews` - Product/company reviews
- `messages` - Messaging system
- `disputes` - Dispute management
- `trade_financing` - Trade financing applications
- `notifications` - User notifications

## Key Changes from Base44

1. **Authentication**: Now uses `supabase.auth` instead of `base44.auth`
2. **Database**: All queries use `supabase.from('table')` instead of `base44.entities.Entity`
3. **File Storage**: Uses Supabase Storage instead of Base44 file upload
4. **Real-time**: Can use Supabase real-time subscriptions
5. **AI Services**: Need to be updated to use your preferred LLM API (OpenAI, Anthropic, etc.)

## ✅ Conversion Complete!

All pages, components, and services have been successfully converted from Base44 to Supabase. See `CONVERSION_COMPLETE.md` for full details.

## Configuration Needed

1. **Supabase Storage**: Create a bucket named `files` (see SETUP_INSTRUCTIONS.md)
2. **Email Service**: Configure email sending (optional but recommended)
3. **AI Services**: Add API keys for LLM features (optional)

## File Structure

```
src/
├── api/
│   └── supabaseClient.js      # Supabase client and helpers
├── components/
│   ├── ui/                     # UI components (Button, Card, etc.)
│   ├── home/                   # Home page components
│   ├── messaging/              # Messaging components
│   └── reviews/                # Review components
├── pages/                      # Page components
├── layout.jsx                  # Main layout
├── App.jsx                     # App router
└── utils/                      # Utility functions
```

