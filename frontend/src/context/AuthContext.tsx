"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

interface UserProfile {
  email: string;
  full_name: string;
  id?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<any>;
  signUpWithEmail: (name: string, email: string, pass: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Synchronize Firebase state on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const token = await fbUser.getIdToken();
          localStorage.setItem('token', token);
          localStorage.removeItem('demo_user');
          
          const profile: UserProfile = {
            email: fbUser.email || '',
            full_name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            id: fbUser.uid
          };
          setUser(profile);
          localStorage.setItem('current_user', JSON.stringify(profile));
        } catch (e) {
          console.error("Error setting Firebase user credentials:", e);
        }
      } else {
        setFirebaseUser(null);
        // If there's a local/offline token, preserve it so developer doesn't get kicked out during offline tests
        const currentToken = localStorage.getItem('token');
        if (currentToken && currentToken.startsWith('local-token-')) {
          const cached = localStorage.getItem('current_user');
          if (cached) {
            try {
              setUser(JSON.parse(cached));
            } catch {
              setUser(null);
            }
          }
        } else {
          setUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('current_user');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Email and Password Login
  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, pass);
      return credential.user;
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  // Email and Password Sign Up
  const signUpWithEmail = async (name: string, email: string, pass: string) => {
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, pass);
      // Update display name
      await updateProfile(credential.user, { displayName: name });
      return credential.user;
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  // Google OAuth Sign In
  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      return credential.user;
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      localStorage.removeItem('token');
      localStorage.removeItem('current_user');
      localStorage.removeItem('demo_user');
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error("Firebase logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      loading,
      loginWithEmail,
      signUpWithEmail,
      loginWithGoogle,
      logout
    }}>
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
