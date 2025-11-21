# PDF Toolkit Compression Backend

Backend API for PDF compression using Ghostscript. Designed to run on Render.com to handle large PDF files without serverless limitations.

## Features

- ✅ Ghostscript-powered PDF compression
- ✅ Handles files up to 200 MB
- ✅ No serverless timeout issues
- ✅ CORS enabled for frontend integration
- ✅ Health check endpoint
- ✅ Docker-based deployment

## Local Development

### Prerequisites

- Node.js 18+
- Ghostscript installed (`brew install ghostscript` on macOS or `apt-get install ghostscript` on Ubuntu)

### Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Edit `.env` and set your local frontend URL:
```env
FRONTEND_URL=http://localhost:3000
```

4. Start the server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

### Test Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Compress PDF
curl -X POST http://localhost:3001/api/compress \
  -F "file=@test.pdf" \
  -F "compressionLevel=high" \
  --output compressed.pdf
```

## Deploy to Render

### Option 1: Deploy via Dashboard (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `pdf-toolkit-api`
   - **Environment**: Docker
   - **Region**: Choose closest to your users
   - **Plan**: Starter ($7/month) or higher
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Health Check Path**: `/health`

5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `3001`
   - `FRONTEND_URL` = `https://your-frontend.netlify.app` (your actual Netlify URL)

6. Click **Create Web Service**

### Option 2: Deploy via render.yaml

1. Ensure `render.yaml` is in the backend directory
2. Connect your repo to Render
3. Render will automatically detect and deploy using the blueprint

### After Deployment

1. Note your Render service URL (e.g., `https://pdf-toolkit-api.onrender.com`)
2. Update your frontend environment variable `NEXT_PUBLIC_COMPRESSION_API_URL` to point to this URL
3. Add your Netlify URL to the `FRONTEND_URL` environment variable in Render

## API Endpoints

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "service": "pdf-compression",
  "timestamp": "2025-11-21T..."
}
```

### POST /api/compress
Compress a PDF file

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `file`: PDF file (max 200 MB)
  - `compressionLevel`: `low` | `medium` | `high` (optional, default: `medium`)

**Response:**
- Binary PDF file
- Headers:
  - `X-Original-Size`: Original file size in bytes
  - `X-Compressed-Size`: Compressed file size in bytes
  - `X-Compression-Ratio`: Compression ratio as percentage
  - `X-Compression-Effective`: `true` if compression reduced size
  - `X-Processing-Time`: Processing time in seconds

## Compression Levels

- **Low**: Best quality (200 DPI, `/printer` preset)
- **Medium**: Balanced (120 DPI, `/ebook` preset)
- **High**: Maximum compression (50 DPI, `/screen` preset)

## Architecture

```
Frontend (Netlify)         Backend (Render)
    Next.js        →  →  →     Express + Ghostscript
                  API Call      Docker Container
```

## Troubleshooting

### Ghostscript not found
Ensure Ghostscript is installed in the Docker image. The provided Dockerfile includes it.

### CORS errors
Make sure `FRONTEND_URL` environment variable is set correctly in Render.

### Large files timing out
Check Render plan limits. Starter plan should handle most PDFs, but very large files may need a higher plan.

## Monitoring

- Check logs in Render Dashboard
- Monitor `/health` endpoint
- Set up alerts for downtime (Render provides this)

## Cost

- **Render Starter Plan**: $7/month
- Includes 512 MB RAM, suitable for PDF compression
- Upgrade to higher plans if you need more resources

## Security

- Files are processed in `/tmp` and immediately deleted
- No file storage - everything in memory
- CORS restricted to your frontend domain
- HTTPS enforced by Render

## License

MIT
