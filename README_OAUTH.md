# Recipe Manager - Google OAuth Login

This application now supports Google OAuth authentication, allowing users to sign in with their Google accounts.

## Quick Start

### 1. Prerequisites
- Node.js installed
- Supabase account
- Google Cloud Console account (for OAuth credentials)

### 2. Installation
```bash
cd frontend
npm install
```

### 3. Environment Setup
Create `frontend/.env`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Configure Google OAuth

#### In Supabase:
1. Go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Add Google OAuth credentials (Client ID & Secret)
4. Configure redirect URLs: `http://localhost:5173/**`

#### In Google Cloud Console:
1. Create OAuth 2.0 credentials
2. Set redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

### 5. Run the Application
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

## Features

✅ Sign in with Google account  
✅ Automatic email extraction from Google  
✅ Role selection after OAuth login  
✅ Session persistence  
✅ Secure OAuth flow  

## Documentation

- **GOOGLE_OAUTH_SETUP.md** - Detailed setup instructions
- **SETUP_QUICK_START.md** - Quick reference guide
- **FIX_GOOGLE_OAUTH.md** - Troubleshooting guide
- **CHANGES_SUMMARY.md** - Complete list of changes

## Support

If you encounter issues:
1. Check that Google provider is enabled in Supabase
2. Verify redirect URLs are configured correctly
3. Ensure environment variables are set
4. Check browser console for errors

## Code Structure

- `frontend/src/components/LoginPage.jsx` - Login UI with Google OAuth button
- `frontend/src/App.jsx` - OAuth callback handling and session management
- `frontend/src/utils/supabaseClient.js` - Supabase client configuration

