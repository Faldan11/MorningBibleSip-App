import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, logout as appwriteLogout } from '../services/appwrite';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) setIsGuest(false);
    } catch (e) {
      setUser(null);
    } finally {
      setInitializing(false);
    }
  };

  const loginAuth = async () => {
    setIsGuest(false);
    await checkUser();
  };

  const logoutAuth = async () => {
    try {
      await appwriteLogout();
    } catch (e) {
      console.error('AuthContext: Logout failed', e);
    } finally {
      setUser(null);
      setIsGuest(false);
    }
  };

  const loginAsGuest = () => {
    setIsGuest(true);
  };

  return (
    <AuthContext.Provider value={{ user, initializing, isGuest, loginAuth, logoutAuth, loginAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
