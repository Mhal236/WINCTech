-- Stripe Connect Accounts Table
CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  technician_id TEXT NOT NULL,
  stripe_account_id TEXT NOT NULL UNIQUE,
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  details_submitted BOOLEAN DEFAULT false,
  email TEXT,
  country TEXT DEFAULT 'GB',
  default_currency TEXT DEFAULT 'gbp',
  metadata JSONB,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(technician_id)
);

-- Cashout Requests Table
CREATE TABLE IF NOT EXISTS cashout_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  technician_id TEXT NOT NULL,
  stripe_account_id UUID REFERENCES stripe_connect_accounts(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  jobs_count INTEGER NOT NULL,
  job_ids TEXT[], -- Array of job IDs included in cashout
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  stripe_payout_id TEXT,
  stripe_transfer_id TEXT,
  failure_code TEXT,
  failure_message TEXT,
  metadata JSONB,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE stripe_connect_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashout_requests ENABLE ROW LEVEL SECURITY;

-- Policies for stripe_connect_accounts
CREATE POLICY "Users can view own stripe account"
  ON stripe_connect_accounts FOR SELECT
  USING (auth.uid() = technician_id);

CREATE POLICY "Users can update own stripe account"
  ON stripe_connect_accounts FOR UPDATE
  USING (auth.uid() = technician_id);

-- Policies for cashout_requests
CREATE POLICY "Users can view own cashout requests"
  ON cashout_requests FOR SELECT
  USING (auth.uid() = technician_id);

CREATE POLICY "Users can create own cashout requests"
  ON cashout_requests FOR INSERT
  WITH CHECK (auth.uid() = technician_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stripe_connect_technician ON stripe_connect_accounts(technician_id);
CREATE INDEX IF NOT EXISTS idx_stripe_connect_account_id ON stripe_connect_accounts(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_cashout_requests_technician ON cashout_requests(technician_id);
CREATE INDEX IF NOT EXISTS idx_cashout_requests_status ON cashout_requests(status);
CREATE INDEX IF NOT EXISTS idx_cashout_requests_stripe_payout ON cashout_requests(stripe_payout_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_stripe_connect_accounts_updated_at BEFORE UPDATE ON stripe_connect_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cashout_requests_updated_at BEFORE UPDATE ON cashout_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

