import { LoginForm } from "@/components/auth/LoginForm";
import { OAuthDebugInfo } from "@/components/auth/OAuthDebugInfo";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { ModalPageTransition } from "@/components/PageTransition";
import { Navigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = `${window.location.protocol}//${window.location.host}/login`;

export default function Login() {
  const { user, session, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);

  // Handle Google OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    console.log('🔵 Login page - Auth state:', { user, session, isLoading });
    console.log('🔵 OAuth params:', { code: !!code, error });
    
    if (error) {
      toast({
        title: "Authentication Error",
        description: `Google OAuth error: ${error}`,
        variant: "destructive",
      });
      return;
    }

    if (code) {
      handleGoogleCallback(code);
    }
  }, [searchParams, user, session, isLoading]);

  const handleGoogleCallback = async (code: string) => {
    console.log('🔵 Processing Google OAuth callback with code:', code);
    setIsProcessingCallback(true);
    
    try {
      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        throw new Error('Google OAuth credentials not configured');
      }

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: GOOGLE_REDIRECT_URI,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', errorText);
        throw new Error(`Failed to exchange code for tokens: ${tokenResponse.status} ${tokenResponse.statusText}`);
      }

      const tokens = await tokenResponse.json();
      
      // Get user info from Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userData = await userResponse.json();

      console.log('🔵 Google user data received:', userData);
      console.log('🔵 User email:', userData.email);

      // Check if user has a valid email
      if (!userData.email) {
        console.error('🔴 No email found in user data');
        throw new Error('Access denied. No email address found.');
      }

      // Generate session token
      const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

      // Store session data in localStorage
      localStorage.setItem('google_session_token', sessionToken);
      localStorage.setItem('google_user_data', JSON.stringify({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        domain: userData.email.split('@')[1]
      }));

      toast({
        title: "Login Successful",
        description: `Welcome ${userData.name}!`,
      });

      // Clean up URL and redirect
      window.history.replaceState({}, '', '/login');
      window.location.href = '/';
      
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      toast({
        title: "Authentication Failed",
        description: error.message || "An error occurred during authentication",
        variant: "destructive",
      });
      
      // Clean up URL on error
      window.history.replaceState({}, '', '/login');
    } finally {
      setIsProcessingCallback(false);
    }
  };

  // If user is already authenticated and not loading, redirect to dashboard
  // Note: We check for user OR session to handle cases where one might load faster
  if (!isLoading && (user || session) && !searchParams.get('code')) {
    console.log('🔵 User already authenticated, redirecting to dashboard');
    return <Navigate to="/" replace />;
  }


  // Show loading during OAuth callback processing
  if (isProcessingCallback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner />
          <p className="text-sm text-muted-foreground">Processing Google authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <ModalPageTransition>
      <div className="min-h-screen w-full flex items-center justify-center mobile-container relative overflow-hidden bg-gradient-to-br from-gray-50 to-cyan-50 safe-area-pt safe-area-pb">
        {/* Debug info - only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed top-4 right-4 bg-black/80 text-white p-2 rounded text-xs z-50">
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>User: {user ? user.email : 'None'}</div>
            <div>Session: {session ? 'Yes' : 'No'}</div>
          </div>
        )}
        
        {/* WindscreenCompare Brand Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#0FB8C1]/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#0FB8C1]/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-cyan-200/20 rounded-full blur-3xl"></div>
        </div>

        {/* Main Content Container */}
        <div className="relative z-10 w-full max-w-md mx-auto px-4">
          {/* Debug Info */}
          <OAuthDebugInfo />
          
          {/* Header Section with WindscreenCompare Branding */}
          <div className="mb-8 text-center">
            {/* WindscreenCompare Logo */}
            <div className="mb-6">
              <div className="mx-auto w-24 h-24 mb-4 flex items-center justify-center">
                <img 
                  src="/WINC.png" 
                  alt="WindscreenCompare" 
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                WindscreenCompare
              </h1>
              <p className="text-lg font-semibold text-[#0FB8C1]">
                Technician Portal
              </p>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Sign in to manage your jobs and orders
            </p>
          </div>

          {/* Login Form with Brand Styling */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-[#0FB8C1]/20 hover:shadow-2xl transition-all duration-300 w-full">
            <LoginForm />
          </div>

          {/* Footer with Brand Info */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-gray-600">
              The UK's leading glass comparison platform
            </p>
            <p className="text-xs text-gray-500">
              Secure authentication • Encrypted data • Trusted by professionals
            </p>
          </div>
        </div>
      </div>
    </ModalPageTransition>
  );
} 