/**
 * Velocity-based fraud risk scoring.
 *
 * Score distribution:
 *   0–2   → low
 *   3–5   → medium
 *   6–8   → high
 *   9–10  → critical
 *
 * Core signals:
 *   - 24h window: acute spike (strongest signal)
 *   - 7d window:  sustained activity (additive on top of 24h)
 *   - 30d window: sparse large-amount pattern (one-time scammer)
 *
 * Both frequency AND amount must cross thresholds together.
 * High frequency with low amount = normal user, never flagged.
 * Amount tiers determine how severely a spike is scored.
 */
function riskScore(walletData) {
  let score = 0;
  const factors = [];

  const transactions = walletData.transactions || [];
  const now = new Date();

  function txsInWindow(hours) {
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
    return transactions.filter(tx => tx.timestamp && new Date(tx.timestamp) >= cutoff);
  }

  function sumAmount(txList) {
    return txList.reduce((s, tx) => s + (tx.amount || 0), 0);
  }

  // ── No history at all ─────────────────────────────────────────
  if (transactions.length === 0) {
    score += 3;
    factors.push({
      code: "NEW_WALLET",
      description: "This wallet has no prior transaction history.",
      weight: 3,
    });
    return finalise(score, factors);
  }

  const txs24h = txsInWindow(24);
  const txs7d  = txsInWindow(24 * 7);
  const txs30d = txsInWindow(24 * 30);

  const count24h = txs24h.length;
  const count7d  = txs7d.length;
  const count30d = txs30d.length;

  const amount24h = sumAmount(txs24h);
  const amount7d  = sumAmount(txs7d);
  const amount30d = sumAmount(txs30d);

  // ── 24h acute spike ───────────────────────────────────────────
  // Highest weight — sudden burst is the clearest fraud signal.
  if (count24h >= 5) {
    if (amount24h > 5000) {
      // Mixer / coordinated attack pattern → push toward critical
      score += 9;
      factors.push({
        code: "CRITICAL_VELOCITY_24H",
        description: `${count24h} transactions totalling ${amount24h.toFixed(2)} DASH in the last 24 hours — extremely high frequency and volume, consistent with mixing or coordinated fraud.`,
        weight: 9,
      });
    } else if (amount24h > 1000) {
      // Clear spike → high territory
      score += 6;
      factors.push({
        code: "VELOCITY_SPIKE_24H",
        description: `${count24h} transactions totalling ${amount24h.toFixed(2)} DASH in the last 24 hours — acute activity spike detected.`,
        weight: 6,
      });
    } else if (amount24h > 500) {
      // Elevated but not alarming → medium territory
      score += 4;
      factors.push({
        code: "ELEVATED_VELOCITY_24H",
        description: `${count24h} transactions totalling ${amount24h.toFixed(2)} DASH in the last 24 hours — elevated frequency with moderate volume.`,
        weight: 4,
      });
    }
  } else if (count24h >= 3 && amount24h > 500) {
    score += 3;
    factors.push({
      code: "ELEVATED_VELOCITY_24H",
      description: `${count24h} transactions totalling ${amount24h.toFixed(2)} DASH in the last 24 hours.`,
      weight: 3,
    });
  } else if (amount24h > 500) {
    score += 2;
    factors.push({
      code: "HIGH_AMOUNT_24H",
      description: `Large amount moved in the last 24 hours: ${amount24h.toFixed(2)} DASH.`,
      weight: 2,
    });
  }

  // ── 7d sustained activity — additive on top of 24h ───────────
  // Uses only the extra txs/amount beyond what 24h already counted.
  const count7d_extra  = count7d  - count24h;
  const amount7d_extra = amount7d - amount24h;

  if (count7d_extra >= 3 && amount7d_extra > 5000) {
    score += 6;
    factors.push({
      code: "SUSTAINED_HIGH_VOLUME_7D",
      description: `${count7d} transactions totalling ${amount7d.toFixed(2)} DASH in the last 7 days — very large sustained volume.`,
      weight: 6,
    });
  } else if (count7d_extra >= 3 && amount7d_extra > 2000) {
    score += 4;
    factors.push({
      code: "ELEVATED_VELOCITY_7D",
      description: `${count7d} transactions totalling ${amount7d.toFixed(2)} DASH in the last 7 days — sustained high-volume activity.`,
      weight: 4,
    });
  } else if (count7d_extra >= 2 && amount7d_extra > 1000) {
    score += 2;
    factors.push({
      code: "MODERATE_VELOCITY_7D",
      description: `${count7d} transactions totalling ${amount7d.toFixed(2)} DASH in the last 7 days.`,
      weight: 1,
    });
  }

  // ── 30d sparse scammer pattern ────────────────────────────────
  // Only fires if nothing recent (7d quiet) — catches one-time
  // fraud wallets that hit large and disappeared.
  const count30d_extra  = count30d - count7d;
  const amount30d_extra = amount30d - amount7d;

  if (count7d === 0 && count30d_extra > 0) {
    const avgTx = amount30d_extra / count30d_extra;
    if (amount30d_extra > 5000 && avgTx > 500) {
      score += 4;
      factors.push({
        code: "LARGE_SPARSE_ACTIVITY_30D",
        description: `${count30d_extra} transactions averaging ${avgTx.toFixed(2)} DASH each in the last 30 days with no recent activity — large sums, low frequency, consistent with one-time fraud.`,
        weight: 4,
      });
    } else if (amount30d_extra > 1000) {
      score += 2;
      factors.push({
        code: "HIGH_AMOUNT_30D",
        description: `${amount30d_extra.toFixed(2)} DASH moved in the last 30 days with no recent activity.`,
        weight: 2,
      });
    }
  }

  return finalise(score, factors);
}

function finalise(score, factors) {
  score = Math.min(score, 10);
  let level;
  if      (score <= 2) level = "low";
  else if (score <= 5) level = "medium";
  else if (score <= 8) level = "high";
  else                 level = "critical";
  return { score, level, factors };
}

if (require.main === module) {
  const now = new Date();
  const hoursAgo = (h) => new Date(now.getTime() - h  * 60 * 60 * 1000).toISOString();
  const daysAgo  = (d) => hoursAgo(d * 24);

  const cases = [
    {
      label: "Trusted Merchant (spread over months, small amounts)",
      transactions: [
        { amount: 12.5, timestamp: daysAgo(60) },
        { amount: 8.0,  timestamp: daysAgo(45) },
        { amount: 22.0, timestamp: daysAgo(30) },
        { amount: 15.5, timestamp: daysAgo(20) },
        { amount: 9.75, timestamp: daysAgo(10) },
      ],
    },
    { label: "New Wallet", transactions: [] },
    {
      label: "Moderate Trader (5 txs, 620 DASH over last week)",
      transactions: [
        { amount: 45.0,  timestamp: daysAgo(6) },
        { amount: 200.0, timestamp: daysAgo(5) },
        { amount: 60.0,  timestamp: daysAgo(4) },
        { amount: 310.0, timestamp: daysAgo(3) },
        { amount: 80.0,  timestamp: daysAgo(2) },
      ],
    },
    {
      label: "Burner Wallet (5 txs, 1800 DASH in last 5h)",
      transactions: [
        { amount: 500, timestamp: hoursAgo(5) },
        { amount: 500, timestamp: hoursAgo(4) },
        { amount: 400, timestamp: hoursAgo(3) },
        { amount: 300, timestamp: hoursAgo(2) },
        { amount: 100, timestamp: hoursAgo(1) },
      ],
    },
    {
      label: "Scam Wallet (5 large txs over last 6 days)",
      transactions: [
        { amount: 500.0,  timestamp: daysAgo(6) },
        { amount: 1200.0, timestamp: daysAgo(5) },
        { amount: 800.0,  timestamp: daysAgo(4) },
        { amount: 3000.0, timestamp: daysAgo(3) },
        { amount: 5000.0, timestamp: daysAgo(3) },
      ],
    },
    {
      label: "Large Volume Wallet (7 txs, 5500 DASH over last week)",
      transactions: [
        { amount: 1000, timestamp: daysAgo(6) },
        { amount: 1500, timestamp: daysAgo(5) },
        { amount: 800,  timestamp: daysAgo(4) },
        { amount: 600,  timestamp: daysAgo(3) },
        { amount: 900,  timestamp: daysAgo(2) },
        { amount: 400,  timestamp: daysAgo(1) },
        { amount: 300,  timestamp: hoursAgo(6) },
      ],
    },
    {
      label: "Mixer (20 txs, 9800 DASH in last 10h)",
      transactions: Array.from({ length: 20 }, (_, i) => ({
        amount: 490, timestamp: hoursAgo(i * 0.5),
      })),
    },
  ];

  cases.forEach(({ label, transactions }) => {
    const result = riskScore({ transactions });
    console.log(`\n${label}`);
    console.log(`  → score=${result.score}/10, level=${result.level.toUpperCase()}`);
    result.factors.forEach(f => console.log(`  [${f.code}] +${f.weight}`));
  });
}

module.exports = { riskScore };