// This is a client-side wrapper for Supabase operations
// It makes API calls to our secure server endpoints instead of directly using Supabase

// Define types for the common Supabase operations
interface FetchOptions {
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending: boolean };
  limit?: number;
  offset?: number;
}

interface SupabaseAuth {
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}

interface SupabaseDB {
  from: (table: string) => {
    select: (columns?: string) => Promise<{ data: any[]; error: any }>;
    insert: (data: any) => Promise<{ data: any; error: any }>;
    update: (data: any) => Promise<{ data: any; error: any }>;
    delete: () => Promise<{ error: any }>;
    eq: (column: string, value: any) => any;
    order: (column: string, options?: { ascending?: boolean }) => any;
    limit: (count: number) => any;
  };
}

// TEMPORARY SOLUTION FOR DEVELOPMENT
// During development, we'll continue to use the Supabase client directly
// In production, you should replace this with a proper server-side implementation
import { createClient } from '@supabase/supabase-js';

// For development, we'll revert to using environment variables
// In production, this should be replaced with API calls to a secure backend
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://julpwjxzrlkbxdbphrdy.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1bHB3anh6cmxrYnhkYnBocmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MTQ4NDUsImV4cCI6MjA1Mjk5MDg0NX0.rynZAq6bjPlpfyTaxHYcs8FdVdTo_gy95lazi2Kt5RY";

// Direct Supabase client for development
const directSupabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Create a secure client that makes API calls to our server endpoints
class SecureSupabaseClient {
  auth: SupabaseAuth;
  db: SupabaseDB;

  constructor() {
    this.auth = this.createAuthClient();
    this.db = this.createDBClient();
  }

  // Expose from method at the top level for compatibility with existing code
  from(table: string) {
    return this.db.from(table);
  }

  private createAuthClient(): SupabaseAuth {
    return {
      signIn: async (email: string, password: string) => {
        try {
          // During development, use the direct Supabase client
          return await directSupabase.auth.signInWithPassword({
            email,
            password,
          });
        } catch (error) {
          console.error('Error signing in:', error);
          throw error;
        }
      },

      signUp: async (email: string, password: string) => {
        try {
          // During development, use the direct Supabase client
          return await directSupabase.auth.signUp({
            email,
            password,
          });
        } catch (error) {
          console.error('Error signing up:', error);
          throw error;
        }
      },

      signOut: async () => {
        try {
          // During development, use the direct Supabase client
          await directSupabase.auth.signOut();
        } catch (error) {
          console.error('Error signing out:', error);
          throw error;
        }
      },
    };
  }

  private createDBClient(): SupabaseDB {
    return {
      from: (table: string) => {
        // During development, we'll pass through to the direct Supabase client
        return directSupabase.from(table);
      },
    };
  }
}

// Export a singleton instance of the secure client
export const supabase = new SecureSupabaseClient(); 