# Google OAuth Setup Guide

This guide will help you configure Google OAuth authentication for your Recipe Manager application.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Google Cloud Console account (for OAuth credentials)

## Step 1: Configure Google OAuth in Supabase

1. **Go to your Supabase Dashboard**
   - Navigate to https://app.supabase.com
   - Select your project (or create a new one)

2. **Enable Google Provider**
   - Go to **Authentication** → **Providers**
   - Find **Google** in the list and click to enable it
   - You'll need Google OAuth credentials (see Step 2)

## Step 2: Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit https://console.cloud.google.com
   - Create a new project or select an existing one

2. **Enable Google+ API**
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API" and enable it
   - Also enable "Google Identity" if available

3. **Create OAuth 2.0 Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Choose **Web application** as the application type
   - Add authorized redirect URIs:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     ```
     Replace `your-project-ref` with your Supabase project reference ID
   - Copy the **Client ID** and **Client Secret**

4. **Add Credentials to Supabase**
   - Go back to Supabase Dashboard → **Authentication** → **Providers** → **Google**
   - Paste your **Client ID** and **Client Secret**
   - Click **Save**

## Step 3: Configure Redirect URLs

1. **In Supabase Dashboard**
   - Go to **Authentication** → **URL Configuration**
   - Add your site URL (e.g., `http://localhost:5173` for development)
   - Add redirect URLs:
     ```
     http://localhost:5173/**
     https://yourdomain.com/**
     ```

## Step 4: Set Up Environment Variables

1. **Get your Supabase credentials**
   - Go to **Project Settings** → **API**
   - Copy your **Project URL** and **anon/public key**

2. **Create `.env` file**
   - In the `frontend` folder, create a `.env` file
   - Add the following:
     ```env
     VITE_SUPABASE_URL=your_project_url_here
     VITE_SUPABASE_ANON_KEY=your_anon_key_here
     ```
   - Replace with your actual values

## Step 5: Test the Integration

1. **Start your development server**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Test Google Login**
   - Click "Sign in with Google" button
   - You should be redirected to Google's login page
   - After logging in, you'll be redirected back to your app
   - Select your role and continue

## Troubleshooting

### Issue: "Redirect URI mismatch"
- **Solution**: Make sure the redirect URI in Google Cloud Console matches exactly: `https://your-project-ref.supabase.co/auth/v1/callback`

### Issue: "Invalid client credentials"
- **Solution**: Double-check that you've copied the Client ID and Client Secret correctly in Supabase

### Issue: OAuth button doesn't work
- **Solution**: 
  - Check browser console for errors
  - Verify environment variables are set correctly
  - Ensure Supabase project has Google provider enabled

### Issue: User email not showing
- **Solution**: The app automatically uses the email from Google account. Check that Google account has a verified email address.

## Security Notes

- Never commit your `.env` file to version control
- Keep your Client Secret secure
- Use environment variables for all sensitive data
- In production, use HTTPS for all redirect URLs

