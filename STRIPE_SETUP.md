# Stripe Payment Integration Setup

## Overview
Your TopUp page now includes full Stripe payment integration for purchasing credits. Users can buy credit packages or custom amounts, and payments are processed securely through Stripe.

## Environment Variables Required

Add these to your `.env` file:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...  # Your Stripe publishable key (you mentioned you have this)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...        # Same key for Vite (alternative naming)
STRIPE_SECRET_KEY=sk_test_51...                  # Your Stripe secret key (KEEP SECRET!)
```

## Features Implemented

### 1. **Updated TopUp Page**
- Brand-consistent design with your amber (#FFC107) color scheme
- Three predefined credit packages: Starter (100 credits), Professional (500 credits), Enterprise (1500 credits)
- Custom amount option for flexible purchasing
- Real-time credit balance display

### 2. **Secure Payment Processing**
- Stripe Elements integration for secure card input
- Payment intents for secure transaction handling
- Real-time payment status updates
- PCI-compliant payment processing

### 3. **Database Integration**
- `credit_transactions` table created for tracking all credit-related activities
- Automatic credit balance updates after successful payments
- Transaction history and audit trail
- Duplicate payment prevention

### 4. **Server-Side Endpoints**
- `/api/stripe/create-payment-intent` - Creates secure payment intents
- `/api/stripe/confirm-payment` - Confirms payments and updates user credits
- `/api/stripe/payment-status/:id` - Checks payment status

## How It Works

1. **User selects package or enters custom amount**
   - Validates minimum purchase (£1.00 = 10 credits)
   - Shows payment summary in branded modal

2. **Payment processing**
   - Creates Stripe payment intent server-side
   - Displays Stripe Elements form with brand styling
   - Processes payment securely through Stripe

3. **Credit allocation**
   - Verifies payment completion with Stripe
   - Updates user's credit balance in database
   - Creates transaction record for audit trail
   - Refreshes user interface

## Credit System

- **Rate**: 1 credit = £0.10
- **Minimum purchase**: 10 credits (£1.00)
- **Packages available**:
  - Starter: 100 credits for £9.99
  - Professional: 500 credits for £39.99 (20% bonus)
  - Enterprise: 1500 credits for £99.99 (50% bonus)

## Security Features

- Server-side payment verification
- Duplicate transaction prevention
- Row Level Security (RLS) on credit transactions
- Secure API endpoints with proper validation
- PCI-compliant payment processing via Stripe

## Testing

### Test Cards (Stripe Test Mode)
- **Success**: 4242 4242 4242 4242
- **Declined**: 4000 0000 0000 0002
- **Insufficient funds**: 4000 0000 0000 9995

Use any future expiry date and any 3-digit CVC.

## Production Checklist

Before going live:

1. ✅ Replace test Stripe keys with live keys
2. ✅ Test payment flow end-to-end
3. ✅ Verify webhook endpoints (if needed for advanced features)
4. ✅ Set up proper error monitoring
5. ✅ Configure Stripe dashboard for your business

## File Structure

- `src/services/stripeService.ts` - Stripe client-side service
- `src/components/payments/PaymentModal.tsx` - Payment modal component
- `src/pages/TopUp.tsx` - Updated TopUp page with payments
- `src/lib/api-setup.js` - Server-side Stripe endpoints
- Database: `credit_transactions` table for transaction tracking

## Support

The integration is now complete and ready for testing. Make sure to:
1. Add the required environment variables
2. Test with Stripe test cards
3. Verify credit balance updates after payments

All payments are processed securely through Stripe, and credits are automatically added to user accounts upon successful payment confirmation.
