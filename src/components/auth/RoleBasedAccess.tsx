import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface RoleBasedAccessProps {
  requiredRole: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleBasedAccess({ 
  requiredRole, 
  children, 
  fallback = null 
}: RoleBasedAccessProps) {
  try {
    const { hasPermission } = useAuth();
    
    if (hasPermission(requiredRole)) {
      return <>{children}</>;
    }
    
    return <>{fallback}</>;
  } catch (error) {
    console.error("Error in RoleBasedAccess:", error);
    // Default to showing fallback in case of any error
    return <>{fallback}</>;
  }
}

export function useRoleBasedAccess() {
  try {
    const { user, hasPermission } = useAuth();
    
    return {
      user,
      hasPermission,
      isAdmin: !!user && user.user_role === 'admin',
      isStaff: !!user && (user.user_role === 'staff' || user.user_role === 'admin'),
      isUser: !!user
    };
  } catch (error) {
    console.error("Error in useRoleBasedAccess:", error);
    // Return safe defaults
    return {
      user: null,
      hasPermission: () => false,
      isAdmin: false,
      isStaff: false,
      isUser: false
    };
  }
} 