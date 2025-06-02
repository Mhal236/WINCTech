import { createContext, useContext, useState, ReactNode } from 'react';

interface MAGUser {
  email: string;
  isAuthenticated: boolean;
  authMethod: 'mag' | 'guest';
}

interface MAGAuthContextType {
  magUser: MAGUser | null;
  isMAGAuthenticated: boolean;
  loginWithMAG: (credentials: { email: string; password: string }) => Promise<void>;
  continueAsGuest: () => void;
  logoutMAG: () => void;
}

const MAGAuthContext = createContext<MAGAuthContextType | null>(null);

export function MAGAuthProvider({ children }: { children: ReactNode }) {
  const [magUser, setMagUser] = useState<MAGUser | null>(null);

  const loginWithMAG = async (credentials: { email: string; password: string }) => {
    try {
      // TODO: Replace with actual MAG API authentication
      // For now, we'll use the hardcoded credentials
      const validCredentials = {
        email: 'admin@windscreencompare.com',
        password: 'test123'
      };

      if (credentials.email === validCredentials.email && credentials.password === validCredentials.password) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setMagUser({
          email: credentials.email,
          isAuthenticated: true,
          authMethod: 'mag'
        });
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('MAG authentication failed:', error);
      throw error;
    }
  };

  const continueAsGuest = () => {
    setMagUser({
      email: 'guest@windscreencompare.com',
      isAuthenticated: false,
      authMethod: 'guest'
    });
  };

  const logoutMAG = () => {
    setMagUser(null);
  };

  const isMAGAuthenticated = magUser?.isAuthenticated ?? false;

  const value = {
    magUser,
    isMAGAuthenticated,
    loginWithMAG,
    continueAsGuest,
    logoutMAG
  };

  return (
    <MAGAuthContext.Provider value={value}>
      {children}
    </MAGAuthContext.Provider>
  );
}

export function useMAGAuth() {
  const context = useContext(MAGAuthContext);
  if (!context) {
    throw new Error('useMAGAuth must be used within a MAGAuthProvider');
  }
  return context;
} 