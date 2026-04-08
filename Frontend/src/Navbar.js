// =============================================================
// src/components/Navbar.js
// Top navigation bar with user info and logout button.
// =============================================================

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Shield, LayoutDashboard, Send, History, LogOut, Wallet } from 'lucide-react';

const NAV_LINKS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/send',      label: 'Send DASH',  icon: Send           },
  { path: '/history',   label: 'History',    icon: History        },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav style={{
      backgroundColor: '#0f172a',
      borderBottom: '1px solid #1e293b',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      height: '64px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', marginRight: '32px' }}>
        <Shield size={24} color="#3b82f6" />
        <span style={{ fontWeight: 800, fontSize: '18px', color: '#f8fafc', letterSpacing: '-0.02em' }}>
          Dash<span style={{ color: '#3b82f6' }}>Guard</span>
        </span>
        <span style={{ fontSize: '10px', backgroundColor: '#1e3a5f', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
          TESTNET
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
        {NAV_LINKS.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                color: active ? '#f8fafc' : '#94a3b8',
                backgroundColor: active ? '#1e293b' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </div>

      {/* User info */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wallet size={14} color="#94a3b8" />
            <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>
              {user.walletAddress?.slice(0, 8)}...{user.walletAddress?.slice(-6)}
            </span>
          </div>
          <div style={{
            width: '32px', height: '32px',
            borderRadius: '50%',
            backgroundColor: '#1e3a5f',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 700, color: '#60a5fa',
          }}>
            {user.username?.[0]?.toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #334155',
              backgroundColor: 'transparent',
              color: '#94a3b8',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}