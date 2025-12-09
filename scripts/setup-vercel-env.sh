#!/bin/bash

# Vercel Environment Variables Setup Helper
# This script helps you verify and set Vercel environment variables

echo "🔧 Vercel Environment Variables Setup"
echo "======================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found."
    echo ""
    echo "📦 Install it with:"
    echo "   npm install -g vercel"
    echo ""
    echo "Or use the Vercel Dashboard:"
    echo "   https://vercel.com/dashboard"
    echo ""
    exit 1
fi

echo "✅ Vercel CLI found"
echo ""

# Read local .env file
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    ENV_FILE=".env.local"
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  No .env file found"
    exit 1
fi

echo "📋 Reading variables from: $ENV_FILE"
echo ""

# Extract VITE_ variables
VARS=$(grep "^VITE_" "$ENV_FILE" | grep -v "^#" | sed 's/^VITE_//')

if [ -z "$VARS" ]; then
    echo "⚠️  No VITE_ variables found in $ENV_FILE"
    exit 1
fi

echo "🔍 Found the following variables:"
echo "$VARS" | while IFS='=' read -r key value; do
    echo "   - VITE_$key"
done

echo ""
echo "📝 To add these to Vercel:"
echo ""
echo "   Option 1: Use Vercel Dashboard"
echo "   1. Go to: https://vercel.com/dashboard"
echo "   2. Select your project"
echo "   3. Go to: Settings → Environment Variables"
echo "   4. Add each variable manually"
echo ""
echo "   Option 2: Use Vercel CLI"
echo "   Run: vercel env add VITE_GA4_ID"
echo "   (Repeat for each variable)"
echo ""
echo "   Option 3: Bulk import (if supported)"
echo "   Check: vercel env --help"
echo ""

# Check if user wants to proceed with CLI
read -p "Do you want to add variables via CLI? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "$VARS" | while IFS='=' read -r key value; do
        echo "Adding VITE_$key..."
        echo "$value" | vercel env add "VITE_$key" production
    done
    echo ""
    echo "✅ Done! Variables added to Vercel."
else
    echo "ℹ️  Use the Vercel Dashboard to add variables manually."
fi

echo ""
echo "🔍 To verify variables are set:"
echo "   vercel env ls"
echo ""

