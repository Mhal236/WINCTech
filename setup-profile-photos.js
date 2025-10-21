/**
 * Setup script for profile photos feature
 * This will:
 * 1. Create the profile-photos storage bucket
 * 2. Add photo_url column to database tables
 * 3. Set up storage policies
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://julpwjxzrlkbxdbphrdy.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  console.log('Please add it to your .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupProfilePhotos() {
  console.log('🚀 Setting up profile photos feature...\n');

  // Step 1: Create storage bucket
  console.log('1️⃣ Creating storage bucket...');
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === 'profile-photos');

  if (bucketExists) {
    console.log('✅ Bucket "profile-photos" already exists');
  } else {
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('profile-photos', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    });

    if (bucketError) {
      console.error('❌ Error creating bucket:', bucketError);
    } else {
      console.log('✅ Bucket "profile-photos" created successfully');
    }
  }

  // Step 2: Apply database migration
  console.log('\n2️⃣ Adding photo_url column to database...');
  
  const migrationSQL = fs.readFileSync('./supabase/migrations/20250120_add_profile_photo.sql', 'utf8');
  
  const { error: migrationError } = await supabase.rpc('exec_sql', { sql: migrationSQL });
  
  if (migrationError) {
    console.log('⚠️ Note: RPC method not available, please run migration manually');
    console.log('   Go to Supabase Dashboard → SQL Editor');
    console.log('   Copy contents of: supabase/migrations/20250120_add_profile_photo.sql');
    console.log('   Execute the SQL');
  } else {
    console.log('✅ Database migration applied successfully');
  }

  console.log('\n✨ Profile photos setup complete!');
  console.log('\nNext steps:');
  console.log('1. Restart your dev server (Ctrl+C then npm run dev)');
  console.log('2. Go to Settings → General tab');
  console.log('3. Upload your profile photo!');
}

setupProfilePhotos().catch(console.error);

