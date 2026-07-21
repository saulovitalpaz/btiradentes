import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Login from '../views/Login';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isCheckingAuth } = useAuth();

  if (isCheckingAuth) {
    return <div className="placeholder-view"><p>Verificando sessão...</p></div>;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return children;
};

export default ProtectedRoute;
