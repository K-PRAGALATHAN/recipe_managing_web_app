# Fix: Google OAuth Not Enabled Error

## The Problem
You're seeing: `"Unsupported provider: provider is not enabled"`

This means Google OAuth is not enabled in your Supabase project.

## Quick Fix Steps

### Step 1: Enable Google Provider in Supabase

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Sign in and select your project

2. **Navigate to Authentication Settings**
   - Click **Authentication** in the left sidebar
   - Click **Providers** tab

3. **Enable Google Provider**
   - Find **Google** in the list of providers
   - Toggle it **ON** (it should be green/enabled)
   - If you see a form, you'll need to add credentials (see Step 2)

### Step 2: Get Google OAuth Credentials

If Google provider asks for Client ID and Client Secret:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Sign in with your Google account

2. **Create or Select a Project**
   - Click the project dropdown at the top
   - Create a new project or select existing one
   - Name it something like "Recipe Manager OAuth"

3. **Enable Google+ API**
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API" or "Google Identity"
   - Click **Enable**

4. **Create OAuth Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Click **+ CREATE CREDENTIALS** → **OAuth client ID**
   - If prompted, configure OAuth consent screen first:
     - User Type: **External** (unless you have a Google Workspace)
     - App name: "Recipe Manager"
     - User support email: Your email
     - Developer contact: Your email
     - Click **Save and Continue** through the steps
   - Application type: **Web application**
   - Name: "Recipe Manager Web"
   - **Authorized redirect URIs**: Click **+ ADD URI**
     - Add: `https://yldgjaegxmnuytqtpvsy.supabase.co/auth/v1/callback`
     - (Replace with your actual Supabase project reference if different)
   - Click **CREATE**
   - **Copy the Client ID and Client Secret** (you'll need these)

5. **Add Credentials to Supabase**
   - Go back to Supabase → **Authentication** → **Providers** → **Google**
   - Paste the **Client ID** in the "Client ID (for OAuth)" field
   - Paste the **Client Secret** in the "Client Secret (for OAuth)" field
   - Click **Save**

### Step 3: Configure Redirect URLs

1. **In Supabase Dashboard**
   - Go to **Authentication** → **URL Configuration**
   - **Site URL**: Set to `http://localhost:5173` (for development)
   - **Redirect URLs**: Add these:
     ```
     http://localhost:5173/**
     http://localhost:5173
     ```
   - Click **Save**

### Step 4: Test Again

1. Refresh your browser at http://localhost:5173
2. Click "Sign in with Google"
3. It should now redirect to Google login page

## Common Issues

**Issue**: "Redirect URI mismatch" error from Google
- **Fix**: Make sure the redirect URI in Google Cloud Console exactly matches: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

**Issue**: Still getting "provider is not enabled"
- **Fix**: 
  - Make sure Google toggle is ON (green) in Supabase
  - Refresh the page
  - Check that you saved the credentials

**Issue**: Can't find Google provider in Supabase
- **Fix**: Make sure you're looking at **Authentication** → **Providers** (not Settings)

## Need Help?

If you're stuck, check:
1. Supabase project is active (not paused)
2. You have the correct project selected
3. Google provider toggle is ON and saved
4. Redirect URLs are configured correctly

