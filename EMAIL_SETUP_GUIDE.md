# Email Setup Guide for 2FA

Your 2FA system is now integrated with Supabase Edge Functions! Here's how to configure real email delivery.

## Current Status ✅

- **Supabase Edge Function**: Deployed and ready (`send-2fa-email`)
- **Demo Mode**: Currently working in demo mode (shows codes in notifications)
- **Email Integration**: Ready to connect with Klaviyo or Resend email service

## Option 1: Setup with Klaviyo (Your Choice!)

### Step 1: Get Your Klaviyo API Key
1. Log into your Klaviyo account
2. Go to **Settings** → **API Keys**
3. Create a new **Private API Key** with the following permissions:
   - **Campaigns**: Read/Write
   - **Events**: Write
   - **Profiles**: Read/Write
4. Copy your API key (starts with `pk_`)

### Step 2: Configure Supabase
1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** → **Settings** 
3. Add environment variable:
   - Name: `KLAVIYO_PRIVATE_API_KEY`
   - Value: Your Klaviyo private API key

### Step 3: Update Email Addresses (Optional)
The Edge Function is configured to send from `noreply@windscreencompare.com`. To use your own domain:

1. In Klaviyo, verify your sending domain
2. Update the email addresses in the Edge Function if needed

### Step 4: Test Email Delivery
1. Go to your app's Settings page
2. Toggle 2FA on
3. You should receive a real email (not just a notification)!

## Option 2: Setup with Resend (Alternative)

### Step 1: Create a Resend Account
1. Go to [resend.com](https://resend.com) and sign up
2. Verify your account
3. Get your API key from the dashboard

### Step 2: Configure Supabase
1. Go to your Supabase project dashboard
2. Navigate to "Edge Functions" → "Settings"
3. Add environment variable:
   - Name: `RESEND_API_KEY` (instead of KLAVIYO_PRIVATE_API_KEY)
   - Value: Your Resend API key (starts with `re_`)

**Note**: The Edge Function will automatically detect which service you're using based on the environment variable name.

## Testing Email Delivery

### Test 1: Check Edge Function Logs
1. Go to Supabase Dashboard → Edge Functions
2. Click on `send-2fa-email` function
3. Check the "Logs" tab for any errors

### Test 2: Enable 2FA
1. Go to your app's Settings page
2. Toggle 2FA on
3. Check if you receive an actual email (not just a toast notification)

### Test 3: Login with 2FA
1. Log out and log back in
2. Enter credentials
3. Check email for verification code
4. Complete 2FA verification

## Troubleshooting

### Issue: Still seeing demo notifications
**Solution**: Make sure the `KLAVIYO_PRIVATE_API_KEY` environment variable is set in Supabase Edge Functions settings.

### Issue: Emails not arriving
**Possible causes**:
- Check spam/junk folder
- Verify API key is correct
- Check Edge Function logs for errors
- Ensure your domain is verified in Klaviyo (if using custom domain)

### Issue: Edge Function errors
**Check**:
- Supabase Edge Function logs
- API key format (should start with `pk_` for Klaviyo)
- API key permissions (Campaigns, Events, Profiles)
- Network connectivity

## Email Template Customization

The email template is defined in the Edge Function. To customize:

1. Update the HTML template in `/supabase/functions/send-2fa-email/index.ts`
2. Modify colors, styling, or content as needed
3. Redeploy the Edge Function

## Production Considerations

### Security
- Never log verification codes in production
- Use HTTPS for all email service calls
- Implement rate limiting for code generation

### Reliability
- Set up email delivery monitoring
- Configure backup email service
- Add retry logic for failed sends

### Compliance
- Add unsubscribe links (if required)
- Include proper email headers
- Follow CAN-SPAM and GDPR requirements

## Cost Considerations

### Klaviyo Pricing (as of 2025)
- **Free tier**: Up to 250 contacts and 500 email sends/month
- **Email plans**: Start at $20/month for 500 contacts
- **SMS + Email**: Start at $35/month for 500 contacts

### Alternative Services
- **Resend**: Free tier 3,000 emails/month, then $20/month
- **SendGrid**: Free tier 100 emails/day
- **Mailgun**: Free tier 5,000 emails/month

## Support

If you need help with email setup:
1. Check Supabase Edge Function logs
2. Verify environment variables
3. Test with a simple email first
4. Contact your email service provider support

---

**Next Steps**: Set up your Resend account and add the API key to start receiving real emails! 📧
