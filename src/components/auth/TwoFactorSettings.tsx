import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Mail, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { EmailService } from "@/services/emailService";

interface TwoFactorSettingsProps {
  className?: string;
}

export function TwoFactorSettings({ className }: TwoFactorSettingsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailTwoFactorEnabled, setEmailTwoFactorEnabled] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'enable' | 'disable' | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [lastCodeSentAt, setLastCodeSentAt] = useState<Date | null>(null);

  // Load current 2FA status
  useEffect(() => {
    const loadTwoFactorStatus = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('app_users')
          .select('two_factor_enabled, two_factor_email_enabled')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setEmailTwoFactorEnabled(data.two_factor_email_enabled || false);
        }
      } catch (error) {
        console.error('Error loading 2FA status:', error);
      }
    };

    loadTwoFactorStatus();
  }, [user]);

  const generateAndSendCode = async () => {
    if (!user) return false;

    try {
      setIsLoading(true);
      
      // Generate a 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      // Store the code in the database
      const { error: insertError } = await supabase
        .from('two_factor_codes')
        .insert({
          user_id: user.id,
          code: code,
          code_type: 'email',
          expires_at: expiresAt.toISOString()
        });

      if (insertError) {
        console.error('Error storing 2FA code:', insertError);
        throw insertError;
      }

      // Send email using Supabase Edge Function
      const emailResult = await EmailService.send2FACode(user.email, code);

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
          description: `A verification code has been sent to ${user.email}. Please check your email (and spam folder).`,
          duration: 5000,
        });
      }

      setLastCodeSentAt(new Date());
      return true;
    } catch (error) {
      console.error('Error generating 2FA code:', error);
      toast({
        title: "Error",
        description: "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!user) return;

    setIsResending(true);
    const success = await generateAndSendCode();
    if (success) {
      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email.",
      });
    }
    setIsResending(false);
  };

  const verifyCode = async (code: string) => {
    if (!user || !code) return false;

    try {
      setIsLoading(true);

      // Find valid, unused code
      const { data: codeData, error: fetchError } = await supabase
        .from('two_factor_codes')
        .select('*')
        .eq('user_id', user.id)
        .eq('code', code)
        .eq('code_type', 'email')
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !codeData) {
        toast({
          title: "Invalid Code",
          description: "The verification code is invalid or has expired.",
          variant: "destructive",
        });
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
      toast({
        title: "Verification Failed",
        description: "Failed to verify code. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEmailTwoFactor = async (enabled: boolean) => {
    if (!user) return;

    setPendingAction(enabled ? 'enable' : 'disable');

    if (enabled) {
      // Send verification code
      const codeSent = await generateAndSendCode();
      if (codeSent) {
        setShowVerificationDialog(true);
        setIsVerifying(true);
      }
    } else {
      // Disable immediately (could add confirmation dialog)
      await updateTwoFactorStatus(false);
    }
  };

  const updateTwoFactorStatus = async (enabled: boolean) => {
    if (!user) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('app_users')
        .update({ 
          two_factor_email_enabled: enabled,
          two_factor_enabled: enabled // For now, only email 2FA
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating 2FA status:', error);
        throw error;
      }

      setEmailTwoFactorEnabled(enabled);
      toast({
        title: enabled ? "2FA Enabled" : "2FA Disabled",
        description: enabled 
          ? "Email two-factor authentication has been enabled for your account."
          : "Two-factor authentication has been disabled for your account.",
      });

    } catch (error) {
      console.error('Error updating 2FA status:', error);
      toast({
        title: "Error",
        description: "Failed to update two-factor authentication settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    const isValid = await verifyCode(verificationCode);
    if (isValid) {
      await updateTwoFactorStatus(true);
      setShowVerificationDialog(false);
      setVerificationCode('');
      setIsVerifying(false);
      setPendingAction(null);
    }
  };

  const handleCancelVerification = () => {
    setShowVerificationDialog(false);
    setVerificationCode('');
    setIsVerifying(false);
    setPendingAction(null);
  };

  if (!user) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#145484]" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account by requiring a verification code in addition to your password.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-gray-500" />
            <div>
              <Label htmlFor="email-2fa" className="text-sm font-medium">
                Email Authentication
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                Receive verification codes via email
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {emailTwoFactorEnabled && (
              <div className="flex items-center gap-1 text-green-600">
                <Check className="h-4 w-4" />
                <span className="text-xs">Enabled</span>
              </div>
            )}
            <Switch
              id="email-2fa"
              checked={emailTwoFactorEnabled}
              onCheckedChange={handleToggleEmailTwoFactor}
              disabled={isLoading}
            />
          </div>
        </div>

        {emailTwoFactorEnabled && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-800">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">Two-Factor Authentication Active</span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              You'll be asked for a verification code when signing in.
            </p>
          </div>
        )}

        {/* Verification Dialog */}
        <AlertDialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Verify Your Email</AlertDialogTitle>
              <AlertDialogDescription>
                We've sent a verification code to your email address. Enter the code below to enable two-factor authentication.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="verification-code" className="text-sm font-medium">
                  Verification Code
                </Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  className="mt-2"
                />
              </div>
              
              {/* Resend Code Section */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {lastCodeSentAt && (
                    `Code sent ${new Date().getTime() - lastCodeSentAt.getTime() < 60000 
                      ? 'just now' 
                      : `${Math.floor((new Date().getTime() - lastCodeSentAt.getTime()) / 60000)} min ago`}`
                  )}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResendCode}
                  disabled={isResending || isLoading}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {isResending ? "Sending..." : "Resend Code"}
                </Button>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelVerification}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleVerifyAndEnable}
                disabled={verificationCode.length !== 6 || isLoading}
              >
                {isLoading ? "Verifying..." : "Verify & Enable"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
