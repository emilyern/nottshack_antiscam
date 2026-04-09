// =============================================================
// src/pages/Login.js
// User login page — validates credentials and stores JWT token.
// =============================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { authAPI } from '../api';
import { Shield, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authAPI.login({ email: form.email, password: form.password });
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <Shield size={32} color="#3b82f6" />
          <div>
            <h1 style={{ margin: 0, color: '#f8fafc', fontSize: '24px', fontWeight: 800 }}>
              Dash<span style={{ color: '#3b82f6' }}>Guard</span>
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Anti-Fraud Payment Platform</p>
          </div>
        </div>

        <h2 style={{ margin: '0 0 8px', color: '#f8fafc', fontSize: '20px', fontWeight: 700 }}>
          Welcome back
        </h2>
        <p style={{ margin: '0 0 28px', color: '#64748b', fontSize: '14px' }}>
          Sign in to access your secure wallet
        </p>

        {/* Error banner */}
        {error && (
          <div style={{
            padding: '12px 14px', borderRadius: '8px',
            backgroundColor: '#450a0a', border: '1px solid #ef4444',
            color: '#fca5a5', fontSize: '14px', marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Email Address</label>
            <input
              name="email" type="email" placeholder="you@example.com"
              value={form.email} onChange={handleChange}
              required autoComplete="email"
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                name="password" type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                value={form.password} onChange={handleChange}
                required autoComplete="current-password"
                style={{ ...inputStyle, paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: '#64748b', padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Testnet notice */}
        <div style={{
          marginTop: '20px', padding: '10px 14px', borderRadius: '8px',
          backgroundColor: '#0c1a2e', border: '1px solid #1e3a5f',
          fontSize: '12px', color: '#60a5fa', lineHeight: '1.5',
        }}>
          🧪 <strong>Testnet Mode</strong> — No real DASH is used. Safe for development & demos.
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
          No account?{' '}
          <Link to="/register" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  backgroundColor: '#020617', padding: '24px',
};
const cardStyle = {
  width: '100%', maxWidth: '420px',
  backgroundColor: '#0f172a', borderRadius: '16px',
  border: '1px solid #1e293b', padding: '36px',
};
const labelStyle = {
  display: 'block', color: '#94a3b8',
  fontSize: '13px', fontWeight: 500, marginBottom: '6px',
};
const inputStyle = {
  width: '100%', padding: '11px 14px',
  borderRadius: '8px', border: '1px solid #334155',
  backgroundColor: '#1e293b', color: '#f8fafc',
  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};
const btnPrimary = {
  width: '100%', padding: '12px',
  borderRadius: '8px', border: 'none',
  backgroundColor: '#3b82f6', color: '#fff',
  fontWeight: 600, fontSize: '15px', cursor: 'pointer',
  transition: 'background-color 0.15s',
};