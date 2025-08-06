import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function LogoutButton({ className, variant = "outline", ...props }: { 
  className?: string; 
  variant?: "outline" | "ghost" | "default";
}) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      console.log('🔵 Logout button clicked');
      await signOut();
      // Navigate to login page after logout
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      onClick={handleLogout} 
      disabled={isLoading}
      className={cn(
        "w-full text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center justify-start",
        className
      )}
      {...props}
    >
      <LogOut className="h-5 w-5 min-w-5 mr-3" />
      {isLoading ? 'Logging out...' : 'Logout'}
    </Button>
  );
} 