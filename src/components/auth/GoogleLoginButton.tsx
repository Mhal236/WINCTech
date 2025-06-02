import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface GoogleLoginButtonProps {
  className?: string;
  disabled?: boolean;
}

export function GoogleLoginButton({ className, disabled }: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    console.log('🔵 Google login button clicked');
    setIsLoading(true);
    
    try {
      console.log('🔵 Calling signInWithGoogle...');
      const { error } = await signInWithGoogle();
      
      console.log('🔵 signInWithGoogle response:', { error });
      
      if (error) {
        console.error('🔴 Google login error:', error);
        
        // Provide more specific error messages
        let errorMessage = "Failed to sign in with Google";
        if (error.message?.includes('Provider not found')) {
          errorMessage = "Google OAuth is not configured. Please check your Supabase settings.";
        } else if (error.message?.includes('redirect')) {
          errorMessage = "OAuth redirect configuration issue. Please check your redirect URLs.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast({
          title: "Authentication Error",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        console.log('🟢 Google login initiated successfully');
        // Note: For OAuth, the user will be redirected to Google, so we won't reach here immediately
      }
    } catch (err) {
      console.error('🔴 Google login error (catch):', err);
      toast({
        title: "Authentication Error",
        description: "An unexpected error occurred during Google sign-in. Check the console for details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={`w-full h-12 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl transition-all duration-200 transform hover:scale-[1.02] ${className}`}
      onClick={handleGoogleLogin}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <span>Signing in...</span>
        </div>
      ) : (
        <>
          <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="font-medium text-gray-700">Continue with Google</span>
        </>
      )}
    </Button>
  );
} 