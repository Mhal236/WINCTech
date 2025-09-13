import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { VerificationForm } from "@/components/auth/VerificationForm";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { useAuth } from "@/contexts/AuthContext";
import { PageTransition } from "@/components/PageTransition";
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user, isLoading } = useAuth();
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);
  const navigate = useNavigate();

  // Handle OAuth callback (PKCE flow)
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      
      if (error) {
        console.error('🔴 OAuth error from URL:', error);
        // Clear the URL parameters
        navigate('/', { replace: true });
        return;
      }
      
      if (code && !user && !isLoading) {
        console.log('🔵 OAuth callback detected, processing code:', code.substring(0, 10) + '...');
        setIsProcessingOAuth(true);
        
        try {
          // Create Supabase client for OAuth exchange
          const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://julpwjxzrlkbxdbphrdy.supabase.co";
          const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1bHB3anh6cmxrYnhkYnBocmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MTQ4NDUsImV4cCI6MjA1Mjk5MDg0NX0.rynZAq6bjPlpfyTaxHYcs8FdVdTo_gy95lazi2Kt5RY";
          
          const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
          
          // Exchange the code for a session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('🔴 Error exchanging code for session:', exchangeError);
          } else {
            console.log('🟢 OAuth callback successful, session created:', !!data.session);
            // The AuthContext will automatically detect the new session
          }
          
          // Clear the URL parameters regardless of success/failure
          navigate('/', { replace: true });
        } catch (error) {
          console.error('🔴 OAuth callback processing error:', error);
          navigate('/', { replace: true });
        } finally {
          setIsProcessingOAuth(false);
        }
      }
    };
    
    // Only run OAuth handling if we're not already loading and don't have a user
    if (!isLoading) {
      handleOAuthCallback();
    }
  }, [user, isLoading, navigate]);

  // Add a delay to prevent flashing during page transitions
  useEffect(() => {
    if (!isLoading && user) {
      // Add a small delay to ensure auth state is stable
      const timer = setTimeout(() => {
        setIsCheckingVerification(false);
      }, 200);
      
      return () => clearTimeout(timer);
    } else if (!isLoading) {
      setIsCheckingVerification(false);
    }
  }, [user, isLoading]);

  // Show verification form for users who haven't completed verification
  // Priority: verification_status takes precedence over user_role
  const needsVerification = !user || 
    (user.verification_status === 'non-verified' || 
     user.verification_status === 'pending' || 
     user.verification_status === 'rejected') ||
    // Only check user_role if verification_status is not set
    (!user.verification_status && 
     (user.user_role === 'non-verified' || 
      (!user.user_role && user.user_role !== 'admin')));

  // Show loading state during auth transitions
  if (isLoading || isCheckingVerification || isProcessingOAuth) {
    return (
      <DashboardLayout>
        <PageTransition>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 bg-[#145484]/10 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#145484] border-t-transparent"></div>
              </div>
              <p className="text-gray-600 font-medium">
                {isProcessingOAuth ? 'Completing Google sign-in...' : 'Loading dashboard...'}
              </p>
            </div>
          </div>
        </PageTransition>
      </DashboardLayout>
    );
  }

  if (needsVerification) {
    return (
      <DashboardLayout>
        <PageTransition>
          <VerificationForm />
        </PageTransition>
      </DashboardLayout>
    );
  }

  // If we reach here, user is verified and should see the main dashboard
  return (
    <DashboardLayout>
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
          {/* Hero Section */}
          <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                  Professional Auto Glass
                  <span className="text-[#145484] block">Management Platform</span>
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8 sm:mb-12 px-2">
                  Streamline your windscreen repair business with comprehensive job management, 
                  team coordination, and professional tools designed for auto glass technicians.
                </p>
                
                {/* Welcome Dashboard Card */}
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-100 mx-2 sm:mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
                    <div className="text-left">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                        Welcome to Your Dashboard
                      </h3>
                      <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                        Access all your professional tools, manage your jobs, track your team, 
                        and grow your auto glass business from one central hub.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                          onClick={() => navigate('/job-swipe')}
                          className="cta-primary px-4 sm:px-6 py-3 rounded-lg font-semibold flex items-center justify-center text-sm sm:text-base min-h-[44px] touch-manipulation"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          View Jobs
                        </button>
                        <button 
                          onClick={() => navigate('/calendar')}
                          className="px-4 sm:px-6 py-3 border-2 border-[#145484] text-[#145484] rounded-lg font-semibold hover:bg-[#145484] hover:text-white transition-colors flex items-center justify-center text-sm sm:text-base min-h-[44px] touch-manipulation"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Calendar
                        </button>
                      </div>
                    </div>
                    <div className="text-center mt-6 md:mt-0">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-[#145484]/10 to-[#145484]/5 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4" style={{animation: 'subtle-pulse 6s ease-in-out infinite'}}>
                        <img 
                          src="/WINC.png" 
                          alt="WINC Logo" 
                          className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                        />
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 font-medium">
                        Professional Tools at Your Fingertips
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>


                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />

          {/* How It Works */}
          <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                  How It Works
                </h2>
                <p className="text-lg sm:text-xl text-gray-600 px-2">
                  Three simple steps to streamline your auto glass business
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 md:gap-8">
                <div className="text-center px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#145484] text-white rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-xl sm:text-2xl font-bold">
                    1
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Browse & Filter Jobs</h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    Browse available windscreen repair jobs in your area. Filter by price, location, urgency, and job type to find the perfect matches.
                  </p>
                </div>
                <div className="text-center px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#145484] text-white rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-xl sm:text-2xl font-bold">
                    2
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Accept & Purchase</h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    Accept exclusive jobs instantly or purchase leads from the job board using credits. Each accepted job is immediately assigned to you.
                  </p>
                </div>
                <div className="text-center px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#145484] text-white rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-xl sm:text-2xl font-bold">
                    3
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Calendar Integration</h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    Accepted jobs are automatically added to your calendar. Manage appointments, track your schedule, and complete jobs efficiently.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Plans */}
          <section className="py-16">
            <PricingPlans />
          </section>

          {/* FAQ Section */}
          <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                  Frequently Asked Questions
                </h2>
                <p className="text-lg sm:text-xl text-gray-600 px-2">
                  Get answers to common questions about our platform
                </p>
              </div>
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm mx-2 sm:mx-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                    How do I get started with the platform?
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    Simply sign up for a free trial, complete your verification process, and start searching for glass immediately. No setup fees or long-term commitments required.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm mx-2 sm:mx-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                    Which suppliers are integrated with your platform?
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    We work with major auto glass suppliers across the UK, ensuring you get competitive prices and reliable delivery times for all your jobs.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm mx-2 sm:mx-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                    How do payments and commissions work?
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    Our transparent commission structure varies by plan tier. You'll see exactly what you earn on each job, with flexible payout options including instant payments on higher tiers.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm mx-2 sm:mx-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                    Can I manage multiple technicians on one account?
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    Yes! Our Enterprise plan includes team management features, allowing you to coordinate multiple technicians, track performance, and manage jobs across your entire operation.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#145484] to-[#0f3d5f]">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 px-2">
                Ready to Elevate Your Operations?
              </h2>
              <p className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-2 leading-relaxed">
                Take your auto glass business to the next level with professional tools, 
                streamlined workflows, and comprehensive team management.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
                <button 
                  onClick={() => navigate('/job-swipe')}
                  className="cta-primary px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold flex items-center justify-center min-h-[48px] touch-manipulation"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Manage Jobs
                </button>
                <button 
                  onClick={() => navigate('/team')}
                  className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-white text-white rounded-lg text-base sm:text-lg font-semibold hover:bg-white hover:text-[#145484] transition-colors flex items-center justify-center min-h-[48px] touch-manipulation"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  View Team
                </button>
              </div>
            </div>
        </section>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
};

export default Index;