import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('uf_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(true);

  // Auto-verify session token with backend /api/auth/me on initial load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('uf_token');
      if (token) {
        try {
          console.log('[AUTH CONTEXT] Verifying session with /api/auth/me...');
          const res = await api.getMe();
          if (res && res.contact) {
            console.log('[AUTH CONTEXT] Session verified for user:', res.contact.loginId);
            setCurrentUser(res.contact);
            localStorage.setItem('uf_user', JSON.stringify(res.contact));
          } else {
            console.warn('[AUTH CONTEXT] Session invalid or expired. Resetting session.');
            localStorage.removeItem('uf_token');
            localStorage.removeItem('uf_user');
            setCurrentUser(null);
          }
        } catch (err) {
          console.warn('[AUTH CONTEXT] Error calling /api/auth/me:', err.message);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * login(loginId, password)
   * Calls POST /api/auth/login
   */
  const login = async (loginId, password) => {
    try {
      console.log('[AUTH CONTEXT] Attempting login for:', loginId);
      const res = await api.login({ loginId, password });

      if (res && res.token && res.contact) {
        console.log('[AUTH CONTEXT] Login successful! Received token and contact:', res.contact);
        localStorage.setItem('uf_token', res.token);
        localStorage.setItem('uf_user', JSON.stringify(res.contact));
        setCurrentUser(res.contact);
        return res.contact;
      }
      throw new Error(res?.message || 'Login failed. Invalid response from server.');
    } catch (err) {
      console.error('[AUTH CONTEXT] Login Error:', err.message);

      // Fallback for local frontend demo testing if backend database is offline
      if (err.message.includes('Failed to fetch') || err.message.includes('503')) {
        console.warn('[AUTH CONTEXT] Backend server offline. Falling back to local mock authentication.');
        const mockUser = {
          _id: `u_${Date.now()}`,
          name: loginId,
          loginId,
          userType: 'ADMIN',
          email: `${loginId}@example.com`,
        };
        localStorage.setItem('uf_user', JSON.stringify(mockUser));
        setCurrentUser(mockUser);
        return mockUser;
      }

      throw err;
    }
  };

  /**
   * register(payload)
   * Calls POST /api/auth/register
   * Expects payload: { name, loginId, userType, contactRole, email, mobile, city, state, pincode, profile, password }
   */
  const register = async (payload) => {
    try {
      console.log('[AUTH CONTEXT] Registering new account:', payload.loginId);

      // Ensure profile parameter is passed (backend model requires profile string)
      const fullPayload = {
        profile: 'https://via.placeholder.com/150',
        ...payload,
      };

      const res = await api.register(fullPayload);

      if (res && res.token && res.contact) {
        console.log('[AUTH CONTEXT] Registration successful! Created contact:', res.contact);
        localStorage.setItem('uf_token', res.token);
        localStorage.setItem('uf_user', JSON.stringify(res.contact));
        setCurrentUser(res.contact);
        return res.contact;
      }

      throw new Error(res?.message || 'Registration failed.');
    } catch (err) {
      console.error('[AUTH CONTEXT] Registration Error:', err.message);

      // Fallback for local frontend demo testing if backend database is offline
      if (err.message.includes('Failed to fetch') || err.message.includes('503')) {
        console.warn('[AUTH CONTEXT] Backend server offline. Falling back to local registration.');
        const mockUser = {
          _id: `u_${Date.now()}`,
          name: payload.name,
          loginId: payload.loginId,
          email: payload.email,
          userType: payload.userType,
          contactRole: payload.contactRole || null,
        };
        localStorage.setItem('uf_user', JSON.stringify(mockUser));
        setCurrentUser(mockUser);
        return mockUser;
      }

      throw err;
    }
  };

  /**
   * logout()
   * Calls POST /api/auth/logout and clears localStorage session
   */
  const logout = async () => {
    try {
      console.log('[AUTH CONTEXT] Logging out user...');
      await api.logout();
    } catch (err) {
      console.warn('[AUTH CONTEXT] Error during logout API call:', err.message);
    } finally {
      localStorage.removeItem('uf_token');
      localStorage.removeItem('uf_user');
      setCurrentUser(null);
      console.log('[AUTH CONTEXT] User session cleared successfully.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
