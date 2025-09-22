import { createClient } from '@supabase/supabase-js';

// Use direct Supabase client for Edge Functions
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://julpwjxzrlkbxdbphrdy.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1bHB3anh6cmxrYnhkYnBocmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MTQ4NDUsImV4cCI6MjA1Mjk5MDg0NX0.rynZAq6bjPlpfyTaxHYcs8FdVdTo_gy95lazi2Kt5RY";

const directSupabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
      const { data, error } = await directSupabase.functions.invoke('send-application-confirmation', {
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
      const { data, error } = await directSupabase.functions.invoke('send-2fa-email', {
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
