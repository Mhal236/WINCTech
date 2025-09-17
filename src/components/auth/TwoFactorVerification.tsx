import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, Mail, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EmailService } from '@/services/emailService';

interface TwoFactorVerificationProps {
  email: string;
  userId: string;
  onVerificationSuccess: () => void;
  onCancel: () => void;
}

export function TwoFactorVerification({ 
  email, 
  userId, 
  onVerificationSuccess, 
  onCancel 
}: TwoFactorVerificationProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCodeSentAt, setLastCodeSentAt] = useState<Date | null>(null);
  const [resendCount, setResendCount] = useState(0);
  const { toast } = useToast();

  const generateAndSendCode = async () => {
    try {
      setIsResending(true);
      setError(null);
      
      // Generate a 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      // Store the code in the database
      const { error: insertError } = await supabase
        .from('two_factor_codes')
        .insert({
          user_id: userId,
          code: code,
          code_type: 'email',
          expires_at: expiresAt.toISOString()
        });

      if (insertError) {
        console.error('Error storing 2FA code:', insertError);
        throw insertError;
      }

      // Send email using Supabase Edge Function
      const emailResult = await EmailService.send2FACode(email, code);

      if (!emailResult.success) {
        throw new Error('Failed to send email');
      }

      // Show appropriate message based on whether it's demo mode
      if (emailResult.isDemo) {
        toast({
          title: "Demo Mode - Code Generated",
          description: `Since no email service is configured, your code is: ${emailResult.demoCode} (expires in 10 minutes)`,
          duration: 15000,
        });
      } else {
        toast({
          title: "Verification Code Sent",
          description: `A verification code has been sent to ${email}. Please check your email (and spam folder).`,
          duration: 5000,
        });
      }

      setLastCodeSentAt(new Date());
      return true;
    } catch (error) {
      console.error('Error generating 2FA code:', error);
      setError('Failed to send verification code. Please try again.');
      return false;
    } finally {
      setIsResending(false);
    }
  };

  const verifyCode = async (code: string) => {
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Find valid, unused code
      const { data: codeData, error: fetchError } = await supabase
        .from('two_factor_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('code', code)
        .eq('code_type', 'email')
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !codeData) {
        setError('The verification code is invalid or has expired.');
        return false;
      }

      // Mark code as used
      const { error: updateError } = await supabase
        .from('two_factor_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', codeData.id);

      if (updateError) {
        console.error('Error marking code as used:', updateError);
        throw updateError;
      }

      return true;
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      setError('Failed to verify code. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = await verifyCode(verificationCode);
    if (isValid) {
      onVerificationSuccess();
    }
  };

  const handleResendCode = async () => {
    const success = await generateAndSendCode();
    if (success) {
      setResendCount(prev => prev + 1);
      setVerificationCode(''); // Clear the input for new code
      toast({
        title: "New Code Sent",
        description: `A new verification code has been sent to ${email}.`,
      });
    }
  };

  // Send initial code when component mounts
  useEffect(() => {
    const sendInitialCode = async () => {
      const success = await generateAndSendCode();
      if (success) {
        setLastCodeSentAt(new Date());
      }
    };
    sendInitialCode();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="mt-6 text-2xl font-bold text-gray-900">
              Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              We've sent a verification code to {email}. Enter the code below to complete your sign in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="verification-code" className="text-sm font-medium text-gray-700">
                  Verification Code
                </Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(value);
                    setError(null);
                  }}
                  className="h-12 px-4 text-center text-lg font-mono tracking-wider border-gray-200 focus:border-[#FFC107] focus:ring-[#FFC107]/20 rounded-xl"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-gray-500 text-center">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full h-12 !bg-[#135084] hover:!bg-[#0e3b61] !text-white font-medium rounded-xl"
                  disabled={isLoading || verificationCode.length !== 6}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    'Verify Code'
                  )}
                </Button>

                <div className="space-y-3">
                  {/* Resend Code Section */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-500">
                      {lastCodeSentAt && (
                        <span>
                          Code sent {new Date().getTime() - lastCodeSentAt.getTime() < 60000 
                            ? 'just now' 
                            : `${Math.floor((new Date().getTime() - lastCodeSentAt.getTime()) / 60000)} min ago`}
                          {resendCount > 0 && ` (${resendCount + 1} sent)`}
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResendCode}
                      disabled={isResending || isLoading}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      {isResending ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          Resend Code
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Cancel Button */}
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onCancel}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Having trouble? Check your spam folder or contact support.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
