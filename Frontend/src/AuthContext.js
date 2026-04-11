// =============================================================
// src/AuthContext.js
// =============================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,       setUser]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [myrBalance, setMyrBalance] = useState(500); // ← shared MYR balance, default RM 500

  useEffect(() => {
    const token     = localStorage.getItem('dashguard_token');
    const savedUser = localStorage.getItem('dashguard_user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      authAPI.me()
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('dashguard_token');
          localStorage.removeItem('dashguard_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  function login(token, userData) {
    localStorage.setItem('dashguard_token', token);
    localStorage.setItem('dashguard_user', JSON.stringify(userData));
    setUser(userData);
    setMyrBalance(500); // reset to RM 500 on every login
  }

  function logout() {
    localStorage.removeItem('dashguard_token');
    localStorage.removeItem('dashguard_user');
    setUser(null);
    setMyrBalance(500); // reset on logout
  }

  // ─── NEW: update the cached user after a profile edit ───────
  function updateUser(updatedUser) {
    setUser(updatedUser);
    localStorage.setItem('dashguard_user', JSON.stringify(updatedUser));
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        isLoggedIn: !!user,
        myrBalance,
        setMyrBalance,
        updateUser, // ← NEW
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;