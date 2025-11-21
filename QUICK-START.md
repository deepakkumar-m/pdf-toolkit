# 🚀 Quick Reference Card

## Local Development Commands

### Start Everything
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend  
npm run dev
```

### URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Health: http://localhost:3001/health

## Deployment Commands

### Deploy to Render (Backend)
```bash
git add backend/
git commit -m "Add backend for Render"
git push
# Then create Web Service in Render Dashboard
```

### Deploy to Netlify (Frontend)
```bash
git add .
git commit -m "Configure external backend"
git push
# Netlify auto-deploys
```

## Environment Variables

### Development
```bash
# Frontend: .env.local
NEXT_PUBLIC_COMPRESSION_API_URL=http://localhost:3001

# Backend: backend/.env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Production
```bash
# Netlify
NEXT_PUBLIC_COMPRESSION_API_URL=https://your-app.onrender.com

# Render
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-app.netlify.app
```

## Testing

```bash
# Health check
curl http://localhost:3001/health

# Compress test
curl -X POST http://localhost:3001/api/compress \
  -F "file=@test.pdf" \
  -F "compressionLevel=high" \
  --output compressed.pdf
```

## File Structure
```
backend/
├── server.js          # Main API server
├── Dockerfile         # Docker + Ghostscript
├── render.yaml        # Render config
└── package.json       # Dependencies

frontend/
├── .env.local         # Local config
└── src/app/tools/compress-pdf/page.tsx  # Updated to use external API
```

## Costs
- Render Starter: $7/month
- Netlify Free: $0/month
- **Total: $7/month**

## Common Issues

### Port 3001 in use
```bash
lsof -i :3001
kill -9 <PID>
```

### CORS error
Check `FRONTEND_URL` matches your frontend domain

### Ghostscript not found
```bash
brew install ghostscript  # macOS
```

## Documentation
- Full deployment: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Backend docs: [backend/README.md](./backend/README.md)
- Setup guide: [BACKEND-SETUP.md](./BACKEND-SETUP.md)
