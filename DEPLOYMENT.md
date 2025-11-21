# Deployment Guide - PDF Toolkit

This guide covers deploying your containerized PDF Toolkit to free hosting platforms.

## Prerequisites

- Git repository (already have this on GitHub)
- Docker installed locally (for testing)
- Account on your chosen hosting platform

## Local Docker Testing

### Build and run locally:

```bash
# Build the Docker image
docker build -t pdf-toolkit .

# Run the container
docker run -p 3000:3000 pdf-toolkit

# Or use docker-compose
docker-compose up
```

Visit `http://localhost:3000` to test.

## Free Hosting Options

### 1. Railway.app (Recommended - Easiest)

**Pros**: 500 hours free/month, automatic deployments, built-in domains, excellent for Docker
**Cons**: Credit card required (but not charged on free tier)

**Steps**:
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `pdf-toolkit` repository
5. Railway auto-detects Dockerfile and deploys
6. Get your public URL: `https://your-app.up.railway.app`

**Environment Variables** (Railway dashboard):
- `NODE_ENV=production`
- `GS_EXEC=/usr/bin/gs`

**Free Tier Limits**:
- $5 usage credit/month
- 500 execution hours
- 100GB bandwidth

---

### 2. Render.com

**Pros**: True free tier (no credit card), 750 hours/month, custom domains
**Cons**: Slower cold starts, instances sleep after 15 min inactivity

**Steps**:
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your `pdf-toolkit` repo
5. Configure:
   - **Name**: pdf-toolkit
   - **Runtime**: Docker
   - **Instance Type**: Free
   - **Port**: 3000 (auto-detected)
6. Add environment variables:
   - `NODE_ENV=production`
   - `GS_EXEC=/usr/bin/gs`
7. Click "Create Web Service"
8. Get URL: `https://pdf-toolkit.onrender.com`

**Free Tier Limits**:
- 750 hours/month
- Spins down after 15 min inactivity
- 100GB bandwidth/month

---

### 3. Fly.io

**Pros**: Generous free tier, fast edge network, great performance
**Cons**: CLI-based deployment, slightly more complex

**Steps**:

1. Install Fly CLI:
```bash
# macOS
brew install flyctl

# Or via script
curl -L https://fly.io/install.sh | sh
```

2. Sign up and authenticate:
```bash
flyctl auth signup
# or
flyctl auth login
```

3. Initialize and deploy:
```bash
cd /Users/deepak/Documents/GitHub/pdf-toolkit

# Create fly.toml config
flyctl launch --no-deploy

# Edit the generated fly.toml if needed, then:
flyctl deploy
```

4. Set environment:
```bash
flyctl secrets set NODE_ENV=production
flyctl secrets set GS_EXEC=/usr/bin/gs
```

5. Open your app:
```bash
flyctl open
```

**Free Tier Limits**:
- 3 shared-cpu VMs
- 3GB storage
- 160GB bandwidth/month

---

### 4. Koyeb

**Pros**: Good free tier, no credit card, automatic SSL
**Cons**: Smaller community, fewer integrations

**Steps**:
1. Go to [koyeb.com](https://www.koyeb.com)
2. Sign up with GitHub
3. Click "Create App" → "GitHub"
4. Select repository
5. Choose "Docker" builder
6. Set environment:
   - `NODE_ENV=production`
   - `GS_EXEC=/usr/bin/gs`
7. Deploy

**Free Tier**:
- 512 MB RAM
- 2 GB disk
- 100 GB bandwidth

---

## Recommended Choice

**For you, I recommend Railway** because:
1. ✅ Easiest setup (one-click deploy from GitHub)
2. ✅ Auto-detects Dockerfile
3. ✅ No cold starts (always warm)
4. ✅ Automatic deployments on git push
5. ✅ Built-in monitoring & logs
6. ✅ 500 hours free (enough for personal use)

---

## Post-Deployment Checklist

After deploying to any platform:

- [ ] Test PDF upload and compression
- [ ] Test all PDF tools (merge, split, rotate, etc.)
- [ ] Verify Ghostscript compression works
- [ ] Test OCR functionality
- [ ] Check response times
- [ ] Set up custom domain (optional)
- [ ] Configure GitHub Actions for CI/CD (optional)

---

## Custom Domain Setup

### Railway:
1. Go to Settings → Domains
2. Add custom domain
3. Update DNS records (Railway provides instructions)

### Render:
1. Go to Settings → Custom Domain
2. Follow DNS setup instructions

---

## Monitoring & Logs

### Railway:
```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# View logs
railway logs
```

### Render:
- View logs in dashboard under "Logs" tab
- Real-time streaming available

### Fly.io:
```bash
# View logs
flyctl logs

# SSH into instance
flyctl ssh console
```

---

## Troubleshooting

### Issue: "Ghostscript not found"
- **Solution**: Ensure `GS_EXEC=/usr/bin/gs` is set in environment variables
- **Check**: Our Dockerfile already installs Ghostscript

### Issue: "Out of memory"
- **Solution**: Optimize memory usage or upgrade tier
- **Check**: Large PDF files (>50MB) might need more RAM

### Issue: "Slow cold starts" (Render)
- **Solution**: Keep app warm with uptime monitoring (UptimeRobot)
- **Or**: Use Railway/Fly.io instead (no cold starts)

### Issue: Build fails
- **Solution**: Check build logs for specific errors
- **Common fix**: Ensure all dependencies in package.json

---

## Cost Optimization

All mentioned platforms have generous free tiers sufficient for personal/portfolio projects.

**If you exceed free limits:**
- Railway: ~$5-10/month for hobby tier
- Render: $7/month for always-on instance
- Fly.io: Pay-as-you-go (usually <$5/month)

---

## Next Steps

1. Choose your platform (I recommend Railway)
2. Follow the steps above
3. Deploy and test
4. Share your live URL!

Need help with a specific platform? Let me know!
