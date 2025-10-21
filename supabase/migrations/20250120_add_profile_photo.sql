-- Add photo_url column to technicians table
ALTER TABLE IF EXISTS public.technicians 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add photo_url column to app_users table
ALTER TABLE IF EXISTS public.app_users 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create storage bucket for profile photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for profile photos
-- Allow authenticated users to upload their own photos
CREATE POLICY IF NOT EXISTS "Users can upload their own profile photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own photos
CREATE POLICY IF NOT EXISTS "Users can update their own profile photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own photos
CREATE POLICY IF NOT EXISTS "Users can delete their own profile photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to profile photos
CREATE POLICY IF NOT EXISTS "Profile photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- Add helpful comment
COMMENT ON COLUMN public.technicians.photo_url IS 'URL to the user''s profile photo stored in Supabase Storage';
COMMENT ON COLUMN public.app_users.photo_url IS 'URL to the user''s profile photo stored in Supabase Storage';

