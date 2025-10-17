# Subscription Credits & Commission Setup

## Overview

When users subscribe to a plan, they automatically receive credits and have their commission rate set in the database.

## Plan Details

### Starter Plan - Get Booked
- **Monthly:** £118.00
- **Annual:** £1,130.00 (save 20%)
- **Credits:** 250/month
- **Commission:** 20%
- **Role:** pro-1
- **Best for:** New or part-time techs

### Professional Plan - Grow Your Pipeline
- **Monthly:** £239.00
- **Annual:** £2,290.00 (save 20%)
- **Credits:** 600/month
- **Commission:** 15%
- **Role:** pro-2
- **Best for:** 2-5 van teams

### Enterprise Plan - Custom Solutions
- **Custom pricing**
- **Credits:** Custom
- **Commission:** 5%
- **Role:** pro-2
- **Best for:** Large teams and fleets

## Database Schema

Both `app_users` and `technicians` tables have:
- `credits` (numeric/integer) - User's available credits
- `commission_rate` (decimal) - Percentage as decimal (e.g., 20.00 for 20%)
- `user_role` (text) - Access level (pro-1, pro-2, admin)

## Automatic Assignment

When a subscription is confirmed:

1. **Credits are added** to the user's account
   - Starter: 250 credits
   - Professional: 600 credits

2. **Commission rate is set**
   - Starter: 20.00%
   - Professional: 15.00%
   - Enterprise: 5.00%

3. **Role is assigned**
   - Starter: pro-1
   - Professional: pro-2

4. **Both tables are updated**
   - `app_users` table (primary)
   - `technicians` table (if user exists)

## API Endpoints

### Confirm Subscription
- `POST /api/stripe/confirm-subscription`
- Called after payment succeeds
- Parameters: `subscriptionId`, `userId`
- Updates: credits, commission_rate, user_role

### Find and Confirm Subscription
- `POST /api/stripe/find-and-confirm-subscription`
- Automatically finds latest subscription
- Parameters: `userId`, `paymentIntentId`
- Updates: Same as above

## How It Works

1. **User clicks subscribe** → Modal opens
2. **Payment succeeds** → Stripe confirms payment
3. **Backend processes** → Calls Stripe API for subscription details
4. **Credits assigned** → Based on plan tier
5. **Commission set** → Based on plan tier
6. **Role updated** → pro-1 or pro-2
7. **User refreshed** → New credits and role appear immediately

## Commission Usage

The `commission_rate` field is used to:
- Calculate platform fees on completed jobs
- Determine technician payout amounts
- Show earnings breakdown in reports

Example:
- Job value: £100
- Commission: 20%
- Platform fee: £20
- Technician receives: £80

## Testing

To test subscription flow:

1. Use Stripe test cards: `4242 4242 4242 4242`
2. Subscribe to Starter plan
3. Check database:
   ```sql
   SELECT credits, commission_rate, user_role 
   FROM app_users 
   WHERE id = 'user-id';
   ```
4. Expected result:
   - credits: 250
   - commission_rate: 20.00
   - user_role: pro-1

## Monthly Credit Refresh

Credits are refreshed each billing cycle automatically by Stripe webhooks. When the subscription renews:
- Starter users get 250 credits
- Professional users get 600 credits

## Monitoring

Log messages to watch for:
- ✅ `Assigning role pro-1, 250 credits, 20% commission for plan Starter`
- ✅ `Subscription confirmed successfully`
- ⚠️ `Error updating user role` (investigate if seen)

