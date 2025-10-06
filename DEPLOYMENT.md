# Deployment Guide

## Quick Start Deployment Options

### Option 1: Railway.app (Recommended - Easiest)

1. **Sign up at [Railway.app](https://railway.app)**

2. **Deploy from GitHub:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose this repository
   - Railway auto-detects Node.js

3. **Add Environment Variables:**
   - Go to your project → Variables
   - Add: `OPENAI_API_KEY` = your-api-key-here
   - Add: `PORT` = 3000

4. **Deploy:**
   - Railway automatically deploys
   - You'll get a URL like: `https://your-app.up.railway.app`

**Cost:** Free tier with $5/month credit

---

### Option 2: Render.com

1. **Sign up at [Render.com](https://render.com)**

2. **Create New Web Service:**
   - Connect your GitHub repository
   - Render detects Node.js automatically

3. **Configure:**
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Add Environment Variable: `OPENAI_API_KEY`

4. **Deploy:**
   - Click "Create Web Service"
   - Free tier available (spins down after 15 min inactivity)

---

### Option 3: Vercel (Serverless)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Add Environment Variables:**
   - Go to Vercel dashboard → Settings → Environment Variables
   - Add `OPENAI_API_KEY`

4. **Redeploy:**
   ```bash
   vercel --prod
   ```

⚠️ **Warning:** Vercel uses serverless functions. Your in-memory data (conversations, events) will reset frequently.

---

### Option 4: Docker (Any Cloud Provider)

1. **Build Docker image:**
   ```bash
   docker build -t personal-assistant-chat .
   ```

2. **Run locally to test:**
   ```bash
   docker run -p 3000:3000 -e OPENAI_API_KEY=your-key personal-assistant-chat
   ```

3. **Deploy to:**
   - DigitalOcean App Platform
   - AWS ECS/Fargate
   - Google Cloud Run
   - Azure Container Apps

---

## Important: Data Persistence Issues

### ⚠️ Current Limitations

Your app currently stores data **in-memory** (RAM):
- Chat conversations
- Calendar events

**This means:**
- ❌ Data is lost when server restarts
- ❌ Data is lost on redeployment
- ❌ Multiple server instances don't share data
- ❌ Not suitable for production use with multiple users

### ✅ Solutions for Production

#### Option A: Add Database (Recommended)

**For PostgreSQL:**
```bash
npm install pg
```

**For MongoDB:**
```bash
npm install mongodb
```

Most platforms (Railway, Render) offer free PostgreSQL/MongoDB databases.

#### Option B: Add Redis (Session Storage)

```bash
npm install redis
```

Railway/Render offer Redis add-ons.

#### Option C: Use Platform Storage

Some platforms offer persistent volumes, but this is more complex.

---

## Pre-Deployment Checklist

- [ ] Set `OPENAI_API_KEY` in environment variables
- [ ] Update `.gitignore` to exclude `.env` file
- [ ] Test locally: `npm start`
- [ ] Check all API endpoints work
- [ ] Verify calendar event creation/deletion
- [ ] Test chat functionality
- [ ] Add error handling for API failures
- [ ] Set up monitoring/logging (optional)

---

## Post-Deployment Steps

1. **Test the deployed app:**
   - Open the provided URL
   - Send a chat message
   - Create a calendar event
   - Verify localStorage persistence

2. **Monitor logs:**
   - Check for errors
   - Monitor API usage
   - Watch OpenAI costs

3. **Set up custom domain (optional):**
   - Most platforms support custom domains
   - Configure DNS settings

---

## Cost Estimates

| Platform | Free Tier | Paid |
|----------|-----------|------|
| Railway | $5/month credit | Pay as you go |
| Render | ✅ Free (with limits) | $7/month+ |
| Vercel | ✅ Free (serverless) | $20/month+ |
| Heroku | ❌ Discontinued free tier | $5/month+ |

**OpenAI API Costs:**
- GPT-4o-mini: ~$0.15-0.60 per 1M tokens
- Estimated: $5-20/month for moderate use

---

## Recommended Next Steps for Production

1. **Add Database:**
   - Store conversations permanently
   - Store calendar events
   - Enable multi-user support

2. **Add Authentication:**
   - User login/signup
   - Protect personal data
   - Separate user sessions

3. **Add Rate Limiting:**
   - Prevent API abuse
   - Control OpenAI costs

4. **Add Error Handling:**
   - Graceful API failures
   - User-friendly error messages

5. **Add Monitoring:**
   - Error tracking (Sentry)
   - Analytics
   - Performance monitoring

---

## Quick Deploy Commands

### Railway:
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

### Render:
1. Push to GitHub
2. Connect repo in Render dashboard
3. Click "Deploy"

### Vercel:
```bash
npm i -g vercel
vercel --prod
```

---

## Need Help?

- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
