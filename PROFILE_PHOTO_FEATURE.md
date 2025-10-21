# Profile Photo Upload Feature

## Overview
Users can now upload their profile photo from the Settings page. The photo will be displayed in the sidebar avatar, replacing the letter initials.

## Features Implemented

### 1. **Profile Photo Upload Component**
- Location: `src/components/settings/ProfilePhotoUpload.tsx`
- Features:
  - Image file selection with validation (max 5MB, image types only)
  - Live preview before uploading
  - Upload to Supabase Storage
  - Remove/delete photo functionality
  - Automatic profile refresh after upload

### 2. **UI Updates**
- Settings page now has a "Profile Photo" card at the top of the General tab
- Sidebar avatar (`UserProfile` component) now displays the uploaded photo
- Gradient fallback for avatars when no photo is uploaded

### 3. **Database Schema**
- Added `photo_url` field to both `technicians` and `app_users` tables
- Created `profile-photos` storage bucket in Supabase
- Implemented Row Level Security (RLS) policies for secure photo management

### 4. **Auth Context Updates**
- User interface now includes `photo_url` field
- All user data fetching locations updated to include photo URL
- Photo URL persists across session refreshes

## Deployment Steps

### Step 1: Run Database Migration

You need to apply the migration to add the `photo_url` column and create the storage bucket.

#### Option A: Using Supabase CLI (Recommended for production)
```bash
cd /Users/muhammadali/Desktop/WindscreenCompare/GITHUBrepo/WINTechnician
supabase db push
```

#### Option B: Using MCP (If connected)
The migration file is ready at: `supabase/migrations/20250120_add_profile_photo.sql`

#### Option C: Manual SQL Execution
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20250120_add_profile_photo.sql`
4. Execute the SQL

### Step 2: Create Storage Bucket (If not created by migration)

If the migration doesn't automatically create the storage bucket:

1. Go to Supabase Dashboard → Storage
2. Click "Create Bucket"
3. Name: `profile-photos`
4. Make it **Public** (allow public reads)
5. Click "Create"

### Step 3: Configure Storage Policies

The migration should set these up automatically, but verify in Dashboard → Storage → profile-photos → Policies:

**Required Policies:**
1. **Insert**: Users can upload their own profile photos
2. **Update**: Users can update their own profile photos
3. **Delete**: Users can delete their own profile photos  
4. **Select**: Profile photos are publicly accessible

### Step 4: Test the Feature

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Log in and navigate to:**
   - Settings → General tab
   - You should see the "Profile Photo" card at the top

3. **Test uploading:**
   - Click "Choose Photo"
   - Select an image (JPG, PNG, GIF < 5MB)
   - Preview appears
   - Click "Save Photo"
   - Photo should upload and appear in sidebar

4. **Test removal:**
   - Click the X button on the avatar
   - Photo should be removed
   - Initials should reappear

### Step 5: Deploy to Production

```bash
git add .
git commit -m "Add profile photo upload feature"
git push origin main
```

Make sure your production Supabase instance has the migration applied and storage bucket configured.

## File Changes

### New Files:
- `src/components/settings/ProfilePhotoUpload.tsx` - Main component
- `supabase/migrations/20250120_add_profile_photo.sql` - Database migration
- `PROFILE_PHOTO_FEATURE.md` - This file

### Modified Files:
- `src/pages/Settings.tsx` - Added ProfilePhotoUpload component
- `src/components/auth/UserProfile.tsx` - Updated to display photo_url
- `src/contexts/AuthContext.tsx` - Added photo_url to User interface and all fetch locations

## Technical Details

### Storage Structure
```
profile-photos/
  └── {user_id}-{timestamp}.{ext}
```

Photos are named with user ID and timestamp to ensure uniqueness and easy cleanup.

### Database Schema
```sql
ALTER TABLE technicians ADD COLUMN photo_url TEXT;
ALTER TABLE app_users ADD COLUMN photo_url TEXT;
```

### RLS Policies
- Users can only upload/update/delete their own photos
- All photos are publicly readable (for display in UI)
- Storage path enforces user ID matching for security

## Security

✅ **File validation** - Only image types, max 5MB
✅ **RLS policies** - Users can only modify their own photos  
✅ **Path-based security** - Photos stored with user ID in path
✅ **Public read** - Photos need to be publicly accessible for display

## Future Enhancements

Possible improvements:
- Image cropping/resizing before upload
- Drag-and-drop upload
- Multiple photo sizes (thumbnail, full size)
- Photo compression
- Animated GIF support
- Profile photo in more locations (e.g., header on mobile)

## Troubleshooting

### "Failed to upload photo"
- Check Supabase Storage is enabled
- Verify storage bucket `profile-photos` exists and is public
- Check browser console for detailed error

### Photo doesn't appear in sidebar
- Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+F5)
- Check user object in AuthContext has photo_url
- Verify photo URL is accessible (try opening in new tab)

### Storage policies error
- Verify RLS policies are set correctly in Supabase Dashboard
- Check user is authenticated
- Ensure user ID matches in storage path

## Support

For issues or questions, check:
1. Browser console for errors
2. Supabase Dashboard → Storage → Logs
3. Network tab in DevTools for upload requests

