-- Fix Leads System: Add missing columns and create lead_purchases table
-- This migration adds all required fields to the leads table and creates the junction table for tracking purchases

-- Step 1: Add missing columns to leads table
ALTER TABLE leads
  -- Name fields
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  
  -- Address fields
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS postcode TEXT,
  
  -- Vehicle fields
  ADD COLUMN IF NOT EXISTS vrn TEXT,
  ADD COLUMN IF NOT EXISTS make TEXT,
  ADD COLUMN IF NOT EXISTS model TEXT,
  ADD COLUMN IF NOT EXISTS year TEXT,
  
  -- Service fields
  ADD COLUMN IF NOT EXISTS glass_type TEXT,
  ADD COLUMN IF NOT EXISTS glass_description TEXT,
  ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'Glass Replacement',
  ADD COLUMN IF NOT EXISTS argic_code TEXT,
  ADD COLUMN IF NOT EXISTS selected_windows JSONB,
  
  -- Pricing fields
  ADD COLUMN IF NOT EXISTS estimated_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS quote_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS credits_cost INTEGER DEFAULT 1,
  
  -- Appointment fields
  ADD COLUMN IF NOT EXISTS appointment_date DATE,
  ADD COLUMN IF NOT EXISTS appointment_time TEXT,
  ADD COLUMN IF NOT EXISTS time_slot TEXT,
  
  -- Assignment fields
  ADD COLUMN IF NOT EXISTS assigned_technician_id UUID,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing rows to have proper timestamps
UPDATE leads SET updated_at = created_at WHERE updated_at IS NULL;

-- Step 2: Create lead_purchases junction table
CREATE TABLE IF NOT EXISTS lead_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  credits_paid INTEGER NOT NULL DEFAULT 1,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  converted_to_job_id UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a technician can only purchase a lead once
  CONSTRAINT unique_lead_technician UNIQUE (lead_id, technician_id)
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_purchases_lead_id ON lead_purchases(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_purchases_technician_id ON lead_purchases(technician_id);
CREATE INDEX IF NOT EXISTS idx_lead_purchases_converted ON lead_purchases(converted_to_job_id) WHERE converted_to_job_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_purchases_purchased_at ON lead_purchases(purchased_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_appointment_date ON leads(appointment_date);

-- Step 4: Add comments for documentation
COMMENT ON TABLE lead_purchases IS 'Junction table tracking which technicians purchased which leads. Max 3 technicians per lead.';
COMMENT ON COLUMN lead_purchases.converted_to_job_id IS 'NULL if lead not yet converted to active job, otherwise references MasterCustomer.id';
COMMENT ON COLUMN leads.credits_cost IS 'Number of credits required to purchase this lead (default 1)';
COMMENT ON COLUMN leads.assigned_technician_id IS 'For direct assignment to specific technician (optional)';

-- Step 5: Enable Row Level Security
ALTER TABLE lead_purchases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for lead_purchases
-- Technicians can view their own purchases
CREATE POLICY "Technicians can view own purchases" ON lead_purchases
  FOR SELECT
  USING (
    technician_id IN (
      SELECT id FROM technicians 
      WHERE user_id = auth.uid() OR contact_email = auth.email()
    )
  );

-- Technicians can insert their own purchases
CREATE POLICY "Technicians can create purchases" ON lead_purchases
  FOR INSERT
  WITH CHECK (
    technician_id IN (
      SELECT id FROM technicians 
      WHERE user_id = auth.uid() OR contact_email = auth.email()
    )
  );

-- Technicians can update their own purchases (for conversion tracking)
CREATE POLICY "Technicians can update own purchases" ON lead_purchases
  FOR UPDATE
  USING (
    technician_id IN (
      SELECT id FROM technicians 
      WHERE user_id = auth.uid() OR contact_email = auth.email()
    )
  );

-- Update RLS policies for leads table to allow technicians to view available leads
DROP POLICY IF EXISTS "Enable read access for all users" ON leads;
CREATE POLICY "Technicians can view available leads" ON leads
  FOR SELECT
  USING (
    status = 'new' OR 
    assigned_technician_id IN (
      SELECT id FROM technicians 
      WHERE user_id = auth.uid() OR contact_email = auth.email()
    )
  );

-- Allow technicians to create leads from price estimator
CREATE POLICY "Technicians can create leads" ON leads
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow technicians to update leads they have access to
CREATE POLICY "Technicians can update accessible leads" ON leads
  FOR UPDATE
  USING (
    assigned_technician_id IN (
      SELECT id FROM technicians 
      WHERE user_id = auth.uid() OR contact_email = auth.email()
    )
  );

-- Step 6: Create function to check lead purchase count
CREATE OR REPLACE FUNCTION get_lead_purchase_count(lead_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM lead_purchases WHERE lead_id = lead_uuid;
$$ LANGUAGE SQL STABLE;

-- Step 7: Create function to check if technician already purchased lead
CREATE OR REPLACE FUNCTION technician_purchased_lead(lead_uuid UUID, tech_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM lead_purchases 
    WHERE lead_id = lead_uuid AND technician_id = tech_uuid
  );
$$ LANGUAGE SQL STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_lead_purchase_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION technician_purchased_lead(UUID, UUID) TO authenticated;

