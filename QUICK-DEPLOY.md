# Quick Start Deployment Guide

## Deploy to Railway (Fastest - 2 minutes)

1. **Visit Railway**: https://railway.app
2. **Sign in** with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Select**: `deepakkumar-m/pdf-toolkit`
5. **Railway auto-deploys** (detects Dockerfile)
6. **Done!** Get your URL from the deployment

That's it! Railway automatically:
- Builds the Docker image
- Installs Ghostscript
- Deploys with HTTPS
- Gives you a public URL

## Local Docker Test (Optional)

```bash
# Build
docker build -t pdf-toolkit .

# Run
docker run -p 3000:3000 pdf-toolkit

# Visit http://localhost:3000
```

## Environment Variables (Set in Railway dashboard)

- `NODE_ENV=production`
- `GS_EXEC=/usr/bin/gs`

## Need More Options?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- Render.com deployment
- Fly.io deployment
- Koyeb deployment
- Custom domain setup
- Troubleshooting

---

**Estimated deployment time**: 2-3 minutes ⚡
**Cost**: Free (Railway's free tier: 500 hours/month) 💰
