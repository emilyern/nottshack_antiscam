// =============================================================
// src/pages/Dashboard.js
// =============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { walletAPI } from '../api';
import { RiskPill } from '../RiskBadge';
import Navbar from '../Navbar';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Shield,
  RefreshCw, Copy, Check, Send, AlertTriangle, TrendingUp,
} from 'lucide-react';

const RISK_COLORS = {
  low:      '#10b981',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#ef4444',
  unknown:  '#475569',
};

export default function Dashboard() {
  const { user, myrBalance } = useAuth(); // ← get myrBalance from context

  const [balance,      setBalance]      = useState(null);
  const [history,      setHistory]      = useState([]);
  const [initialLoad,  setInitialLoad]  = useState(true);
  const [error,        setError]        = useState('');
  const [copied,       setCopied]       = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);
  const [dashPriceMyr, setDashPriceMyr] = useState(null);
  const intervalRef = useRef(null);

  const fetchBalance = useCallback(async (silent = false) => {
    try {
      const { data } = await walletAPI.getBalance();
      setBalance(data);
      setError('');
    } catch {
      if (!silent) setError('Could not load balance. Is the backend running?');
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await walletAPI.getHistory();
      setHistory(data.transactions || []);
    } catch {}
  }, []);

  const initialFetch = useCallback(async () => {
    await Promise.all([fetchBalance(false), fetchHistory()]);
    setInitialLoad(false);
  }, [fetchBalance, fetchHistory]);

  const manualRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchBalance(true), fetchHistory()]);
    setRefreshing(false);
  }, [fetchBalance, fetchHistory]);

  useEffect(() => {
    initialFetch();
    intervalRef.current = setInterval(() => {
      fetchBalance(true);
      fetchHistory();
    }, 30000);
    return () => clearInterval(intervalRef.current);
  }, [initialFetch, fetchBalance, fetchHistory]);

  // ---- Fetch DASH price in MYR from CoinGecko ----
  useEffect(() => {
    async function fetchPrice() {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=dash&vs_currencies=myr'
        );
        const data = await res.json();
        setDashPriceMyr(data?.dash?.myr || null);
      } catch {}
    }
    fetchPrice();
    const priceInterval = setInterval(fetchPrice, 60000);
    return () => clearInterval(priceInterval);
  }, []);

  const sentTxs     = history.filter((t) => t.fromAddress === user?.walletAddress);
  const receivedTxs = history.filter((t) => t.toAddress   === user?.walletAddress);
  const totalSent   = sentTxs.reduce((s, t) => s + (t.amount || 0), 0);
  const totalRecv   = receivedTxs.reduce((s, t) => s + (t.amount || 0), 0);

  const barData = buildBarData(history, user?.walletAddress);

  const riskCounts = {};
  sentTxs.forEach((t) => {
    const lvl = t.riskLevel || 'unknown';
    riskCounts[lvl] = (riskCounts[lvl] || 0) + 1;
  });
  const pieData = Object.entries(riskCounts).map(([name, value]) => ({ name, value }));

  function copyAddress() {
    navigator.clipboard.writeText(user?.walletAddress || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (initialLoad) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#020617' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b', fontSize: '14px' }}>
          Loading dashboard…
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617' }}>
      <Navbar />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 24px' }}>

        {error && <div style={errorBanner}>{error}</div>}

        {/* ======== TOP CARDS ROW ======== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>

          {/* Wallet card */}
          <div style={{ ...card, gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>

              {/* Left: address */}
              <div>
                <div style={cardLabel}>
                  <Wallet size={13} style={{ marginRight: '5px' }} /> Your Wallet
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#94a3b8', wordBreak: 'break-all' }}>
                    {user?.walletAddress || '—'}
                  </span>
                  <button onClick={copyAddress} style={iconBtn}>
                    {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} color="#64748b" />}
                  </button>
                </div>
              </div>

              {/* Right: balances */}
              <div style={{ textAlign: 'right' }}>

                {/* DASH balance */}
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DASH Balance</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', lineHeight: 1.1 }}>
                  {balance?.balance?.toFixed(4) ?? '0.0000'}
                  <span style={{ fontSize: '14px', color: '#64748b', marginLeft: '6px' }}>DASH</span>
                </div>

                {/* Live MYR equivalent of DASH */}
                {dashPriceMyr && balance?.balance != null && (
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                    ≈ RM {(balance.balance * dashPriceMyr).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span style={{ fontSize: '11px', color: '#475569', marginLeft: '6px' }}>
                      @ RM {dashPriceMyr.toLocaleString()} / DASH
                    </span>
                  </div>
                )}

                {balance?.unconfirmedBalance > 0 && (
                  <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
                    +{balance.unconfirmedBalance.toFixed(4)} unconfirmed
                  </div>
                )}

                {/* MYR Wallet — from shared Context */}
                <div style={{ marginTop: '12px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0a1628', border: '1px solid #1e3a5f', textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>MYR Wallet</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#34d399' }}>
                    RM {myrBalance.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>Available balance</div>
                </div>

              </div>
            </div>

            {!initialLoad && (balance?.balance || 0) === 0 && (
              <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#0c1a2e', border: '1px solid #1e3a5f', fontSize: '12px', color: '#60a5fa' }}>
                🚰 Balance is 0 — get free testnet DASH from{' '}
                <a href="https://testnet-faucet.dash.org" target="_blank" rel="noreferrer" style={{ color: '#93c5fd' }}>
                  testnet-faucet.dash.org
                </a>
              </div>
            )}
          </div>

          {/* Sent stat */}
          <StatCard icon={<ArrowUpRight size={18} color="#f97316" />} label="Total Sent" value={`${totalSent.toFixed(4)} DASH`} sub={`${sentTxs.length} transactions`} color="#f97316" />

          {/* Received stat */}
          <StatCard icon={<ArrowDownLeft size={18} color="#10b981" />} label="Total Received" value={`${totalRecv.toFixed(4)} DASH`} sub={`${receivedTxs.length} transactions`} color="#10b981" />

          {/* Risk flagged */}
          <StatCard icon={<AlertTriangle size={18} color="#ef4444" />} label="High Risk Blocked" value={sentTxs.filter((t) => t.riskLevel === 'critical' || t.riskLevel === 'high').length} sub="transactions flagged" color="#ef4444" />
        </div>

        {/* ======== CHARTS ROW ======== */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '28px' }}>
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={sectionTitle}><TrendingUp size={16} style={{ marginRight: '6px' }} />7-Day Activity (DASH)</h3>
            </div>
            {barData.every(d => d.sent === 0 && d.received === 0) ? (
              <EmptyState message="No transactions yet. Send some DASH to see activity!" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }} cursor={{ fill: '#1e293b' }} />
                  <Bar dataKey="sent" name="Sent" fill="#f97316" radius={[4,4,0,0]} />
                  <Bar dataKey="received" name="Received" fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={card}>
            <h3 style={{ ...sectionTitle, marginBottom: '20px' }}><Shield size={16} style={{ marginRight: '6px' }} />Risk Distribution</h3>
            {pieData.length === 0 ? (
              <EmptyState message="Risk data will appear after your first transaction." />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry) => (<Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#475569'} />))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }} />
                  <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ======== RECENT TRANSACTIONS ======== */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={sectionTitle}>Recent Transactions</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={manualRefresh} style={iconBtn} title="Refresh">
                <RefreshCw size={14} color="#64748b" style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              <Link to="/history" style={{ ...smallBtn, textDecoration: 'none' }}>View All</Link>
            </div>
          </div>

          {history.length === 0 ? (
            <EmptyState message="No transactions yet.">
              <Link to="/send" style={{ ...smallBtn, textDecoration: 'none', marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Send size={13} /> Send Your First DASH
              </Link>
            </EmptyState>
          ) : (
            <div>
              {history.slice(0, 8).map((tx) => {
                const isSent = tx.fromAddress === user?.walletAddress;
                return (
                  <div key={tx.id} style={txRow}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: isSent ? '#431407' : '#052e16', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isSent ? <ArrowUpRight size={16} color="#f97316" /> : <ArrowDownLeft size={16} color="#10b981" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{isSent ? 'Sent' : 'Received'}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {isSent ? `→ ${tx.toAddress}` : `← ${tx.fromAddress}`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: isSent ? '#f97316' : '#10b981' }}>
                        {isSent ? '-' : '+'}{tx.amount?.toFixed(4)} DASH
                      </div>
                      {tx.riskLevel && <div style={{ marginTop: '3px' }}><RiskPill level={tx.riskLevel} score={tx.riskScore} /></div>}
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <span style={cardLabel}>{label}</span>
      </div>
      <div style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc' }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{sub}</div>
    </div>
  );
}

function EmptyState({ message, children }) {
  return (
    <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
      <Shield size={32} color="#1e293b" style={{ marginBottom: '12px' }} />
      <div>{message}</div>
      {children}
    </div>
  );
}

function buildBarData(history, myAddress) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ day: d.toLocaleDateString('en', { weekday: 'short' }), date: d.toDateString(), sent: 0, received: 0 });
  }
  history.forEach((tx) => {
    if (!tx.timestamp) return;
    const txDate = new Date(tx.timestamp).toDateString();
    const bucket = days.find((d) => d.date === txDate);
    if (!bucket) return;
    if (tx.fromAddress === myAddress) bucket.sent += tx.amount || 0;
    else bucket.received += tx.amount || 0;
  });
  return days;
}

const card = { backgroundColor: '#0f172a', borderRadius: '14px', border: '1px solid #1e293b', padding: '20px' };
const cardLabel = { fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' };
const sectionTitle = { margin: 0, fontSize: '14px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center' };
const iconBtn = { background: 'none', border: '1px solid #1e293b', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const smallBtn = { backgroundColor: '#1e293b', border: 'none', borderRadius: '6px', padding: '6px 12px', color: '#94a3b8', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' };
const txRow = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #0f172a' };
const errorBanner = { backgroundColor: '#1c0a0a', border: '1px solid #7f1d1d', borderRadius: '8px', padding: '12px 16px', color: '#fca5a5', fontSize: '13px', marginBottom: '20px' };