# Two-Factor Authentication (2FA) Testing Guide

## Overview
This guide explains how to test the newly implemented Email 2FA feature in the WINTechnician application.

## Features Implemented

### 1. Database Schema
- Added `two_factor_enabled` and `two_factor_email_enabled` columns to `app_users` table
- Created `two_factor_codes` table to store temporary verification codes
- Implemented proper RLS policies for security

### 2. Settings Page Integration
- Added 2FA settings card in the Settings page (`/settings`)
- Toggle switch to enable/disable email 2FA
- Verification flow when enabling 2FA
- Visual indicators showing 2FA status

### 3. Login Flow Integration
- Modified login process to check for 2FA requirements
- Seamless redirect to 2FA verification screen
- Code verification before completing login
- Fallback to regular login if 2FA is disabled

### 4. Security Features
- 6-digit verification codes
- 10-minute expiration for codes
- One-time use codes (marked as used after verification)
- Proper error handling and user feedback

## Testing Steps

### Step 1: Access the Application
1. Open your browser and navigate to `http://localhost:8080`
2. If not already logged in, use existing credentials:
   - Email: `admin@windscreencompare.com`
   - Password: `test123` (or your existing password)

### Step 2: Enable 2FA in Settings
1. Navigate to Settings page (`/settings`)
2. Scroll down to find the "Two-Factor Authentication" card
3. Toggle the "Email Authentication" switch to ON
4. A verification dialog will appear
5. Check the toast notification for the demo verification code
6. Enter the 6-digit code and click "Verify & Enable"
7. You should see a success message and the toggle should remain ON

### Step 3: Test 2FA Login Flow
1. Log out of the application
2. Go to the login page
3. Enter your credentials (same as Step 1)
4. Instead of logging in directly, you should see a 2FA verification screen
5. Check the toast notification for the verification code
6. Enter the code and click "Verify Code"
7. You should be successfully logged into the dashboard

### Step 4: Test Code Expiration and Resend
1. During the 2FA verification screen, wait for the code to expire (or test with an invalid code)
2. Try entering an invalid code - you should see an error message
3. Click "Resend Code" to get a new verification code
4. Use the new code to complete login

### Step 5: Disable 2FA
1. Go back to Settings page
2. Toggle the "Email Authentication" switch to OFF
3. The 2FA should be disabled immediately
4. Test login again - it should work without 2FA verification

## Email Delivery

The system now uses **Supabase Edge Functions** for email delivery:

1. **Demo Mode**: Currently running in demo mode since no email service API key is configured
2. **Production Ready**: Edge Function is deployed and ready to send real emails
3. **Email Service**: Integrated with Resend (recommended) - just add your API key to enable real emails

### To Enable Real Email Delivery:
1. Sign up for [Resend](https://resend.com) (free tier available)
2. Get your API key
3. Add it to Supabase Edge Functions environment variables as `RESEND_API_KEY`
4. Restart and test - you'll receive real emails instead of demo notifications!

See `EMAIL_SETUP_GUIDE.md` for detailed setup instructions.

## Production Deployment Checklist

To make this production-ready:

- [ ] Integrate with an email service provider
- [ ] Remove toast notifications showing verification codes
- [ ] Add email templates for 2FA codes
- [ ] Consider adding backup codes for account recovery
- [ ] Add rate limiting for code generation
- [ ] Add audit logging for 2FA events
- [ ] Test with various email providers
- [ ] Add mobile-responsive design testing

## Technical Implementation Details

### Database Tables
```sql
-- Added to app_users
ALTER TABLE app_users 
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN two_factor_email_enabled BOOLEAN DEFAULT FALSE;

-- New table for codes
CREATE TABLE two_factor_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  code_type VARCHAR(20) NOT NULL DEFAULT 'email',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Components
- `TwoFactorSettings.tsx` - Settings page component
- `TwoFactorVerification.tsx` - Login verification screen
- `LoginForm.tsx` - Updated to handle 2FA flow
- `supabase-client.ts` - Backend authentication logic

### API Methods
- `signInWithPassword()` - Modified to check 2FA requirements
- `completeTwoFactorAuth()` - New method to complete 2FA login
- Code generation and verification in respective components

## Troubleshooting

### Common Issues
1. **Codes not working**: Check that codes haven't expired (10-minute limit)
2. **Toggle not working**: Ensure user is properly authenticated
3. **Database errors**: Check Supabase connection and table permissions

### Debug Information
- Check browser console for detailed error messages
- Verify database connections in Network tab
- Toast notifications provide user-friendly error messages

## Support
For technical issues or questions about the 2FA implementation, refer to the code comments or contact the development team.

