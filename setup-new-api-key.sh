#!/bin/bash

echo "🔑 OpenAI API Key Setup"
echo "======================="
echo ""
echo "⚠️  SECURITY NOTICE:"
echo "Your current API key was exposed in git history."
echo "You need to create a NEW key before deploying."
echo ""
echo "Steps:"
echo "1. Go to: https://platform.openai.com/api-keys"
echo "2. Find the key: sk-proj-3yC2Sx6L..."
echo "3. Click 'Delete' or 'Revoke'"
echo "4. Click 'Create new secret key'"
echo "5. Copy the new key (you'll only see it once!)"
echo ""

read -p "Have you created a NEW API key? (yes/no): " created

if [ "$created" != "yes" ]; then
    echo ""
    echo "Please create a new key first, then re-run this script."
    echo "Visit: https://platform.openai.com/api-keys"
    exit 1
fi

echo ""
echo "Please paste your NEW OpenAI API key:"
read -s NEW_API_KEY

if [ -z "$NEW_API_KEY" ]; then
    echo "❌ No key entered!"
    exit 1
fi

# Validate key format
if [[ ! $NEW_API_KEY =~ ^sk- ]]; then
    echo "❌ Invalid key format. OpenAI keys start with 'sk-'"
    exit 1
fi

# Backup old .env
cp .env .env.backup
echo "✅ Backed up old .env to .env.backup"

# Update .env file
cat > .env << EOF
OPENAI_API_KEY=$NEW_API_KEY
PORT=3000
NODE_ENV=development
EOF

echo "✅ Updated .env file with new API key!"
echo ""

# Test the key
echo "Testing new API key..."
if npm start &
then
    sleep 5
    if curl -s http://localhost:3000/health > /dev/null; then
        echo "✅ Server started successfully with new key!"
        pkill -f "node server.js"
    else
        echo "⚠️  Server started but health check failed"
        pkill -f "node server.js"
    fi
else
    echo "❌ Server failed to start. Check your API key."
    exit 1
fi

echo ""
echo "✅ API key setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: ./deploy-railway.sh"
echo "2. Or follow manual deployment steps"
echo ""
