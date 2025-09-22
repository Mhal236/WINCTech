# 🗄️ Technician Database Schema Documentation

## Overview
This document outlines the complete database schema for storing technician application and profile data in the WindscreenCompare system.

## 📋 Applications Table Schema

The `applications` table stores technician application data from the verification form:

```sql
CREATE TABLE applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    
    -- Personal Information
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    
    -- Company Information  
    company_name TEXT,
    business_type TEXT, -- 'Limited Company', 'Sole Trader', 'Partnerships'
    registration_number TEXT, -- Only for Limited Company
    dvla_number TEXT, -- Only for Limited Company
    vat_number TEXT, -- Only for Limited Company (if VAT registered)
    years_in_business TEXT,
    
    -- Contact Information
    contact_phone TEXT,
    business_postcode TEXT, -- NEW: For postcode lookup
    business_address TEXT,
    
    -- Vehicle Information
    vehicle_registration_number TEXT,
    vehicle_make TEXT,
    vehicle_model TEXT,
    driver_license_number TEXT, -- NEW: UK driving license number
    
    -- Services & Certifications
    services_offered TEXT[],
    certifications TEXT,
    insurance_details TEXT,
    additional_info TEXT,
    
    -- Status & Timestamps
    status TEXT DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 👥 Technicians Table Schema

The `technicians` table stores active technician profiles (copied from approved applications):

```sql
ALTER TABLE technicians 
ADD COLUMN IF NOT EXISTS business_postcode TEXT,
ADD COLUMN IF NOT EXISTS driver_license_number TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS dvla_number TEXT,
ADD COLUMN IF NOT EXISTS vat_number TEXT,
ADD COLUMN IF NOT EXISTS years_in_business TEXT,
ADD COLUMN IF NOT EXISTS vehicle_registration_number TEXT,
ADD COLUMN IF NOT EXISTS certifications TEXT,
ADD COLUMN IF NOT EXISTS additional_info TEXT;
```

## 🔄 Field Mapping: Applications → Technicians

When an application is approved, data flows from `applications` to `technicians`:

| Application Field | Technician Field | Notes |
|-------------------|------------------|-------|
| `first_name` + `last_name` | `name` | Combined into single name field |
| `email` | `contact_email` | Primary contact email |
| `contact_phone` | `phone` | Primary phone number |
| `business_address` | `address` | Business address |
| `business_postcode` | `business_postcode` | NEW: Postcode field |
| `driver_license_number` | `driver_license_number` | NEW: Driver license |
| `business_type` | `business_type` | NEW: Business structure |
| `vehicle_make` | `vehicle_make` | Vehicle make |
| `vehicle_model` | `vehicle_model` | Vehicle model |
| `vehicle_registration_number` | `vehicle_registration_number` | NEW: Vehicle reg |
| `services_offered` | `skills` | Services → Skills mapping |
| `insurance_details` | `insurance_details` | NEW: Insurance info |
| `certifications` | `certifications` | NEW: Professional certs |

## 🎯 Form Field Validation by Business Type

### **Sole Trader**
**Required Fields:**
- Personal: first_name, last_name, email
- Company: company_name, business_type
- Contact: contact_phone, business_postcode, business_address
- Vehicle: vehicle_registration_number, vehicle_make, vehicle_model, driver_license_number
- Business: years_in_business, services_offered, insurance_details

**Hidden Fields:**
- registration_number, dvla_number, vat_number, vat_registered

### **Limited Company**
**Required Fields:**
- All Sole Trader fields PLUS:
- Company: registration_number, dvla_number
- VAT: vat_number (if vat_registered is checked)

## 🔗 Database Relationships

```sql
-- Applications reference auth users
applications.user_id → auth.users.id

-- Technicians reference auth users  
technicians.user_id → auth.users.id

-- Applications can be copied to technicians
applications.id → technicians.application_id (via RPC function)
```

## 📊 Indexes for Performance

```sql
-- Applications table indexes
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_email ON applications(email);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_business_type ON applications(business_type);
CREATE INDEX idx_applications_driver_license ON applications(driver_license_number);

-- Technicians table indexes  
CREATE INDEX idx_technicians_driver_license ON technicians(driver_license_number);
CREATE INDEX idx_technicians_business_postcode ON technicians(business_postcode);
CREATE INDEX idx_technicians_business_type ON technicians(business_type);
CREATE INDEX idx_technicians_vehicle_reg ON technicians(vehicle_registration_number);
```

## 🔒 Row Level Security (RLS)

```sql
-- Applications table policies
CREATE POLICY "Users can view own applications" ON applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications" ON applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON applications
    FOR UPDATE USING (auth.uid() = user_id);
```

## 🚀 Deployment Steps

### 1. Run Database Migrations
```sql
-- Run these in Supabase SQL Editor:
\i ensure-technician-application-fields.sql
\i ensure-technician-table-fields.sql
```

### 2. Verify Schema
```sql
-- Check applications table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'applications' 
ORDER BY ordinal_position;

-- Check technicians table structure  
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'technicians' 
ORDER BY ordinal_position;
```

### 3. Test Form Submission
1. Fill out technician verification form
2. Check data appears in `applications` table
3. Approve application (change status to 'pro-1')
4. Verify data copies to `technicians` table

## 📝 Field Descriptions

### **NEW Fields Added:**
- **`business_postcode`**: Stores formatted UK postcode for address lookup
- **`driver_license_number`**: UK driving license number (16 characters, uppercase)
- **`business_type`**: Business structure (Limited Company, Sole Trader, Partnerships)
- **`vehicle_registration_number`**: Technician's vehicle registration
- **`certifications`**: Professional certifications and qualifications
- **`additional_info`**: Any additional information about the technician

### **Conditional Fields:**
- **`registration_number`**: Only required/shown for Limited Company
- **`dvla_number`**: Only required/shown for Limited Company  
- **`vat_number`**: Only required/shown for Limited Company (if VAT registered)

## 🎯 Data Flow Summary

1. **User fills form** → Data stored in `applications` table
2. **Admin approves** → Status changed to 'pro-1'/'pro-2'/'admin'
3. **Auto-trigger** → Data copied to `technicians` table via RPC function
4. **User gains access** → Can use technician features based on role

This schema ensures complete data capture for all technician verification requirements while maintaining flexibility for different business types! 🚀
