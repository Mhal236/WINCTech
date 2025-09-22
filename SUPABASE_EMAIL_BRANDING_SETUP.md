# 📧 Supabase Email Template Branding Setup

This guide explains how to customize Supabase authentication email templates with WindscreenCompare branding.

## 📋 Overview

I've created three branded email templates that match your WindscreenCompare design:
- **Email Confirmation** (`supabase-email-confirm-template.html`)
- **User Invitation** (`supabase-email-invite-template.html`) 
- **Password Reset** (`supabase-password-reset-template.html`)

## 🚀 Setup Instructions

### Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com) and log into your project
2. Navigate to **Authentication** → **Settings** → **Email Templates**

### Step 2: Configure Email Templates

#### **Email Confirmation Template**
1. Click on "Confirm signup" template
2. Replace the existing HTML with the content from `supabase-email-confirm-template.html`
3. Update the subject line to: `"Confirm your WindscreenCompare account"`

#### **User Invitation Template** 
1. Click on "Invite user" template
2. Replace the existing HTML with the content from `supabase-email-invite-template.html`
3. Update the subject line to: `"You're invited to join WindscreenCompare!"`

#### **Password Reset Template**
1. Click on "Reset password" template  
2. Replace the existing HTML with the content from `supabase-password-reset-template.html`
3. Update the subject line to: `"Reset your WindscreenCompare password"`

### Step 3: Configure Email Settings

#### **SMTP Settings** (Recommended for Production)
1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Configure your custom SMTP provider (Gmail, SendGrid, etc.)
3. Set **From Email** to: `noreply@windscreencompare.com`
4. Set **From Name** to: `WindscreenCompare`

#### **Site URL Configuration**
1. Go to **Authentication** → **Settings** → **URL Configuration**  
2. Set **Site URL** to your production domain (e.g., `https://technician.windscreencompare.com`)
3. Add your domain to **Additional Redirect URLs** if needed

## 🎨 Template Features

### **Design Elements**
- ✅ WindscreenCompare logo and branding colors (`#0FB8C1`)
- ✅ Consistent layout matching your existing email design
- ✅ Mobile-responsive design
- ✅ Professional styling with proper spacing and typography

### **Functionality**
- ✅ Uses Supabase template variables (`{{ .ConfirmationURL }}`)
- ✅ Fallback links for accessibility
- ✅ Clear call-to-action buttons
- ✅ Security notices and expiration information
- ✅ Alternative copy-paste URLs for troubleshooting

### **Content Structure**
- 📧 **Header**: Logo, company name, and context
- 🎯 **Main Action**: Clear button with confirmation URL
- ℹ️ **Information**: What happens next, security notices
- 🔗 **Alternative**: Manual link copying option
- 👋 **Footer**: Company info and support contact

## 🧪 Testing Your Templates

### **Test Email Confirmation**
```javascript
// In your app, trigger a signup
const { error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123'
})
```

### **Test Password Reset**
```javascript
// In your app, trigger a password reset
const { error } = await supabase.auth.resetPasswordForEmail(
  'test@example.com',
  { redirectTo: 'https://yourdomain.com/reset-password' }
)
```

### **Test User Invitation**
1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click "Invite a user"
3. Enter test email address
4. Check the email template renders correctly

## 🔧 Customization Options

### **Logo Updates**
- Replace the logo URL in all templates:
  ```html
  <img src="YOUR_LOGO_URL" alt="WindscreenCompare Logo">
  ```

### **Color Scheme**
- Primary color: `#0FB8C1` (teal)
- Success color: `#28a745` (green) 
- Warning color: `#ffc107` (yellow)
- Info color: `#17a2b8` (blue)

### **Content Customization**
- Update company contact information
- Modify security notices and policies
- Add additional branding elements
- Customize call-to-action text

## 📱 Mobile Responsiveness

All templates are designed to work well on:
- ✅ Desktop email clients (Outlook, Apple Mail, etc.)
- ✅ Mobile email apps (Gmail, Apple Mail, etc.)
- ✅ Web-based email clients (Gmail web, Outlook web, etc.)

## 🔒 Security Considerations

### **Template Variables**
- `{{ .ConfirmationURL }}` - Auto-generated secure confirmation link
- `{{ .Token }}` - Security token (if needed for custom implementations)
- `{{ .Email }}` - User's email address
- `{{ .SiteURL }}` - Your configured site URL

### **Link Expiration**
- Email confirmation: 24 hours
- Password reset: 1 hour  
- User invitation: 24 hours

## 🚨 Common Issues & Solutions

### **Images Not Loading**
- Ensure logo URL is publicly accessible
- Use HTTPS URLs for images
- Test image URLs in browser before deployment

### **Styling Issues**
- Use inline CSS for maximum email client compatibility
- Test templates across different email clients
- Avoid complex CSS that might not render properly

### **Template Variables Not Working**
- Ensure you're using the correct Supabase template syntax
- Check that variables are spelled correctly with proper casing
- Test with actual email sends, not just previews

## 📊 Monitoring & Analytics

### **Email Delivery**
- Monitor bounce rates in your SMTP provider
- Set up delivery notifications
- Track open rates and click-through rates

### **User Experience**
- Monitor user completion rates for email confirmation
- Track support tickets related to email issues
- A/B test different subject lines and content

## 🎯 Next Steps

1. **Deploy Templates**: Upload all three templates to Supabase
2. **Configure SMTP**: Set up professional email sending
3. **Test Thoroughly**: Test all email flows in staging
4. **Monitor Performance**: Track email delivery and user engagement
5. **Iterate**: Improve templates based on user feedback

## 💡 Pro Tips

- **Subject Lines**: Keep them clear and action-oriented
- **Preview Text**: Add preview text for better email client display
- **Accessibility**: Use alt text for images and proper heading structure
- **Localization**: Consider multiple language versions if needed
- **Backup**: Keep copies of your templates in version control

Your WindscreenCompare email templates are now ready to provide a professional, branded experience for all user authentication flows! 🚀
