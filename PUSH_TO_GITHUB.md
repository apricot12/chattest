# 🚀 How to Safely Push to GitHub

## 🚨 IMPORTANT: Read `SECURITY_INCIDENT.md` First!

Your OpenAI API key was exposed in git history. **Follow these steps exactly.**

---

## Step-by-Step Guide

### Step 1: Revoke Old API Key (5 minutes)

1. Open: https://platform.openai.com/api-keys
2. Find the exposed key: `sk-proj-3yC2Sx6L...`
3. Click the delete/revoke button
4. Confirm deletion

**Why:** Even though we removed it from the code, it's in git history. Anyone who accesses your repo can see it.

---

### Step 2: Create New API Key (2 minutes)

1. On the same page, click "Create new secret key"
2. Name it: "Personal Assistant - Production"
3. **COPY THE KEY** (you'll only see it once!)
4. Update your `.env` file:
   ```bash
   OPENAI_API_KEY=your_new_key_here
   PORT=3000
   ```

---

### Step 3: Test Your App (2 minutes)

```bash
# Start the server
npm start

# Open browser
# Go to: http://localhost:3000

# Test:
# - Send a chat message
# - Create a calendar event
# - Verify everything works
```

If it works, proceed. If not, check your `.env` file.

---

### Step 4: Clean Git History (1 minute)

**EASY METHOD** - Run the cleanup script:

```bash
./clean-git-history.sh
```

The script will:
- Create a backup
- Remove old git history
- Initialize fresh repository
- No more exposed keys in history!

**MANUAL METHOD** - If script doesn't work:

```bash
# Backup
cp -r . ../personal-assistant-chat-backup

# Remove git history
rm -rf .git

# Start fresh
git init
git add .
git commit -m "Initial commit"
```

---

### Step 5: Verify Security (2 minutes)

Run these commands to verify safety:

```bash
# Should return nothing (no secrets found)
git log --all -p | grep "sk-proj"

# Should confirm .env is ignored
git check-ignore .env

# Should be empty (no .env tracked)
git ls-files | grep "^.env$"

# Check what will be committed
git status
```

**If all checks pass, continue. If not, STOP and fix issues.**

---

### Step 6: Push to GitHub (5 minutes)

#### Option A: New Repository

1. Go to: https://github.com/new
2. Name: `personal-assistant-chat`
3. Make it **Private** (recommended) or Public
4. **DO NOT** initialize with README (we have one)
5. Click "Create repository"

Then run:
```bash
git remote add origin https://github.com/YOUR_USERNAME/personal-assistant-chat.git
git branch -M main
git push -u origin main
```

#### Option B: Existing Repository

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main --force
```

**⚠️ WARNING:** `--force` will overwrite existing repository!

---

### Step 7: Configure GitHub Repository (3 minutes)

After pushing:

1. Go to your GitHub repo
2. Click "Settings"
3. Go to "Secrets and variables" → "Actions"
4. Add repository secret:
   - Name: `OPENAI_API_KEY`
   - Value: Your new API key
5. (Optional) Make repo private if you haven't

---

## ✅ Deployment to Railway/Render/Vercel

### Railway (Recommended)

```bash
npm install -g @railway/cli
railway login
railway init
railway variables set OPENAI_API_KEY=your_new_key_here
railway up
```

Your app will be live at: `https://your-app.up.railway.app`

### Render

1. Go to: https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Add environment variable: `OPENAI_API_KEY`
5. Click "Create Web Service"

### Vercel

```bash
npm i -g vercel
vercel
# Follow prompts
# Add OPENAI_API_KEY in dashboard: https://vercel.com
vercel --prod
```

---

## 🛡️ Ongoing Security

### After Deployment

- [ ] Set OpenAI spending limit: https://platform.openai.com/account/billing/limits
- [ ] Monitor usage: https://platform.openai.com/usage
- [ ] Enable 2FA on OpenAI account
- [ ] Enable 2FA on GitHub account

### Weekly

- [ ] Check OpenAI usage/costs
- [ ] Check for suspicious activity

### Monthly

- [ ] Run `npm audit` for security issues
- [ ] Review and update dependencies

### Every 90 Days

- [ ] Rotate API keys (create new, update deployments, revoke old)

---

## 📚 Additional Resources

- `SECURITY_CHECKLIST.md` - Complete security checklist
- `SECURITY_INCIDENT.md` - Details about the security issue
- `DEPLOYMENT.md` - Full deployment guide
- `.env.example` - Environment variable template

---

## ❓ FAQ

**Q: Can I skip the git history cleanup?**
A: NO! The API key is in the history. Anyone can see it if you push.

**Q: What if I already pushed to GitHub?**
A: 1) Revoke the key IMMEDIATELY, 2) Clean history, 3) Force push cleaned version

**Q: Is my old API key still dangerous?**
A: Yes, until you revoke it. Revoke it first, before anything else.

**Q: Can I make the repo public?**
A: Yes, but ONLY after cleaning git history and verifying no secrets are committed.

**Q: What if someone already saw my key?**
A: Check OpenAI usage logs. Contact OpenAI support if you see suspicious activity.

---

## 🆘 Need Help?

If you're stuck:
1. Check `SECURITY_CHECKLIST.md` for detailed steps
2. Run `git status` and share output
3. Check OpenAI usage for suspicious activity
4. Contact OpenAI support if needed

---

## ✅ Success Checklist

Before closing this document, verify:

- [x] Old API key revoked
- [x] New API key created and tested
- [x] Git history cleaned
- [x] Security verification passed
- [x] Pushed to GitHub successfully
- [x] No secrets in repository
- [x] Deployment configured (optional)
- [x] Spending limits set

**If all checked: CONGRATULATIONS! Your repo is secure! 🎉**
