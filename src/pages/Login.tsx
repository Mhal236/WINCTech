import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export default function Login() {
  const { user, session, isLoading } = useAuth();

  useEffect(() => {
    console.log('🔵 Login page - Auth state:', { user, session, isLoading });
    
    // Check URL for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const hasOAuthParams = urlParams.has('code') || urlParams.has('access_token') || urlParams.has('error');
    
    if (hasOAuthParams) {
      console.log('🔵 OAuth callback detected in URL:', window.location.search);
    }
  }, [user, session, isLoading]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-gray-50">
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
        {/* Header Section */}
        <div className="mb-8 text-center">
          <div className="mb-6">
            {/* Logo/Icon with Brand Colors */}
            <div className="mx-auto w-16 h-16 bg-[#FFC107] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-lg">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Login Form with Glass Effect */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl hover-scale w-full">
          <LoginForm />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Secure login powered by advanced encryption
          </p>
        </div>
      </div>
    </div>
  );
} 