// models/walletdataset.js
//
// Timestamps are generated relative to "now" at runtime so that
// velocity windows (24h, 7d, 30d) in riskEngine.js always work
// correctly regardless of when the server is started.

const now = new Date();
const hoursAgo = (h)  => new Date(now.getTime() - h  * 60 * 60 * 1000).toISOString();
const daysAgo  = (d)  => hoursAgo(d * 24);

const walletProfiles = [

  // ── 1. LOW: Established merchant ──────────────────────────────
  // Many small transactions spread over months.
  // Nothing in 24h, nothing in 7d, low amounts in 30d.
  // Expected: score=0, level=low
  {
    address: "yNsWkgPLN1u84oBrigDPQ5NgNYEDxQ9rjS",
    label: "Trusted Merchant",
    transaction_count: 47,
    total_amount: 320,
    transactions: [
      { txid: "tx001", from: "yBuyer1..", to: "yNsWk..", amount: 12.5, timestamp: daysAgo(60),  status: "confirmed" },
      { txid: "tx002", from: "yBuyer2..", to: "yNsWk..", amount: 8.0,  timestamp: daysAgo(45),  status: "confirmed" },
      { txid: "tx003", from: "yNsWk..",  to: "yBuyer3..", amount: 22.0, timestamp: daysAgo(30), status: "confirmed" },
      { txid: "tx004", from: "yBuyer4..", to: "yNsWk..", amount: 15.5, timestamp: daysAgo(20),  status: "confirmed" },
      { txid: "tx005", from: "yNsWk..",  to: "yBuyer5..", amount: 9.75, timestamp: daysAgo(10), status: "confirmed" },
    ],
  },

  // ── 2. LOW: Regular personal wallet ───────────────────────────
  // Small amounts, infrequent, spread over weeks.
  // Expected: score=0, level=low
  {
    address: "yPersonalSafeWallet111111111111111",
    label: "Regular User",
    transaction_count: 8,
    total_amount: 45,
    transactions: [
      { txid: "tx101", from: "yFriend1..", to: "yPers..", amount: 5.0,  timestamp: daysAgo(40), status: "confirmed" },
      { txid: "tx102", from: "yPers..",   to: "yShop1..", amount: 12.0, timestamp: daysAgo(25), status: "confirmed" },
      { txid: "tx103", from: "yFriend2..", to: "yPers..", amount: 7.5,  timestamp: daysAgo(12), status: "confirmed" },
    ],
  },

  // ── 3. MEDIUM: Brand new wallet, no history ───────────────────
  // No transactions at all → NEW_WALLET signal.
  // Expected: score=1, level=medium
  {
    address: "ySampleSuspiciousAddress1111111111",
    label: "Suspicious New Wallet",
    transaction_count: 0,
    total_amount: 0,
    transactions: [],
  },

  // ── 4. MEDIUM: Moderate recent activity, not alarming ─────────
  // A few transactions in the last 7 days, modest amounts.
  // Expected: score=2, level=medium (ELEVATED_VELOCITY_7D)
  {
    address: "yHighFrequencyTrader222222222222222",
    label: "Moderate Recent Trader",
    transaction_count: 18,
    total_amount: 620,
    transactions: [
      { txid: "tx301", from: "yHFT..", to: "yExch1..", amount: 45.0,  timestamp: daysAgo(6),  status: "confirmed" },
      { txid: "tx302", from: "yExch1..", to: "yHFT..", amount: 200.0, timestamp: daysAgo(5),  status: "confirmed" },
      { txid: "tx303", from: "yHFT..", to: "yExch2..", amount: 60.0,  timestamp: daysAgo(4),  status: "confirmed" },
      { txid: "tx304", from: "yExch2..", to: "yHFT..", amount: 310.0, timestamp: daysAgo(3),  status: "confirmed" },
      { txid: "tx305", from: "yHFT..", to: "yExch3..", amount: 80.0,  timestamp: daysAgo(2),  status: "confirmed" },
    ],
  },

  // ── 5. HIGH: Burner wallet — large amounts in a few hours ─────
  // Classic one-time scammer: receives large sums rapidly then
  // forwards them out. All activity within the last 24 hours.
  // Expected: score=4, level=high (VELOCITY_SPIKE_24H)
  {
    address: "yHighRiskBurnerWallet33333333333333",
    label: "Likely Burner Wallet",
    transaction_count: 5,
    total_amount: 1800,
    transactions: [
      { txid: "tx401", from: "yUnkA..", to: "yBurn..", amount: 500.0, timestamp: hoursAgo(5),  status: "confirmed" },
      { txid: "tx402", from: "yUnkB..", to: "yBurn..", amount: 500.0, timestamp: hoursAgo(4),  status: "confirmed" },
      { txid: "tx403", from: "yUnkC..", to: "yBurn..", amount: 400.0, timestamp: hoursAgo(3),  status: "confirmed" },
      { txid: "tx404", from: "yBurn..", to: "yDark1..", amount: 300.0, timestamp: hoursAgo(2), status: "broadcast" },
      { txid: "tx405", from: "yBurn..", to: "yDark2..", amount: 100.0, timestamp: hoursAgo(1), status: "broadcast" },
    ],
  },

  // ── 6. HIGH: Sustained high volume over last week ─────────────
  // Not a single spike but consistently large transactions over 7d.
  // Expected: score=3, level=high (VELOCITY_SPIKE_7D)
  {
    address: "yLargeVolumeOldWallet444444444444444",
    label: "Large Volume Wallet",
    transaction_count: 22,
    total_amount: 5500,
    transactions: [
      { txid: "tx501", from: "yLV..", to: "yRecip1..", amount: 1000.0, timestamp: daysAgo(6), status: "confirmed" },
      { txid: "tx502", from: "yLV..", to: "yRecip2..", amount: 1500.0, timestamp: daysAgo(5), status: "confirmed" },
      { txid: "tx503", from: "yLV..", to: "yRecip3..", amount: 800.0,  timestamp: daysAgo(4), status: "confirmed" },
      { txid: "tx504", from: "yLV..", to: "yRecip4..", amount: 600.0,  timestamp: daysAgo(3), status: "confirmed" },
      { txid: "tx505", from: "yLV..", to: "yRecip5..", amount: 900.0,  timestamp: daysAgo(2), status: "confirmed" },
      { txid: "tx506", from: "yLV..", to: "yRecip6..", amount: 400.0,  timestamp: daysAgo(1), status: "confirmed" },
      { txid: "tx507", from: "yLV..", to: "yRecip7..", amount: 300.0,  timestamp: hoursAgo(6), status: "confirmed" },
    ],
  },

  // ── 7. CRITICAL: Known scam wallet — blacklisted ──────────────
  // Victims were drained over a few days last week.
  // Would also score HIGH from velocity even without blacklist.
  // Expected: forced critical (blacklisted)
  {
    address: "yXkHXoFjmQMHZ3J2rkVhiMpnMmNiPkBMzE",
    label: "Known Scam Wallet",
    transaction_count: 31,
    total_amount: 12400,
    blacklisted: true,
    blacklist_reason: "Reported by 14 users for investment fraud. Linked to known phishing campaign.",
    transactions: [
      { txid: "tx601", from: "yVictim1..", to: "yScam..", amount: 500.0,  timestamp: daysAgo(6),  status: "confirmed" },
      { txid: "tx602", from: "yVictim2..", to: "yScam..", amount: 1200.0, timestamp: daysAgo(5),  status: "confirmed" },
      { txid: "tx603", from: "yVictim3..", to: "yScam..", amount: 800.0,  timestamp: daysAgo(4),  status: "confirmed" },
      { txid: "tx604", from: "yVictim4..", to: "yScam..", amount: 3000.0, timestamp: daysAgo(3),  status: "confirmed" },
      { txid: "tx605", from: "yScam..",   to: "yMixer1..", amount: 5000.0, timestamp: daysAgo(3), status: "confirmed" },
    ],
  },

  // ── 8. CRITICAL: Mixer/tumbler — blacklisted ──────────────────
  // Enormous volume, very high frequency, all within last 24 hours.
  // Would score critical even without the blacklist.
  // Expected: forced critical (blacklisted), and score=8 independently
  {
    address: "yMixerTumblerCritical555555555555555",
    label: "Suspected Mixer",
    transaction_count: 200,
    total_amount: 98000,
    blacklisted: true,
    blacklist_reason: "Address matches known coin mixing service pattern. Automated detection.",
    transactions: [
      // 20 transactions in the last 10 hours — rapid cycling of large amounts
      ...Array.from({ length: 20 }, (_, i) => ({
        txid:      `tx7${String(i).padStart(2, "0")}`,
        from:      i % 2 === 0 ? `yRand${i}..` : "yMix..",
        to:        i % 2 === 0 ? "yMix.."      : `yRand${i}..`,
        amount:    490,
        timestamp: hoursAgo(i * 0.5),
        status:    "confirmed",
      })),
    ],
  },
];

function getWalletProfile(address) {
  return walletProfiles.find(p => p.address === address) || null;
}

function getWalletData(address) {
  const profile = getWalletProfile(address);
  if (profile) {
    return {
      transaction_count: profile.transaction_count,
      total_amount:      profile.total_amount,
      blacklisted:       profile.blacklisted       || false,
      blacklist_reason:  profile.blacklist_reason  || null,
      label:             profile.label,
      transactions:      profile.transactions      || [],
    };
  }
  // Unknown wallet — no history at all
  return {
    transaction_count: 0,
    total_amount:      0,
    blacklisted:       false,
    blacklist_reason:  null,
    label:             "Unknown Wallet",
    transactions:      [],
  };
}

module.exports = { walletProfiles, getWalletProfile, getWalletData };