# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Create `.env` File
Copy the example and add your Supabase credentials:
```bash
# Create .env file
cat > .env << EOF
VITE_SUPABASE_URL=https://qkeeufeiaphqylsnfhza.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZWV1ZmVpYXBocXlsc25maHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzYwNjYsImV4cCI6MjA4MDAxMjA2Nn0.CaGKQ3C5rz-XP-5r2I8xrHZ7F-5w4Z-1yzxtclddQus
EOF
```

### 3. Setup Supabase Storage
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Storage** → **New bucket**
4. Name: `files`
5. Make it **Public**
6. Click **Create bucket**

### 4. Run the App
```bash
npm run dev
```

Visit http://localhost:5173

## ✅ What's Already Done

- ✅ All database tables created
- ✅ All pages converted from Base44 to Supabase
- ✅ Authentication system ready
- ✅ File upload system ready
- ✅ All components created

## 🎯 First Steps

1. **Sign Up**: Create a new account at `/signup`
2. **Onboard**: Complete your company profile
3. **Explore**: Browse products, suppliers, and features

## 📝 Optional Setup

### Email Service
Update `src/api/supabaseClient.js` email helper with your service (Resend, SendGrid, etc.)

### AI Features
Add API keys to `.env` and update AI service files for full functionality

## 🐛 Troubleshooting

**"Missing Supabase environment variables"**
- Make sure `.env` file exists in root directory
- Restart dev server after creating `.env`

**"Storage bucket not found"**
- Create the `files` bucket in Supabase Storage
- Make sure it's set to public

**"Authentication errors"**
- Check Supabase URL and anon key are correct
- Verify RLS policies allow your operations

## 📚 More Info

- See `SETUP_INSTRUCTIONS.md` for detailed setup
- See `CONVERSION_COMPLETE.md` for conversion details
- See `README.md` for project overview

