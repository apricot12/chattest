# 🪰 Deploy to Fly.io

## Overview

- ✅ Free tier: 3 VMs with 256MB RAM
- ✅ Always-on server
- ✅ Good for Node.js apps
- ⚠️ Requires credit card (for verification, not charged)

---

## Quick Deploy

### Step 1: Install Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
```

### Step 2: Login

```bash
flyctl auth login
```

### Step 3: Launch App

```bash
# In your project directory
flyctl launch

# Answer prompts:
# - App name: your-app-name
# - Region: choose closest
# - PostgreSQL: No
# - Redis: No
```

### Step 4: Set Environment Variables

```bash
flyctl secrets set OPENAI_API_KEY=your_new_key_here
```

### Step 5: Deploy

```bash
flyctl deploy
```

### Step 6: Open App

```bash
flyctl open
```

---

## Dockerfile Already Created

I've already created a `Dockerfile` for you, so Fly.io will work out of the box!

---

## Note

Fly.io requires a credit card for verification, even on free tier. If you don't want to provide one, **use Render.com instead** (see `deploy-render.md`).
