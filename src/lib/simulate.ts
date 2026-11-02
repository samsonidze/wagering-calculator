// Monte Carlo playthrough. Two-outcome game: lose the stake or hit a fixed payout.
// Crude compared to a real slot, but enough to show how often sessions bust.

export type Volatility = "low" | "medium" | "high";

/** Probability a bet pays anything. Lower = more variance for the same RTP. */
export const HIT_RATE: Record<Volatility, number> = { low: 0.45, medium: 0.25, high: 0.08 };

export interface SimInputs {
  startingBalance: number;
  /** Stakes that must be placed to finish (already adjusted for contribution). */
  turnover: number;
  betSize: number;
  rtp: number;
  volatility: Volatility;
  sessions: number;
  /** Cap on bets per session so a tiny stake cannot run forever. */
  maxBets?: number;
  seed?: number;
}

export interface SimResult {
  sessions: number;
  completed: number;
  /** Share of sessions that met the requirement. */
  completionRate: number;
  /** Mean final balance across all sessions (0 for busts). */
  meanFinalBalance: number;
  /** Mean final balance among completed sessions only. */
  meanBalanceIfCompleted: number;
  medianFinalBalance: number;
  /** Histogram of final balances, in `bucketSize` steps from 0. */
  histogram: { from: number; to: number; count: number }[];
  bucketSize: number;
  /** Mean bets placed per session. */
  meanBets: number;
}

// mulberry32: tiny seedable PRNG, so tests and the UI get the same numbers for the same inputs
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard deviation of one bet's return, in units of the stake. */
export function betStdDev(rtp: number, volatility: Volatility): number {
  const h = HIT_RATE[volatility];
  return rtp * Math.sqrt(1 / h - 1);
}

export function simulate(i: SimInputs): SimResult {
  const rand = mulberry32(i.seed ?? 1);
  const hit = HIT_RATE[i.volatility];
  const payout = i.rtp / hit; // multiple of stake returned on a hit
  const maxBets = i.maxBets ?? 200_000;
  const finals: number[] = new Array(i.sessions);
  let completed = 0;
  let totalBets = 0;
  let sumCompletedBalance = 0;

  for (let s = 0; s < i.sessions; s++) {
    let balance = i.startingBalance;
    let staked = 0;
    let bets = 0;
    while (staked < i.turnover && balance >= i.betSize && bets < maxBets) {
      balance -= i.betSize;
      staked += i.betSize;
      bets++;
      if (rand() < hit) balance += i.betSize * payout;
    }
    totalBets += bets;
    const done = staked >= i.turnover;
    if (done) {
      completed++;
      sumCompletedBalance += balance;
      finals[s] = balance;
    } else {
      finals[s] = 0; // bust: whatever is left is below one bet; treat as lost
    }
  }

  const sorted = [...finals].sort((a, b) => a - b);
  const mean = finals.reduce((a, b) => a + b, 0) / i.sessions;
  const median = sorted[Math.floor(i.sessions / 2)] ?? 0;

  const max = sorted[sorted.length - 1] ?? 0;
  const bucketSize = niceBucket(max / 20 || 1);
  const buckets = Math.max(1, Math.ceil((max + 1e-9) / bucketSize));
  const counts = new Array<number>(buckets).fill(0);
  for (const v of finals) {
    const idx = Math.min(buckets - 1, Math.floor(v / bucketSize));
    counts[idx] = (counts[idx] ?? 0) + 1;
  }

  return {
    sessions: i.sessions,
    completed,
    completionRate: completed / i.sessions,
    meanFinalBalance: mean,
    meanBalanceIfCompleted: completed ? sumCompletedBalance / completed : 0,
    medianFinalBalance: median,
    histogram: counts.map((count, k) => ({ from: k * bucketSize, to: (k + 1) * bucketSize, count })),
    bucketSize,
    meanBets: totalBets / i.sessions,
  };
}

/** Round a bucket width up to 1/2/5 × 10^n so histogram labels read cleanly. */
export function niceBucket(raw: number): number {
  const exp = Math.floor(Math.log10(raw));
  const base = Math.pow(10, exp);
  const m = raw / base;
  const step = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
  return step * base;
}
