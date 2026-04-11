// =============================================================
// src/Navbar.js — 加了 Buy 和 Sell 链接
// =============================================================

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Shield, LayoutDashboard, Send, History, LogOut, TrendingUp, TrendingDown } from 'lucide-react';

const NAV_LINKS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/buy',       label: 'Buy DASH',  icon: TrendingUp      },
  { path: '/sell',      label: 'Sell DASH', icon: TrendingDown     },
  { path: '/send',      label: 'Send',      icon: Send             },
  { path: '/history',   label: 'History',   icon: History          },
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
      <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', marginRight: '24px' }}>
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
                padding: '6px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                color: active ? '#f8fafc' : '#94a3b8',
                backgroundColor: active ? '#1e293b' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </div>

      {/* User + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '13px', color: '#64748b' }}>
          {user?.username}
        </span>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '8px',
            background: 'transparent', border: '1px solid #1e293b',
            color: '#64748b', cursor: 'pointer', fontSize: '13px',
          }}
        >
          <LogOut size={14} /> Logout
        </button>
      </div>
    </nav>
  );
}