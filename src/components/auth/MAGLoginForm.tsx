import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Info } from 'lucide-react';

const magLoginSchema = z.object({
  email: z.string().email('Please enter a valid email.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type MAGLoginFormValues = z.infer<typeof magLoginSchema>;

interface MAGLoginFormProps {
  onLoginSuccess: (credentials: { email: string; password: string }) => void;
  onContinueAsGuest?: () => void;
  provider?: 'mag' | 'pughs';
}

export function MAGLoginForm({ onLoginSuccess, onContinueAsGuest, provider = 'mag' }: MAGLoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        const providerName = provider === 'mag' ? 'MAG' : 'Pughs';
        setError(`Invalid ${providerName} credentials. Please check your email and password.`);
      }
    } catch (err) {
      const providerName = provider === 'mag' ? 'MAG' : 'Pughs';
      setError(`Failed to authenticate with ${providerName}. Please try again.`);
      console.error(`${providerName} authentication error:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <img
          src={provider === 'mag' ? '/MAG.png' : '/pughs_logo.png'}
          alt={provider === 'mag' ? 'Master Auto Glass' : 'Charles Pugh'}
          className="h-20 w-auto object-contain"
        />
      </div>

      <Card className="shadow-xl border-0">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Connect to supplier account
            </h1>
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <p>Sync your trade pricing and order history after login.</p>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email / Trade ID Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email / Trade ID
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email or trade ID"
                {...register('email')}
                className="h-12 border-gray-300 focus:border-[#14b8a6] focus:ring-[#14b8a6]"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password')}
                  className="h-12 border-gray-300 focus:border-[#14b8a6] focus:ring-[#14b8a6] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Connect Account Button */}
            <Button
              variant="ghost"
              type="submit"
              className="w-full h-12 bg-[#FFC107] hover:bg-[#e6ad06] text-black font-semibold text-base rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : 'Connect Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 