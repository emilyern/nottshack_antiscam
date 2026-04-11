// =============================================================
// src/pages/Buy.js
// Buy DASH with MYR (simulated) — fetches live price from CoinGecko
// =============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import api from '../api';
import {
  TrendingUp, DollarSign, RefreshCw, CheckCircle, AlertTriangle,
  ChevronRight, Loader
} from 'lucide-react';

const QUICK_AMOUNTS_MYR = [50, 100, 200, 500, 1000];

export default function Buy() {
  const navigate = useNavigate();
  const [myrAmount, setMyrAmount]   = useState('');
  const [dashPrice, setDashPrice]   = useState(null); // price in MYR
  const [dashPriceUSD, setDashPriceUSD] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ---- Fetch live DASH price ----
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
      // fallback price if API fails
      setDashPrice(118.50);
      setDashPriceUSD(25.30);
    } finally {
      setLoadingPrice(false);
    }
  }

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const dashAmount = dashPrice && myrAmount ? (parseFloat(myrAmount) / dashPrice) : 0;

  async function handleBuy() {
    const myr = parseFloat(myrAmount);
    if (!myr || myr <= 0) return setError('Please enter a valid MYR amount.');
    if (myr < 10) return setError('Minimum purchase is RM10.');
    if (myr > 10000) return setError('Maximum purchase is RM10,000 per transaction.');

    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/exchange/buy', {
        myrAmount: myr,
        dashAmount: dashAmount,
        rate: dashPrice,
      });
      setSuccess(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Purchase failed. Please try again.');
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
                Purchase Successful!
              </h2>
              <p style={{ color: '#64748b', marginTop: '6px', fontSize: '14px' }}>
                DASH has been added to your wallet
              </p>
            </div>

            <div style={{ background: '#0f172a', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              {[
                { label: 'You paid',     value: `RM ${parseFloat(myrAmount).toFixed(2)}` },
                { label: 'You received', value: `${success.dashAmount.toFixed(6)} DASH` },
                { label: 'Rate',         value: `RM ${dashPrice?.toFixed(2)} / DASH` },
                { label: 'New balance',  value: `${success.newBalance.toFixed(6)} DASH` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1e293b' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>{label}</span>
                  <span style={{ color: '#f8fafc', fontSize: '13px', fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setSuccess(null); setMyrAmount(''); }} style={btnSecondary}>
                Buy More
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
            Buy DASH
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            Purchase DASH instantly using Malaysian Ringgit
          </p>
        </div>

        {/* Live price card */}
        <div style={{ ...card, marginBottom: '20px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Live DASH Price</div>
              {loadingPrice ? (
                <div style={{ color: '#64748b', fontSize: '14px' }}>Fetching price...</div>
              ) : (
                <>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#3b82f6' }}>
                    RM {dashPrice?.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                    ≈ ${dashPriceUSD?.toFixed(2)} USD
                  </div>
                </>
              )}
            </div>
            <button onClick={fetchPrice} style={{ background: 'none', border: '1px solid #1e293b', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#64748b' }}>
              <RefreshCw size={16} />
            </button>
          </div>
          {lastUpdated && (
            <div style={{ fontSize: '11px', color: '#334155', marginTop: '10px' }}>
              Updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Buy form */}
        <div style={card}>
          {error && (
            <div style={errorBanner}>
              <AlertTriangle size={15} /> {error}
            </div>
          )}

          {/* Quick amount buttons */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Quick Select (MYR)</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {QUICK_AMOUNTS_MYR.map(amt => (
                <button
                  key={amt}
                  onClick={() => { setMyrAmount(String(amt)); setError(''); }}
                  style={{
                    padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                    border: myrAmount === String(amt) ? '2px solid #3b82f6' : '1px solid #1e293b',
                    background: myrAmount === String(amt) ? '#1e3a5f' : '#0f172a',
                    color: myrAmount === String(amt) ? '#60a5fa' : '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  RM {amt}
                </button>
              ))}
            </div>
          </div>

          {/* MYR input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>You Pay (MYR)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                min="10"
                step="1"
                placeholder="0.00"
                value={myrAmount}
                onChange={(e) => { setMyrAmount(e.target.value); setError(''); }}
                style={{ ...inputStyle, fontSize: '20px', fontWeight: 700, paddingRight: '60px' }}
              />
              <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', fontWeight: 600, color: '#64748b' }}>
                MYR
              </span>
            </div>
          </div>

          {/* Arrow */}
          <div style={{ textAlign: 'center', margin: '12px 0', color: '#334155' }}>
            <ChevronRight size={20} style={{ transform: 'rotate(90deg)' }} />
          </div>

          {/* DASH output */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>You Receive (DASH)</label>
            <div style={{
              padding: '16px', borderRadius: '10px', background: '#0f172a',
              border: '1px solid #1e293b', fontSize: '22px', fontWeight: 800,
              color: dashAmount > 0 ? '#10b981' : '#334155',
            }}>
              {dashAmount > 0 ? dashAmount.toFixed(6) : '0.000000'} DASH
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '5px' }}>
              ≈ ${dashAmount > 0 ? (dashAmount * (dashPriceUSD || 0)).toFixed(2) : '0.00'} USD • Fee: 0% (simulated)
            </div>
          </div>

          <button
            onClick={handleBuy}
            disabled={loading || loadingPrice || !myrAmount}
            style={{ ...btnPrimary, width: '100%', opacity: (loading || !myrAmount) ? 0.6 : 1 }}
          >
            {loading
              ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
              : <><TrendingUp size={15} /> Buy {dashAmount > 0 ? dashAmount.toFixed(4) : '0'} DASH</>
            }
          </button>

          <p style={{ fontSize: '11px', color: '#334155', textAlign: 'center', marginTop: '12px' }}>
            🔒 Simulated purchase for demo purposes. Price from CoinGecko.
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
  color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
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