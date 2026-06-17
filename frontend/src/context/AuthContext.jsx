import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('sb_token'));
  const [loading, setLoading] = useState(true);

  const API_BASE = '/api';

  // Verify existing token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const savedToken = localStorage.getItem('sb_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { 'Authorization': `Bearer ${savedToken}` }
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          setToken(savedToken);
        } else {
          // Token expired or invalid
          localStorage.removeItem('sb_token');
          setToken(null);
        }
      } catch (e) {
        console.error('Error verifying token:', e);
        localStorage.removeItem('sb_token');
        setToken(null);
      }
      setLoading(false);
    };
    verifyToken();
  }, []);

  const login = useCallback((newToken, userData) => {
    localStorage.setItem('sb_token', newToken);
    setToken(newToken);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sb_token');
    setToken(null);
    setUser(null);
  }, []);

  const isLoggedIn = !!user && !!token;

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
