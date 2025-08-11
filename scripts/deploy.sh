#!/bin/bash

# NeuralHack Cognitive AI Deployment Script
# This script handles the deployment process to production

set -e

echo "🚀 Starting deployment process..."

# Check if required environment variables are set
if [ -z "$SUPABASE_PROJECT_REF" ]; then
    echo "❌ Error: SUPABASE_PROJECT_REF environment variable is not set"
    exit 1
fi

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ Error: SUPABASE_ACCESS_TOKEN environment variable is not set"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run tests
echo "🧪 Running tests..."
npm run test
npm run test:e2e

# Build the application
echo "🏗️ Building application..."
npm run build

# Run database migrations
echo "🗄️ Running database migrations..."
npx supabase link --project-ref $SUPABASE_PROJECT_REF
npx supabase db push

# Deploy to hosting platform
echo "🌐 Deploying to hosting platform..."
if [ "$DEPLOYMENT_TARGET" = "vercel" ]; then
    npx vercel --prod
elif [ "$DEPLOYMENT_TARGET" = "netlify" ]; then
    npx netlify deploy --prod --dir=dist
else
    echo "⚠️ No deployment target specified, skipping hosting deployment"
fi

echo "✅ Deployment completed successfully!"

# Send notification (if webhook is configured)
if [ -n "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"🚀 NeuralHack Cognitive AI deployed successfully to production!"}' \
        $SLACK_WEBHOOK
fi