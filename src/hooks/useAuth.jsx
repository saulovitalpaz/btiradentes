import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { changePassword, fetchCurrentUser, loginUser, logoutUser } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetchCurrentUser()
      .then((result) => {
        if (isMounted) setUser(result.authenticated ? result.user : null);
      })
      .catch(() => {
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setIsCheckingAuth(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const result = await loginUser(email, password);
      setUser(result.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Email ou senha incorretos.' };
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    await changePassword(currentPassword, newPassword);
    setUser(null);
  };

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    isCheckingAuth,
    login,
    logout,
    updatePassword,
  }), [user, isCheckingAuth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};
