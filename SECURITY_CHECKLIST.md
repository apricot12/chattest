# 🔒 Security Checklist - Before GitHub Push

## ⚠️ CRITICAL - Do This First!

### 1. Revoke Exposed API Key
- [ ] Go to https://platform.openai.com/api-keys
- [ ] Find key starting with `sk-proj-3yC2Sx6L...`
- [ ] Click "Revoke" or delete it
- [ ] Verify it's revoked (should disappear from list)

### 2. Create New API Key
- [ ] Create new OpenAI API key
- [ ] Copy the new key (you'll only see it once!)
- [ ] Update `.env` file with new key
- [ ] Test that app works with new key: `npm start`

### 3. Clean Git History
- [ ] Run: `./clean-git-history.sh`
- [ ] OR manually remove `.git` folder and reinitialize
- [ ] Verify old key is not in history: `git log --all -p | grep "sk-proj"`

## ✅ Security Verification

### Environment Files
- [ ] `.env` is in `.gitignore`
- [ ] `.env` is NOT tracked by git: `git ls-files | grep .env` (should be empty)
- [ ] `.env.example` has placeholder values only
- [ ] `.env.example` has no real API keys

### Code Security
- [ ] No hardcoded API keys in code
- [ ] Server validates `OPENAI_API_KEY` on startup
- [ ] Pre-commit hook is installed and executable
- [ ] Test pre-commit hook prevents secrets

### Git Status
- [ ] Run: `git status` - no sensitive files staged
- [ ] Run: `git log --oneline` - history is clean
- [ ] Run: `git diff --cached` - no secrets in staged changes

## 🚀 Ready to Push

Once all checkboxes above are complete:

```bash
# Test the app one more time
npm start

# Create GitHub repo (if new)
# Go to: https://github.com/new

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## 🛡️ Additional Security (Recommended)

### Set Spending Limits
- [ ] Go to: https://platform.openai.com/account/billing/limits
- [ ] Set monthly limit (e.g., $10)
- [ ] Set email alerts for 50%, 75%, 90%

### Enable 2FA
- [ ] Enable 2FA on OpenAI account
- [ ] Enable 2FA on GitHub account

### Monitor Usage
- [ ] Bookmark: https://platform.openai.com/usage
- [ ] Check weekly for unexpected usage

### Add .github/dependabot.yml
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

## 📋 Deployment Platform Security

### Railway / Render / Vercel
- [ ] Add `OPENAI_API_KEY` as environment variable in dashboard
- [ ] Do NOT commit it to deployment config files
- [ ] Use platform's secret management

### GitHub Repository
- [ ] Make repo private (if contains sensitive logic)
- [ ] Enable security alerts
- [ ] Enable Dependabot security updates

## 🔄 Ongoing Security

### Regular Tasks
- [ ] Rotate API keys every 90 days
- [ ] Review OpenAI usage monthly
- [ ] Update dependencies: `npm audit fix`
- [ ] Check for security vulnerabilities: `npm audit`

### If Key Is Compromised
1. Revoke immediately at https://platform.openai.com/api-keys
2. Create new key
3. Update all deployments
4. Check usage logs for suspicious activity
5. Contact OpenAI support if needed

## 🆘 Emergency Contacts

- OpenAI Support: https://help.openai.com
- GitHub Support: https://support.github.com
- API Key Management: https://platform.openai.com/api-keys

## ✅ Final Check

Before pushing to GitHub, run:
```bash
# Should return nothing (no secrets)
git log --all -p | grep -E "sk-[a-zA-Z0-9]{32,}"

# Should list .env
git check-ignore .env

# Should NOT list .env
git ls-files | grep "^.env$"
```

If all checks pass: **YOU'RE SAFE TO PUSH! 🚀**
