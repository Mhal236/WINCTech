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
  verification_status?: string;
  verification_form_data?: any;
  submitted_at?: string;
  verified_at?: string;
  verified_by?: string;
  rejection_reason?: string;
  credits?: number;
}

interface AuthSession {
  user: AppUser | null;
}

interface SupabaseAuth {
  signInWithPassword: (credentials: { email: string; password: string }) => Promise<any>;
  signUp: (credentials: { email: string; password: string }) => Promise<any>;
  signInWithOAuth: (options: { provider: string; options?: { redirectTo?: string } }) => Promise<any>;
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

// Global singleton pattern to prevent multiple instances across entire app
declare global {
  interface Window {
    __supabaseInstance: any;
    __loggedKeys: Set<string>;
  }
}

function getDirectSupabaseClient() {
  if (typeof window !== 'undefined' && !window.__supabaseInstance) {
    window.__supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: {
          getItem: (key: string) => {
            if (typeof window !== 'undefined') {
              const value = window.localStorage.getItem(key);
              // Only log once per key to avoid spam
              if (!window.__loggedKeys) window.__loggedKeys = new Set();
              if (!window.__loggedKeys.has(key)) {
                console.log(`🔵 Storage getItem: ${key} = ${value ? 'found' : 'null'}`);
                window.__loggedKeys.add(key);
              }
              return value;
            }
            return null;
          },
          setItem: (key: string, value: string) => {
            if (typeof window !== 'undefined') {
              console.log(`🔵 Storage setItem: ${key} = ${value ? 'set' : 'null'}`);
              window.localStorage.setItem(key, value);
            }
          },
          removeItem: (key: string) => {
            if (typeof window !== 'undefined') {
              console.log(`🔵 Storage removeItem: ${key}`);
              window.localStorage.removeItem(key);
            }
          }
        }
      }
    });
  }
  return typeof window !== 'undefined' ? window.__supabaseInstance : null;
}

// Direct Supabase client for development with proper session persistence
const directSupabase = getDirectSupabaseClient();

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
          if (!directSupabase) {
            throw new Error('Supabase client not initialized');
          }
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

          // Check if 2FA is enabled for this user
          if (data.two_factor_enabled && data.two_factor_email_enabled) {
            // Return special response indicating 2FA is required
            return {
              data: { user: null, session: null },
              error: null,
              requiresTwoFactor: true,
              tempUserId: data.id,
              tempUserEmail: data.email
            };
          }

          // Create a user session
          const user: AppUser = {
            id: data.id,
            email: data.email,
            name: data.name,
            user_role: data.user_role || 'user', // Default to 'user' if no role is specified
            verification_status: data.verification_status,
            verification_form_data: data.verification_form_data,
            submitted_at: data.submitted_at,
            verified_at: data.verified_at,
            verified_by: data.verified_by,
            rejection_reason: data.rejection_reason
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

          // Create new user with non-verified status
          const { data, error } = await directSupabase
            .from('app_users')
            .insert([
              { 
                email: credentials.email, 
                password: credentials.password,
                name: 'New User',
                user_role: 'non-verified',
                verification_status: 'non-verified'
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
                user_role: data.user_role,
                verification_status: data.verification_status
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

      signInWithOAuth: async (options: { provider: string; options?: { redirectTo?: string } }) => {
        try {
          // Use the direct Supabase client for OAuth as it handles the redirect flow
          const { data, error } = await directSupabase.auth.signInWithOAuth({
            provider: options.provider as any,
            options: options.options
          });
          
          if (error) {
            return { data: null, error };
          }
          
          return { data, error: null };
        } catch (error) {
          console.error('Error signing in with OAuth:', error);
          return { data: null, error };
        }
      },

      signOut: async () => {
        try {
          // First, sign out from Supabase OAuth (if there's an OAuth session)
          const { data: supabaseSession } = await directSupabase.auth.getSession();
          if (supabaseSession?.session) {
            console.log('🔵 Signing out from Supabase OAuth session');
            await directSupabase.auth.signOut();
          }
          
          // Remove session from localStorage
          localStorage.removeItem('user_session');
          
          // Clear current session and notify listeners
          this.currentSession = null;
          this.notifyListeners('SIGNED_OUT', null);
          
          console.log('🔵 Complete sign out successful');
        } catch (error) {
          console.error('Error signing out:', error);
        }
      },

      completeTwoFactorAuth: async (userId: string) => {
        try {
          // Fetch the user data
          const { data, error } = await directSupabase
            .from('app_users')
            .select('*')
            .eq('id', userId)
            .single();

          if (error || !data) {
            return { 
              data: { user: null, session: null },
              error: { message: 'User not found' } 
            };
          }

          // Create a user session
          const user: AppUser = {
            id: data.id,
            email: data.email,
            name: data.name,
            user_role: data.user_role || 'user',
            verification_status: data.verification_status,
            verification_form_data: data.verification_form_data,
            submitted_at: data.submitted_at,
            verified_at: data.verified_at,
            verified_by: data.verified_by,
            rejection_reason: data.rejection_reason
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
          console.error('Error completing 2FA auth:', error);
          return { data: { user: null, session: null }, error };
        }
      },

      getSession: async () => {
        try {
          // First check for real Supabase session (for OAuth)
          const { data: supabaseSession, error: supabaseError } = await directSupabase.auth.getSession();
          
          if (supabaseSession?.session) {
            console.log('🟢 Found Supabase OAuth session');
            
            // For OAuth users, ensure they exist in our app_users table
            const oauthUser = supabaseSession.session.user;
            let appUserData = null;
            
            try {
              // Check if user exists in app_users table
              const { data: existingUser } = await directSupabase
                .from('app_users')
                .select('*')
                .eq('id', oauthUser.id)
                .single();
              
              if (!existingUser) {
                console.log('🔵 Creating app_users record for OAuth user');
                // Create new user record for OAuth user
                const { data: newUser, error: insertError } = await directSupabase
                  .from('app_users')
                  .insert([{
                    id: oauthUser.id,
                    email: oauthUser.email,
                    name: (oauthUser as any).user_metadata?.full_name || oauthUser.email || 'OAuth User',
                    user_role: 'non-verified',
                    verification_status: 'non-verified',
                    auth_provider: 'google',
                    oauth_user_id: oauthUser.id
                  }])
                  .select()
                  .single();
                
                if (!insertError && newUser) {
                  appUserData = newUser;
                }
              } else {
                appUserData = existingUser;
              }
            } catch (error) {
              console.error('🔴 Error syncing OAuth user to app_users:', error);
            }
            
            // Convert Supabase session to our format with complete user data
            const user: AppUser = {
              id: oauthUser.id,
              email: oauthUser.email || '',
              name: appUserData?.name || (oauthUser as any).user_metadata?.full_name || oauthUser.email || 'User',
              user_role: appUserData?.user_role || 'non-verified',
              verification_status: appUserData?.verification_status || 'non-verified',
              verification_form_data: appUserData?.verification_form_data,
              submitted_at: appUserData?.submitted_at,
              verified_at: appUserData?.verified_at,
              verified_by: appUserData?.verified_by,
              rejection_reason: appUserData?.rejection_reason,
              credits: appUserData?.credits || 0
            };
            
            this.currentSession = { user };
            return { data: { session: this.currentSession }, error: null };
          }
          
          // Fallback to localStorage session (for email/password)
          const savedSession = localStorage.getItem('user_session');
          if (savedSession) {
            console.log('🟢 Found localStorage session');
            const user = JSON.parse(savedSession) as AppUser;
            this.currentSession = { user };
            return { data: { session: this.currentSession }, error: null };
          }
          
          console.log('🔵 No session found');
          return { data: { session: null }, error: null };
        } catch (error) {
          console.error('Error getting session:', error);
          return { data: { session: null }, error };
        }
      },

      onAuthStateChange: (callback) => {
        // Add listener to the array
        this.listeners.push(callback);
        
        // Also listen to real Supabase auth changes for OAuth
        const supabaseListener = directSupabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔵 Supabase auth state change:', event, !!session);
          
          if (event === 'SIGNED_IN' && session) {
            // For OAuth users, ensure they exist in our app_users table
            const oauthUser = session.user;
            let appUserData = null;
            
            try {
              // Check if user exists in app_users table using ID instead of email
              const { data: existingUser } = await directSupabase
                .from('app_users')
                .select('*')
                .eq('id', oauthUser.id)
                .single();
              
              if (!existingUser) {
                console.log('🔵 Creating app_users record for OAuth sign-in');
                // Create new user record for OAuth user
                const { data: newUser, error: insertError } = await directSupabase
                  .from('app_users')
                  .insert([{
                    id: oauthUser.id,
                    email: oauthUser.email,
                    name: (oauthUser as any).user_metadata?.full_name || oauthUser.email || 'OAuth User',
                    user_role: 'non-verified',
                    verification_status: 'non-verified',
                    auth_provider: 'google',
                    oauth_user_id: oauthUser.id
                  }])
                  .select()
                  .single();
                
                if (!insertError && newUser) {
                  appUserData = newUser;
                }
              } else {
                appUserData = existingUser;
              }
            } catch (error) {
              console.error('🔴 Error syncing OAuth user during sign-in:', error);
            }
            
            // Convert Supabase session to our format with complete data
            const user: AppUser = {
              id: oauthUser.id,
              email: oauthUser.email || '',
              name: appUserData?.name || (oauthUser as any).user_metadata?.full_name || oauthUser.email || 'User',
              user_role: appUserData?.user_role || 'non-verified',
              verification_status: appUserData?.verification_status || 'non-verified',
              verification_form_data: appUserData?.verification_form_data,
              submitted_at: appUserData?.submitted_at,
              verified_at: appUserData?.verified_at,
              verified_by: appUserData?.verified_by,
              rejection_reason: appUserData?.rejection_reason,
              credits: appUserData?.credits || 0
            };
            
            this.currentSession = { user };
            callback(event, this.currentSession);
          } else if (event === 'SIGNED_OUT') {
            this.currentSession = null;
            callback(event, null);
          } else if (event === 'TOKEN_REFRESHED' && session) {
            // Handle token refresh to maintain session
            console.log('🔵 Token refreshed, maintaining session');
            if (this.currentSession) {
              callback('SIGNED_IN', this.currentSession);
            }
          }
        });
        
        // Return a subscription object with unsubscribe method
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                this.listeners = this.listeners.filter(listener => listener !== callback);
                // Also unsubscribe from Supabase listener
                if (supabaseListener?.data?.subscription) {
                  supabaseListener.data.subscription.unsubscribe();
                }
              }
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
        if (!directSupabase) {
          throw new Error('Supabase client not initialized');
        }
        return directSupabase.from(table);
      }
    };
  }
}

// Export a singleton instance of the secure client
export const supabase = new SecureSupabaseClient(); 