#!/bin/bash

# 🚀 Afrikoni Marketplace - Deployment Script
# This script helps deploy the application to Vercel

set -e  # Exit on error

echo "🚀 Afrikoni Marketplace - Deployment Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Are you in the project root?${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Project directory verified${NC}"
echo ""

# Step 2: Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Step 3: Run build
echo -e "${YELLOW}📦 Building project...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
    echo ""
else
    echo -e "${RED}❌ Build failed! Please fix errors before deploying.${NC}"
    exit 1
fi

# Step 4: Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
    echo ""
fi

# Step 5: Check environment variables
echo -e "${YELLOW}🔍 Checking environment variables...${NC}"
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo -e "${RED}⚠️  Warning: VITE_SUPABASE_URL not set in environment${NC}"
    echo "   Make sure to set it in Vercel dashboard after deployment"
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}⚠️  Warning: VITE_SUPABASE_ANON_KEY not set in environment${NC}"
    echo "   Make sure to set it in Vercel dashboard after deployment"
fi

echo ""
echo -e "${GREEN}✅ Ready to deploy!${NC}"
echo ""
echo "Next steps:"
echo "1. Run: vercel --prod"
echo "2. Or: vercel (for preview deployment first)"
echo ""
echo "After deployment, set these environment variables in Vercel dashboard:"
echo "  - VITE_SUPABASE_URL"
echo "  - VITE_SUPABASE_ANON_KEY"
echo "  - VITE_OPENAI_API_KEY (optional, for KoniAI)"
echo ""

# Ask if user wants to deploy now
read -p "Deploy to Vercel now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🚀 Deploying to Vercel...${NC}"
    vercel --prod
else
    echo -e "${GREEN}✅ Ready to deploy! Run 'vercel --prod' when ready.${NC}"
fi

