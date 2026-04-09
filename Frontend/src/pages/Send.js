// =============================================================
// src/pages/Send.js
// Two-step send flow:
//   Step 1 — Enter recipient address → analyze risk → show report
//   Step 2 — Enter amount → confirm + send (with bypass for high risk)
// =============================================================

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { riskAPI, transactionAPI } from '../api';
import RiskBadge from '../RiskBadge';
import Navbar from '../Navbar';
import {
  Search, Send, ShieldAlert, ShieldX, ShieldCheck,
  AlertTriangle, CheckCircle, XCircle, Loader, ArrowLeft,
  ExternalLink, Info,
} from 'lucide-react';

// Steps in the send flow
const STEP = { ADDRESS: 'address', RISK: 'risk', AMOUNT: 'amount', CONFIRM: 'confirm', RESULT: 'result' };

export default function SendPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step,        setStep]        = useState(STEP.ADDRESS);
  const [toAddress,   setToAddress]   = useState('');
  const [riskReport,  setRiskReport]  = useState(null);
  const [amount,      setAmount]      = useState('');
  const [note,        setNote]        = useState('');
  const [bypassRisk,  setBypassRisk]  = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [txResult,    setTxResult]    = useState(null);
  const inputRef = useRef(null);

  // ---- Step 1: Analyze address risk ----
  async function handleAnalyze(e) {
    e.preventDefault();
    if (!toAddress.trim()) return;
    setLoading(true);
    setError('');
    setRiskReport(null);
    try {
      const { data } = await riskAPI.analyze(toAddress.trim());
      setRiskReport(data);
      setStep(STEP.RISK);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze address. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  // ---- Step 2 → 3: User reviewed risk, proceed to enter amount ----
  function handleProceed() {
    setBypassRisk(riskReport?.level === 'critical' || riskReport?.level === 'high');
    setStep(STEP.AMOUNT);
  }

  // ---- Step 3 → 4: Review before sending ----
  function handleReview(e) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return setError('Enter a valid amount greater than 0.');
    setError('');
    setStep(STEP.CONFIRM);
  }

  // ---- Step 4: Send transaction ----
  async function handleSend() {
    setLoading(true);
    setError('');
    try {
      const { data } = await transactionAPI.send({
        toAddress,
        amount: parseFloat(amount),
        note,
        bypassRisk,
      });
      setTxResult(data);
      setStep(STEP.RESULT);
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.canBypass) {
        setError(`Transaction blocked: ${errData.error}`);
        setStep(STEP.RISK); // send back to risk review
      } else {
        setError(errData?.error || 'Transaction failed.');
      }
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(STEP.ADDRESS);
    setToAddress('');
    setRiskReport(null);
    setAmount('');
    setNote('');
    setBypassRisk(false);
    setError('');
    setTxResult(null);
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617' }}>
      <Navbar />

      <main style={{ maxWidth: '620px', margin: '0 auto', padding: '36px 24px' }}>

        {/* Page title */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#f8fafc' }}>
            Send DASH
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            Every transaction is risk-analyzed before sending.
          </p>
        </div>

        {/* Progress indicator */}
        {step !== STEP.RESULT && <StepProgress current={step} />}

        {/* Error banner */}
        {error && (
          <div style={errorBanner}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        {/* ====================== STEP 1: Address input ====================== */}
        {step === STEP.ADDRESS && (
          <div style={card}>
            <h2 style={cardTitle}>
              <Search size={18} /> Recipient Address
            </h2>
            <p style={hint}>Enter the Dash wallet address you want to send to. We will check it for fraud signals before proceeding.</p>

            <form onSubmit={handleAnalyze}>
              <label style={labelStyle}>Dash Wallet Address</label>
              <textarea
                ref={inputRef}
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                placeholder="yXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                rows={2}
                style={{ ...inputStyle, fontFamily: 'monospace', resize: 'none', fontSize: '13px' }}
                required
              />

              {/* Quick test addresses */}
              <div style={{ marginTop: '8px', marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: '#475569', marginBottom: '6px' }}>Quick test addresses:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    { label: '✅ Safe', addr: 'yNsWkgPLN1u84oBrigDPQ5NgNYEDxQ9rjS' },
                    { label: '⚠️ Medium', addr: 'ySampleSuspiciousAddress1111111111' },
                    { label: '🚨 Blacklisted', addr: 'yXkHXoFjmQMHZ3J2rkVhiMpnMmNiPkBMzE' },
                  ].map(({ label, addr }) => (
                    <button key={addr} type="button"
                      onClick={() => setToAddress(addr)}
                      style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#94a3b8', fontSize: '11px', cursor: 'pointer' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading || !toAddress.trim()} style={btnPrimary}>
                {loading ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</> : <><Search size={15} /> Analyze Address</>}
              </button>
            </form>
          </div>
        )}

        {/* ====================== STEP 2: Risk report ====================== */}
        {step === STEP.RISK && riskReport && (
          <div style={card}>
            <h2 style={cardTitle}><ShieldAlert size={18} /> Risk Analysis Report</h2>

            {/* Big risk badge */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
              <RiskBadge report={riskReport} size="large" />
            </div>

            {/* Address */}
            <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '11px', color: '#475569', marginBottom: '3px' }}>RECIPIENT ADDRESS</div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#94a3b8', wordBreak: 'break-all' }}>{riskReport.address}</div>
            </div>

            {/* Recommendation */}
            <div style={{
              padding: '12px 14px', borderRadius: '8px', marginBottom: '20px',
              backgroundColor: riskReport.level === 'low' ? '#052e16' : riskReport.level === 'medium' ? '#1c1204' : '#1c0a0a',
              border: `1px solid ${riskReport.level === 'low' ? '#166534' : riskReport.level === 'medium' ? '#92400e' : '#991b1b'}`,
              color: riskReport.level === 'low' ? '#86efac' : riskReport.level === 'medium' ? '#fde68a' : '#fca5a5',
              fontSize: '13px',
            }}>
              {riskReport.recommendation}
            </div>

            {/* Risk factors list */}
            {riskReport.factors?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Risk Factors Detected ({riskReport.factors.length})
                </div>
                {riskReport.factors.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px', borderRadius: '8px', marginBottom: '6px', backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                    <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>{f.code}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{f.description}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 700, color: '#f97316' }}>+{f.weight}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(STEP.ADDRESS)} style={btnSecondary}>
                <ArrowLeft size={14} /> Change Address
              </button>

              {riskReport.level === 'critical' ? (
                <button
                  onClick={handleProceed}
                  style={{ ...btnDanger, flex: 1 }}
                >
                  <ShieldX size={14} /> I Understand the Risk — Proceed Anyway
                </button>
              ) : (
                <button onClick={handleProceed} style={{ ...btnPrimary, flex: 1 }}>
                  {riskReport.level === 'low'
                    ? <><ShieldCheck size={14} /> Looks Good — Continue</>
                    : <><ShieldAlert size={14} /> Accept Risk & Continue</>
                  }
                </button>
              )}
            </div>
          </div>
        )}

        {/* ====================== STEP 3: Amount input ====================== */}
        {step === STEP.AMOUNT && (
          <div style={card}>
            <h2 style={cardTitle}><Send size={18} /> Enter Amount</h2>

            {/* Compact risk reminder */}
            {riskReport && (
              <div style={{ marginBottom: '20px' }}>
                <RiskBadge report={riskReport} size="normal" />
              </div>
            )}

            <form onSubmit={handleReview}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Amount (DASH)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number" min="0.0001" step="0.0001"
                    placeholder="0.0000"
                    value={amount} onChange={(e) => { setAmount(e.target.value); setError(''); }}
                    required
                    style={{ ...inputStyle, fontSize: '20px', fontWeight: 700, paddingRight: '60px' }}
                  />
                  <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', fontWeight: 600, color: '#64748b' }}>
                    DASH
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '5px' }}>
                  ≈ Fee: 0.0001 DASH  •  Testnet funds only
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Note (optional)</label>
                <input
                  type="text" placeholder="What's this payment for?"
                  value={note} onChange={(e) => setNote(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setStep(STEP.RISK)} style={btnSecondary}>
                  <ArrowLeft size={14} /> Back
                </button>
                <button type="submit" style={{ ...btnPrimary, flex: 1 }}>
                  Review Transaction →
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ====================== STEP 4: Confirm ====================== */}
        {step === STEP.CONFIRM && (
          <div style={card}>
            <h2 style={cardTitle}><Info size={18} /> Confirm Transaction</h2>

            <div style={{ marginBottom: '20px' }}>
              {[
                { label: 'From',      value: user?.walletAddress, mono: true },
                { label: 'To',        value: toAddress, mono: true },
                { label: 'Amount',    value: `${parseFloat(amount).toFixed(4)} DASH` },
                { label: 'Fee',       value: '0.0001 DASH (estimated)' },
                { label: 'Note',      value: note || '—' },
                { label: 'Risk Level', value: `${riskReport?.level?.toUpperCase()} (${riskReport?.score}/10)` },
              ].map(({ label, value, mono }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1e293b', gap: '16px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: '13px', color: '#e2e8f0', fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all', textAlign: 'right' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {(riskReport?.level === 'critical' || riskReport?.level === 'high') && (
              <div style={{ ...errorBanner, marginBottom: '16px' }}>
                <AlertTriangle size={16} /> You are sending to a HIGH RISK address. Confirm you accept all responsibility.
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(STEP.AMOUNT)} style={btnSecondary} disabled={loading}>
                <ArrowLeft size={14} /> Edit
              </button>
              <button onClick={handleSend} style={{ ...btnPrimary, flex: 1 }} disabled={loading}>
                {loading
                  ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Broadcasting...</>
                  : <><Send size={15} /> Send {parseFloat(amount).toFixed(4)} DASH</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ====================== STEP 5: Result ====================== */}
        {step === STEP.RESULT && txResult && (
          <div style={card}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <CheckCircle size={48} color="#10b981" style={{ marginBottom: '12px' }} />
              <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '20px' }}>Transaction Broadcast!</h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>
                Your transaction has been sent to the Dash testnet.
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              {[
                { label: 'TXID',    value: txResult.txid, mono: true, truncate: true },
                { label: 'Amount',  value: `${parseFloat(amount).toFixed(4)} DASH` },
                { label: 'To',      value: toAddress, mono: true },
                { label: 'Status',  value: 'Broadcast (pending confirmation)' },
                { label: 'Risk',    value: `${riskReport?.level?.toUpperCase()} (${riskReport?.score}/10)` },
              ].map(({ label, value, mono, truncate }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1e293b', gap: '16px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: '12px', color: '#e2e8f0', fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all', textAlign: 'right' }}>
                    {truncate && value?.length > 24 ? `${value.slice(0, 12)}...${value.slice(-8)}` : value}
                  </span>
                </div>
              ))}
            </div>

            {txResult.explorerUrl && (
              <a href={txResult.explorerUrl} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', color: '#60a5fa', fontSize: '13px', textDecoration: 'none', marginBottom: '20px' }}>
                <ExternalLink size={14} /> View on Testnet Explorer
              </a>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={reset} style={{ ...btnSecondary, flex: 1 }}>
                Send Another
              </button>
              <button onClick={() => navigate('/dashboard')} style={{ ...btnPrimary, flex: 1 }}>
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ---- Progress bar ----
const STEPS_ORDER = [STEP.ADDRESS, STEP.RISK, STEP.AMOUNT, STEP.CONFIRM];
const STEP_LABELS  = { address: '1. Address', risk: '2. Risk Check', amount: '3. Amount', confirm: '4. Confirm' };

function StepProgress({ current }) {
  const idx = STEPS_ORDER.indexOf(current);
  return (
    <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #1e293b' }}>
      {STEPS_ORDER.map((s, i) => {
        const done   = i < idx;
        const active = i === idx;
        return (
          <div key={s} style={{
            flex: 1, padding: '8px 4px', textAlign: 'center',
            fontSize: '11px', fontWeight: 600,
            backgroundColor: active ? '#1e3a5f' : done ? '#0f2a3f' : '#0f172a',
            color: active ? '#60a5fa' : done ? '#3b82f6' : '#475569',
            borderRight: i < 3 ? '1px solid #1e293b' : 'none',
            transition: 'all 0.2s',
          }}>
            {done ? '✓ ' : ''}{STEP_LABELS[s]}
          </div>
        );
      })}
    </div>
  );
}

// ---- Shared styles ----
const card = {
  backgroundColor: '#0f172a', borderRadius: '14px',
  border: '1px solid #1e293b', padding: '24px',
};
const cardTitle = {
  margin: '0 0 16px', fontSize: '16px', fontWeight: 700,
  color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px',
};
const hint = { color: '#64748b', fontSize: '13px', marginTop: '-8px', marginBottom: '20px' };
const labelStyle = { display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 500, marginBottom: '6px' };
const inputStyle = {
  width: '100%', padding: '11px 14px',
  borderRadius: '8px', border: '1px solid #334155',
  backgroundColor: '#1e293b', color: '#f8fafc',
  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
};
const btnBase = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  padding: '11px 18px', borderRadius: '8px', border: 'none',
  fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'opacity 0.15s',
};
const btnPrimary  = { ...btnBase, backgroundColor: '#3b82f6', color: '#fff' };
const btnSecondary = { ...btnBase, backgroundColor: 'transparent', border: '1px solid #334155', color: '#94a3b8' };
const btnDanger   = { ...btnBase, backgroundColor: '#7f1d1d', border: '1px solid #ef4444', color: '#fca5a5' };
const errorBanner = {
  display: 'flex', alignItems: 'flex-start', gap: '8px',
  padding: '12px 14px', borderRadius: '8px', marginBottom: '16px',
  backgroundColor: '#450a0a', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '13px',
};