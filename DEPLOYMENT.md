# Deployment Guide: Render + Netlify

This guide explains how to deploy the PDF Toolkit with the backend on Render and frontend on Netlify.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│   Netlify       │         │    Render        │
│   (Frontend)    │  ─────→ │   (Backend)      │
│   Next.js       │   API   │   Express + GS   │
└─────────────────┘         └──────────────────┘
```

## Part 1: Deploy Backend to Render

### Step 1: Push to GitHub

Ensure your code (including the `backend/` folder) is pushed to GitHub.

### Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up or log in with GitHub

### Step 3: Deploy Web Service

1. Click **New** → **Web Service**
2. Connect your GitHub repository: `pdf-toolkit`
3. Configure:
   - **Name**: `pdf-toolkit-api` (or any name you prefer)
   - **Root Directory**: `backend`
   - **Environment**: `Docker`
   - **Region**: Select closest to your users (e.g., Oregon)
   - **Branch**: `main`
   - **Dockerfile Path**: `./Dockerfile`
   - **Docker Build Context Directory**: `backend`

4. **Instance Type**: Select **Starter** ($7/month)
   - 512 MB RAM
   - Shared CPU
   - Good for most PDFs up to 200 MB

5. **Environment Variables** - Add these:
   ```
   NODE_ENV=production
   PORT=3001
   FRONTEND_URL=https://your-app.netlify.app
   ```
   (Replace `your-app.netlify.app` with your actual Netlify domain)

6. **Advanced Settings**:
   - Health Check Path: `/health`
   - Auto-Deploy: Yes (recommended)

7. Click **Create Web Service**

### Step 4: Wait for Deployment

- First deployment takes 5-10 minutes
- Render will build the Docker image with Ghostscript
- Monitor logs in the dashboard

### Step 5: Test Your Backend

Once deployed, note your Render URL (e.g., `https://pdf-toolkit-api.onrender.com`)

Test the health endpoint:
```bash
curl https://pdf-toolkit-api.onrender.com/health
```

Should return:
```json
{
  "status": "ok",
  "service": "pdf-compression",
  "timestamp": "..."
}
```

## Part 2: Update & Deploy Frontend to Netlify

### Step 1: Update Environment Variable

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add or update:
   ```
   NEXT_PUBLIC_COMPRESSION_API_URL=https://pdf-toolkit-api.onrender.com
   ```
   (Use your actual Render URL)

### Step 2: Update Backend CORS

Go back to Render dashboard:
1. Select your web service
2. Go to **Environment** tab
3. Update `FRONTEND_URL` to your Netlify domain:
   ```
   FRONTEND_URL=https://your-app.netlify.app
   ```
4. Save changes (Render will auto-redeploy)

### Step 3: Deploy Frontend

Push your changes to GitHub:
```bash
git add .
git commit -m "Configure external backend API"
git push
```

Netlify will automatically rebuild and deploy.

### Step 4: Test End-to-End

1. Visit your Netlify site
2. Go to Compress PDF tool
3. Upload a PDF
4. Select compression level
5. Click Compress
6. Should work without timeouts!

## Cost Summary

- **Render Starter**: $7/month (backend)
- **Netlify Free**: $0 (frontend) - or Pro at $19/month for better limits
- **Total**: $7-26/month

## Monitoring

### Render Monitoring
- View logs: Dashboard → Your Service → Logs
- Monitor metrics: CPU, memory usage
- Set up alerts for downtime

### Netlify Monitoring
- View build logs
- Monitor function invocations (local API still works as fallback)
- Analytics available on Pro plan

## Troubleshooting

### Backend Issues

**Problem**: Render service shows "Build failed"
- Check Dockerfile syntax
- Ensure `backend/` directory structure is correct
- Check Render logs for specific error

**Problem**: CORS errors in frontend
- Verify `FRONTEND_URL` is set correctly in Render
- Must include `https://` protocol
- No trailing slash

**Problem**: "Ghostscript not found"
- Check Dockerfile includes `apt-get install ghostscript`
- Verify build logs show successful GS installation

### Frontend Issues

**Problem**: Still hitting Netlify Functions timeout
- Verify `NEXT_PUBLIC_COMPRESSION_API_URL` is set
- Check Network tab in browser - should call Render, not `/api/compress`
- Environment variable must start with `NEXT_PUBLIC_`

**Problem**: Files not compressing
- Check browser console for errors
- Verify Render service is running (check health endpoint)
- Check Render logs for backend errors

## Local Development

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env to set FRONTEND_URL=http://localhost:3000
npm run dev
```

Backend runs on `http://localhost:3001`

### Frontend
```bash
npm install
# Create .env.local with: NEXT_PUBLIC_COMPRESSION_API_URL=http://localhost:3001
npm run dev
```

Frontend runs on `http://localhost:3000`

## Scaling Up

If you process many PDFs or very large files:

1. **Upgrade Render Plan**:
   - Standard: $25/month (2 GB RAM)
   - Pro: $85/month (4 GB RAM)

2. **Add Caching**:
   - Implement Redis for duplicate detection
   - Cache compression results

3. **Add Queue System**:
   - Use Bull or BullMQ for job queue
   - Process compressions asynchronously

4. **Multiple Instances**:
   - Render supports auto-scaling
   - Load balancing built-in

## Security Checklist

- ✅ CORS restricted to your domain
- ✅ File size limits (200 MB)
- ✅ File type validation
- ✅ Temp files cleaned up immediately
- ✅ No file storage - memory only
- ✅ HTTPS enforced by Render
- ✅ Environment variables for secrets

## Backup Plan

If Render has issues, the frontend still has client-side compression fallback. Users can still compress PDFs in their browser (though less effective than Ghostscript).

## Questions?

Check logs first:
- Render: Dashboard → Your Service → Logs
- Netlify: Dashboard → Your Site → Deploys → Deploy log

Common patterns:
- CORS errors → Check `FRONTEND_URL` 
- Timeout → File too large, upgrade plan
- 500 errors → Check Render backend logs
