import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';

import Login     from './pages/Login';
import Register  from './pages/Register';
import Dashboard from './pages/Dashboard';
import Send      from './pages/Send';
import History   from './pages/History';
import Buy       from './pages/buy';
import Sell      from './pages/sell';
import TopUp from './pages/TopUp';

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <Splash />;
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <Splash />;
  return isLoggedIn ? <Navigate to="/dashboard" replace /> : children;
}

function Splash() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
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
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #020617; }
          input, textarea, button { font-family: inherit; }
          input:focus, textarea:focus { border-color: #3b82f6 !important; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
        <Routes>
          <Route path="/login"    element={<PublicRoute><Login    /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/send"      element={<ProtectedRoute><Send      /></ProtectedRoute>} />
          <Route path="/history"   element={<ProtectedRoute><History   /></ProtectedRoute>} />
          <Route path="/buy"       element={<ProtectedRoute><Buy       /></ProtectedRoute>} />
          <Route path="/sell"      element={<ProtectedRoute><Sell      /></ProtectedRoute>} />
          <Route path="/topup"     element={<ProtectedRoute><TopUp     /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}