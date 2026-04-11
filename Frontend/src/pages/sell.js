// =============================================================
// src/pages/Sell.js
// Sell DASH to get MYR (simulated) — fetches live price from CoinGecko
// =============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import api, { walletAPI } from '../api';
import {
  TrendingDown, RefreshCw, CheckCircle, AlertTriangle,
  ChevronRight, Loader, Wallet
} from 'lucide-react';

export default function Sell() {
  const navigate = useNavigate();
  const [dashAmount, setDashAmount] = useState('');
  const [dashPrice, setDashPrice]   = useState(null);
  const [dashPriceUSD, setDashPriceUSD] = useState(null);
  const [balance, setBalance]       = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function fetchPrice() {
    setLoadingPrice(true);
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=dash&vs_currencies=myr,usd'
      );
      const data = await res.json();
      setDashPrice(data.dash.myr);
      setDashPriceUSD(data.dash.usd);
      setLastUpdated(new Date());
    } catch {
      setDashPrice(118.50);
      setDashPriceUSD(25.30);
    } finally {
      setLoadingPrice(false);
    }
  }

  async function fetchBalance() {
    try {
      const { data } = await walletAPI.getBalance();
      setBalance(data.balance ?? 0);
    } catch {
      setBalance(0);
    }
  }

  useEffect(() => {
    fetchPrice();
    fetchBalance();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  const myrAmount = dashPrice && dashAmount ? (parseFloat(dashAmount) * dashPrice) : 0;
  const usdAmount = dashPriceUSD && dashAmount ? (parseFloat(dashAmount) * dashPriceUSD) : 0;

  function handleSetMax() {
    if (balance !== null) setDashAmount(balance.toFixed(6));
  }

  async function handleSell() {
    const dash = parseFloat(dashAmount);
    if (!dash || dash <= 0) return setError('Please enter a valid DASH amount.');
    if (dash > balance) return setError('Insufficient DASH balance.');
    if (dash < 0.001) return setError('Minimum sell amount is 0.001 DASH.');

    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/exchange/sell', {
        dashAmount: dash,
        myrAmount: myrAmount,
        rate: dashPrice,
      });
      setSuccess(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Sale failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#020617' }}>
        <Navbar />
        <main style={{ maxWidth: '520px', margin: '0 auto', padding: '36px 24px' }}>
          <div style={card}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <CheckCircle size={56} color="#10b981" style={{ marginBottom: '14px' }} />
              <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '22px', fontWeight: 800 }}>
                Sale Successful!
              </h2>
              <p style={{ color: '#64748b', marginTop: '6px', fontSize: '14px' }}>
                Your MYR is ready for withdrawal
              </p>
            </div>

            <div style={{ background: '#0f172a', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              {[
                { label: 'You sold',       value: `${parseFloat(dashAmount).toFixed(6)} DASH` },
                { label: 'You received',   value: `RM ${myrAmount.toFixed(2)}` },
                { label: 'Rate',           value: `RM ${dashPrice?.toFixed(2)} / DASH` },
                { label: 'Remaining DASH', value: `${success.newBalance.toFixed(6)} DASH` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1e293b' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>{label}</span>
                  <span style={{ color: '#f8fafc', fontSize: '13px', fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setSuccess(null); setDashAmount(''); fetchBalance(); }} style={btnSecondary}>
                Sell More
              </button>
              <button onClick={() => navigate('/dashboard')} style={{ ...btnPrimary, flex: 1 }}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617' }}>
      <Navbar />
      <main style={{ maxWidth: '520px', margin: '0 auto', padding: '36px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#f8fafc' }}>
            Sell DASH
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            Convert your DASH to Malaysian Ringgit instantly
          </p>
        </div>

        {/* Balance + price row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div style={card}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Balance
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
              {balance !== null ? balance.toFixed(4) : '—'} DASH
            </div>
            {balance !== null && dashPrice && (
              <div style={{ fontSize: '12px', color: '#10b981', marginTop: '2px' }}>
                ≈ RM {(balance * dashPrice).toFixed(2)}
              </div>
            )}
          </div>
          <div style={{ ...card, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  DASH Price
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#3b82f6' }}>
                  {loadingPrice ? '...' : `RM ${dashPrice?.toFixed(2)}`}
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                  ${dashPriceUSD?.toFixed(2)} USD
                </div>
              </div>
              <button onClick={fetchPrice} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '2px' }}>
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Sell form */}
        <div style={card}>
          {error && (
            <div style={errorBanner}>
              <AlertTriangle size={15} /> {error}
            </div>
          )}

          {/* DASH input */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={labelStyle}>You Sell (DASH)</label>
              <button onClick={handleSetMax} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: '12px', fontWeight: 600 }}>
                MAX
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                min="0.001"
                step="0.0001"
                placeholder="0.0000"
                value={dashAmount}
                onChange={(e) => { setDashAmount(e.target.value); setError(''); }}
                style={{ ...inputStyle, fontSize: '20px', fontWeight: 700, paddingRight: '65px' }}
              />
              <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', fontWeight: 600, color: '#64748b' }}>
                DASH
              </span>
            </div>
          </div>

          {/* Arrow */}
          <div style={{ textAlign: 'center', margin: '12px 0', color: '#334155' }}>
            <ChevronRight size={20} style={{ transform: 'rotate(90deg)' }} />
          </div>

          {/* MYR output */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>You Receive (MYR)</label>
            <div style={{
              padding: '16px', borderRadius: '10px', background: '#0f172a',
              border: '1px solid #1e293b', fontSize: '22px', fontWeight: 800,
              color: myrAmount > 0 ? '#10b981' : '#334155',
            }}>
              RM {myrAmount > 0 ? myrAmount.toFixed(2) : '0.00'}
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '5px' }}>
              ≈ ${usdAmount > 0 ? usdAmount.toFixed(2) : '0.00'} USD • Fee: 0% (simulated)
            </div>
          </div>

          <button
            onClick={handleSell}
            disabled={loading || loadingPrice || !dashAmount}
            style={{ ...btnPrimary, width: '100%', background: '#0f766e', opacity: (loading || !dashAmount) ? 0.6 : 1 }}
          >
            {loading
              ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
              : <><TrendingDown size={15} /> Sell {dashAmount ? parseFloat(dashAmount).toFixed(4) : '0'} DASH for RM {myrAmount.toFixed(2)}</>
            }
          </button>

          <p style={{ fontSize: '11px', color: '#334155', textAlign: 'center', marginTop: '12px' }}>
            🔒 Simulated sale for demo purposes. Price from CoinGecko.
          </p>
        </div>
      </main>
    </div>
  );
}

// ---- Styles ----
const card = {
  background: '#0f172a', border: '1px solid #1e293b',
  borderRadius: '16px', padding: '24px',
};
const inputStyle = {
  width: '100%', padding: '14px', borderRadius: '10px',
  background: '#020617', border: '1px solid #1e293b',
  color: '#f8fafc', fontSize: '15px', outline: 'none',
  boxSizing: 'border-box',
};
const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: 600,
  color: '#64748b', marginBottom: '0', textTransform: 'uppercase', letterSpacing: '0.05em',
};
const btnPrimary = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  padding: '14px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '15px',
  background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer',
};
const btnSecondary = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  padding: '14px 20px', borderRadius: '10px', fontWeight: 600, fontSize: '14px',
  background: 'transparent', color: '#94a3b8', border: '1px solid #1e293b', cursor: 'pointer',
};
const errorBanner = {
  display: 'flex', alignItems: 'center', gap: '8px',
  padding: '12px 14px', borderRadius: '8px', marginBottom: '16px',
  background: '#450a0a', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '14px',
};