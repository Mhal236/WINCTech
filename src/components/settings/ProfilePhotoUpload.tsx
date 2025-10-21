import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, Upload, X, User as UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from '@supabase/supabase-js';
import { toast } from "@/hooks/use-toast";

// Direct Supabase client for storage operations
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://julpwjxzrlkbxdbphrdy.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1bHB3anh6cmxrYnhkYnBocmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MTQ4NDUsImV4cCI6MjA1Mjk5MDg0NX0.rynZAq6bjPlpfyTaxHYcs8FdVdTo_gy95lazi2Kt5RY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export function ProfilePhotoUpload() {
  const { user, refreshUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get user initials for fallback
  const getInitials = () => {
    if (!user) return "?";
    const name = user.name || user.email || "";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!user?.id || !fileInputRef.current?.files?.[0]) return;

    const file = fileInputRef.current.files[0];
    setIsUploading(true);

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName; // Don't include bucket name in path

      console.log('Uploading profile photo:', filePath);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('Public URL:', publicUrl);

      // Update user profile in both tables
      const updates = { photo_url: publicUrl };

      // Update technicians table
      const { error: techError } = await supabase
        .from('technicians')
        .update(updates)
        .eq('id', user.id);

      // Update app_users table
      const { error: appError } = await supabase
        .from('app_users')
        .update(updates)
        .eq('id', user.id);

      if (techError && appError) {
        console.error('Database update errors:', { techError, appError });
        throw new Error('Failed to update profile');
      }

      console.log('Profile updated in database');

      // Refresh user data to get the new photo
      await refreshUser();

      toast({
        title: "Photo Updated",
        description: "Your profile photo has been successfully updated",
      });

      // Clear preview and input
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.id || !user.photo_url) return;

    const confirmed = confirm("Are you sure you want to remove your profile photo?");
    if (!confirmed) return;

    setIsUploading(true);

    try {
      // Extract filename from URL
      const urlParts = user.photo_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = fileName; // Don't include bucket name

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('profile-photos')
        .remove([filePath]);

      if (deleteError) {
        console.warn('Error deleting old photo from storage:', deleteError);
        // Continue anyway as the file might not exist
      }

      // Update database to remove photo_url
      const updates = { photo_url: null };

      await supabase.from('technicians').update(updates).eq('id', user.id);
      await supabase.from('app_users').update(updates).eq('id', user.id);

      // Refresh user data
      await refreshUser();

      toast({
        title: "Photo Removed",
        description: "Your profile photo has been removed",
      });

    } catch (error) {
      console.error('Error removing photo:', error);
      toast({
        title: "Error",
        description: "Failed to remove photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const cancelPreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2 mobile-card">
        <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-[#145484] mr-2" />
        <CardTitle className="text-base sm:text-lg font-semibold">Profile Photo</CardTitle>
      </CardHeader>
      <CardContent className="mobile-card">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Upload a profile photo to personalize your account. This will be displayed in the sidebar and throughout the app.
          </p>

          {/* Current/Preview Photo */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={previewUrl || user?.photo_url || ""} 
                  alt={user?.name || "Profile"}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-[#145484] to-[#0FB8C1] text-white">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              {(user?.photo_url || previewUrl) && (
                <div className="absolute -top-2 -right-2">
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8 rounded-full"
                    onClick={previewUrl ? cancelPreview : handleRemovePhoto}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!previewUrl ? (
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full sm:w-auto"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Photo
                  </Button>
                  <p className="text-xs text-gray-500">
                    JPG, PNG or GIF. Max size 5MB.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="flex-1 sm:flex-none"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4 mr-2" />
                          Save Photo
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={cancelPreview}
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                  </div>
                  <p className="text-xs text-green-600">
                    Preview ready! Click "Save Photo" to upload.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

