# 🚀 Irori Deployment Guide

Complete guide for deploying your Irori application to production with custom domain and hosting.

## 🌐 Deployment Options

### Option 1: Railway (Recommended)
Railway offers excellent Next.js support with automatic deployments.

#### Step 1: Prepare Your Repository
```bash
# Ensure your code is committed and pushed to GitHub
git add .
git commit -m "Prepare for deployment"
git push origin main
```

#### Step 2: Set Up Railway
1. Visit [railway.app](https://railway.app)
2. Sign up with your GitHub account
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `irori` repository
5. Railway will automatically detect it's a Next.js app

#### Step 3: Configure Environment Variables
In Railway dashboard, go to Variables tab and add:
```env
DATABASE_URL=postgresql://username:password@host:port/database
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=https://your-domain.railway.app
OPENAI_API_KEY=sk-your-openai-key
ELEVENLABS_API_KEY=your-elevenlabs-key
```

#### Step 4: Database Setup
1. In Railway, click "New" → "Database" → "PostgreSQL"
2. Copy the connection string to `DATABASE_URL`
3. Run database migration:
```bash
npx prisma db push --preview-feature
```

### Option 2: AWS (Advanced)
For more control and scalability.

#### Step 1: Install AWS CLI
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Configure AWS credentials
aws configure
```

#### Step 2: Use AWS Amplify
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" → "Host web app"
3. Connect your GitHub repository
4. Configure build settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        - npx prisma generate
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

## 🌍 Custom Domain Setup

### Option 1: GoDaddy Domain
1. Purchase domain at [godaddy.com](https://godaddy.com)
2. In GoDaddy DNS management, add these records:

**For Railway:**
```
Type: CNAME
Name: @
Value: your-app.railway.app
TTL: 600

Type: CNAME  
Name: www
Value: your-app.railway.app
TTL: 600
```

**For AWS Amplify:**
```
Type: CNAME
Name: @
Value: your-amplify-domain.amplifyapp.com
TTL: 600
```

### Option 2: Cloudflare (Free SSL)
1. Transfer domain to Cloudflare or use as DNS provider
2. Automatic SSL certificates and CDN
3. Better performance and security

## 📊 Database Migration to Production

### From SQLite to PostgreSQL
1. Export your SQLite data:
```bash
# Create a backup script
node scripts/export-data.js
```

2. Update Prisma schema for PostgreSQL:
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. Run migration:
```bash
npx prisma db push
npx prisma db seed # if you have seed data
```

## 🔐 Security Configuration

### Environment Variables Security
Never commit these to git:
- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY` 
- `NEXTAUTH_SECRET`
- `DATABASE_URL`

### Additional Security Headers
Add to `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

## 📈 Performance Optimization

### Image Optimization
Add to `next.config.js`:
```javascript
const nextConfig = {
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
}
```

### Caching Strategy
```javascript
// In your API routes
export async function GET() {
  return new Response(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400'
    }
  })
}
```

## 🔊 Voice Services Configuration

### ElevenLabs Setup
1. Sign up at [elevenlabs.io](https://elevenlabs.io)
2. Get API key from dashboard
3. Choose appropriate voice models:
   - **Bella**: Warm, nurturing facilitator voice
   - **Antoni**: Friendly, encouraging guide
   - **Domi**: Youthful voice for child connection

### Voice Model Selection
```typescript
// In your voice service configuration
const VOICE_PROFILES = {
  facilitator: 'EXAVITQu4vr4xnSDxMaL', // Bella
  friendly: 'ErXwobaYiN019PkySvjV',    // Antoni  
  child_friendly: 'AZnzlk1XvdvUeBnXmlld' // Domi
}
```

## 📱 Mobile Optimization

### PWA Configuration
Add to `next.config.js`:
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})

module.exports = withPWA(nextConfig)
```

### Responsive Audio
Ensure voice features work on mobile:
```typescript
// Check for mobile browser limitations
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

if (isMobile) {
  // Use Web Speech API fallback
  useFallbackVoice()
}
```

## 🔄 Continuous Deployment

### GitHub Actions (Optional)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        uses: railway/github-action@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
```

## 📊 Monitoring & Analytics

### Error Tracking
Add Sentry for error monitoring:
```bash
npm install @sentry/nextjs
```

### Analytics
Add Vercel Analytics or Google Analytics:
```typescript
// _app.tsx
import { Analytics } from '@vercel/analytics/react'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}
```

## 🧪 Testing in Production

### Health Check Endpoint
Create `pages/api/health.ts`:
```typescript
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  })
}
```

### Load Testing
Use tools like Artillery or Lighthouse:
```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery quick --count 100 --num 10 https://your-domain.com
```

## 🆘 Troubleshooting

### Common Issues

**1. Database Connection Errors**
- Verify `DATABASE_URL` format
- Check firewall settings
- Ensure database is running

**2. Voice Synthesis Issues**
- Verify ElevenLabs API key
- Check browser permissions for microphone
- Test with fallback Web Speech API

**3. Build Failures**
- Clear `.next` cache: `rm -rf .next`
- Update dependencies: `npm update`
- Check for TypeScript errors

**4. Performance Issues**
- Enable compression in hosting platform
- Optimize images and static assets
- Use CDN for better global performance

## 📞 Support Resources

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **AWS Amplify**: [docs.amplify.aws](https://docs.amplify.aws)
- **Next.js Deployment**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- **Prisma Production**: [prisma.io/docs/guides/deployment](https://prisma.io/docs/guides/deployment)

---

**🎉 Your Irori application will be live and helping families worldwide!** 

For additional support with deployment, follow the step-by-step instructions and don't hesitate to consult the documentation links provided above.
