'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { signInAnonymously } from 'firebase/auth';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { useUser } from './auth/use-user';

interface FirebaseContextValue {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({
  children,
  app,
  auth,
  firestore,
}: {
  children: React.ReactNode;
} & FirebaseContextValue) {
  const { user, loading } = useUser(auth);

  useEffect(() => {
    if (!loading && !user) {
      signInAnonymously(auth).catch((error) => {
        console.error('Anonymous sign-in failed', error);
      });
    }
  }, [user, loading, auth]);

  return (
    <FirebaseContext.Provider value={{ app, auth, firestore }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebaseApp = () => {
    const context = useContext(FirebaseContext);
    if (!context) throw new Error('useFirebaseApp must be used within a FirebaseProvider');
    return context.app;
};
export const useAuth = () => {
    const context = useContext(FirebaseContext);
    if (!context) throw new Error('useAuth must be used within a FirebaseProvider');
    return context.auth;
};
export const useFirestore = () => {
    const context = useContext(FirebaseContext);
    if (!context) throw new Error('useFirestore must be used within a FirebaseProvider');
    return context.firestore;
};
