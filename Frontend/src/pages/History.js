// =============================================================
// src/pages/History.js
// Full transaction history with filtering by direction + risk level.
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { walletAPI } from '../api';
import { RiskPill } from '../RiskBadge';
import Navbar from '../Navbar';
import {
  ArrowUpRight, ArrowDownLeft, RefreshCw,
  ExternalLink, Filter, Shield,
} from 'lucide-react';

export default function History() {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filterDir,  setFilterDir]      = useState('all');   // 'all' | 'sent' | 'received'
  const [filterRisk, setFilterRisk]     = useState('all');   // 'all' | 'low' | 'medium' | 'high' | 'critical'

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await walletAPI.getHistory();
      setTransactions(data.transactions || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // ---- Filtering ----
  const filtered = transactions.filter((tx) => {
    const isSent = tx.fromAddress === user?.walletAddress;
    if (filterDir === 'sent'     && !isSent)  return false;
    if (filterDir === 'received' &&  isSent)  return false;
    if (filterRisk !== 'all' && tx.riskLevel !== filterRisk) return false;
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617' }}>
      <Navbar />

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#f8fafc' }}>
              Transaction History
            </h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
              {filtered.length} of {transactions.length} transactions
            </p>
          </div>
          <button onClick={fetchHistory} style={iconBtn} title="Refresh">
            <RefreshCw size={15} color="#64748b" />
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={13} color="#64748b" />
            <span style={{ fontSize: '12px', color: '#64748b' }}>Direction:</span>
            {['all', 'sent', 'received'].map((v) => (
              <button key={v} onClick={() => setFilterDir(v)} style={{ ...filterBtn, ...(filterDir === v ? filterBtnActive : {}) }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={13} color="#64748b" />
            <span style={{ fontSize: '12px', color: '#64748b' }}>Risk:</span>
            {['all', 'low', 'medium', 'high', 'critical'].map((v) => (
              <button key={v} onClick={() => setFilterRisk(v)} style={{ ...filterBtn, ...(filterRisk === v ? filterBtnActive : {}) }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={tableWrap}>
          {/* Header row */}
          <div style={headerRow}>
            {['Type', 'Address', 'Amount', 'Risk', 'Status', 'Date'].map((h) => (
              <div key={h} style={th}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading transactions...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <Shield size={36} color="#1e293b" style={{ marginBottom: '12px' }} />
              <div style={{ color: '#64748b', fontSize: '14px' }}>No transactions match your filters.</div>
            </div>
          ) : (
            filtered.map((tx) => {
              const isSent = tx.fromAddress === user?.walletAddress;
              const counterparty = isSent ? tx.toAddress : tx.fromAddress;
              return (
                <div key={tx.id} style={dataRow}>
                  {/* Type */}
                  <div style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        backgroundColor: isSent ? '#431407' : '#052e16',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSent
                          ? <ArrowUpRight size={12} color="#f97316" />
                          : <ArrowDownLeft size={12} color="#10b981" />
                        }
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: isSent ? '#f97316' : '#10b981' }}>
                        {isSent ? 'Sent' : 'Received'}
                      </span>
                    </div>
                  </div>

                  {/* Address */}
                  <div style={td}>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8' }}>
                      {counterparty ? `${counterparty.slice(0, 8)}...${counterparty.slice(-6)}` : '—'}
                    </span>
                    {tx.note && (
                      <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>{tx.note}</div>
                    )}
                  </div>

                  {/* Amount */}
                  <div style={{ ...td, fontWeight: 700, color: isSent ? '#f97316' : '#10b981', fontSize: '13px' }}>
                    {isSent ? '-' : '+'}{tx.amount?.toFixed(4)} DASH
                  </div>

                  {/* Risk */}
                  <div style={td}>
                    {tx.riskLevel
                      ? <RiskPill level={tx.riskLevel} score={tx.riskScore} />
                      : <span style={{ fontSize: '11px', color: '#475569' }}>N/A</span>
                    }
                  </div>

                  {/* Status */}
                  <div style={td}>
                    <StatusPill status={tx.status} />
                  </div>

                  {/* Date */}
                  <div style={{ ...td, fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : '—'}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </main>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    broadcast:  { color: '#f59e0b', bg: '#1c1204', label: 'Pending'   },
    confirmed:  { color: '#10b981', bg: '#052e16', label: 'Confirmed' },
    failed:     { color: '#ef4444', bg: '#1c0a0a', label: 'Failed'    },
  };
  const cfg = map[status] || map.broadcast;
  return (
    <span style={{
      padding: '2px 8px', borderRadius: '999px',
      fontSize: '11px', fontWeight: 600,
      color: cfg.color, backgroundColor: cfg.bg,
      border: `1px solid ${cfg.color}40`,
    }}>
      {cfg.label}
    </span>
  );
}

// ---- Styles ----
const tableWrap = {
  backgroundColor: '#0f172a', borderRadius: '14px',
  border: '1px solid #1e293b', overflow: 'hidden',
};
const headerRow = {
  display: 'grid',
  gridTemplateColumns: '80px 1fr 120px 140px 90px 140px',
  padding: '10px 16px',
  borderBottom: '1px solid #1e293b',
  backgroundColor: '#0a0f1e',
};
const dataRow = {
  display: 'grid',
  gridTemplateColumns: '80px 1fr 120px 140px 90px 140px 60px',
  padding: '12px 16px',
  borderBottom: '1px solid #0f172a',
  alignItems: 'center',
  transition: 'background-color 0.1s',
};
const th = { fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' };
const td = { fontSize: '13px', color: '#e2e8f0' };
const iconBtn = { background: 'none', border: 'none', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' };
const filterBtn = {
  padding: '4px 10px', borderRadius: '6px',
  border: '1px solid #1e293b', backgroundColor: 'transparent',
  color: '#64748b', fontSize: '11px', cursor: 'pointer',
};
const filterBtnActive = {
  backgroundColor: '#1e3a5f', border: '1px solid #3b82f6', color: '#60a5fa',
};