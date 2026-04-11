// =============================================================
// src/pages/Profile.js
// User profile page — shows account info and wallet details.
// =============================================================

import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import Navbar from '../Navbar';
import {
  User, Mail, Wallet, Shield, Copy, Check,
  Calendar, Key,
} from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [copiedField, setCopiedField] = useState(null);

  function copyToClipboard(value, field) {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617' }}>
      <Navbar />

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '36px 24px' }}>

        {/* Page title */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#f8fafc' }}>
            My Profile
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            Your account details and wallet information.
          </p>
        </div>

        {/* Avatar + name card */}
        <div style={{
          ...card,
          display: 'flex', alignItems: 'center', gap: '20px',
          marginBottom: '16px',
        }}>
          <div style={{
            width: '64px', height: '64px',
            borderRadius: '50%',
            backgroundColor: '#1e3a5f',
            border: '2px solid #3b82f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '26px', fontWeight: 800, color: '#60a5fa',
            flexShrink: 0,
          }}>
            {user.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>
              {user.username}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              {user.email}
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              marginTop: '8px',
              padding: '2px 8px', borderRadius: '999px',
              backgroundColor: '#052e16', border: '1px solid #166534',
              fontSize: '11px', color: '#86efac', fontWeight: 600,
            }}>
              <Shield size={10} /> Active Account
            </div>
          </div>
        </div>

        {/* Account info */}
        <div style={{ ...card, marginBottom: '16px' }}>
          <h2 style={sectionTitle}>
            <User size={15} /> Account Information
          </h2>

          <InfoRow
            icon={<User size={14} color="#60a5fa" />}
            label="Username"
            value={user.username}
            mono={false}
          />
          <InfoRow
            icon={<Mail size={14} color="#60a5fa" />}
            label="Email Address"
            value={user.email}
            mono={false}
          />
          <InfoRow
            icon={<Key size={14} color="#60a5fa" />}
            label="User ID"
            value={user.id}
            mono={true}
            truncate={true}
            onCopy={() => copyToClipboard(user.id, 'id')}
            copied={copiedField === 'id'}
          />
        </div>

        {/* Wallet info */}
        <div style={card}>
          <h2 style={sectionTitle}>
            <Wallet size={15} /> Wallet Details
          </h2>

          <div style={{ marginBottom: '6px' }}>
            <div style={labelStyle}>Wallet Address</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 14px', borderRadius: '8px',
              backgroundColor: '#020617', border: '1px solid #1e293b',
            }}>
              <span style={{
                fontFamily: 'monospace', fontSize: '12px', color: '#94a3b8',
                wordBreak: 'break-all', flex: 1,
              }}>
                {user.walletAddress}
              </span>
              <button
                onClick={() => copyToClipboard(user.walletAddress, 'wallet')}
                style={copyBtn}
                title="Copy address"
              >
                {copiedField === 'wallet'
                  ? <Check size={14} color="#10b981" />
                  : <Copy size={14} color="#64748b" />}
              </button>
            </div>
          </div>

          <div style={{
            marginTop: '16px',
            padding: '12px 14px', borderRadius: '8px',
            backgroundColor: '#0c1a2e', border: '1px solid #1e3a5f',
            fontSize: '12px', color: '#60a5fa', lineHeight: '1.6',
          }}>
            🧪 <strong>Testnet Mode</strong> — This wallet operates on the Dash testnet.
            No real DASH is used.
          </div>
        </div>

      </main>
    </div>
  );
}

// ---- Sub-components ----

function InfoRow({ icon, label, value, mono, truncate, onCopy, copied }) {
  const display = truncate && value?.length > 20
    ? `${value.slice(0, 10)}...${value.slice(-8)}`
    : value;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 0', borderBottom: '1px solid #1e293b',
    }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px',
        backgroundColor: '#0f1f3d',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={labelStyle}>{label}</div>
        <div style={{
          fontSize: '13px', color: '#e2e8f0',
          fontFamily: mono ? 'monospace' : 'inherit',
        }}>
          {display}
        </div>
      </div>
      {onCopy && (
        <button onClick={onCopy} style={copyBtn} title="Copy">
          {copied
            ? <Check size={14} color="#10b981" />
            : <Copy size={14} color="#64748b" />}
        </button>
      )}
    </div>
  );
}

// ---- Styles ----
const card = {
  backgroundColor: '#0f172a',
  borderRadius: '14px',
  border: '1px solid #1e293b',
  padding: '20px 24px',
};
const sectionTitle = {
  display: 'flex', alignItems: 'center', gap: '8px',
  fontSize: '14px', fontWeight: 700, color: '#e2e8f0',
  marginBottom: '16px',
};
const labelStyle = {
  fontSize: '11px', color: '#475569',
  fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.05em', marginBottom: '2px',
};
const copyBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: '6px', display: 'flex', alignItems: 'center',
  borderRadius: '6px',
};