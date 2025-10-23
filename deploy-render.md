# 🚀 Deploy to Render.com (Free Tier)

## Why Render?
- ✅ Truly free (no credit card needed)
- ✅ Easy deployment from GitHub
- ✅ Persistent server (your in-memory events persist while server is running)
- ⚠️ Spins down after 15 min inactivity (wakes up in ~30 seconds)

---

## Step-by-Step Deployment

### Step 1: Secure Your API Key (If Not Done)

**CRITICAL:** Do this first if you haven't already!

1. Go to: https://platform.openai.com/api-keys
2. Delete old key: `sk-proj-3yC2Sx6L...`
3. Create new key
4. Update `.env` file:
   ```bash
   OPENAI_API_KEY=your_new_key_here
   PORT=3000
   ```

---

### Step 2: Push to GitHub

**Clean git history first:**
```bash
./clean-git-history.sh
```

**Or manual method:**
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

**Create GitHub repository:**
1. Go to: https://github.com/new
2. Name: `personal-assistant-chat`
3. Visibility: Private (recommended)
4. Don't initialize with README
5. Click "Create repository"

**Push code:**
```bash
git remote add origin https://github.com/YOUR_USERNAME/personal-assistant-chat.git
git branch -M main
git push -u origin main
```

---

### Step 3: Deploy on Render

**1. Sign up:**
- Go to: https://render.com/
- Click "Get Started for Free"
- Sign up with GitHub (easiest)

**2. Create new Web Service:**
- Click "New +" button
- Select "Web Service"
- Click "Connect Account" to link GitHub
- Find and select `personal-assistant-chat` repo

**3. Configure service:**

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `personal-assistant-chat` (or your choice) |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Root Directory** | (leave empty) |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | `Free` |

**4. Add Environment Variables:**

Click "Advanced" → Add environment variables:

| Key | Value |
|-----|-------|
| `OPENAI_API_KEY` | Your new API key |
| `NODE_ENV` | `production` |

**Note:** PORT is automatically set by Render, no need to add it.

**5. Deploy:**
- Click "Create Web Service"
- Render will build and deploy (takes 2-3 minutes)
- Watch the logs for any errors

---

### Step 4: Get Your URL

Once deployed:
1. You'll see your URL at the top: `https://your-app-name.onrender.com`
2. Click it to open your app
3. Test chat and calendar features

---

### Step 5: Important Render.yaml (Optional)

I already created a `render.yaml` file for you. This allows you to deploy with one click in the future.

To use it:
1. In Render dashboard, click "New +" → "Blueprint"
2. Connect your repo
3. Render reads `render.yaml` automatically

---

## ⚠️ Free Tier Limitations

**Render Free Tier:**
- Spins down after 15 minutes of inactivity
- Takes 30-50 seconds to wake up on first request
- 750 hours/month of runtime (plenty!)
- In-memory data (events, chats) persists while server is running
- Data LOST when server spins down or restarts

**Solutions for data persistence:**
- Add a database (PostgreSQL) - Render offers free tier
- Users rely on localStorage (already implemented)
- Ping service to keep alive (not recommended for free tier)

---

## 🎯 After Deployment

### Test Your App

1. Visit your Render URL
2. Send a chat message
3. Create a calendar event
4. Verify everything works

### Monitor

- View logs: Click "Logs" tab in Render dashboard
- Check events: Click "Events" tab
- Monitor metrics: Click "Metrics" tab

### Set OpenAI Limits

1. Go to: https://platform.openai.com/account/billing/limits
2. Set monthly limit (e.g., $10)
3. Set email alerts

---

## 🔧 Updating Your App

When you make code changes:

```bash
# Commit changes
git add .
git commit -m "Your update message"

# Push to GitHub
git push origin main

# Render automatically redeploys!
```

---

## 💰 Cost Breakdown

| Service | Free Tier | Paid |
|---------|-----------|------|
| **Render** | ✅ Free forever | $7/month for always-on |
| **OpenAI API** | Pay per use | ~$5-20/month typical |
| **GitHub** | ✅ Free (private repos) | - |

**Total:** ~$5-20/month (OpenAI only)

---

## 🆘 Troubleshooting

### "Build failed"
- Check Render logs for errors
- Verify `package.json` is correct
- Ensure all dependencies are listed

### "Application Error"
- Check environment variables are set
- View logs for specific error
- Verify OPENAI_API_KEY is valid

### "502 Bad Gateway"
- Server is waking up from sleep (wait 30 seconds)
- Or check logs for startup errors

### "OpenAI API Error"
- Verify API key is correct
- Check OpenAI billing/limits
- Check OpenAI status: https://status.openai.com

---

## 📱 Keep Your App Alive

Free tier spins down after 15 min. Options:

**Option 1: Accept it**
- First request takes 30 seconds
- Subsequent requests are fast
- Good for personal use

**Option 2: Upgrade to paid ($7/month)**
- Always on
- No spin-down
- Better for sharing

**Option 3: Use a ping service (not recommended)**
- Services like cron-job.org
- Pings your app every 14 minutes
- Keeps it awake
- Uses up free hours quickly

---

## ✅ Success Checklist

- [ ] Old API key revoked
- [ ] New API key created
- [ ] Git history cleaned
- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Web service deployed
- [ ] Environment variables set
- [ ] App tested and working
- [ ] OpenAI spending limit set

---

## 🎉 You're Live!

Your app is now deployed at: `https://your-app.onrender.com`

You can access it from anywhere! Share the URL with others if you like.

**Next steps:**
- Bookmark your app URL
- Set up email notifications in Render
- Monitor OpenAI usage
- Consider adding a database for persistence
