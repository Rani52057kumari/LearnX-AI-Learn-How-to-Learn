# Vercel Deployment Setup

## Step 1: Create Neon Postgres Database

Vercel now uses Neon for PostgreSQL databases:

1. Go to your Vercel project dashboard
2. Click on **Storage** tab
3. Click **Create Database**
4. Select **Neon Postgres** (recommended) or **Postgres**
5. Choose a name for your database (e.g., "learnx-db")
6. Click **Create**

## Step 2: Connect Database to Project

Vercel will automatically add these environment variables to your project:
- `POSTGRES_URL` or `DATABASE_URL`
- Other database connection variables

The app will automatically detect and use PostgreSQL when these variables are present.

## Step 3: Add Additional Environment Variables

In your Vercel project settings, add:

1. **JWT_SECRET**: Your secret key for JWT tokens
   ```
   JWT_SECRET=your-super-secret-jwt-key-here
   ```

2. **ADMIN_EMAIL**: Admin email for logging
   ```
   ADMIN_EMAIL=admin@yourdomain.com
   ```

## Step 4: Deploy

Push your code to GitHub, and Vercel will automatically deploy:

```bash
git add .
git commit -m "Add Vercel deployment support"
git push origin main
```

## Local Development

For local development, the app will use SQLite automatically. No configuration needed.

Just run:
```bash
npm install
npm start
```

## Verification

After deployment:
1. Visit your Vercel deployment URL
2. Try signing up with a test account
3. Check if login works
4. Test reflection saving

## Troubleshooting

If you see database errors:
1. Make sure Vercel Postgres is created and connected
2. Check environment variables in Vercel dashboard
3. Redeploy the project

## Database Schema

Tables are automatically created on first run:
- **users**: User accounts
- **reflections**: Learning reflections
- **feedback**: User feedback
