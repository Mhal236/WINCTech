import { SignupForm } from "@/components/auth/SignupForm";
import { ModalPageTransition } from "@/components/PageTransition";

export default function Signup() {
  return (
    <ModalPageTransition>
      <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-gray-50">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Create Account
            </h1>
            <p className="text-gray-600 text-lg">
              Join WindScreen Compare today
            </p>
          </div>

          {/* Signup Form with Glass Effect */}
          <div className="glass-card rounded-2xl p-8 shadow-2xl hover-scale w-full">
            <SignupForm />
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Secure registration powered by advanced encryption
            </p>
          </div>
        </div>
      </div>
    </ModalPageTransition>
  );
} 