// =============================================================
// src/pages/Register.js
// =============================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { authAPI } from '../api';
import { Shield, Eye, EyeOff, AlertTriangle, Copy, Check } from 'lucide-react';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mnemonic, setMnemonic] = useState(null);
  const [mnemonicCopied, setMnemonicCopied] = useState(false);
  const [mnemonicConfirmed, setMnemonicConfirmed] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setLoading(true);
    setError('');
    try {
      const { data } = await authAPI.register({
        username: form.username,
        email: form.email,
        password: form.password,
      });
      login(data.token, data.user);
      setMnemonic(data.mnemonic);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  function copyMnemonic() {
    navigator.clipboard.writeText(mnemonic);
    setMnemonicCopied(true);
    setTimeout(() => setMnemonicCopied(false), 3000);
  }

  // ---- Mnemonic screen (shown ONCE after registration) ----
  if (mnemonic) {
    const words = mnemonic.split(' ');
    return (
      <div style={pageStyle}>
        <div style={{ ...cardStyle, maxWidth: '600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertTriangle size={24} color="#f59e0b" />
            <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '20px' }}>Save Your Recovery Phrase</h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
            Write down these 12 words and store them safely.{' '}
            <strong style={{ color: '#f59e0b' }}>They will NEVER be shown again.</strong>
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px', marginBottom: '20px',
            padding: '16px', borderRadius: '12px',
            backgroundColor: '#0f172a', border: '1px solid #1e293b',
          }}>
            {words.map((word, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1e293b' }}>
                <span style={{ color: '#475569', fontSize: '11px', minWidth: '18px' }}>{i + 1}.</span>
                <span style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: '14px' }}>{word}</span>
              </div>
            ))}
          </div>

          <button onClick={copyMnemonic} style={{ ...btnSecondary, marginBottom: '20px' }}>
            {mnemonicCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            {mnemonicCopied ? 'Copied!' : 'Copy to Clipboard'}
          </button>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '20px' }}>
            <input
              type="checkbox"
              checked={mnemonicConfirmed}
              onChange={(e) => setMnemonicConfirmed(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }}
            />
            <span style={{ color: '#e2e8f0', fontSize: '14px' }}>
              I have saved my recovery phrase in a safe place
            </span>
          </label>

          <button
            onClick={() => navigate('/dashboard')}
            disabled={!mnemonicConfirmed}
            style={{ ...btnPrimary, opacity: mnemonicConfirmed ? 1 : 0.4, cursor: mnemonicConfirmed ? 'pointer' : 'not-allowed' }}
          >
            Continue to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  // ---- Registration form ----
  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
          <Shield size={32} color="#3b82f6" />
          <div>
            <h1 style={{ margin: 0, color: '#f8fafc', fontSize: '24px', fontWeight: 800 }}>
              Dash<span style={{ color: '#3b82f6' }}>Guard</span>
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Anti-Fraud Payment Platform</p>
          </div>
        </div>

        <h2 style={{ margin: '0 0 24px', color: '#f8fafc', fontSize: '18px' }}>Create Account</h2>

        {error && <div style={errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {[
            { name: 'username', label: 'Username', type: 'text',  placeholder: 'johndoe'         },
            { name: 'email',    label: 'Email',    type: 'email', placeholder: 'you@example.com' },
          ].map(({ name, label, type, placeholder }) => (
            <div key={name} style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>{label}</label>
              <input name={name} type={type} placeholder={placeholder}
                value={form[name]} onChange={handleChange} required style={inputStyle} />
            </div>
          ))}

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input name="password" type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 characters" value={form.password}
                onChange={handleChange} required style={{ ...inputStyle, paddingRight: '44px' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Confirm Password</label>
            <input name="confirm" type="password" placeholder="Repeat password"
              value={form.confirm} onChange={handleChange} required style={inputStyle} />
          </div>

          <button type="submit" disabled={loading}
            style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Creating Account & Wallet...' : 'Create Account + Generate Wallet'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}

const pageStyle  = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617', padding: '24px' };
const cardStyle  = { width: '100%', maxWidth: '440px', backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', padding: '32px' };
const labelStyle = { display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 500, marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
const btnPrimary   = { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' };
const btnSecondary = { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#e2e8f0', cursor: 'pointer', fontSize: '13px' };
const errorBanner  = { padding: '12px', borderRadius: '8px', backgroundColor: '#450a0a', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '14px', marginBottom: '16px' };