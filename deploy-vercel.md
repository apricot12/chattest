# 🔺 Deploy to Vercel (Serverless)

## ⚠️ Important Limitations

Vercel uses **serverless functions**. This means:
- ❌ In-memory data resets on every request
- ❌ Your calendar events won't persist server-side
- ✅ Chat/events persist in browser (localStorage) only
- ✅ Good for testing, not ideal for production

**Use Render.com instead for better persistence!**

---

## If You Still Want to Use Vercel

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Deploy

```bash
# Login (opens browser)
vercel login

# Deploy
vercel

# Follow prompts, then:
# Set project name
# Link to existing project or create new
```

### Step 3: Add Environment Variable

```bash
# In Vercel dashboard: https://vercel.com
# Go to your project → Settings → Environment Variables
# Add:
# Name: OPENAI_API_KEY
# Value: your_new_key_here
```

### Step 4: Redeploy

```bash
vercel --prod
```

---

## Better Alternative: Use Render

See `deploy-render.md` for a better deployment option!
