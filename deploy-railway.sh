#!/bin/bash

echo "🚂 Railway Deployment Script"
echo "============================"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check for .env file
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found!"
    echo "Please create a .env file with your OPENAI_API_KEY"
    exit 1
fi

# Get API key from .env
OPENAI_KEY=$(grep OPENAI_API_KEY .env | cut -d '=' -f2)

if [ -z "$OPENAI_KEY" ]; then
    echo "❌ ERROR: OPENAI_API_KEY not found in .env file!"
    exit 1
fi

echo "✅ Found OPENAI_API_KEY in .env"
echo ""

# Check if user needs to login
echo "Step 1: Login to Railway"
echo "------------------------"
echo "A browser window will open for authentication."
echo "If you don't have a Railway account, create one (it's free!)"
echo ""
read -p "Press Enter to login to Railway..."

railway login

echo ""
echo "Step 2: Create/Link Railway Project"
echo "-----------------------------------"
echo ""
echo "Choose an option:"
echo "1) Create a new Railway project"
echo "2) Link to an existing Railway project"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" == "1" ]; then
    echo ""
    echo "Creating new Railway project..."
    railway init
elif [ "$choice" == "2" ]; then
    echo ""
    echo "Linking to existing project..."
    railway link
else
    echo "❌ Invalid choice"
    exit 1
fi

echo ""
echo "Step 3: Set Environment Variables"
echo "---------------------------------"
echo "Setting OPENAI_API_KEY..."
railway variables set OPENAI_API_KEY="$OPENAI_KEY"

echo "Setting PORT..."
railway variables set PORT=3000

echo ""
echo "✅ Environment variables set!"

echo ""
echo "Step 4: Deploy to Railway"
echo "-------------------------"
read -p "Deploy now? (yes/no): " deploy

if [ "$deploy" == "yes" ]; then
    echo ""
    echo "🚀 Deploying..."
    railway up

    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "Getting deployment URL..."
    railway status

    echo ""
    echo "🎉 Your app should be live!"
    echo ""
    echo "Useful commands:"
    echo "  railway logs        - View logs"
    echo "  railway status      - Check deployment status"
    echo "  railway open        - Open app in browser"
    echo "  railway domain      - Manage custom domain"
else
    echo ""
    echo "⏸️  Deployment skipped."
    echo ""
    echo "To deploy later, run:"
    echo "  railway up"
fi

echo ""
echo "📚 Next steps:"
echo "1. Run: railway open       (opens your app)"
echo "2. Run: railway logs       (view logs)"
echo "3. Set spending limit on OpenAI dashboard"
echo ""
