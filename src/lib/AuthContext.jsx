import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { auth } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const currentUser = await auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthChecked(true);

      // Redirect mgh_director to their portal
      if (currentUser?.role === 'mgh_director' && !window.location.pathname.startsWith('/director')) {
        window.location.href = '/director';
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      setAuthChecked(true);

      if (error.response?.status === 401) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    } finally {
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
    }
  };

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const currentUser = await auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthChecked(true);
      setAuthError(null);
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      setAuthChecked(true);
      if (error.response?.status === 401) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    setAuthError(null);
    const data = await auth.login(credentials);
    setUser(data.user);
    setIsAuthenticated(true);
    setAuthChecked(true);
    return data;
  }, []);

  const logout = useCallback(async (shouldRedirect = true) => {
    try {
      await auth.logout();
    } catch (e) {
      // Ignore logout errors
    }
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      window.location.href = '/login';
    }
  }, []);

  const navigateToLogin = useCallback(() => {
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      login,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
