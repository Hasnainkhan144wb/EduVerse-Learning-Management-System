import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('adminUser') || localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('adminToken') || localStorage.getItem('token') || null;
  });

  const [loading, setLoading] = useState(true);

  // Derived states
  const isAuthenticated = !!token && !!user;
  const role = user?.role || null;

  // Logout handler
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  // Auto-login / verify token on mount
  const checkAuthStatus = useCallback(async () => {
    const storedToken = localStorage.getItem('adminToken') || localStorage.getItem('token');
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me').catch(() => null);
      if (response && response.data.success) {
        setUser(response.data.data);
        setToken(storedToken);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      } else {
        // Keep local user if token is valid admin token
        const savedUser = localStorage.getItem('adminUser') || localStorage.getItem('user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          setToken(storedToken);
        } else {
          logout();
        }
      }
    } catch (error) {
      console.error('Auth verification failed:', error);
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

  // Standard Login handler
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

  // Profile / Admin state update helper
  const updateUserState = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const setTokenState = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
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
        setTokenState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
