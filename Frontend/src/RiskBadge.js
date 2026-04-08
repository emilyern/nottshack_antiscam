// =============================================================
// src/components/RiskBadge.js
// Displays a color-coded risk indicator with score and level.
// =============================================================

import React from 'react';
import { Shield, ShieldAlert, ShieldX, ShieldCheck } from 'lucide-react';

const RISK_CONFIG = {
  low:      { color: '#10b981', bg: '#d1fae5', icon: ShieldCheck,  label: 'LOW RISK'      },
  medium:   { color: '#f59e0b', bg: '#fef3c7', icon: Shield,       label: 'MEDIUM RISK'   },
  high:     { color: '#f97316', bg: '#ffedd5', icon: ShieldAlert,  label: 'HIGH RISK'     },
  critical: { color: '#ef4444', bg: '#fee2e2', icon: ShieldX,      label: 'CRITICAL RISK' },
};

export default function RiskBadge({ report, size = 'normal' }) {
  if (!report) return null;

  const config = RISK_CONFIG[report.level] || RISK_CONFIG.medium;
  const Icon = config.icon;
  const isLarge = size === 'large';

  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: isLarge ? 'column' : 'row',
      alignItems: 'center',
      gap: isLarge ? '12px' : '8px',
      padding: isLarge ? '20px 28px' : '8px 14px',
      borderRadius: isLarge ? '16px' : '8px',
      backgroundColor: config.bg,
      border: `2px solid ${config.color}`,
    }}>
      <Icon size={isLarge ? 40 : 18} color={config.color} />
      <div style={{ textAlign: isLarge ? 'center' : 'left' }}>
        <div style={{
          fontWeight: 700,
          fontSize: isLarge ? '20px' : '13px',
          color: config.color,
          letterSpacing: '0.05em',
        }}>
          {config.label}
        </div>
        <div style={{
          fontSize: isLarge ? '14px' : '11px',
          color: config.color,
          opacity: 0.8,
        }}>
          Score: {report.score}/10
        </div>
      </div>
    </div>
  );
}

// Compact inline badge (for transaction history)
export function RiskPill({ level, score }) {
  const config = RISK_CONFIG[level] || RISK_CONFIG.medium;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '999px',
      fontSize: '11px',
      fontWeight: 600,
      color: config.color,
      backgroundColor: config.bg,
      border: `1px solid ${config.color}`,
    }}>
      {config.label} ({score}/10)
    </span>
  );
}