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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <img 
              src="/windscreen-compare-technician.png" 
              alt="WindscreenCompare" 
              className="h-12 w-auto mx-auto mb-4"
            />
          </div>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-[#145484]/10 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#145484] border-t-transparent"></div>
            </div>
            <p className="text-gray-600 font-medium">Loading...</p>
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

  // Check user verification status using same logic as Index.tsx
  const isNonVerified = user.verification_status === 'non-verified' || user.user_role === 'non-verified';
  const isPendingApproval = user.verification_status === 'pending' || user.user_role === 'pending';
  const isRejected = user.verification_status === 'rejected';
  const needsVerification = isNonVerified || isPendingApproval || isRejected;

  // For unverified/pending/rejected users, only allow dashboard (/) - all other routes redirect
  if (needsVerification) {
    if (location.pathname === '/') {
      return <>{children}</>;
    }
    console.log('🔵 ProtectedRoute: Non-verified user accessing restricted route, redirecting to dashboard');
    return <Navigate to="/" replace />;
  }

  // Allow non-verified users to access Contact and Settings
  if (location.pathname === '/contact' || location.pathname === '/settings') {
    return <>{children}</>;
  }

  // For other routes, check verification status and permissions
  try {

    // For verified users, check role-based permissions
    if (!hasPermission(requiredRole)) {
      console.log('🔵 ProtectedRoute: Insufficient permissions, redirecting to dashboard');
      return <Navigate to="/" replace />;
    }

    // Special case: Block Mehrdad and Master Auto Glass staff from accessing History and Reports pages
    // BUT allow admin role to override this restriction
    const isMasterAutoGlassEmail = user.email.endsWith('@master-auto-glass.com');
    const isRestrictedUser = user.name === 'Mehrdad' || isMasterAutoGlassEmail;
    const isRestrictedPage = location.pathname === '/history' || location.pathname === '/reporting';
    
    // Only block if user is restricted AND not an admin
    if (isRestrictedUser && isRestrictedPage && user.user_role !== 'admin') {
      console.log('Access blocked for non-admin restricted user to', location.pathname);
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