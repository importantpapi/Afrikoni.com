#!/bin/bash

# Email Service Setup Script for Afrikoni
# This script helps you configure Resend email service

echo "📧 Afrikoni Email Service Setup"
echo "================================"
echo ""
echo "Your domain 'afrikoni.com' is already verified in Resend!"
echo "We just need your API key to start sending emails."
echo ""

# Check if API key is provided as argument
if [ -z "$1" ]; then
  echo "Step 1: Get your Resend API Key"
  echo "--------------------------------"
  echo "1. Go to: https://resend.com/api-keys"
  echo "2. Click 'Create API Key'"
  echo "3. Name it: 'Afrikoni Production'"
  echo "4. Copy the key (starts with 're_')"
  echo ""
  read -p "Paste your Resend API key here: " API_KEY
  
  if [ -z "$API_KEY" ]; then
    echo "❌ No API key provided. Exiting."
    exit 1
  fi
else
  API_KEY=$1
fi

# Validate API key format
if [[ ! $API_KEY =~ ^re_ ]]; then
  echo "⚠️  Warning: API key should start with 're_'"
  read -p "Continue anyway? (y/n): " confirm
  if [ "$confirm" != "y" ]; then
    exit 1
  fi
fi

echo ""
echo "Step 2: Adding environment variables to Vercel..."
echo "---------------------------------------------------"

# Add email provider
echo "Adding VITE_EMAIL_PROVIDER..."
echo "resend" | npx vercel env add VITE_EMAIL_PROVIDER production

# Add API key
echo "Adding VITE_EMAIL_API_KEY..."
echo "$API_KEY" | npx vercel env add VITE_EMAIL_API_KEY production

echo ""
echo "✅ Environment variables added!"
echo ""
echo "Step 3: Next steps"
echo "------------------"
echo "1. The variables are now in Vercel"
echo "2. Redeploy your project:"
echo "   npx vercel --prod"
echo ""
echo "3. Test by subscribing to the newsletter"
echo "4. Check your inbox for the welcome email!"
echo ""
echo "📧 Email will be sent from: Afrikoni <hello@afrikoni.com>"
echo ""

