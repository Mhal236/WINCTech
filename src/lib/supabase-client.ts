// This is a client-side wrapper for Supabase operations
// It makes API calls to our secure server endpoints instead of directly using Supabase

// Define types for the common Supabase operations
interface FetchOptions {
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending: boolean };
  limit?: number;
  offset?: number;
}

// Simple user type for our custom authentication
interface AppUser {
  id: string;
  email: string;
  name: string;
  user_role?: string;
}

interface AuthSession {
  user: AppUser | null;
}

interface SupabaseAuth {
  signInWithPassword: (credentials: { email: string; password: string }) => Promise<any>;
  signUp: (credentials: { email: string; password: string }) => Promise<any>;
  signOut: () => Promise<void>;
  getSession: () => Promise<{ data: { session: AuthSession | null }, error: any }>;
  onAuthStateChange: (callback: (event: string, session: AuthSession | null) => void) => any;
}

interface SupabaseDB {
  from: (table: string) => any; // Use any to avoid type issues
}

// TEMPORARY SOLUTION FOR DEVELOPMENT
// During development, we'll continue to use the Supabase client directly
// In production, you should replace this with a proper server-side implementation
import { createClient } from '@supabase/supabase-js';

// Use the actual values from our Supabase project
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://julpwjxzrlkbxdbphrdy.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1bHB3anh6cmxrYnhkYnBocmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MTQ4NDUsImV4cCI6MjA1Mjk5MDg0NX0.rynZAq6bjPlpfyTaxHYcs8FdVdTo_gy95lazi2Kt5RY";

// Direct Supabase client for development
const directSupabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Create a secure client that makes API calls to our server endpoints
class SecureSupabaseClient {
  auth: SupabaseAuth;
  db: SupabaseDB;
  private currentSession: AuthSession | null = null;
  private listeners: Array<(event: string, session: AuthSession | null) => void> = [];

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
      signInWithPassword: async (credentials: { email: string; password: string }) => {
        try {
          // Use our custom app_users table for authentication
          const { data, error } = await directSupabase
            .from('app_users')
            .select('*')
            .eq('email', credentials.email)
            .eq('password', credentials.password)
            .single();

          if (error || !data) {
            return { 
              data: { user: null, session: null },
              error: { message: 'Invalid login credentials' } 
            };
          }

          // Create a user session
          const user: AppUser = {
            id: data.id,
            email: data.email,
            name: data.name,
            user_role: data.user_role || 'user' // Default to 'user' if no role is specified
          };

          // Save the session in localStorage for persistence
          localStorage.setItem('user_session', JSON.stringify(user));
          
          // Set current session and notify listeners
          this.currentSession = { user };
          this.notifyListeners('SIGNED_IN', this.currentSession);

          return { 
            data: { user, session: { user } },
            error: null 
          };
        } catch (error) {
          console.error('Error signing in:', error);
          return { data: { user: null, session: null }, error };
        }
      },

      signUp: async (credentials: { email: string; password: string }) => {
        try {
          // Check if user already exists
          const { data: existingUser } = await directSupabase
            .from('app_users')
            .select('*')
            .eq('email', credentials.email)
            .single();

          if (existingUser) {
            return { 
              data: { user: null, session: null },
              error: { message: 'User already exists' } 
            };
          }

          // Create new user
          const { data, error } = await directSupabase
            .from('app_users')
            .insert([
              { 
                email: credentials.email, 
                password: credentials.password,
                name: 'New User',
                user_role: 'user' // Default role for new users
              }
            ])
            .select()
            .single();

          if (error || !data) {
            return { 
              data: { user: null, session: null },
              error: error || { message: 'Failed to create user' } 
            };
          }

          // Return user data without creating a session
          return { 
            data: { 
              user: { 
                id: data.id, 
                email: data.email, 
                name: data.name,
                user_role: data.user_role
              }, 
              session: null 
            },
            error: null 
          };
        } catch (error) {
          console.error('Error signing up:', error);
          return { data: { user: null, session: null }, error };
        }
      },

      signOut: async () => {
        try {
          // Remove session from localStorage
          localStorage.removeItem('user_session');
          
          // Clear current session and notify listeners
          this.currentSession = null;
          this.notifyListeners('SIGNED_OUT', null);
        } catch (error) {
          console.error('Error signing out:', error);
        }
      },

      getSession: async () => {
        try {
          // Check for session in localStorage
          const savedSession = localStorage.getItem('user_session');
          if (savedSession) {
            const user = JSON.parse(savedSession) as AppUser;
            this.currentSession = { user };
            return { data: { session: this.currentSession }, error: null };
          }
          return { data: { session: null }, error: null };
        } catch (error) {
          console.error('Error getting session:', error);
          return { data: { session: null }, error };
        }
      },

      onAuthStateChange: (callback) => {
        // Add listener to the array
        this.listeners.push(callback);
        
        // Return a subscription object with unsubscribe method
        return {
          subscription: {
            unsubscribe: () => {
              this.listeners = this.listeners.filter(listener => listener !== callback);
            }
          }
        };
      }
    };
  }

  private notifyListeners(event: string, session: AuthSession | null) {
    this.listeners.forEach(listener => {
      try {
        listener(event, session);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }

  private createDBClient(): SupabaseDB {
    return {
      from: (table: string) => {
        // During development, we'll pass through to the direct Supabase client
        return directSupabase.from(table);
      }
    };
  }
}

// Export a singleton instance of the secure client
export const supabase = new SecureSupabaseClient(); 