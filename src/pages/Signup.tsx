import { SignupForm } from "@/components/auth/SignupForm";
import { ModalPageTransition } from "@/components/PageTransition";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function Signup() {
  const { user, session, isLoading } = useAuth();

  // If user is already authenticated and not loading, redirect to dashboard
  if (!isLoading && user && session) {
    console.log('🔵 User already authenticated, redirecting to dashboard');
    return <Navigate to="/" replace />;
  }
  return (
    <ModalPageTransition>
      <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-gray-50 to-cyan-50">
        {/* WindscreenCompare Brand Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#0FB8C1]/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#0FB8C1]/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-cyan-200/20 rounded-full blur-3xl"></div>
        </div>

        {/* Main Content Container */}
        <div className="relative z-10 w-full max-w-md mx-auto">
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
              Create Your Account
            </h2>
            <p className="text-gray-600">
              Join the UK's leading glass comparison platform
            </p>
          </div>

          {/* Signup Form with Brand Styling */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-[#0FB8C1]/20 hover:shadow-2xl transition-all duration-300 w-full">
            <SignupForm />
          </div>

          {/* Footer with Brand Info */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Start managing your glass repair jobs today
            </p>
            <p className="text-xs text-gray-500">
              Secure registration • Encrypted data • Trusted by professionals
            </p>
          </div>
        </div>
      </div>
    </ModalPageTransition>
  );
} 