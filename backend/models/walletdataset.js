// ─── walletDataset.js ──────────────────────────────────────────
// Mock wallet profiles for risk engine demo.
// Each address has a realistic transaction history that drives
// real risk scores — not hardcoded stubs.
//
// Usage: const { getWalletProfile } = require('./walletDataset');
//        const profile = getWalletProfile(address); // returns null if unknown

const walletProfiles = [

  // ── 1. SAFE: Established wallet, moderate activity ─────────────
  {
    address: "yNsWkgPLN1u84oBrigDPQ5NgNYEDxQ9rjS",
    label: "Trusted Merchant",
    new_wallet: false,
    transaction_count: 47,
    total_amount: 320,
    transactions: [
      { txid: "tx001", from: "yNsWk...", to: "yBuyer1...", amount: 12.5,  timestamp: "2025-11-01T09:00:00Z", status: "confirmed" },
      { txid: "tx002", from: "yBuyer2...", to: "yNsWk...", amount: 8.0,   timestamp: "2025-11-05T14:20:00Z", status: "confirmed" },
      { txid: "tx003", from: "yNsWk...", to: "yBuyer3...", amount: 22.0,  timestamp: "2025-11-10T11:10:00Z", status: "confirmed" },
      { txid: "tx004", from: "yBuyer4...", to: "yNsWk...", amount: 15.5,  timestamp: "2025-11-18T08:45:00Z", status: "confirmed" },
      { txid: "tx005", from: "yNsWk...", to: "yBuyer5...", amount: 9.75,  timestamp: "2025-11-25T16:30:00Z", status: "confirmed" },
    ],
    expected_risk: { new_wallet: false, transaction_count: 47, total_amount: 320 },
    // score = 0 → LOW
  },

  // ── 2. SAFE: Personal wallet, small amounts ────────────────────
  {
    address: "yPersonalSafeWallet111111111111111",
    label: "Regular User",
    new_wallet: false,
    transaction_count: 8,
    total_amount: 45,
    transactions: [
      { txid: "tx101", from: "yFriend1...", to: "yPers...", amount: 5.0,  timestamp: "2025-12-01T10:00:00Z", status: "confirmed" },
      { txid: "tx102", from: "yPers...",   to: "yShop1..", amount: 12.0, timestamp: "2025-12-10T13:00:00Z", status: "confirmed" },
      { txid: "tx103", from: "yFriend2...", to: "yPers...", amount: 7.5,  timestamp: "2025-12-15T09:30:00Z", status: "confirmed" },
    ],
    expected_risk: { new_wallet: false, transaction_count: 8, total_amount: 45 },
    // score = 0 → LOW
  },

  // ── 3. MEDIUM: New wallet, suspicious volume ───────────────────
  {
    address: "ySampleSuspiciousAddress1111111111",
    label: "Suspicious New Wallet",
    new_wallet: true,
    transaction_count: 3,
    total_amount: 850,
    transactions: [
      { txid: "tx201", from: "yUnknown1..", to: "ySusp..", amount: 400.0, timestamp: "2026-01-02T01:15:00Z", status: "confirmed" },
      { txid: "tx202", from: "yUnknown2..", to: "ySusp..", amount: 300.0, timestamp: "2026-01-02T02:30:00Z", status: "confirmed" },
      { txid: "tx203", from: "ySusp..",    to: "yUnknown3..", amount: 150.0, timestamp: "2026-01-02T03:00:00Z", status: "broadcast" },
    ],
    expected_risk: { new_wallet: true, transaction_count: 3, total_amount: 850 },
    // score = 1 (new) + 2 (amount>1000 NOT yet, but close) = 1 → MEDIUM
    // Note: tweak total_amount to 1100 if you want HIGH for this profile
  },

  // ── 4. MEDIUM: High tx count, moderate amounts ─────────────────
  {
    address: "yHighFrequencyTrader222222222222222",
    label: "High Frequency Trader",
    new_wallet: false,
    transaction_count: 18,
    total_amount: 620,
    transactions: [
      { txid: "tx301", from: "yHFT...", to: "yExch1..", amount: 45.0,  timestamp: "2026-01-10T08:00:00Z", status: "confirmed" },
      { txid: "tx302", from: "yExch1..", to: "yHFT...", amount: 47.2,  timestamp: "2026-01-10T08:15:00Z", status: "confirmed" },
      { txid: "tx303", from: "yHFT...", to: "yExch2..", amount: 60.0,  timestamp: "2026-01-10T09:00:00Z", status: "confirmed" },
      { txid: "tx304", from: "yExch2..", to: "yHFT...", amount: 61.5,  timestamp: "2026-01-10T09:10:00Z", status: "confirmed" },
      { txid: "tx305", from: "yHFT...", to: "yExch3..", amount: 80.0,  timestamp: "2026-01-10T10:00:00Z", status: "confirmed" },
    ],
    expected_risk: { new_wallet: false, transaction_count: 18, total_amount: 620 },
    // score = 1 (tx_count>10) = 1 → MEDIUM
  },

  // ── 5. HIGH: New wallet + high tx count + large amount ─────────
  {
    address: "yHighRiskBurnerWallet33333333333333",
    label: "Likely Burner Wallet",
    new_wallet: true,
    transaction_count: 14,
    total_amount: 1800,
    transactions: [
      { txid: "tx401", from: "yUnkA..", to: "yBurn..", amount: 500.0, timestamp: "2026-02-01T00:05:00Z", status: "confirmed" },
      { txid: "tx402", from: "yUnkB..", to: "yBurn..", amount: 500.0, timestamp: "2026-02-01T00:10:00Z", status: "confirmed" },
      { txid: "tx403", from: "yUnkC..", to: "yBurn..", amount: 400.0, timestamp: "2026-02-01T00:15:00Z", status: "confirmed" },
      { txid: "tx404", from: "yBurn..", to: "yDark1..", amount: 300.0, timestamp: "2026-02-01T00:30:00Z", status: "broadcast" },
      { txid: "tx405", from: "yBurn..", to: "yDark2..", amount: 100.0, timestamp: "2026-02-01T00:35:00Z", status: "broadcast" },
    ],
    expected_risk: { new_wallet: true, transaction_count: 14, total_amount: 1800 },
    // score = 1 (new) + 1 (tx>10) + 2 (amount>1000) = 4 → HIGH
  },

  // ── 6. HIGH: Old wallet, huge volume ───────────────────────────
  {
    address: "yLargeVolumeOldWallet444444444444444",
    label: "Large Volume Wallet",
    new_wallet: false,
    transaction_count: 22,
    total_amount: 5500,
    transactions: [
      { txid: "tx501", from: "yLV...", to: "yRecip1..", amount: 1000.0, timestamp: "2025-09-01T12:00:00Z", status: "confirmed" },
      { txid: "tx502", from: "yLV...", to: "yRecip2..", amount: 1500.0, timestamp: "2025-10-15T12:00:00Z", status: "confirmed" },
      { txid: "tx503", from: "yLV...", to: "yRecip3..", amount: 2000.0, timestamp: "2025-12-01T12:00:00Z", status: "confirmed" },
      { txid: "tx504", from: "yLV...", to: "yRecip4..", amount: 1000.0, timestamp: "2026-01-10T12:00:00Z", status: "confirmed" },
    ],
    expected_risk: { new_wallet: false, transaction_count: 22, total_amount: 5500 },
    // score = 1 (tx>10) + 2 (amount>1000) = 3 → HIGH (border with MEDIUM)
  },

  // ── 7. CRITICAL: Blacklisted address ───────────────────────────
  {
    address: "yXkHXoFjmQMHZ3J2rkVhiMpnMmNiPkBMzE",
    label: "Known Scam Wallet",
    new_wallet: true,
    transaction_count: 31,
    total_amount: 12400,
    blacklisted: true,
    blacklist_reason: "Reported by 14 users for investment fraud. Linked to known phishing campaign.",
    transactions: [
      { txid: "tx601", from: "yVictim1..", to: "yScam..", amount: 500.0,  timestamp: "2025-08-10T10:00:00Z", status: "confirmed" },
      { txid: "tx602", from: "yVictim2..", to: "yScam..", amount: 1200.0, timestamp: "2025-08-11T14:00:00Z", status: "confirmed" },
      { txid: "tx603", from: "yVictim3..", to: "yScam..", amount: 800.0,  timestamp: "2025-08-12T09:00:00Z", status: "confirmed" },
      { txid: "tx604", from: "yVictim4..", to: "yScam..", amount: 3000.0, timestamp: "2025-08-13T11:00:00Z", status: "confirmed" },
      { txid: "tx605", from: "yScam..",   to: "yMixer1..", amount: 5000.0, timestamp: "2025-08-13T23:59:00Z", status: "confirmed" },
    ],
    expected_risk: { new_wallet: true, transaction_count: 31, total_amount: 12400 },
    // score = 1+1+2 = 4, but FORCED to critical due to blacklist flag
  },

  // ── 8. CRITICAL: Mixer/tumbler wallet ─────────────────────────
  {
    address: "yMixerTumblerCritical555555555555555",
    label: "Suspected Mixer",
    new_wallet: false,
    transaction_count: 200,
    total_amount: 98000,
    blacklisted: true,
    blacklist_reason: "Address matches known coin mixing service pattern. Automated detection.",
    transactions: [
      { txid: "tx701", from: "yRand1..", to: "yMix..", amount: 100.0, timestamp: "2025-06-01T00:01:00Z", status: "confirmed" },
      { txid: "tx702", from: "yRand2..", to: "yMix..", amount: 100.0, timestamp: "2025-06-01T00:02:00Z", status: "confirmed" },
      { txid: "tx703", from: "yMix..",   to: "yRand3..", amount: 99.5, timestamp: "2025-06-01T00:03:00Z", status: "confirmed" },
    ],
    expected_risk: { new_wallet: false, transaction_count: 200, total_amount: 98000 },
    // CRITICAL — blacklisted
  },

];

// ── Lookup function ────────────────────────────────────────────
function getWalletProfile(address) {
  return walletProfiles.find(p => p.address === address) || null;
}

// ── Unknown address: return generic "new wallet" defaults ──────
function getWalletData(address) {
  const profile = getWalletProfile(address);
  if (profile) {
    return {
      new_wallet: profile.new_wallet,
      transaction_count: profile.transaction_count,
      total_amount: profile.total_amount,
      blacklisted: profile.blacklisted || false,
      blacklist_reason: profile.blacklist_reason || null,
      label: profile.label,
    };
  }
  // Unknown wallet → treat as new, no history
  return {
    new_wallet: true,
    transaction_count: 0,
    total_amount: 0,
    blacklisted: false,
    blacklist_reason: null,
    label: "Unknown Wallet",
  };
}

module.exports = { walletProfiles, getWalletProfile, getWalletData };