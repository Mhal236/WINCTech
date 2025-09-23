// Use our singleton Supabase client to prevent multiple instances
import { supabase } from '@/lib/supabase-client';

export class EmailService {
  /**
   * Send application confirmation email using Supabase Edge Function
   */
  static async sendApplicationConfirmation(
    email: string, 
    applicantName: string, 
    applicationData: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await (supabase as any).functions.invoke('send-application-confirmation', {
        body: {
          to: email,
          applicantName: applicantName,
          applicationData: applicationData
        }
      });

      if (error) {
        console.error('Application confirmation email error:', error);
        return { success: false, error: error.message };
      }

      console.log('Application confirmation email sent:', data);
      return { success: true };
    } catch (error) {
      console.error('Failed to send application confirmation email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send 2FA verification code via email using Supabase Edge Function
   */
  static async send2FACode(email: string, code: string): Promise<{ success: boolean; isDemo?: boolean; demoCode?: string }> {
    try {
      const { data, error } = await (supabase as any).functions.invoke('send-2fa-email', {
        body: {
          to: email,
          code: code
        }
      });

      if (error) {
        console.error('Email sending error:', error);
        return { success: false };
      }

      console.log('Email service response:', data);
      
      // Check if it's demo mode
      if (data?.demo) {
        return { 
          success: true, 
          isDemo: true, 
          demoCode: data.code 
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to send 2FA email:', error);
      return { success: false };
    }
  }
}
