# 🚀 Deploy Movie Hangout to Netlify

## Step 1: Create Netlify Account
1. Go to [netlify.com](https://netlify.com)
2. Sign up with your GitHub account
3. This will give you access to deploy directly from your GitHub repository

## Step 2: Connect Your Repository
1. In Netlify dashboard, click "Add new site" → "Import an existing project"
2. Choose "Deploy with GitHub"
3. Select your Movie Hangout repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `out`
   - **Node version**: `18`

## Step 3: Set Environment Variables
In Netlify dashboard → Site settings → Environment variables, add:
```
SITE_NAME=Movie Hangout
PUBLIC_DOMAIN=your-site-name.netlify.app
REDIS_URL=your-redis-url (if you have one)
DEFAULT_SRC=your-default-video-source
NODE_ENV=production
```

## Step 4: Deploy
1. Click "Deploy site"
2. Netlify will automatically build and deploy your site
3. You'll get a URL like `https://amazing-name-123456.netlify.app`

## Step 5: Custom Domain (Optional)
1. Go to Site settings → Domain management
2. Add your custom domain
3. Netlify will handle SSL certificates automatically

## Step 6: Enable Functions
Your API routes are now converted to Netlify Functions and will work automatically!

## Troubleshooting
- Check build logs if deployment fails
- Ensure all environment variables are set
- Functions logs are available in Netlify dashboard
