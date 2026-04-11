import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { riskAPI, transactionAPI } from '../api';
import RiskBadge from '../RiskBadge';
import Navbar from '../Navbar';
import {
  Search, Send, ShieldAlert, ShieldX, ShieldCheck,
  AlertTriangle, CheckCircle, Loader, ArrowLeft, Info,
} from 'lucide-react';

const STEP = { ADDRESS: 'address', RISK: 'risk', AMOUNT: 'amount', CONFIRM: 'confirm', RESULT: 'result' };

export default function SendPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step,       setStep]       = useState(STEP.ADDRESS);
  const [toAddress,  setToAddress]  = useState('');
  const [riskReport, setRiskReport] = useState(null);
  const [amount,     setAmount]     = useState('');
  const [note,       setNote]       = useState('');
  // Fixed: starts false, only set true when user explicitly checks the box
  const [bypassRisk, setBypassRisk] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [txResult,   setTxResult]   = useState(null);
  const inputRef = useRef(null);

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!toAddress.trim()) return;
    setLoading(true);
    setError('');
    setRiskReport(null);
    setBypassRisk(false); // reset on each new address
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

  // Fixed: no longer pre-sets bypassRisk — user must explicitly acknowledge
  function handleProceed() {
    setStep(STEP.AMOUNT);
  }

  function handleReview(e) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return setError('Enter a valid amount greater than 0.');
    setError('');
    setStep(STEP.CONFIRM);
  }

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
      setError(err.response?.data?.error || 'Transaction failed. Please try again.');
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

  const isHighRisk = riskReport?.level === 'high' || riskReport?.level === 'critical';
  const isCritical = riskReport?.level === 'critical';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617' }}>
      <Navbar />
      <main style={{ maxWidth: '560px', margin: '0 auto', padding: '28px 24px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          {step !== STEP.ADDRESS && step !== STEP.RESULT && (
            <button onClick={() => setStep(step === STEP.AMOUNT ? STEP.RISK : step === STEP.CONFIRM ? STEP.AMOUNT : STEP.ADDRESS)}
              style={{ ...btnSecondary, padding: '8px' }}>
              <ArrowLeft size={16} />
            </button>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#f8fafc' }}>Send DASH</h1>
            <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '13px' }}>Testnet — no real funds</p>
          </div>
        </div>

        <StepProgress current={step} />

        {error && (
          <div style={errorBanner}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Address */}
        {step === STEP.ADDRESS && (
          <div style={card}>
            <h2 style={cardTitle}><Search size={18} /> Recipient Address</h2>
            <p style={hint}>Enter the Dash address you want to send to.</p>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick test addresses</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { label: '🟢 Safe',       addr: 'yNsWkgPLN1u84oBrigDPQ5NgNYEDxQ9rjS' },
                  { label: '🟡 Medium',      addr: 'ySampleSuspiciousAddress1111111111' },
                  { label: '🔴 High',        addr: 'yHighRiskBurnerWallet33333333333333' },
                  { label: '⛔ Blacklisted', addr: 'yXkHXoFjmQMHZ3J2rkVhiMpnMmNiPkBMzE' },
                ].map(({ label, addr }) => (
                  <button key={addr} onClick={() => setToAddress(addr)}
                    style={{ ...btnSecondary, fontSize: '12px', padding: '6px 10px' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAnalyze}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Dash Address</label>
                <input
                  ref={inputRef}
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  placeholder="yXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '13px' }}
                  required
                />
              </div>
              <button type="submit" disabled={loading || !toAddress.trim()}
                style={{ ...btnPrimary, width: '100%', opacity: loading || !toAddress.trim() ? 0.6 : 1 }}>
                {loading
                  ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</>
                  : <><Search size={15} /> Analyze Address</>}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Risk report */}
        {step === STEP.RISK && riskReport && (
          <div style={card}>
            <h2 style={cardTitle}><ShieldAlert size={18} /> Risk Analysis Report</h2>

            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
              <RiskBadge report={riskReport} size="large" />
            </div>

            <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '11px', color: '#475569', marginBottom: '3px' }}>RECIPIENT ADDRESS</div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#94a3b8', wordBreak: 'break-all' }}>{riskReport.address}</div>
            </div>

            <div style={{
              padding: '12px 14px', borderRadius: '8px', marginBottom: '20px',
              backgroundColor: riskReport.level === 'low' ? '#052e16' : riskReport.level === 'medium' ? '#1c1204' : '#1c0a0a',
              border: `1px solid ${riskReport.level === 'low' ? '#166534' : riskReport.level === 'medium' ? '#92400e' : '#991b1b'}`,
              color: riskReport.level === 'low' ? '#86efac' : riskReport.level === 'medium' ? '#fcd34d' : '#fca5a5',
              fontSize: '13px',
            }}>
              <Info size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              {riskReport.recommendation}
            </div>

            {riskReport.factors?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk Factors</div>
                {riskReport.factors.map((f, i) => (
                  <div key={i} style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #1e293b', marginBottom: '6px', fontSize: '12px', color: '#94a3b8' }}>
                    <span style={{ color: '#f87171', fontWeight: 600, marginRight: '6px' }}>[{f.code}]</span>
                    {f.description}
                  </div>
                ))}
              </div>
            )}

            {/* Fixed: user must explicitly check this box — bypassRisk is NOT pre-set */}
            {isHighRisk && (
              <div style={{ padding: '12px 14px', borderRadius: '8px', marginBottom: '16px', backgroundColor: '#1c0a0a', border: '1px solid #ef4444' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={bypassRisk}
                    onChange={(e) => setBypassRisk(e.target.checked)}
                    style={{ marginTop: '2px', accentColor: '#ef4444' }}
                  />
                  <span style={{ fontSize: '12px', color: '#fca5a5', lineHeight: '1.5' }}>
                    I understand the risks and accept full responsibility for this transaction.
                    {isCritical && <strong> This address is blacklisted and sending is strongly discouraged.</strong>}
                  </span>
                </label>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={reset} style={{ ...btnSecondary, flex: 1 }}>Cancel</button>
              <button
                onClick={handleProceed}
                disabled={isHighRisk && !bypassRisk}
                style={{
                  ...(isHighRisk ? btnDanger : btnPrimary),
                  flex: 1,
                  opacity: isHighRisk && !bypassRisk ? 0.4 : 1,
                  cursor: isHighRisk && !bypassRisk ? 'not-allowed' : 'pointer',
                }}
              >
                {isCritical
                  ? <><ShieldX size={15} /> Proceed Anyway</>
                  : isHighRisk
                  ? <><AlertTriangle size={15} /> Proceed with Caution</>
                  : <><ShieldCheck size={15} /> Proceed</>}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Amount */}
        {step === STEP.AMOUNT && (
          <div style={card}>
            <h2 style={cardTitle}><Send size={18} /> Enter Amount</h2>
            <form onSubmit={handleReview}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Amount (DASH)</label>
                <input
                  type="number" value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00" min="0.0001" step="0.0001"
                  style={inputStyle} required
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Note (optional)</label>
                <input
                  type="text" value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What's this for?"
                  style={inputStyle} maxLength={120}
                />
              </div>
              <button type="submit" style={{ ...btnPrimary, width: '100%' }}>
                Review Transaction →
              </button>
            </form>
          </div>
        )}

        {/* STEP 4: Confirm */}
        {step === STEP.CONFIRM && (
          <div style={card}>
            <h2 style={cardTitle}><CheckCircle size={18} /> Confirm Transaction</h2>
            <div style={{ backgroundColor: '#0f172a', borderRadius: '10px', border: '1px solid #1e293b', overflow: 'hidden', marginBottom: '20px' }}>
              {[
                { label: 'To',     value: toAddress,        truncate: true  },
                { label: 'Amount', value: `${amount} DASH`, truncate: false },
                { label: 'Risk',   value: riskReport?.level?.toUpperCase(), truncate: false },
                ...(note ? [{ label: 'Note', value: note, truncate: false }] : []),
              ].map(({ label, value, truncate }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid #1e293b', gap: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: '12px', color: '#e2e8f0', fontFamily: truncate ? 'monospace' : 'inherit', wordBreak: 'break-all', textAlign: 'right' }}>
                    {truncate && value?.length > 24 ? `${value.slice(0, 12)}...${value.slice(-8)}` : value}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(STEP.AMOUNT)} style={{ ...btnSecondary, flex: 1 }}>Back</button>
              <button onClick={handleSend} disabled={loading} style={{ ...btnPrimary, flex: 1, opacity: loading ? 0.6 : 1 }}>
                {loading
                  ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</>
                  : <><Send size={15} /> Send DASH</>}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Result */}
        {step === STEP.RESULT && txResult && (
          <div style={card}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <CheckCircle size={48} color="#10b981" style={{ marginBottom: '12px' }} />
              <h2 style={{ margin: '0 0 8px', color: '#f8fafc', fontSize: '20px' }}>Transaction Sent!</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Your DASH has been broadcast to the testnet.</p>
            </div>
            <div style={{ backgroundColor: '#0f172a', borderRadius: '10px', border: '1px solid #1e293b', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', flexShrink: 0 }}>TXID</span>
                <span style={{ fontSize: '12px', color: '#e2e8f0', fontFamily: 'monospace', wordBreak: 'break-all', textAlign: 'right' }}>
                  {txResult.txid}
                </span>
              </div>
            </div>
            {txResult.explorerUrl && (
              <a href={txResult.explorerUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#3b82f6', fontSize: '13px', marginBottom: '20px', textDecoration: 'none' }}>
                View on Explorer ↗
              </a>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={reset} style={{ ...btnSecondary, flex: 1 }}>Send Another</button>
              <button onClick={() => navigate('/dashboard')} style={{ ...btnPrimary, flex: 1 }}>Back to Dashboard</button>
            </div>
          </div>
        )}

      </main>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const STEPS_ORDER = [STEP.ADDRESS, STEP.RISK, STEP.AMOUNT, STEP.CONFIRM];
const STEP_LABELS  = { address: '1. Address', risk: '2. Risk Check', amount: '3. Amount', confirm: '4. Confirm' };

function StepProgress({ current }) {
  const idx = STEPS_ORDER.indexOf(current);
  return (
    <div style={{ display: 'flex', marginBottom: '24px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #1e293b' }}>
      {STEPS_ORDER.map((s, i) => {
        const done = i < idx, active = i === idx;
        return (
          <div key={s} style={{
            flex: 1, padding: '8px 4px', textAlign: 'center', fontSize: '11px', fontWeight: 600,
            backgroundColor: active ? '#1e3a5f' : done ? '#0f2a3f' : '#0f172a',
            color: active ? '#60a5fa' : done ? '#3b82f6' : '#475569',
            borderRight: i < 3 ? '1px solid #1e293b' : 'none',
          }}>
            {done ? '✓ ' : ''}{STEP_LABELS[s]}
          </div>
        );
      })}
    </div>
  );
}

const card         = { backgroundColor: '#0f172a', borderRadius: '14px', border: '1px solid #1e293b', padding: '24px' };
const cardTitle    = { margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' };
const hint         = { color: '#64748b', fontSize: '13px', marginTop: '-8px', marginBottom: '20px' };
const labelStyle   = { display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 500, marginBottom: '6px' };
const inputStyle   = { width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
const btnBase      = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '11px 18px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer' };
const btnPrimary   = { ...btnBase, backgroundColor: '#3b82f6', color: '#fff' };
const btnSecondary = { ...btnBase, backgroundColor: 'transparent', border: '1px solid #334155', color: '#94a3b8' };
const btnDanger    = { ...btnBase, backgroundColor: '#7f1d1d', border: '1px solid #ef4444', color: '#fca5a5' };
const errorBanner  = { display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px', backgroundColor: '#450a0a', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '13px' };