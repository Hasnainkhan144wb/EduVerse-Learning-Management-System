import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null;
  });

  const [loading, setLoading] = useState(true);

  // Derived states
  const isAuthenticated = !!token && !!user;
  const role = user?.role || null;

  // Logout handler
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  // Auto-login / verify token on mount
  const checkAuthStatus = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.data);
        setToken(storedToken);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      } else {
        logout();
      }
    } catch (error) {
      console.error('Auth verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    checkAuthStatus();

    const handleAuthError = () => {
      logout();
    };

    window.addEventListener('auth-error', handleAuthError);
    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, [checkAuthStatus, logout]);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        const { token: newToken, ...userData } = response.data.data;

        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));

        setToken(newToken);
        setUser(userData);
        setLoading(false);
        return { success: true, user: userData };
      }
    } catch (error) {
      setLoading(false);
      const message =
        error.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, message };
    }
  };

  // Register handler
  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.success) {
        const { token: newToken, ...newUser } = response.data.data;

        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));

        setToken(newToken);
        setUser(newUser);
        setLoading(false);
        return { success: true, user: newUser };
      }
    } catch (error) {
      setLoading(false);
      const message =
        error.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, message };
    }
  };

  // Profile update helper
  const updateUserState = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        checkAuthStatus,
        updateUserState,
      }}
    >
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

export default AuthContext;
