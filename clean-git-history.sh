#!/bin/bash

echo "🚨 GIT HISTORY CLEANUP SCRIPT"
echo "=============================="
echo ""
echo "This script will remove git history and start fresh."
echo "This is necessary because your API key was committed to git history."
echo ""

# Safety check
read -p "⚠️  Have you revoked your old OpenAI API key? (yes/no): " revoked
if [ "$revoked" != "yes" ]; then
    echo "❌ Please revoke your old API key first:"
    echo "   https://platform.openai.com/api-keys"
    exit 1
fi

read -p "⚠️  Have you created a NEW API key and updated .env? (yes/no): " newkey
if [ "$newkey" != "yes" ]; then
    echo "❌ Please create a new API key and update your .env file first"
    exit 1
fi

echo ""
echo "Creating backup..."
cd ..
cp -r personal-assistant-chat personal-assistant-chat-backup
echo "✅ Backup created at ../personal-assistant-chat-backup"

cd personal-assistant-chat

echo ""
echo "Removing git history..."
rm -rf .git

echo ""
echo "Initializing fresh git repository..."
git init
git add .
git commit -m "Initial commit - cleaned history"

echo ""
echo "✅ Git history cleaned successfully!"
echo ""
echo "Next steps:"
echo "1. Test your app to make sure it still works"
echo "2. Create a new GitHub repository (or use existing)"
echo "3. Run these commands:"
echo ""
echo "   git remote add origin <your-github-repo-url>"
echo "   git branch -M main"
echo "   git push -u origin main --force"
echo ""
echo "⚠️  If using an existing repo, --force will overwrite it!"
echo "    Make sure you have backups of anything important."
