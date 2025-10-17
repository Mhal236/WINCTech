# Stripe Connect Cashout Integration - Setup Guide

## Overview

The cashout system uses **Stripe Connect** to enable technicians to receive payouts directly to their bank accounts. This is a fully production-ready implementation.

## ✅ Implemented Features

### 1. **Database Schema**
- `stripe_connect_accounts` table - Stores connected Stripe accounts
- `cashout_requests` table - Tracks all payout requests
- Row Level Security (RLS) policies
- Automatic timestamp updates

### 2. **API Endpoints**
- `POST /api/stripe/connect/create-account-link` - Creates Stripe Connect onboarding link
- `POST /api/stripe/connect/account-status` - Gets account connection status
- `POST /api/stripe/connect/disconnect` - Disconnects Stripe account
- `POST /api/cashout/request` - Processes cashout requests
- `POST /api/cashout/history` - Retrieves cashout history

### 3. **Frontend Components**
- Stripe Connect UI in Settings → Cashout tab
- Connection status display
- Cashout request flow
- Earnings dashboard
- Transaction history

## 🔑 Environment Variables Required

Add to your `.env` file:

```bash
# Stripe Configuration (you already have these)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...

# Application URL (for Stripe redirects)
VITE_APP_URL=http://localhost:8080  # Development
# VITE_APP_URL=https://yourdomain.com  # Production

# Supabase (you already have these)
VITE_SUPABASE_URL=https://julpwjxzrlkbxdbphrdy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📋 Setup Steps

### 1. Apply Database Migration

Run the migration to create the necessary tables:

```bash
# Using Supabase CLI
supabase db push

# Or apply manually via Supabase dashboard:
# SQL Editor → Run the migration file:
# supabase/migrations/20250115000000_stripe_connect_cashout.sql
```

### 2. Configure Stripe Connect

In your Stripe Dashboard:

1. Go to **Settings → Connect**
2. Enable **Express accounts**
3. Set redirect URLs:
   - Redirect URL: `http://localhost:8080/settings?stripe_connected=true`
   - Refresh URL: `http://localhost:8080/settings?stripe_refresh=true`
4. Save settings

### 3. Restart Your Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

## 🎯 User Flow

### Connecting Stripe Account:

1. User goes to **Settings → Cashout tab**
2. Clicks **"Connect with Stripe"** button
3. Redirected to Stripe's secure onboarding form
4. Fills in business/personal details
5. Adds bank account information
6. Stripe verifies identity
7. Redirected back to app with connected account

### Requesting Cashout:

1. Complete jobs appear in cashout dashboard
2. User selects jobs to cash out
3. Clicks **"Request Cashout"** button
4. System validates:
   - Stripe account connected ✓
   - Payouts enabled ✓
   - Minimum £20 amount ✓
5. Creates Stripe transfer to connected account
6. Records transaction in database
7. User receives payout in 1-2 business days

## 💰 Payout Details

- **Minimum Cashout**: £20.00
- **Platform Fee**: 15% (technicians receive 85%)
- **Payout Speed**: 1-2 business days (standard)
- **Currency**: GBP (British Pounds)
- **Supported**: All UK bank accounts

## 🔒 Security Features

- ✅ **Stripe-hosted onboarding** - Never handle sensitive data
- ✅ **Express accounts** - Simplified KYC process
- ✅ **Automatic verification** - Stripe handles identity checks
- ✅ **Secure transfers** - PCI-compliant payment processing
- ✅ **RLS policies** - Users can only see their own data
- ✅ **Metadata tracking** - Full audit trail

## 🧪 Testing

### Test Mode (Development):

Use Stripe test mode:
- All connections and payouts work in sandbox
- No real money transferred
- Can test full flow end-to-end

### Test Stripe Connect Account:

1. Connect account in test mode
2. Use Stripe test data for onboarding:
   - Name: Any name
   - DOB: 01/01/1990
   - Address: 123 Test St
   - Bank: Use Stripe test account numbers

## 📊 Stripe Dashboard

Technicians can access their Stripe Express Dashboard by clicking **"Manage"** on their connected account. This allows them to:
- View payout history
- Update bank details
- See transaction fees
- Download statements

## 🚨 Error Handling

The system handles these scenarios:
- User not connected → Shows connection button
- Payouts not enabled → Shows warning to complete setup
- Minimum amount not met → Shows error message
- API failures → Graceful error messages
- Network issues → Retry logic built-in

## 📱 Responsive Design

- Works on all devices
- Mobile-optimized cashout interface
- Touch-friendly buttons
- Clear status indicators

## 🔄 Webhook Integration (Optional)

For real-time payout status updates, set up webhooks:

1. **Stripe Dashboard → Developers → Webhooks**
2. **Add endpoint**: `https://yourdomain.com/api/stripe/connect/webhook`
3. **Listen for events**:
   - `transfer.paid` - Transfer completed
   - `transfer.failed` - Transfer failed
   - `account.updated` - Account status changed

## 🎉 Production Checklist

Before going live:

- [ ] Apply database migration
- [ ] Set `VITE_APP_URL` to production URL
- [ ] Configure Stripe Connect settings
- [ ] Switch to Stripe live mode
- [ ] Test complete flow
- [ ] Set up webhook endpoints
- [ ] Monitor first few payouts

## 🆘 Support

If issues arise:
- Check Stripe Dashboard for account status
- Review API server logs
- Verify environment variables are set
- Ensure database migration is applied
- Check Supabase RLS policies

## 📈 Analytics

Track these metrics:
- Total payouts processed
- Average payout amount
- Payout success rate
- Time to complete payouts
- Number of connected accounts

