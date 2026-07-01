import React, { createContext, useContext, useState } from 'react';

// Define User type locally
interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    console.log('Sign in:', email);
    // Set dummy user
    setUser({ uid: 'dummy-uid', email, displayName: 'Test User' });
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    console.log('Sign up:', email);
    // Set dummy user
    setUser({ uid: 'dummy-uid', email, displayName: displayName || 'New User' });
  };

  const signOut = async () => {
    console.log('Sign out');
    setUser(null);
  };

  const updateProfile = async (data: { displayName?: string; photoURL?: string }) => {
    console.log('Update profile:', data);
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  const resetPassword = async (email: string) => {
    console.log('Reset password:', email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 