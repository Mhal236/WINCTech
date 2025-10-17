import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'], 
});

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await signUp(data.email, data.password);
      
      if (error) {
        setError(error.message || 'Failed to create account. Please try again.');
        return;
      }

      // Show success message
      setSuccess(true);
      
      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50/50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="border-green-200 bg-green-50/50">
            <AlertDescription className="text-green-700">
              Account created successfully! Check your email to confirm your account.
              You will be redirected to the login page shortly...
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            className="h-12 px-4 border-gray-200 focus:border-[#FFC107] focus:ring-[#FFC107]/20 rounded-xl transition-all duration-200"
            {...register('email')}
            disabled={isLoading || success}
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a password"
            className="h-12 px-4 border-gray-200 focus:border-[#FFC107] focus:ring-[#FFC107]/20 rounded-xl transition-all duration-200"
            {...register('password')}
            disabled={isLoading || success}
          />
          {errors.password && (
            <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            className="h-12 px-4 border-gray-200 focus:border-[#FFC107] focus:ring-[#FFC107]/20 rounded-xl transition-all duration-200"
            {...register('confirmPassword')}
            disabled={isLoading || success}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>
        
        <Button 
          type="submit" 
          className="w-full h-12 !bg-[#145484] hover:!bg-[#0e3b61] !text-white !border-[#145484] hover:!border-[#0e3b61] font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]" 
          disabled={isLoading || success}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Creating Account...</span>
            </div>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>
      
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-gray-500 font-medium">Or sign up with</span>
        </div>
      </div>
      
      <GoogleLoginButton disabled={isLoading || success} />
      
      <div className="text-center pt-4">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Button 
            variant="link" 
            className="p-0 text-blue-600 hover:text-blue-800 font-medium transition-colors" 
            onClick={() => navigate('/login')}
          >
            Sign in here
          </Button>
        </p>
      </div>
    </div>
  );
} 