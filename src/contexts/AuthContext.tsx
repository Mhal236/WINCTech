import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';

// Use direct Supabase client for better OAuth support
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://julpwjxzrlkbxdbphrdy.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1bHB3anh6cmxrYnhkYnBocmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MTQ4NDUsImV4cCI6MjA1Mjk5MDg0NX0.rynZAq6bjPlpfyTaxHYcs8FdVdTo_gy95lazi2Kt5RY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

// Simpler User type matching our app_users table
interface User {
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

// Use Supabase Session type directly
type Session = import('@supabase/supabase-js').Session;

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasPermission: (requiredRole: string) => boolean;
};

// Create a default context value
const defaultContextValue: AuthContextType = {
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => ({ error: new Error('Not implemented') }),
  signUp: async () => ({ error: new Error('Not implemented') }),
  signInWithGoogle: async () => ({ error: new Error('Not implemented') }),
  signOut: async () => {},
  hasPermission: () => false
};

const AuthContext = createContext<AuthContextType>(defaultContextValue);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Safety timeout to ensure loading never gets stuck
    const safetyTimeout = setTimeout(() => {
      console.log('🔴 Safety timeout triggered - forcing loading to false');
      setIsLoading(false);
    }, 10000);

    const getInitialSession = async () => {
      setIsLoading(true);
      try {
        console.log('🔵 Checking for initial session...');
        
        // First check for Google session token in localStorage (like WINCRM)
        const googleSessionToken = localStorage.getItem('google_session_token');
        const userDataStr = localStorage.getItem('google_user_data');
        
        if (googleSessionToken && userDataStr) {
          try {
            console.log('🟢 Found Google session in localStorage');
            // Parse stored user data from Google OAuth
            const userData = JSON.parse(userDataStr);
            
            // Look up user data using the database function
            console.log('🔵 Looking up user data by email:', userData.email);
            
            const { data: userLookupData, error: lookupError } = await supabase
              .rpc('get_user_by_email', { user_email: userData.email })
              .single();
            
            let userObject: User;
            
            if (userLookupData && !lookupError) {
              console.log('🟢 Found user data from database:', userLookupData);
              // Use data from database lookup
              const dbUser = userLookupData as any;
              userObject = {
                id: dbUser.supabase_id,
                email: dbUser.email,
                name: dbUser.name,
                user_role: dbUser.user_role,
                verification_status: dbUser.verification_status,
                verification_form_data: dbUser.verification_form_data,
                submitted_at: dbUser.submitted_at,
                verified_at: dbUser.verified_at,
                verified_by: dbUser.verified_by,
                rejection_reason: dbUser.rejection_reason,
                credits: dbUser.credits
              };
            } else {
              console.log('🔵 No database user found, creating new user in app_users table');
              
              // Create user in app_users table
              const newUserData = {
                email: userData.email,
                name: userData.name,
                user_role: userData.email === 'admin@windscreencompare.com' ? 'admin' : 
                          userData.email === 'tech@windscreencompare.com' ? 'pro-1' : 'pending',
                verification_status: userData.email === 'admin@windscreencompare.com' ? 'verified' : 
                                   userData.email === 'tech@windscreencompare.com' ? 'verified' : 'non-verified',
                supabase_id: userData.id || userData.sub,
                created_at: new Date().toISOString()
              };
              
              try {
                // First try to insert the user
                const { data: insertedUser, error: insertError } = await supabase
                  .from('app_users')
                  .insert([newUserData])
                  .select()
                  .single();
                
                if (insertError) {
                  console.error('🔴 Error creating user in app_users:', insertError);
                  
                  // If it's a duplicate key error, try to fetch the existing user
                  if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
                    console.log('🔵 User already exists, fetching existing record');
                    const { data: existingUser, error: fetchError } = await supabase
                      .from('app_users')
                      .select('*')
                      .eq('email', userData.email)
                      .single();
                    
                    if (existingUser && !fetchError) {
                      console.log('🟢 Found existing user:', existingUser);
                      userObject = {
                        id: existingUser.id,
                        email: existingUser.email,
                        name: existingUser.name,
                        user_role: existingUser.user_role,
                        verification_status: existingUser.verification_status,
                        verification_form_data: existingUser.verification_form_data,
                        submitted_at: existingUser.submitted_at,
                        verified_at: existingUser.verified_at,
                        verified_by: existingUser.verified_by,
                        rejection_reason: existingUser.rejection_reason,
                        credits: existingUser.credits
                      };
                    } else {
                      // Still fallback to basic user object
                      userObject = {
                        id: userData.id || userData.sub,
                        email: userData.email,
                        name: userData.name,
                        user_role: userData.email === 'admin@windscreencompare.com' ? 'admin' : 'pending',
                        verification_status: userData.email === 'admin@windscreencompare.com' ? 'verified' : 'non-verified'
                      };
                    }
                  } else {
                    // Other error, continue with basic user object
                    userObject = {
                      id: userData.id || userData.sub,
                      email: userData.email,
                      name: userData.name,
                      user_role: userData.email === 'admin@windscreencompare.com' ? 'admin' : 'pending',
                      verification_status: userData.email === 'admin@windscreencompare.com' ? 'verified' : 'non-verified'
                    };
                  }
                } else {
                  console.log('🟢 Successfully created user in app_users table:', insertedUser);
                  userObject = {
                    id: insertedUser.id,
                    email: insertedUser.email,
                    name: insertedUser.name,
                    user_role: insertedUser.user_role,
                    verification_status: insertedUser.verification_status,
                    verification_form_data: insertedUser.verification_form_data,
                    submitted_at: insertedUser.submitted_at,
                    verified_at: insertedUser.verified_at,
                    verified_by: insertedUser.verified_by,
                    rejection_reason: insertedUser.rejection_reason,
                    credits: insertedUser.credits
                  };
                }
              } catch (createError) {
                console.error('🔴 Exception creating user:', createError);
                // Fallback to basic Google data
                userObject = {
                  id: userData.id || userData.sub,
                  email: userData.email,
                  name: userData.name,
                  user_role: userData.email === 'admin@windscreencompare.com' ? 'admin' : 'pending',
                  verification_status: userData.email === 'admin@windscreencompare.com' ? 'verified' : 'non-verified'
                };
              }
            }
            
            console.log('🟢 Final Google user object:', userObject);
            setUser(userObject);
            // Create a mock session for compatibility
            setSession({ user: { id: userObject.id, email: userData.email } } as any);
            clearTimeout(safetyTimeout);
            setIsLoading(false);
            return;
          } catch (parseError) {
            console.error('Error parsing Google user data:', parseError);
            localStorage.removeItem('google_session_token');
            localStorage.removeItem('google_user_data');
          }
        }
        
        // Fall back to Supabase session checking
        console.log('🔵 Getting Supabase session...');
        const { data, error } = await supabase.auth.getSession();
        
        console.log('🔵 Session check result:', { hasData: !!data, hasSession: !!data?.session, error });
        
        if (error) {
          console.error("🔴 Session retrieval error:", error);
          clearTimeout(safetyTimeout);
          setIsLoading(false);
          return;
        }
        
        if (data?.session) {
          console.log('🟢 Found existing Supabase session');
          console.log('🔵 Session user ID:', data.session.user?.id);
          
          // Create user object from session
          const sessionUser = data.session.user as any;
          
          let userObject: User = {
            id: sessionUser.id,
            email: sessionUser.email || '',
            name: sessionUser.user_metadata?.full_name || sessionUser.email || 'User',
            user_role: 'user'
          };
          
          console.log('🔵 Initial user object from session:', userObject);
          
          // Try to fetch complete user data with timeout
          try {
            console.log('🔵 Fetching complete user data for ID:', sessionUser.id);
            
            // Add a timeout to prevent hanging
            const fetchPromise = supabase
              .from('app_users')
              .select('*')
              .eq('id', sessionUser.id)
              .single();
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('User data fetch timeout')), 5000)
            );
            
            const { data: userData, error: fetchError } = await Promise.race([
              fetchPromise,
              timeoutPromise
            ]) as any;
            
            console.log('🔵 User data fetch result:', { hasUserData: !!userData, fetchError });
            
            if (userData && !fetchError) {
              console.log('🟢 Found complete user data');
              userObject = {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                user_role: userData.user_role,
                verification_status: userData.verification_status,
                verification_form_data: userData.verification_form_data,
                submitted_at: userData.submitted_at,
                verified_at: userData.verified_at,
                verified_by: userData.verified_by,
                rejection_reason: userData.rejection_reason,
                credits: userData.credits
              };
            } else {
              console.log('🔵 User not found in app_users or timeout, using session data only');
            }
          } catch (error) {
            console.error('🔴 Error fetching user data on initial load:', error);
            // Continue with basic user object
          }
          
          console.log('🟢 Final user object for initial session:', userObject);
          
          setUser(userObject);
          setSession(data.session);
        } else {
          console.log('🔵 No existing session found');
        }
      } catch (error) {
        console.error('🔴 Error checking auth session:', error);
      } finally {
        console.log('🔵 Setting initial loading to false');
        clearTimeout(safetyTimeout);
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Debounce auth state changes to prevent rapid transitions
    let authChangeTimeout: NodeJS.Timeout | null = null;
    
    // Set up auth change listener
    let subscription = { unsubscribe: () => {} };
    try {
      const authListener = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔵 Auth state changed:', event);
        console.log('🔵 Session exists:', !!session);
        
        // Clear any pending auth change timeout
        if (authChangeTimeout) {
          clearTimeout(authChangeTimeout);
        }
        
        // Debounce auth state changes to prevent flashing during navigation
        authChangeTimeout = setTimeout(async () => {
          if (session?.user) {
            console.log('🔵 Session user ID:', session.user.id);
            console.log('🔵 Session user email:', session.user.email);
          }
          
          try {
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('🟢 Processing SIGNED_IN event...');
              
              const sessionUser = session.user;
              
              // Create basic user object
              let userObject: User = {
                id: sessionUser.id,
                email: sessionUser.email || '',
                name: (sessionUser as any)?.user_metadata?.full_name || sessionUser.email || 'User',
                user_role: 'user'
              };
              
              console.log('🔵 Basic user object created:', userObject);
            
              // Try to fetch additional data from app_users table with timeout
              try {
                console.log('🔵 Querying app_users table for user:', sessionUser.id);
                
                const fetchPromise = supabase
                  .from('app_users')
                  .select('*')
                  .eq('id', sessionUser.id)
                  .single();
                
                const timeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Database query timeout')), 3000)
                );
                
                const { data: userData, error: dbError } = await Promise.race([
                  fetchPromise,
                  timeoutPromise
                ]) as any;
                
                console.log('🔵 Database query result:', { hasUserData: !!userData, dbError: dbError?.message });
                
                if (userData && !dbError) {
                  console.log('🟢 Using database user data');
                  userObject = {
                    id: userData.id,
                    email: userData.email,
                    name: userData.name,
                    user_role: userData.user_role,
                    verification_status: userData.verification_status,
                    verification_form_data: userData.verification_form_data,
                    submitted_at: userData.submitted_at,
                    verified_at: userData.verified_at,
                    verified_by: userData.verified_by,
                    rejection_reason: userData.rejection_reason,
                    credits: userData.credits
                  };
                } else {
                  console.log('🔵 No database record found or timeout, using OAuth data');
                  // For OAuth users without database record, set as non-verified
                  userObject.user_role = 'non-verified';
                  userObject.verification_status = 'non-verified';
                }
              } catch (dbError) {
                console.log('🔴 Database query failed:', dbError);
                // Continue with basic user object
                userObject.user_role = 'non-verified';
                userObject.verification_status = 'non-verified';
              }
              
              console.log('🟢 Final user object:', userObject);
              console.log('🔵 Updating auth state...');
              
              setUser(userObject);
              setSession(session);
              
              console.log('🟢 Auth state updated successfully');
              
            } else if (event === 'SIGNED_OUT') {
              console.log('🔴 Processing SIGNED_OUT event...');
              setUser(null);
              setSession(null);
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
              console.log('🔵 Processing TOKEN_REFRESHED event...');
              // Don't clear the user state on token refresh, just update session
              setSession(session);
            }
          } catch (error) {
            console.error('🔴 Error in auth state change handler:', error);
          } finally {
            // Always set loading to false after processing auth events
            console.log('🔵 Setting loading to false after auth change');
            setIsLoading(false);
          }
        }, 150); // 150ms debounce delay
      });
      
      if (authListener?.data?.subscription) {
        subscription = authListener.data.subscription;
      }
    } catch (error) {
      console.error('🔴 Error setting up auth listener:', error);
      setIsLoading(false);
    }

    return () => {
      // Clean up auth listener on unmount
      try {
        clearTimeout(safetyTimeout);
        if (authChangeTimeout) {
          clearTimeout(authChangeTimeout);
        }
        subscription.unsubscribe();
      } catch (error) {
        console.error('🔴 Error unsubscribing:', error);
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      return { error };
    } catch (error) {
      console.error('Error signing up:', error);
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('🔵 AuthContext: Starting Google OAuth...');
      console.log('🔵 Current window location:', window.location.origin);
      
      // Get the correct redirect URL based on environment
      const getRedirectUrl = () => {
        // Priority 1: Explicit environment variables
        if (import.meta.env.VITE_BASE_URL) {
          return import.meta.env.VITE_BASE_URL;
        }
        
        if (import.meta.env.VITE_SITE_URL) {
          return import.meta.env.VITE_SITE_URL;
        }
        
        // Priority 2: Detect Vercel deployment
        if (window.location.hostname.includes('vercel.app')) {
          return window.location.origin;
        }
        
        // Priority 3: Development environment
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return window.location.origin;
        }
        
        // Priority 4: Production deployment (custom domain)
        return window.location.origin;
      };
      
      const redirectUrl = getRedirectUrl();
      console.log('🔵 Using redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${redirectUrl}/`
        }
      });
      
      console.log('🔵 OAuth response:', { data, error });
      
      if (error) {
        console.error('🔴 OAuth error:', error);
        return { error };
      }
      
      console.log('🟢 OAuth initiated successfully');
      return { error: null };
    } catch (error) {
      console.error('🔴 OAuth catch error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🔵 Starting sign out process');
      setIsLoading(true);
      
      // Clear Google session data (like WINCRM)
      localStorage.removeItem('google_session_token');
      localStorage.removeItem('google_user_data');
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear local state immediately
      setSession(null);
      setUser(null);
      
      console.log('🟢 Sign out completed');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check if user has permission based on their role
  const hasPermission = (requiredRole: string): boolean => {
    if (!user) return false;
    
    // New 4-level hierarchy: admin > pro-2 > pro-1 > pending
    const userRole = user.user_role || 'pending';
    const verificationStatus = user.verification_status || 'non-verified';
    
    // Check verification status first - non-verified users can only access basic features
    if (verificationStatus === 'non-verified' || verificationStatus === 'pending' || verificationStatus === 'rejected') {
      // Non-verified users can only access user-level features (Home, Contact, Settings)
      if (requiredRole === 'user') {
        return true;
      }
      // Block access to jobs, calendar, and other admin features for non-verified users
      return false;
    }
    
    // Admin has access to everything (if verified)
    if (userRole === 'admin' && verificationStatus === 'verified') return true;
    
    // Pro-2 technicians can access everything except admin-only features (if verified)
    if (userRole === 'pro-2' && verificationStatus === 'verified') {
      return ['pro-2', 'admin', 'pro-1', 'user'].includes(requiredRole);
    }
    
    // Pro-1 technicians can access core technician features (if verified)
    if (userRole === 'pro-1' && verificationStatus === 'verified') {
      return ['pro-1', 'user'].includes(requiredRole) || 
             (requiredRole === 'admin'); // Allow admin access for core features
    }
    
    // For "user" level access (Contact, Settings, Home), allow all authenticated users
    if (requiredRole === 'user') {
      return ['pending', 'pro-1', 'pro-2', 'admin'].includes(userRole);
    }
    
    // For admin-level access, check specific permissions (must be verified)
    if (requiredRole === 'admin' && verificationStatus === 'verified') {
      // Admin and Pro-2 have full admin access
      if (['admin', 'pro-2'].includes(userRole)) return true;
      
      // Pro-1 has admin access to core technician features only
      if (userRole === 'pro-1') return true;
    }
    
    // For pro-2 level access, only pro-2 and admin (must be verified)
    if (requiredRole === 'pro-2' && verificationStatus === 'verified') {
      return ['admin', 'pro-2'].includes(userRole);
    }
    
    // Legacy support for old role names - map to new system
    if (userRole === 'staff') return hasPermission('pro-2');
    if (userRole === 'verified') return hasPermission('pro-1');
    if (userRole === 'user') return hasPermission('pending');
    
    return false;
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    hasPermission
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('useAuth must be used within an AuthProvider');
    return defaultContextValue;
  }
  return context;
} 