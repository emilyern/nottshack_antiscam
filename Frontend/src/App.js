// =============================================================
// src/App.js
// Root component — sets up React Router with protected routes.
// =============================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';

import Login     from './pages/Login';
import Register  from './pages/Register';
import Dashboard from './pages/Dashboard';
import Send      from './pages/Send';
import History   from './pages/History';

// ---- ProtectedRoute: redirects to /login if not logged in ----
function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <Splash />;
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

// ---- PublicRoute: redirects to /dashboard if already logged in ----
function PublicRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <Splash />;
  return isLoggedIn ? <Navigate to="/dashboard" replace /> : children;
}

// ---- Loading splash shown while auth state is being determined ----
function Splash() {
  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#020617',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '16px',
    }}>
      <div style={{ fontSize: '32px', fontWeight: 800, color: '#f8fafc' }}>
        Dash<span style={{ color: '#3b82f6' }}>Guard</span>
      </div>
      <div style={{ fontSize: '13px', color: '#475569' }}>Loading...</div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Global reset styles */}
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #020617; }
          input, textarea, button { font-family: inherit; }
          input:focus, textarea:focus { border-color: #3b82f6 !important; }
        `}</style>

        <Routes>
          {/* Public routes (redirect to dashboard if already logged in) */}
          <Route path="/login"    element={<PublicRoute><Login    /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected routes (redirect to login if not authenticated) */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/send"      element={<ProtectedRoute><Send      /></ProtectedRoute>} />
          <Route path="/history"   element={<ProtectedRoute><History   /></ProtectedRoute>} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}