# 🎯 Stripe Webhook Setup - Automatic Role Upgrades

## ✅ **What's Implemented:**

### **1. 🔄 Automatic Role Assignment**
- ✅ **Webhook Handler** at `/api/stripe/webhook`
- ✅ **Professional Plan** → Automatically upgrades to `pro-2` role
- ✅ **Starter Plan** → Automatically upgrades to `pro-1` role
- ✅ **Credit Allocation** with each successful payment
- ✅ **Subscription Tracking** in database

### **2. 🎭 Webhook Events Handled**
- ✅ **`invoice.payment_succeeded`** → Upgrades user role and adds credits
- ✅ **`customer.subscription.updated`** → Updates subscription status
- ✅ **`customer.subscription.deleted`** → Downgrades user to basic role

## 🛠️ **Stripe Dashboard Webhook Setup:**

### **1. Create Webhook Endpoint:**
Go to: https://dashboard.stripe.com/test/webhooks

**Create Endpoint:**
- **URL**: `https://your-domain.com/api/stripe/webhook`
- **Description**: "Automatic subscription role upgrades"

### **2. Select Events to Send:**
Add these specific events:
- ✅ `invoice.payment_succeeded`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`

### **3. Get Webhook Secret:**
After creating the webhook:
1. Click on your webhook endpoint
2. Click "Reveal" next to "Signing secret"
3. Copy the webhook secret (starts with `whsec_`)

### **4. Add Environment Variable:**
Add to your `.env` file:
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 📋 **How It Works:**

### **Automatic Upgrade Flow:**
1. **User subscribes** → Stripe creates subscription
2. **Payment succeeds** → Stripe sends `invoice.payment_succeeded` webhook
3. **Webhook processes** → Identifies plan type from price ID
4. **Role upgraded** → User automatically gets `pro-2` for Professional plan
5. **Credits added** → 350 credits for Professional, 100 for Starter
6. **Database updated** → Subscription record created/updated

### **Price ID Mapping:**
```javascript
// Professional Plan (pro-2 role, 350 credits)
STRIPE_PROFESSIONAL_MONTHLY_PRICE
STRIPE_PROFESSIONAL_ANNUAL_PRICE

// Starter Plan (pro-1 role, 100 credits)  
STRIPE_STARTER_MONTHLY_PRICE
STRIPE_STARTER_ANNUAL_PRICE
```

### **Fallback Matching:**
If environment variables aren't set, webhook uses string matching:
- Price IDs containing `"professional"` or `"198"` → `pro-2`
- Price IDs containing `"starter"` or `"118"` → `pro-1`

## 🔧 **Testing the Webhook:**

### **1. Use Stripe CLI for Local Testing:**
```bash
# Install Stripe CLI
# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/stripe/webhook

# This will give you a webhook secret like: whsec_test_...
# Use this secret in your local .env file
```

### **2. Test Subscription Flow:**
1. Create a test subscription
2. Complete payment with test card: `4242 4242 4242 4242`
3. Check webhook logs in terminal
4. Verify user role updated in database

### **3. Webhook Logs:**
The webhook logs detailed information:
```
Received Stripe webhook event: invoice.payment_succeeded
Processing successful subscription payment for invoice: in_xxx
Webhook: Assigning role pro-2 to user xxx for plan Professional
Webhook: Successfully upgraded user user@example.com to pro-2 (Professional)
```

## 🚨 **Important Notes:**

### **Customer ID Storage:**
- Customer ID is automatically stored in `app_users.stripe_customer_id`
- This links Stripe customers to app users for webhook processing
- Required for automatic role upgrades to work

### **Subscription Downgrade:**
- Canceled/unpaid subscriptions automatically downgrade to basic `user` role
- Credits are removed when subscription ends
- Subscription status tracked in `user_subscriptions` table

### **Error Handling:**
- Webhook validates signature for security
- Graceful error handling with detailed logging
- Failed webhooks don't break the subscription flow

## 📊 **Database Tables Updated:**

### **`app_users` Table:**
- `user_role` → Updated to `pro-2` for Professional
- `credits` → Set to 350 for Professional, 100 for Starter
- `stripe_customer_id` → Stored for webhook processing

### **`user_subscriptions` Table:**
- Complete subscription tracking
- Status updates from webhooks
- Role and plan name storage
- Billing period tracking

This webhook system ensures that **Professional plan subscribers are automatically upgraded to `pro-2` role** as soon as Stripe processes their payment!
