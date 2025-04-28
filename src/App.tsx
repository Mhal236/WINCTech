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
const Team = lazy(() => import("./pages/Team"));
const Settings = lazy(() => import("./pages/Settings"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Reporting = lazy(() => import("./pages/Reporting"));
const History = lazy(() => import("./pages/History"));
const JobSwipe = lazy(() => import("./pages/JobSwipe"));
const LandingPage = lazy(() => import("./pages/LandingPage"));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Error boundary component
function ErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      <h2 className="text-2xl text-red-600 mb-4">Something went wrong</h2>
      <p className="mb-4">There was an error loading the application.</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-500 text-white rounded-md"
      >
        Try again
      </button>
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

                    {/* Lazy loaded protected routes - Add these back once the app is stable */}
                    <Route path="/settings" element={
                      <ProtectedRoute requiredRole="user">
                        <Settings />
                      </ProtectedRoute>
                    } />
                    
                    {/* Add missing routes that are in the Sidebar navigation */}
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
                    <Route path="/price-lookup" element={
                      <ProtectedRoute requiredRole="user">
                        <PriceLookup />
                      </ProtectedRoute>
                    } />
                    <Route path="/history" element={
                      <ProtectedRoute requiredRole="user">
                        <History />
                      </ProtectedRoute>
                    } />
                    <Route path="/reporting" element={
                      <ProtectedRoute requiredRole="user">
                        <Reporting />
                      </ProtectedRoute>
                    } />
                    <Route path="/contact" element={
                      <ProtectedRoute requiredRole="user">
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

export default App;