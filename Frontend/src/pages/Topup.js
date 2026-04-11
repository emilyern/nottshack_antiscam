// =============================================================
// src/pages/TopUp.js
// Simulate topping up MYR balance via FPX
// =============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import api from '../api';
import { CheckCircle, AlertTriangle, Loader, Building2 } from 'lucide-react';

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

const BANKS = [
  { id: 'maybank', name: 'Maybank2u', color: '#FFD700' },
  { id: 'cimb',    name: 'CIMB Clicks', color: '#c00' },
  { id: 'rhb',     name: 'RHB Now', color: '#1a5276' },
  { id: 'hlb',     name: 'Hong Leong', color: '#1a7a4a' },
  { id: 'public',  name: 'Public Bank', color: '#1a3c8f' },
  { id: 'ambank',  name: 'AmBank', color: '#e87722' },
];

export default function TopUp() {
  const navigate = useNavigate();
  const [amount, setAmount]       = useState('');
  const [bank, setBank]           = useState(null);
  const [step, setStep]           = useState('form'); // form | processing | success
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [result, setResult]       = useState(null);

  async function handleTopUp() {
    const myr = parseFloat(amount);
    if (!myr || myr <= 0) return setError('Please enter a valid amount.');
    if (myr < 10)         return setError('Minimum top up is RM10.');
    if (myr > 10000)      return setError('Maximum top up is RM10,000.');
    if (!bank)            return setError('Please select a bank.');

    setLoading(true);
    setError('');
    setStep('processing');

    // Simulate bank processing delay
    await new Promise(r => setTimeout(r, 2000));

    try {
      const { data } = await api.post('/exchange/topup', { myrAmount: myr });
      setResult(data);
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.error || 'Top up failed.');
      setStep('form');
    } finally {
      setLoading(false);
    }
  }

  // ---- Processing screen ----
  if (step === 'processing') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#020617' }}>
        <Navbar />
        <main style={{ maxWidth: '480px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <Loader size={48} color="#3b82f6" style={{ animation: 'spin 1s linear infinite', marginBottom: '20px' }} />
          <h2 style={{ color: '#f8fafc', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
            Processing Payment...
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Connecting to {BANKS.find(b => b.id === bank)?.name}
          </p>
          <p style={{ color: '#334155', fontSize: '12px', marginTop: '8px' }}>
            Please do not close this page
          </p>
        </main>
      </div>
    );
  }

  // ---- Success screen ----
  if (step === 'success') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#020617' }}>
        <Navbar />
        <main style={{ maxWidth: '480px', margin: '0 auto', padding: '36px 24px' }}>
          <div style={card}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <CheckCircle size={56} color="#10b981" style={{ marginBottom: '14px' }} />
              <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '22px', fontWeight: 800 }}>
                Top Up Successful!
              </h2>
              <p style={{ color: '#64748b', marginTop: '6px', fontSize: '14px' }}>
                Your MYR balance has been updated
              </p>
            </div>

            <div style={{ background: '#020617', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              {[
                { label: 'Amount Added',   value: `RM ${parseFloat(amount).toFixed(2)}` },
                { label: 'Bank',           value: BANKS.find(b => b.id === bank)?.name },
                { label: 'New MYR Balance',value: `RM ${result?.newMyrBalance?.toFixed(2)}` },
                { label: 'Status',         value: '✅ Completed' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1e293b' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>{label}</span>
                  <span style={{ color: '#f8fafc', fontSize: '13px', fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setStep('form'); setAmount(''); setBank(null); }} style={btnSecondary}>
                Top Up More
              </button>
              <button onClick={() => navigate('/buy')} style={{ ...btnPrimary, flex: 1 }}>
                Buy DASH Now →
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ---- Main form ----
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617' }}>
      <Navbar />
      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '36px 24px' }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#f8fafc' }}>
            Top Up MYR
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            Add Malaysian Ringgit to your wallet via FPX
          </p>
        </div>

        <div style={card}>
          {error && (
            <div style={errorBanner}>
              <AlertTriangle size={15} /> {error}
            </div>
          )}

          {/* Quick amounts */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Select Amount (MYR)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
              {QUICK_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  onClick={() => { setAmount(String(amt)); setError(''); }}
                  style={{
                    padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                    border: amount === String(amt) ? '2px solid #3b82f6' : '1px solid #1e293b',
                    background: amount === String(amt) ? '#1e3a5f' : '#020617',
                    color: amount === String(amt) ? '#60a5fa' : '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  RM {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Or Enter Custom Amount</label>
            <div style={{ position: 'relative', marginTop: '8px' }}>
              <input
                type="number" min="10" max="10000" step="1"
                placeholder="0.00"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(''); }}
                style={{ ...inputStyle, paddingRight: '55px', fontSize: '18px', fontWeight: 700 }}
              />
              <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 600 }}>
                MYR
              </span>
            </div>
          </div>

          {/* Bank selection */}
          <div style={{ marginBottom: '28px' }}>
            <label style={labelStyle}>Select Bank (FPX)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
              {BANKS.map(b => (
                <button
                  key={b.id}
                  onClick={() => { setBank(b.id); setError(''); }}
                  style={{
                    padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '8px',
                    border: bank === b.id ? `2px solid ${b.color}` : '1px solid #1e293b',
                    background: bank === b.id ? '#0f172a' : '#020617',
                    color: bank === b.id ? '#f8fafc' : '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  <Building2 size={14} color={bank === b.id ? b.color : '#334155'} />
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleTopUp}
            disabled={loading || !amount || !bank}
            style={{ ...btnPrimary, width: '100%', opacity: (!amount || !bank) ? 0.5 : 1 }}
          >
            {loading
              ? <><Loader size={15} /> Processing...</>
              : <>Pay RM {amount || '0.00'} via FPX</>
            }
          </button>

          <p style={{ fontSize: '11px', color: '#334155', textAlign: 'center', marginTop: '12px' }}>
            🔒 Simulated FPX payment for demo purposes
          </p>
        </div>
      </main>
    </div>
  );
}

const card = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' };
const inputStyle = { width: '100%', padding: '14px', borderRadius: '10px', background: '#020617', border: '1px solid #1e293b', color: '#f8fafc', fontSize: '15px', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };
const btnPrimary = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '15px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer' };
const btnSecondary = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px 20px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', background: 'transparent', color: '#94a3b8', border: '1px solid #1e293b', cursor: 'pointer' };
const errorBanner = { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px', background: '#450a0a', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '14px' };