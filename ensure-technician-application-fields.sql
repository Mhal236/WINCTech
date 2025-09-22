-- Ensure all technician application fields exist in the applications table
-- This migration adds any missing columns for the verification form

-- Add missing columns to applications table if they don't exist
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS dvla_number TEXT,
ADD COLUMN IF NOT EXISTS vat_number TEXT,
ADD COLUMN IF NOT EXISTS years_in_business TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS business_postcode TEXT,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS vehicle_registration_number TEXT,
ADD COLUMN IF NOT EXISTS vehicle_make TEXT,
ADD COLUMN IF NOT EXISTS vehicle_model TEXT,
ADD COLUMN IF NOT EXISTS driver_license_number TEXT,
ADD COLUMN IF NOT EXISTS services_offered TEXT[],
ADD COLUMN IF NOT EXISTS coverage_areas TEXT[],
ADD COLUMN IF NOT EXISTS certifications TEXT,
ADD COLUMN IF NOT EXISTS insurance_details TEXT,
ADD COLUMN IF NOT EXISTS additional_info TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_business_type ON applications(business_type);
CREATE INDEX IF NOT EXISTS idx_applications_driver_license ON applications(driver_license_number);

-- Add comments to document the new fields
COMMENT ON COLUMN applications.business_postcode IS 'Business postcode for address lookup';
COMMENT ON COLUMN applications.driver_license_number IS 'UK driving license number (16 characters)';
COMMENT ON COLUMN applications.business_type IS 'Type of business: Limited Company, Sole Trader, or Partnerships';
COMMENT ON COLUMN applications.coverage_areas IS 'JSON array of geographical areas where technician provides services';

-- Create or update the applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    
    -- Personal Information
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    
    -- Company Information  
    company_name TEXT,
    business_type TEXT,
    registration_number TEXT,
    dvla_number TEXT,
    vat_number TEXT,
    years_in_business TEXT,
    
    -- Contact Information
    contact_phone TEXT,
    business_postcode TEXT,
    business_address TEXT,
    
    -- Vehicle Information
    vehicle_registration_number TEXT,
    vehicle_make TEXT,
    vehicle_model TEXT,
    driver_license_number TEXT,
    
    -- Services & Certifications
    services_offered TEXT[],
    coverage_areas TEXT[],
    certifications TEXT,
    insurance_details TEXT,
    additional_info TEXT,
    
    -- Status & Timestamps
    status TEXT DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure RLS is enabled
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
    -- Policy for users to read their own applications
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'applications' 
        AND policyname = 'Users can view own applications'
    ) THEN
        CREATE POLICY "Users can view own applications" ON applications
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    -- Policy for users to insert their own applications
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'applications' 
        AND policyname = 'Users can insert own applications'
    ) THEN
        CREATE POLICY "Users can insert own applications" ON applications
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- Policy for users to update their own applications
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'applications' 
        AND policyname = 'Users can update own applications'
    ) THEN
        CREATE POLICY "Users can update own applications" ON applications
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END
$$;
