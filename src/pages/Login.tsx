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
      <div className="min-h-screen w-full flex items-center justify-center mobile-container relative overflow-hidden bg-gray-50 safe-area-pt safe-area-pb">
        {/* Debug info - only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed top-4 right-4 bg-black/80 text-white p-2 rounded text-xs z-50">
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>User: {user ? user.email : 'None'}</div>
            <div>Session: {session ? 'Yes' : 'No'}</div>
          </div>
        )}
        
        {/* Subtle Background Elements with Brand Colors */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl"></div>
        </div>

        {/* Main Content Container */}
        <div className="relative z-10 w-full max-w-md mx-auto">
          {/* Debug Info */}
          <OAuthDebugInfo />
          
          {/* Header Section */}
          <div className="mb-6 sm:mb-8 text-center">
            <div className="mb-4 sm:mb-6">
              {/* Logo/Icon with Brand Colors */}
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-[#FFC107] rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
              Welcome Back
            </h1>
            <p className="text-gray-600 text-base sm:text-lg">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Login Form with Glass Effect */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-2xl hover-scale w-full">
            <LoginForm />
          </div>

          {/* Footer */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs sm:text-sm text-gray-500">
              Secure login powered by advanced encryption
            </p>
          </div>
        </div>
      </div>
    </ModalPageTransition>
  );
} 