if (typeof window !== 'undefined') {
  (window as any).$RefreshReg$ = (window as any).$RefreshReg$ || function () {};
  (window as any).$RefreshSig$ = (window as any).$RefreshSig$ || function () { return function (type: any) { return type; }; };
}

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { api } from '../utils/api';
import { useAppStore } from '../stores/useAppStore';

export interface UserData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: UserData | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: (role?: 'citizen' | 'authority') => Promise<UserData>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const storeLogin = useAppStore((s) => s.login);
  const storeLogout = useAppStore((s) => s.logout);

  useEffect(() => {
    console.log("AuthContext Loaded");

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);

      if (currentUser) {
        const userData: UserData = {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
        };
        setUser(userData);
        console.log("Current User:", userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [storeLogin]);

  // Google Sign In using signInWithPopup()
  const signInWithGoogle = async (role: 'citizen' | 'authority' = 'citizen'): Promise<UserData> => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const currentUser = result.user;
      const userData: UserData = {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
      };
      setUser(userData);
      console.log("signInWithGoogle exists:", typeof signInWithGoogle);

      if (currentUser.email) {
        try {
          const res = await api.post('/auth/google', {
            email: currentUser.email,
            name: currentUser.displayName || currentUser.email.split('@')[0],
            role: role,
          });
          const { access_token, refresh_token, user: apiUser } = res.data;
          localStorage.setItem('geoguard_access_token', access_token);
          localStorage.setItem('geoguard_refresh_token', refresh_token);
          storeLogin({
            id: apiUser.id,
            email: apiUser.email,
            name: apiUser.name,
            role: apiUser.role as any,
            avatarUrl: currentUser.photoURL || undefined,
            languagePref: apiUser.language_pref || 'en',
          });
        } catch (err) {
          console.error('Failed to sync Firebase user with backend:', err);
        }
      }
      setLoading(false);
      return userData;
    } catch (error: any) {
      setLoading(false);
      console.error('Firebase Google Auth error:', error);
      throw error;
    }
  };

  // Logout Functionality
  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await signOut(auth);
      storeLogout();
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Firebase Sign Out error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
