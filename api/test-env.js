// Simple endpoint to check if environment variables are configured
export default async function handler(req, res) {
  const hasSupabaseUrl = !!process.env.VITE_SUPABASE_URL;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasAnonKey = !!process.env.VITE_SUPABASE_ANON_KEY;

  return res.status(200).json({
    configured: {
      VITE_SUPABASE_URL: hasSupabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: hasServiceKey,
      VITE_SUPABASE_ANON_KEY: hasAnonKey
    },
    message: hasSupabaseUrl && hasServiceKey && hasAnonKey 
      ? '✅ All required environment variables are configured' 
      : '❌ Missing required environment variables'
  });
}

