import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const magLoginSchema = z.object({
  email: z.string().email('Please enter a valid email.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type MAGLoginFormValues = z.infer<typeof magLoginSchema>;

interface MAGLoginFormProps {
  onLoginSuccess: (credentials: { email: string; password: string }) => void;
  onContinueAsGuest: () => void;
}

export function MAGLoginForm({ onLoginSuccess, onContinueAsGuest }: MAGLoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MAGLoginFormValues>({
    resolver: zodResolver(magLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: MAGLoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      // Hardcoded credentials for now - will be replaced with actual MAG API call
      const validCredentials = {
        email: 'admin@windscreencompare.com',
        password: 'test123'
      };

      if (data.email === validCredentials.email && data.password === validCredentials.password) {
        // TODO: Replace with actual MAG API authentication call
        // const magAuthResult = await authenticateWithMAGAPI(data.email, data.password);
        
        onLoginSuccess({ email: data.email, password: data.password });
      } else {
        setError('Invalid MAG credentials. Please check your email and password.');
      }
    } catch (err) {
      setError('Failed to authenticate with MAG. Please try again.');
      console.error('MAG authentication error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-[#145484]">Glass Order Access</CardTitle>
        <CardDescription>
          Log in with your MAG credentials or continue as a guest
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">MAG Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your MAG email"
              {...register('email')}
              className="border-[#145484] focus:ring-[#145484]"
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">MAG Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your MAG password"
              {...register('password')}
              className="border-[#145484] focus:ring-[#145484]"
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-[#145484] hover:bg-[#145484]/90"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Log In with MAG'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full border-[#145484] text-[#145484] hover:bg-[#145484] hover:text-white"
          onClick={onContinueAsGuest}
        >
          Continue as Guest
        </Button>

        <div className="text-xs text-center text-muted-foreground space-y-2">
        
          
          <div className="space-y-1">
            <p>MAG Login provides:</p>
            <ul className="text-left space-y-1">
              <li>• Access to your account pricing</li>
              <li>• Personalized quotes and discounts</li>
              <li>• Order history and tracking</li>
              <li>• Priority customer support</li>
            </ul>
          </div>
        </div>

        {/* TODO: Add this when MAG API is implemented
        <div className="text-xs text-center text-muted-foreground">
          <p>
            Don't have MAG credentials? 
            <a href="#" className="text-[#145484] hover:underline ml-1">
              Contact your MAG representative
            </a>
          </p>
        </div>
        */}
      </CardContent>
    </Card>
  );
} 