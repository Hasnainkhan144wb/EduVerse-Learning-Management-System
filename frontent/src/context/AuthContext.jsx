import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
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

  // Global Logout handler - Clears all credentials and redirects directly to main landing page '/'
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setToken(null);
    setUser(null);
    setLoading(false);
    toast.success('Logged out successfully!');
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }
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
      if (response && response.data && response.data.success) {
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
      if (response.data && response.data.success) {
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
      if (response.data && response.data.success) {
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

  // Profile update handler
  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData);
      if (response.data && response.data.success) {
        const updated = response.data.user || response.data.data;
        updateUserState(updated);
        return { success: true, message: response.data.message || 'Profile updated successfully!', user: updated };
      }
      return { success: false, message: response.data?.message || 'Failed to update profile' };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      return { success: false, message };
    }
  };

  // Profile / Admin state update helper
  const updateUserState = (updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
    localStorage.setItem('user', JSON.stringify({ ...user, ...updatedUser }));
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
        updateProfile,
        updateUserState,
        setTokenState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// EXPLICIT CUSTOM HOOK EXPORTS FOR COMPATIBILITY
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Alias export in case other components use useAuthContext
export const useAuthContext = useAuth;

export default AuthContext;
