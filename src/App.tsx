import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Suspense, lazy, useState, useEffect } from "react";
import { DebugInfo } from "@/components/DebugInfo";
import { AnimatePresence } from "framer-motion";
import { ElevenLabsWidget } from "@/components/ElevenLabsWidget";

// Eager load critical pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import InstantLeads from "./pages/InstantLeads";
import Jobs from "./pages/Jobs";
import Calendar from "./pages/Calendar";

// Lazy load less critical pages to improve initial load time
const Contact = lazy(() => import("./pages/Contact"));
const Quotes = lazy(() => import("./pages/Quotes"));
const PriceLookup = lazy(() => import("./pages/PriceLookup"));
const PriceEstimator = lazy(() => import("./pages/PriceEstimator"));
const Glass = lazy(() => import("./pages/Glass"));
const VrnSearch = lazy(() => import("./pages/VrnSearch"));
const ArgicLookup = lazy(() => import("./pages/ArgicLookup"));
const Team = lazy(() => import("./pages/Team"));
const Settings = lazy(() => import("./pages/Settings"));
const Reporting = lazy(() => import("./pages/Reporting"));
const History = lazy(() => import("./pages/History"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const DebugAuth = lazy(() => import("./pages/DebugAuth"));
const TonyAI = lazy(() => import("./pages/TonyAI"));
const ShopSupplies = lazy(() => import("./pages/ShopSupplies"));
const Templates = lazy(() => import("./pages/Templates"));
const Website = lazy(() => import("./pages/Website"));
const TopUp = lazy(() => import("./pages/TopUp"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const JobManagement = lazy(() => import("./pages/JobManagement"));

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

// Component to conditionally render widget based on auth
const ConditionalWidget = ({ enabled }: { enabled: boolean }) => {
  const { user, isLoading } = useAuth();
  
  // Don't show widget on login/signup pages or when not authenticated
  if (isLoading || !user) {
    return null;
  }
  
  return <ElevenLabsWidget enabled={enabled} />;
};

// Add AnimatedRoutes component to handle location-based animations
const AnimatedRoutes = () => {
  const location = useLocation();
  const { isLoading, user } = useAuth();
  
  // Prevent route changes during auth loading to avoid flashing
  if (isLoading) {
    return <LoadingFallback />;
  }
  
  return (
    <AnimatePresence mode="popLayout">
      <Routes location={location}>
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
        
        {/* Pro-1+ routes - Instant Leads, Jobs, and Calendar for technicians */}
        <Route path="/instant-leads" element={
          <ProtectedRoute requiredRole="pro-1">
            <InstantLeads />
          </ProtectedRoute>
        } />
        <Route path="/jobs" element={
          <ProtectedRoute requiredRole="pro-1">
            <Jobs />
          </ProtectedRoute>
        } />
        <Route path="/jobs/:jobId" element={
          <ProtectedRoute requiredRole="pro-1">
            <JobManagement />
          </ProtectedRoute>
        } />
        <Route path="/calendar" element={
          <ProtectedRoute requiredRole="pro-1">
            <Calendar />
          </ProtectedRoute>
        } />
        
        {/* Legacy route redirect */}
        <Route path="/job-swipe" element={<Navigate to="/instant-leads" replace />} />
        
        {/* Premium features - require higher subscription level (for now admin) */}
        <Route path="/price-estimator" element={
          <ProtectedRoute requiredRole="admin">
            <PriceEstimator />
          </ProtectedRoute>
        } />
        
        {/* Redirect old URL to new one */}
        <Route path="/price-lookup" element={<Navigate to="/glass-order" replace />} />
        
        <Route path="/glass-order" element={
          <ProtectedRoute requiredRole="admin">
            <PriceLookup />
          </ProtectedRoute>
        } />
        <Route path="/glass-search" element={
          <ProtectedRoute requiredRole="admin">
            <Glass />
          </ProtectedRoute>
        } />
        <Route path="/vrn-search" element={
          <ProtectedRoute requiredRole="admin">
            <VrnSearch />
          </ProtectedRoute>
        } />
        <Route path="/vrn-search/argic-lookup" element={
          <ProtectedRoute requiredRole="pro-1">
            <ArgicLookup />
          </ProtectedRoute>
        } />
        <Route path="/shop-supplies" element={
          <ProtectedRoute requiredRole="admin">
            <ShopSupplies />
          </ProtectedRoute>
        } />
        <Route path="/website" element={
          <ProtectedRoute requiredRole="admin">
            <Website />
          </ProtectedRoute>
        } />
        <Route path="/templates" element={
          <ProtectedRoute requiredRole="admin">
            <Templates />
          </ProtectedRoute>
        } />
        <Route path="/topup" element={
          <ProtectedRoute>
            <TopUp />
          </ProtectedRoute>
        } />
        <Route path="/checkout" element={
          <ProtectedRoute requiredRole="admin">
            <Checkout />
          </ProtectedRoute>
        } />
        <Route path="/order-confirmation" element={
          <ProtectedRoute requiredRole="admin">
            <OrderConfirmation />
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute requiredRole="pro-1">
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

        <Route path="/tony-ai" element={
          <ProtectedRoute requiredRole="admin">
            <TonyAI />
          </ProtectedRoute>
        } />

        <Route path="/debug-auth" element={
          <ProtectedRoute>
            <DebugAuth />
          </ProtectedRoute>
        } />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  const [error, setError] = useState<Error | null>(null);
  const [aiWidgetEnabled, setAiWidgetEnabled] = useState(() => {
    // Check localStorage for widget preference (default to true)
    const saved = localStorage.getItem('aiWidgetEnabled');
    return saved !== null ? saved === 'true' : true;
  });

  // Listen for changes to widget preference
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      try {
        if (e.key === 'aiWidgetEnabled') {
          setAiWidgetEnabled(e.newValue === 'true');
        }
      } catch (error) {
        console.error('Error handling storage change:', error);
      }
    };

    // Also listen for custom event for same-tab updates
    const handleWidgetToggle = ((e: CustomEvent) => {
      try {
        if (e.detail && typeof e.detail.enabled === 'boolean') {
          setAiWidgetEnabled(e.detail.enabled);
        }
      } catch (error) {
        console.error('Error handling widget toggle:', error);
      }
    }) as EventListener;

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('aiWidgetToggle', handleWidgetToggle);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('aiWidgetToggle', handleWidgetToggle);
    };
  }, []);

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
        <CartProvider>
          <TooltipProvider>
            <SidebarProvider>
              <div className="min-h-screen flex w-full">
                <Toaster />
                <Sonner />
                <Router>
                  <Suspense fallback={<LoadingFallback />}>
                    <AnimatedRoutes />
                  </Suspense>
                  
                  {/* Debug info overlay - only shown in development - moved inside Router */}
                  <DebugInfo />
                  
                  {/* ElevenLabs AI Widget - only shown when logged in */}
                  <ConditionalWidget enabled={aiWidgetEnabled} />
                </Router>
              </div>
            </SidebarProvider>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

console.log('🔵 App module loaded');

export default App;