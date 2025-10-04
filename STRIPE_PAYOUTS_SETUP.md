# Stripe Payouts API Setup Guide

## Overview
Your cashout feature now uses **Stripe Payouts API** instead of Stripe Connect. This is simpler for technicians - they just add their bank account details once and can request cashouts directly.

## ✅ What's Already Implemented (Beta)

### Frontend Components:
1. **Bank Account Management UI** in `CashoutSettings.tsx`
   - Add/Update/Remove bank account details
   - Validates UK bank account format (8-digit account, XX-XX-XX sort code)
   - Secure storage (currently localStorage for beta, ready for API)
   - Beautiful UI with dialogs and forms

2. **Cashout Request Flow**
   - Checks for bank account before allowing cashout
   - Selects completed jobs for cashout
   - Shows total amount and payout preview
   - Displays payout destination

3. **Bank Account Details Stored**:
   - Account Holder Name
   - Account Number (8 digits, masked after saving)
   - Sort Code (XX-XX-XX format)
   - Bank Name (optional)

## 🔧 Production Implementation Steps

### 1. Database Schema

Create a `bank_accounts` table in Supabase:

```sql
-- Bank Accounts Table
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  account_holder_name TEXT NOT NULL,
  account_number_encrypted TEXT NOT NULL, -- Encrypted
  sort_code TEXT NOT NULL,
  bank_name TEXT,
  stripe_bank_account_token TEXT, -- Stripe token for the bank account
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(technician_id)
);

-- Enable RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own bank account
CREATE POLICY "Users can view own bank account"
  ON bank_accounts FOR SELECT
  USING (auth.uid() = technician_id);

-- Cashout Requests Table
CREATE TABLE cashout_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  jobs_count INTEGER NOT NULL,
  job_ids TEXT[], -- Array of job IDs included in cashout
  bank_account_id UUID REFERENCES bank_accounts(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  stripe_payout_id TEXT, -- Stripe payout ID
  stripe_transfer_id TEXT, -- Stripe transfer ID
  failure_reason TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cashout_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own cashout requests
CREATE POLICY "Users can view own cashout requests"
  ON cashout_requests FOR SELECT
  USING (auth.uid() = technician_id);
```

### 2. API Endpoints

Add these endpoints to `api-server.js`:

```javascript
// Save Bank Account (with encryption)
app.post('/api/cashout/save-bank-account', async (req, res) => {
  try {
    const { technicianId, accountHolderName, accountNumber, sortCode, bankName } = req.body;

    // TODO: Encrypt account number before storing
    // const encryptedAccountNumber = encrypt(accountNumber);

    // Create Stripe bank account token
    const bankAccountToken = await stripe.tokens.create({
      bank_account: {
        country: 'GB',
        currency: 'gbp',
        account_holder_name: accountHolderName,
        account_holder_type: 'individual',
        routing_number: sortCode.replace(/-/g, ''), // Remove dashes
        account_number: accountNumber,
      },
    });

    // Save to database
    const { data, error } = await supabase
      .from('bank_accounts')
      .upsert({
        technician_id: technicianId,
        account_holder_name: accountHolderName,
        account_number_encrypted: encryptedAccountNumber,
        sort_code: sortCode,
        bank_name: bankName,
        stripe_bank_account_token: bankAccountToken.id,
        is_verified: true,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error saving bank account:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Bank Account
app.post('/api/cashout/get-bank-account', async (req, res) => {
  try {
    const { technicianId } = req.body;

    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('technician_id', technicianId)
      .single();

    if (error) throw error;

    // Return masked account number
    if (data) {
      data.account_number = `****${data.account_number_encrypted.slice(-4)}`;
      delete data.account_number_encrypted;
      delete data.stripe_bank_account_token; // Don't expose token
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching bank account:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Request Cashout
app.post('/api/cashout/request', async (req, res) => {
  try {
    const { technicianId, jobIds, amount } = req.body;

    // Validate minimum cashout
    if (amount < 20) {
      return res.status(400).json({ 
        success: false, 
        error: 'Minimum cashout amount is £20.00' 
      });
    }

    // Get bank account
    const { data: bankAccount, error: bankError } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('technician_id', technicianId)
      .single();

    if (bankError || !bankAccount) {
      return res.status(400).json({ 
        success: false, 
        error: 'No bank account found. Please add your bank account first.' 
      });
    }

    // Create Stripe Payout
    const payout = await stripe.payouts.create({
      amount: Math.round(amount * 100), // Convert to pence
      currency: 'gbp',
      method: 'standard', // or 'instant' for instant payouts (higher fee)
      description: `Cashout for ${jobIds.length} jobs`,
      destination: bankAccount.stripe_bank_account_token,
      metadata: {
        technician_id: technicianId,
        jobs_count: jobIds.length,
        job_ids: jobIds.join(','),
      },
    });

    // Create cashout request record
    const { data: cashoutRequest, error: requestError } = await supabase
      .from('cashout_requests')
      .insert({
        technician_id: technicianId,
        amount: amount,
        jobs_count: jobIds.length,
        job_ids: jobIds,
        bank_account_id: bankAccount.id,
        status: 'processing',
        stripe_payout_id: payout.id,
        metadata: { payout },
      })
      .select()
      .single();

    if (requestError) throw requestError;

    // Mark jobs as paid out
    await supabase
      .from('job_assignments')
      .update({ payout_status: 'paid' })
      .in('id', jobIds);

    res.json({ 
      success: true, 
      data: cashoutRequest,
      message: `Payout of £${amount.toFixed(2)} initiated to your bank account` 
    });
  } catch (error) {
    console.error('Error requesting cashout:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Cashout History
app.post('/api/cashout/history', async (req, res) => {
  try {
    const { technicianId } = req.body;

    const { data, error } = await supabase
      .from('cashout_requests')
      .select('*')
      .eq('technician_id', technicianId)
      .order('requested_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching cashout history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stripe Webhook for Payout Updates
app.post('/api/stripe/payout-webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_PAYOUT_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle payout events
  switch (event.type) {
    case 'payout.paid':
      // Payout succeeded
      const payout = event.data.object;
      await supabase
        .from('cashout_requests')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('stripe_payout_id', payout.id);
      break;

    case 'payout.failed':
      // Payout failed
      const failedPayout = event.data.object;
      await supabase
        .from('cashout_requests')
        .update({ 
          status: 'failed',
          failure_reason: failedPayout.failure_message
        })
        .eq('stripe_payout_id', failedPayout.id);
      break;
  }

  res.json({received: true});
});
```

### 3. Update Frontend to Use API

Update `CashoutSettings.tsx` to call the API endpoints instead of localStorage:

```typescript
// Replace fetchBankAccount
const fetchBankAccount = async () => {
  if (!user?.id) return;

  try {
    const response = await fetch('/api/cashout/get-bank-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technicianId: user.id })
    });

    const result = await response.json();
    if (result.success && result.data) {
      setBankAccount(result.data);
    }
  } catch (error) {
    console.error('Error fetching bank account:', error);
  }
};

// Replace handleSaveBankAccount
const handleSaveBankAccount = async () => {
  // ... validation code ...

  setSavingBank(true);

  try {
    const response = await fetch('/api/cashout/save-bank-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        technicianId: user?.id,
        accountHolderName,
        accountNumber,
        sortCode,
        bankName,
      })
    });

    const result = await response.json();
    
    if (result.success) {
      setBankAccount(result.data);
      toast({
        title: "Bank Account Saved",
        description: "Your bank account details have been securely saved",
      });
      setShowBankDialog(false);
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    toast({
      title: "Error",
      description: error.message || "Failed to save bank account details",
      variant: "destructive",
    });
  } finally {
    setSavingBank(false);
  }
};

// Replace handleCashoutRequest
const handleCashoutRequest = async () => {
  // ... validation code ...

  setProcessing(true);

  try {
    const response = await fetch('/api/cashout/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        technicianId: user?.id,
        jobIds: Array.from(selectedJobs),
        amount: getTotalPendingAmount(),
      })
    });

    const result = await response.json();
    
    if (result.success) {
      toast({
        title: "Cashout Request Submitted",
        description: result.message,
      });

      // Refresh data
      fetchCompletedJobs();
      fetchCashoutHistory();
      setSelectedJobs(new Set());
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    toast({
      title: "Error",
      description: error.message || "Failed to process cashout request",
      variant: "destructive",
    });
  } finally {
    setProcessing(false);
  }
};
```

## 🔐 Security Considerations

1. **Encrypt Bank Account Numbers**: Use AES-256 encryption before storing
2. **Use Environment Variables**: Store encryption keys securely
3. **Validate Input**: Always validate account number and sort code format
4. **Use HTTPS**: Ensure all API calls are over HTTPS in production
5. **Audit Trail**: Log all bank account changes and cashout requests

## 💰 Payout Details

- **Platform Fee**: 15% (technicians receive 85%)
- **Minimum Cashout**: £20.00
- **Payout Speed**: 
  - Standard: 1-2 business days (free)
  - Instant: ~30 minutes (Stripe charges extra fee)
- **Supported Banks**: All UK banks with sort code/account number

## 📊 Testing

### Stripe Test Bank Accounts:
- **Success**: Account: `00012345`, Sort Code: `10-88-00`
- **Failure**: Account: `00000002`, Sort Code: `10-88-00`

## 🚀 Next Steps

1. Set up database tables in Supabase
2. Implement encryption for bank account numbers
3. Create API endpoints in api-server.js
4. Update frontend to use API instead of localStorage
5. Set up Stripe webhook for payout status updates
6. Test thoroughly with Stripe test mode
7. Add monitoring and error logging

## 📝 Notes

- Currently using localStorage for beta - replace with API calls
- Bank account validation is client-side - add server-side validation
- Consider adding 2FA for bank account changes
- Add email notifications for successful payouts

