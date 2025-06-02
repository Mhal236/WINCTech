import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole = 'user' }: ProtectedRouteProps) {
  const { user, isLoading, hasPermission } = useAuth();
  const location = useLocation();

  console.log('🔍 ProtectedRoute Debug:', {
    user,
    isLoading,
    location: location.pathname,
    requiredRole,
    hasPermission: user ? hasPermission(requiredRole) : false,
    userRole: user?.user_role,
    verificationStatus: user?.verification_status
  });

  // Show loading indicator while checking authentication
  if (isLoading) {
    console.log('🔵 ProtectedRoute: Showing loading...');
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center space-y-4 p-8">
          {/* Logo/Brand */}
          <div className="w-16 h-16 bg-[#FFC107] rounded-2xl flex items-center justify-center mb-2 shadow-lg">
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          {/* Spinner */}
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#135084]"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-r-[#FFC107] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          
          {/* Loading Text */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Authenticating</h3>
            <p className="text-sm text-gray-600">Please wait while we verify your access...</p>
          </div>
        </div>
      </div>
    );
  }

    // Redirect to login if not authenticated
    if (!user) {
    console.log('🔵 ProtectedRoute: No user, redirecting to login');
      // Save the current location to redirect back after login
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

  // Allow all authenticated users to access the dashboard (/) 
  // The dashboard page will handle showing verification form
  if (location.pathname === '/') {
    return <>{children}</>;
  }

  // Allow non-verified users to access Contact and Settings
  if (location.pathname === '/contact' || location.pathname === '/settings') {
    return <>{children}</>;
  }

  // For other routes, check verification status and permissions
  try {
    // Handle non-verified users - redirect to dashboard for verification (except Contact/Settings)
    if (user.user_role === 'non-verified' || user.verification_status === 'non-verified') {
      console.log('🔵 ProtectedRoute: Non-verified user accessing restricted route, redirecting to dashboard');
      return <Navigate to="/" replace />;
    }

    // Handle pending verification users - redirect to dashboard
    if (user.verification_status === 'pending' || user.verification_status === 'rejected') {
      console.log('🔵 ProtectedRoute: Pending/rejected user, redirecting to dashboard');
      return <Navigate to="/" replace />;
    }

    // For verified users, check role-based permissions
    if (!hasPermission(requiredRole)) {
      console.log('🔵 ProtectedRoute: Insufficient permissions, redirecting to dashboard');
      return <Navigate to="/" replace />;
    }

    // Special case: Block Mehrdad and Master Auto Glass staff from accessing History and Reports pages
    const isMasterAutoGlassEmail = user.email.endsWith('@master-auto-glass.com');
    if ((user.name === 'Mehrdad' || isMasterAutoGlassEmail) && 
        (location.pathname === '/history' || location.pathname === '/reporting')) {
      console.log('Access blocked for restricted user to', location.pathname);
      return <Navigate to="/" replace />;
    }
  } catch (error) {
    console.error("Error in protected route:", error);
    // If there's any error, redirect to login
    return <Navigate to="/login" replace />;
  }

  console.log('🔵 ProtectedRoute: All checks passed, rendering children');
  // Render children inside an error boundary
  try {
    return <>{children}</>;
  } catch (error) {
    console.error("Error rendering protected content:", error);
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
          <p className="text-gray-600 max-w-md">We encountered an error while loading the page. Please try again.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-[#135084] text-white rounded-lg hover:bg-[#0e3b61] transition-colors duration-200 font-medium"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
} 