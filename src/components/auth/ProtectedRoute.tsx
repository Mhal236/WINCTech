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

  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If there's no user or no permission, redirect appropriately
  try {
    // Redirect to login if not authenticated
    if (!user) {
      // Save the current location to redirect back after login
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if user has the required role
    if (!hasPermission(requiredRole)) {
      // For safer rendering, just redirect to the home page
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

  // Render children inside an error boundary
  try {
    return <>{children}</>;
  } catch (error) {
    console.error("Error rendering protected content:", error);
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl text-red-500">Something went wrong</h1>
        <button 
          onClick={() => window.location.href = '/'}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Return to Home
        </button>
      </div>
    );
  }
} 