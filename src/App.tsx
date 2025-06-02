import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Suspense, lazy, useState, useEffect } from "react";
import { DebugInfo } from "@/components/DebugInfo";

// Eager load critical pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";

// Lazy load less critical pages to improve initial load time
const Contact = lazy(() => import("./pages/Contact"));
const Quotes = lazy(() => import("./pages/Quotes"));
const PriceLookup = lazy(() => import("./pages/PriceLookup"));
const Glass = lazy(() => import("./pages/Glass"));
const Team = lazy(() => import("./pages/Team"));
const Settings = lazy(() => import("./pages/Settings"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Reporting = lazy(() => import("./pages/Reporting"));
const History = lazy(() => import("./pages/History"));
const JobSwipe = lazy(() => import("./pages/JobSwipe"));
const LandingPage = lazy(() => import("./pages/LandingPage"));

// Loading fallback
const LoadingFallback = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="flex flex-col items-center space-y-4 p-8">
      {/* Logo/Brand */}
      <div className="w-16 h-16 bg-[#FFC107] rounded-2xl flex items-center justify-center mb-2 shadow-lg">
        <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1h2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8v10a2 2 0 002 2h6a2 2 0 002-2V8" />
        </svg>
      </div>
      
      {/* Spinner */}
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#135084]"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-r-[#FFC107] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      
      {/* Loading Text */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Loading</h3>
        <p className="text-sm text-gray-600">Please wait while we prepare your experience...</p>
      </div>
    </div>
  </div>
);

// Error boundary component
function ErrorFallback() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-red-600">Something went wrong</h2>
        <p className="text-gray-600 max-w-md">There was an error loading the application. Please try refreshing the page.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-[#135084] text-white rounded-lg hover:bg-[#0e3b61] transition-colors duration-200 font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

const queryClient = new QueryClient();

const App = () => {
  const [error, setError] = useState<Error | null>(null);

  // Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      setError(event.error);
      // Prevent white screen by showing error UI
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Show error fallback if there's a global error
  if (error) {
    return <ErrorFallback />;
  }

  console.log('🔵 App component rendering...');

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <Toaster />
              <Sonner />
              <Router>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/404" element={<NotFound />} />
                    
                    {/* Basic Protected Route */}
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    } />

                    {/* Settings - Available to all authenticated users */}
                    <Route path="/settings" element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    } />
                    
                    {/* Admin-only routes */}
                    <Route path="/job-swipe" element={
                      <ProtectedRoute requiredRole="admin">
                        <JobSwipe />
                      </ProtectedRoute>
                    } />
                    <Route path="/calendar" element={
                      <ProtectedRoute requiredRole="admin">
                        <Calendar />
                      </ProtectedRoute>
                    } />
                    
                    {/* Premium features - require higher subscription level (for now admin) */}
                    <Route path="/price-lookup" element={
                      <ProtectedRoute requiredRole="admin">
                        <PriceLookup />
                      </ProtectedRoute>
                    } />
                    <Route path="/glass-search" element={
                      <ProtectedRoute requiredRole="admin">
                        <Glass />
                      </ProtectedRoute>
                    } />
                    <Route path="/history" element={
                      <ProtectedRoute requiredRole="admin">
                        <History />
                      </ProtectedRoute>
                    } />
                    <Route path="/reporting" element={
                      <ProtectedRoute requiredRole="admin">
                        <Reporting />
                      </ProtectedRoute>
                    } />
                    <Route path="/contact" element={
                      <ProtectedRoute>
                        <Contact />
                      </ProtectedRoute>
                    } />
                    
                    {/* Catch all route */}
                    <Route path="*" element={<Navigate to="/404" replace />} />
                  </Routes>
                </Suspense>
              </Router>
              
              {/* Debug info overlay - only shown in development */}
              <DebugInfo />
            </div>
          </SidebarProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

console.log('🔵 App module loaded');

export default App;