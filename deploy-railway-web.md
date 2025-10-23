# 🚂 Deploy to Railway (Web Dashboard Method)

## Prerequisites

- [ ] New OpenAI API key created (old one revoked)
- [ ] `.env` file updated with new key
- [ ] App tested locally (`npm start` works)

---

## Option 1: Deploy from GitHub (Recommended)

### Step 1: Prepare GitHub Repository

**IMPORTANT:** Your API key is in git history, so you must clean it first!

```bash
# Run the cleanup script
./clean-git-history.sh
```

If script doesn't work, manual method:
```bash
# Backup
cp -r . ../personal-assistant-chat-backup

# Remove git history
rm -rf .git

# Fresh start
git init
git add .
git commit -m "Initial commit"
```

### Step 2: Push to GitHub

**Create new GitHub repository:**
1. Go to: https://github.com/new
2. Name: `personal-assistant-chat`
3. Make **Private** (recommended)
4. **Don't** initialize with README
5. Click "Create repository"

**Push your code:**
```bash
git remote add origin https://github.com/YOUR_USERNAME/personal-assistant-chat.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Railway

1. Go to: https://railway.app/
2. Click "**Start a New Project**"
3. Select "**Deploy from GitHub repo**"
4. Authorize Railway (if first time)
5. Select your `personal-assistant-chat` repository
6. Railway auto-detects Node.js ✅

### Step 4: Add Environment Variables

1. In your Railway project, click on your service
2. Go to "**Variables**" tab
3. Click "**+ New Variable**"
4. Add:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** Your new API key
5. Click "Add"
6. Add another:
   - **Name:** `PORT`
   - **Value:** `3000`
7. Railway will automatically redeploy

### Step 5: Get Your URL

1. Click on "**Settings**" tab
2. Scroll to "**Networking**"
3. Click "**Generate Domain**"
4. Copy your URL: `https://your-app.up.railway.app`

### Step 6: Test Your App

1. Click the generated URL
2. Test chat functionality
3. Test calendar events
4. Check Railway logs for errors (Deployments → View Logs)

---

## Option 2: Deploy via Railway CLI (Manual)

Since the browserless login didn't work, you'll need to:

### On Your Local Machine (not VSCode terminal):

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login (opens browser)
railway login

# Link to project
railway link

# Or create new project
railway init
```

### Set Environment Variables:

```bash
# Get your new API key
railway variables set OPENAI_API_KEY=your_new_key_here
railway variables set PORT=3000
```

### Deploy:

```bash
railway up
```

---

## Option 3: Direct Deploy (No GitHub)

If you want to deploy without GitHub:

1. Go to: https://railway.app/
2. Click "**New Project**"
3. Select "**Deploy from local directory**"
4. Follow Railway's instructions
5. Add environment variables as above

---

## ⚠️ IMPORTANT: Security Checklist

Before deploying:

- [ ] Old API key (`sk-proj-3yC2Sx6L...`) is **revoked**
- [ ] New API key created
- [ ] `.env` updated with new key
- [ ] Git history cleaned (no exposed keys)
- [ ] `.env.example` has placeholder values only
- [ ] Tested locally

After deploying:

- [ ] Set OpenAI spending limit: https://platform.openai.com/account/billing/limits
- [ ] Test deployed app works
- [ ] Monitor Railway logs for errors
- [ ] Check OpenAI usage

---

## 🎯 Recommended Path

**For easiest deployment:**

1. **Clean git history**
   ```bash
   ./clean-git-history.sh
   ```

2. **Push to GitHub**
   - Create private repo
   - Push cleaned code

3. **Deploy on Railway**
   - Use "Deploy from GitHub repo"
   - Add environment variables
   - Get your URL

**Total time:** ~10 minutes

---

## 💰 Costs

- **Railway:** Free tier with $5/month credit (plenty for this app)
- **OpenAI API:** ~$0.15-0.60 per 1M tokens (set spending limit!)

---

## 🆘 Troubleshooting

**"Build failed"**
- Check Railway logs
- Verify `package.json` has all dependencies
- Ensure `start` script exists

**"Application error"**
- Check environment variables are set
- View logs in Railway dashboard
- Verify OPENAI_API_KEY is correct

**"Can't connect to OpenAI"**
- Verify API key is valid
- Check OpenAI status: https://status.openai.com
- Ensure spending limits not exceeded

---

## 📚 Useful Commands

```bash
# Railway CLI (if you get it working)
railway logs              # View logs
railway status            # Check deployment
railway open              # Open app in browser
railway variables         # List env vars
railway link              # Link to existing project
```

---

## ✅ Success!

Once deployed, your app will be at:
`https://your-app-name.up.railway.app`

Share this URL to access your personal assistant from anywhere! 🎉
