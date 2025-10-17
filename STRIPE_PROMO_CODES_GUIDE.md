# 🎟️ Stripe Promo Codes Guide for Subscriptions

## 📋 **Overview**

Stripe supports powerful promo codes for subscriptions that can:
- ✅ Give percentage or fixed discounts
- ✅ Offer free trials (e.g., 7 days free)
- ✅ Apply to first payment or ongoing
- ✅ Be one-time use or reusable
- ✅ Have expiration dates

---

## 🎯 **Option 1: Create Discount Promo Codes**

### **Via Stripe Dashboard:**

1. **Go to:** https://dashboard.stripe.com/coupons
2. **Click:** "Create coupon"
3. **Configure the coupon:**
   - **Name:** `SAVE20` (customer sees this)
   - **ID:** `save20` (internal reference)
   - **Type:** Percentage discount
   - **Percent off:** 20%
   - **Duration:** 
     - `Once` - applies to first payment only
     - `Forever` - applies to all payments
     - `Repeating` - applies for X months
   
4. **Click "Create coupon"**

5. **Create Promotion Code:**
   - After creating coupon, click "Create promotion code"
   - **Code:** `SAVE20` (what users enter)
   - **Active:** Yes
   - **Max redemptions:** Leave blank for unlimited, or set a limit
   - **Expiration date:** Optional
   - **Click "Create"**

### **Example Discount Codes:**

```
WELCOME20   → 20% off forever
FIRST50     → 50% off first month only
ANNUAL10    → 10% off annual plans
SAVE3MONTHS → 3 months at 25% off
```

---

## 🆓 **Option 2: Create Free Trial Promo Codes**

### **Method A: Trial Period Coupon (Recommended)**

1. **Go to:** https://dashboard.stripe.com/coupons
2. **Create coupon:**
   - **Name:** `7 Day Free Trial`
   - **ID:** `7day-trial`
   - **Type:** Percentage discount
   - **Percent off:** 100%
   - **Duration:** Repeating
   - **Duration in months:** Leave at 0 (Stripe interprets this as trial period)
   - **Trial period days:** 7

3. **Create Promotion Code:**
   - **Code:** `FREETRIAL7`
   - **Active:** Yes
   - Click "Create"

### **Method B: Using Stripe's Built-in Trial Feature**

You can also modify your subscription creation to include trial periods:

```typescript
// In your server-side subscription creation endpoint
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: priceId }],
  trial_period_days: 7,  // 7 days free trial
  promotion_code: promotionCodeId, // If they enter a code
});
```

---

## 💻 **Implementing Promo Codes in Your App**

### **Step 1: Update Subscription Service**

Add promo code support to `subscriptionService.ts`:

```typescript
/**
 * Create a new subscription with optional promo code
 */
static async createSubscription(data: {
  priceId: string;
  userId: string;
  email: string;
  name: string;
  promotionCode?: string;  // Add this
}): Promise<CreateSubscriptionResponse> {
  try {
    const response = await fetch('/api/stripe/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}
```

### **Step 2: Update Subscription Modal UI**

Add a promo code input field in your `SubscriptionModal.tsx`:

```tsx
// Add state for promo code
const [promoCode, setPromoCode] = useState('');
const [promoCodeApplied, setPromoCodeApplied] = useState(false);

// In your form, before the payment element:
<div className="space-y-2">
  <Label htmlFor="promoCode">Promo Code (Optional)</Label>
  <div className="flex gap-2">
    <Input
      id="promoCode"
      type="text"
      placeholder="Enter promo code"
      value={promoCode}
      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
      className="flex-1"
    />
    {promoCodeApplied && (
      <Check className="w-5 h-5 text-green-600" />
    )}
  </div>
  {promoCodeApplied && (
    <p className="text-sm text-green-600">
      Promo code applied successfully!
    </p>
  )}
</div>

// Update your subscription creation call:
const result = await SubscriptionService.createSubscription({
  priceId: selectedPlan.priceId,
  userId: user.id,
  email: user.email,
  name: user.user_metadata?.full_name || user.email,
  promotionCode: promoCode || undefined,
});
```

### **Step 3: Update Server-Side Subscription Creation**

In your API endpoint (e.g., `server.js` or Edge Function):

```javascript
// When creating subscription
app.post('/api/stripe/create-subscription', async (req, res) => {
  const { priceId, userId, email, name, promotionCode } = req.body;
  
  try {
    // Create or get customer
    let customer = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (customer.data.length === 0) {
      customer = await stripe.customers.create({
        email,
        name,
        metadata: { userId }
      });
    } else {
      customer = customer.data[0];
    }

    // Validate promo code if provided
    let promotionCodeObj = null;
    if (promotionCode) {
      const promoCodes = await stripe.promotionCodes.list({
        code: promotionCode,
        active: true,
        limit: 1
      });

      if (promoCodes.data.length === 0) {
        return res.status(400).json({ 
          error: 'Invalid or expired promo code' 
        });
      }

      promotionCodeObj = promoCodes.data[0];
    }

    // Create subscription with promo code
    const subscriptionData = {
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { 
        save_default_payment_method: 'on_subscription' 
      },
      expand: ['latest_invoice.payment_intent'],
    };

    // Add promo code if valid
    if (promotionCodeObj) {
      subscriptionData.promotion_code = promotionCodeObj.id;
    }

    const subscription = await stripe.subscriptions.create(subscriptionData);

    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      customerId: customer.id,
      promoCodeApplied: !!promotionCodeObj
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🎁 **Example Promo Code Scenarios**

### **1. New Customer Discount (20% off first month)**
```
Coupon ID: new-customer-20
Code: WELCOME20
Type: Percentage (20%)
Duration: Once
```

### **2. Black Friday Sale (3 months at 50% off)**
```
Coupon ID: black-friday-2024
Code: BLACKFRIDAY
Type: Percentage (50%)
Duration: Repeating (3 months)
Expiration: Dec 1, 2024
```

### **3. Free Trial (7 days free)**
```
Coupon ID: 7-day-trial
Code: FREETRIAL7
Type: Percentage (100%)
Duration: Once
Trial Period Days: 7
```

### **4. Annual Plan Discount (£200 off annual)**
```
Coupon ID: annual-200-off
Code: ANNUAL200
Type: Amount off (£200)
Duration: Once
Only applies to: Annual plans (configure in Stripe)
```

---

## 📊 **How to Track Promo Code Usage**

### **In Stripe Dashboard:**
1. Go to: https://dashboard.stripe.com/coupons
2. Click on a coupon
3. See "Times redeemed" count
4. View "Promotion codes" tab for specific code usage

### **Via Stripe API:**
```javascript
// Get promo code details and usage
const promoCode = await stripe.promotionCodes.retrieve('promo_xxx');
console.log('Times redeemed:', promoCode.times_redeemed);
console.log('Max redemptions:', promoCode.max_redemptions);
```

---

## 🛡️ **Best Practices**

### **Security:**
- ✅ Always validate promo codes server-side
- ✅ Check expiration dates and redemption limits
- ✅ Don't expose coupon IDs to frontend

### **User Experience:**
- ✅ Show clear feedback when code is applied
- ✅ Display discount amount before payment
- ✅ Make promo field optional (don't require it)
- ✅ Show error message for invalid codes

### **Business Strategy:**
- ✅ Set expiration dates for seasonal campaigns
- ✅ Use redemption limits for exclusive offers
- ✅ Track which codes drive most conversions
- ✅ A/B test different discount percentages

---

## 🧪 **Testing Promo Codes**

### **Test Mode Codes:**
1. Create test coupons in Stripe test mode
2. Use test codes: `TESTCODE20`, `FREETRIAL`
3. Test card: `4242 4242 4242 4242`
4. Verify discount appears in Stripe dashboard

### **Validation Testing:**
- ✅ Test expired codes (should fail)
- ✅ Test max redemption limit
- ✅ Test invalid codes (should show error)
- ✅ Test with different subscription plans

---

## 📈 **Common Use Cases**

### **1. Launch Campaign:**
```
Code: LAUNCH50
50% off first 3 months
Max 100 redemptions
Expires in 30 days
```

### **2. Referral Program:**
```
Code: FRIEND20
20% off forever
Unlimited redemptions
No expiration
```

### **3. Seasonal Promotion:**
```
Code: SUMMER2024
30% off first month
Expires: Sept 1, 2024
Max 500 redemptions
```

### **4. VIP Early Access:**
```
Code: VIP100
100% off first month (free)
Max 50 redemptions
Expires in 7 days
```

---

## 🚀 **Quick Start Checklist**

- [ ] Create coupons in Stripe dashboard
- [ ] Create promotion codes from coupons
- [ ] Add promo code input to subscription modal
- [ ] Update subscription service to handle codes
- [ ] Update server-side validation
- [ ] Test with test mode codes
- [ ] Monitor redemptions in Stripe
- [ ] Share codes with customers!

---

## 📞 **Need Help?**

**Stripe Resources:**
- Coupons API: https://stripe.com/docs/api/coupons
- Promotion Codes: https://stripe.com/docs/api/promotion_codes
- Subscription Trials: https://stripe.com/docs/billing/subscriptions/trials

**Common Questions:**
- Can I combine multiple codes? No, one code per subscription
- Can I change a code after applied? No, must cancel and recreate subscription
- Do codes work on annual plans? Yes, if configured correctly
- Can I make codes case-sensitive? No, Stripe auto-uppercases

---

**Ready to boost conversions with promo codes! 🎉**

