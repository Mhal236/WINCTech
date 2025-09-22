-- Ensure all technician fields exist in the technicians table
-- This migration adds any missing columns that might be copied from applications

-- Add missing columns to technicians table if they don't exist
ALTER TABLE technicians 
ADD COLUMN IF NOT EXISTS business_postcode TEXT,
ADD COLUMN IF NOT EXISTS driver_license_number TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS dvla_number TEXT,
ADD COLUMN IF NOT EXISTS vat_number TEXT,
ADD COLUMN IF NOT EXISTS years_in_business TEXT,
ADD COLUMN IF NOT EXISTS vehicle_registration_number TEXT,
ADD COLUMN IF NOT EXISTS coverage_areas TEXT[],
ADD COLUMN IF NOT EXISTS certifications TEXT,
ADD COLUMN IF NOT EXISTS additional_info TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_technicians_driver_license ON technicians(driver_license_number);
CREATE INDEX IF NOT EXISTS idx_technicians_business_postcode ON technicians(business_postcode);
CREATE INDEX IF NOT EXISTS idx_technicians_business_type ON technicians(business_type);
CREATE INDEX IF NOT EXISTS idx_technicians_vehicle_reg ON technicians(vehicle_registration_number);

-- Add comments to document the fields
COMMENT ON COLUMN technicians.business_postcode IS 'Business postcode for address lookup';
COMMENT ON COLUMN technicians.driver_license_number IS 'UK driving license number (16 characters)';
COMMENT ON COLUMN technicians.business_type IS 'Type of business: Limited Company, Sole Trader, or Partnerships';
COMMENT ON COLUMN technicians.coverage_areas IS 'JSON array of geographical areas where technician provides services';
COMMENT ON COLUMN technicians.registration_number IS 'Company registration number (for Limited Companies)';
COMMENT ON COLUMN technicians.dvla_number IS 'DVLA number for business registration';
COMMENT ON COLUMN technicians.vat_number IS 'VAT registration number (for VAT registered businesses)';
COMMENT ON COLUMN technicians.vehicle_registration_number IS 'Technician vehicle registration number';
COMMENT ON COLUMN technicians.certifications IS 'Professional certifications and qualifications';
COMMENT ON COLUMN technicians.additional_info IS 'Additional information about the technician';

-- Update any existing RPC functions to handle new fields
-- Note: This would need to be updated in the actual database functions
