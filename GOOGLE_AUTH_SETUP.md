# Google OAuth Authentication Setup - WINTechnician

This guide will help you set up Google OAuth authentication for the WINTechnician portal.

## 🎯 What's Been Implemented

I've implemented a Google OAuth authentication system for WINTechnician using the same approach as WINCRM:

### Frontend Components
- **Updated `GoogleLoginButton`** - Now uses manual OAuth flow instead of Supabase OAuth
- **Updated `Login` page** - Handles OAuth callback processing
- **Updated `AuthContext`** - Supports Google session management via localStorage
- **Open Access** - Allows any valid Google account to log in

## 🔧 Setup Instructions

### 1. Configure Environment Variables

Create a `.env` file in the WINTechnician root directory with:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google+ API** and **OAuth2 API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Set **Application type** to **Web application**
6. Add **Authorized redirect URIs**:
   - `http://localhost:5173/login` (development)
   - `https://yourdomain.com/login` (production)

**Note**: The redirect URI for WINTechnician is `/login` (not `/auth/google/callback` like WINCRM)

## 🚀 Testing

### 1. Start the Development Server
```bash
cd WINTechnician
npm run dev
```

### 2. Test Google Login
1. Navigate to: `http://localhost:5173/login`
2. Click **"Continue with Google"**
3. Complete Google OAuth flow
4. You should be redirected back and logged in

### 3. Test Logout
1. Once logged in, use the logout button
2. You should be redirected back to the login page

## 🔍 Troubleshooting

### Common Issues:

1. **"Configuration Error"**
   - Make sure you've set the environment variables with real Google credentials

2. **"Redirect URI Mismatch"**
   - Ensure the redirect URI in Google Console matches exactly: `http://localhost:5173/login`

3. **"Access denied"**
   - Make sure you're using a valid Google account with an email address

4. **Token exchange fails**
   - Check that your Google Client ID and Secret are correct
   - Verify the OAuth consent screen is configured

## 🔒 Security Notes

1. **Client Secret**: In production, consider implementing a backend proxy for token exchange for enhanced security
2. **Open Access**: Any valid Google account can log in
3. **HTTPS Required**: Google OAuth requires HTTPS in production

## 📋 Next Steps

1. **Replace placeholder credentials** with your actual Google OAuth credentials
2. **Test the authentication flow** thoroughly
3. **Configure production redirect URIs** when deploying
4. **Test with different Google email accounts**

## 🎉 Features Included

- ✅ Complete Google OAuth flow (same as WINCRM)
- ✅ Open Google authentication (any Google account)
- ✅ Session management with localStorage
- ✅ Integration with existing auth system
- ✅ Proper error handling and user feedback
- ✅ Logout functionality
- ✅ Mobile-responsive login interface

The system now uses the same working OAuth implementation as WINCRM!
