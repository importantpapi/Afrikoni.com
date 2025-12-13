#!/bin/bash

# Afrikoni Marketplace - Complete Installation Script
# This script installs everything needed to run the project

set -e

echo "🚀 Afrikoni Marketplace - Complete Installation"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node.js
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found${NC}"
    echo ""
    echo "Please install Node.js:"
    echo "1. Download from: https://nodejs.org/en/download/"
    echo "2. Or install via Homebrew: brew install node@18"
    echo ""
    exit 1
fi

# Check npm
echo "📦 Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm installed: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Verify .env file
echo ""
echo "🔐 Checking environment variables..."
if [ -f ".env" ]; then
    if grep -q "VITE_SUPABASE_URL" .env; then
        echo -e "${GREEN}✅ .env file exists with Supabase configuration${NC}"
    else
        echo -e "${YELLOW}⚠️ .env file exists but missing Supabase URL${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ .env file not found - please create it${NC}"
fi

# Test build
echo ""
echo "🔨 Testing production build..."
if npm run build; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Summary
echo ""
echo "================================================"
echo -e "${GREEN}✅ Installation Complete!${NC}"
echo ""
echo "To start development server:"
echo "  npm run dev"
echo ""
echo "To preview production build:"
echo "  npm run preview"
echo ""

