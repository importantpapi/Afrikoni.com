#!/bin/bash

# Google OAuth 2.0 Setup Script for Supabase
# This script helps you create OAuth credentials via Google Cloud API

set -e

echo "🔵 Google OAuth Setup for Supabase"
echo "=================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed."
    echo "   Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "🔐 Please log in to Google Cloud:"
    gcloud auth login
fi

# Get project ID
echo ""
read -p "Enter your Google Cloud Project ID (or press Enter to create new): " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo "Creating new project..."
    read -p "Enter project name (e.g., afrikoni-oauth): " PROJECT_NAME
    PROJECT_ID=$(gcloud projects create "$PROJECT_NAME" --format="value(projectId)" 2>/dev/null || echo "")
    
    if [ -z "$PROJECT_ID" ]; then
        echo "❌ Failed to create project. Please create one manually at:"
        echo "   https://console.cloud.google.com/"
        exit 1
    fi
    
    echo "✅ Created project: $PROJECT_ID"
fi

# Set the project
gcloud config set project "$PROJECT_ID"

# Enable Google+ API
echo ""
echo "📦 Enabling Google+ API..."
gcloud services enable plus.googleapis.com --project="$PROJECT_ID"

# Configure OAuth consent screen (required first)
echo ""
echo "📝 Configuring OAuth consent screen..."
echo "   You'll need to complete this in the web console:"
echo "   https://console.cloud.google.com/apis/credentials/consent?project=$PROJECT_ID"
echo ""
read -p "Press Enter after you've configured the OAuth consent screen..."

# Create OAuth 2.0 Client ID
echo ""
echo "🔑 Creating OAuth 2.0 Client ID..."
read -p "Enter a name for your OAuth client (e.g., Afrikoni Web Client): " CLIENT_NAME

REDIRECT_URI="https://qkeeufeiaphqylsnfhza.supabase.co/auth/v1/callback"

# Create the OAuth client using gcloud
CLIENT_OUTPUT=$(gcloud alpha iap oauth-clients create "$CLIENT_NAME" \
    --project="$PROJECT_ID" \
    --display_name="$CLIENT_NAME" \
    --redirect_uris="$REDIRECT_URI" 2>&1 || echo "ERROR")

if echo "$CLIENT_OUTPUT" | grep -q "ERROR"; then
    echo ""
    echo "⚠️  gcloud CLI method didn't work. Using web console method instead..."
    echo ""
    echo "📋 Please create OAuth credentials manually:"
    echo "   1. Go to: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
    echo "   2. Click '+ CREATE CREDENTIALS' → 'OAuth client ID'"
    echo "   3. Application type: Web application"
    echo "   4. Name: $CLIENT_NAME"
    echo "   5. Authorized redirect URIs: $REDIRECT_URI"
    echo "   6. Click 'Create'"
    echo ""
    read -p "Press Enter after you've created the OAuth client..."
fi

# Get the credentials
echo ""
echo "📋 Your OAuth credentials:"
echo "   Go to: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo "   Find your OAuth 2.0 Client ID and copy:"
echo "   - Client ID"
echo "   - Client Secret (click 'Show')"
echo ""
echo "🔗 Then add them to Supabase:"
echo "   https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/auth/providers"
echo ""
echo "✅ Done! Your OAuth client should be ready."

