# Quick Start: Google OAuth Setup

## 1. Supabase Configuration

1. Go to https://app.supabase.com → Your Project → **Authentication** → **Providers**
2. Enable **Google** provider
3. You'll need Google OAuth credentials (see step 2)

## 2. Google Cloud Console Setup

1. Go to https://console.cloud.google.com
2. Create/select a project
3. Enable **Google+ API** (APIs & Services → Library)
4. Create OAuth 2.0 credentials:
   - **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Copy **Client ID** and **Client Secret**

## 3. Add Credentials to Supabase

1. Paste **Client ID** and **Client Secret** in Supabase → **Authentication** → **Providers** → **Google**
2. Save

## 4. Configure Redirect URLs

1. Supabase → **Authentication** → **URL Configuration**
2. Add Site URL: `http://localhost:5173` (for dev)
3. Add Redirect URLs: `http://localhost:5173/**`

## 5. Environment Variables

Create `frontend/.env`:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from: Supabase → **Project Settings** → **API**

## 6. Test

```bash
cd frontend
npm run dev
```

Click "Sign in with Google" → Select role → Done!

---

**Note**: The app will automatically use your Google email address for login.

