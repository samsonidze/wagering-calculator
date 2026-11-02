import { describe, expect, it } from "vitest";
import { betStdDev, mulberry32, niceBucket, simulate } from "./simulate";

describe("mulberry32", () => {
  it("is deterministic for a seed and uniform-ish on [0,1)", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const xs = Array.from({ length: 5 }, () => a());
    expect(Array.from({ length: 5 }, () => b())).toEqual(xs);
    const mean = Array.from({ length: 20000 }, () => a()).reduce((s, x) => s + x, 0) / 20000;
    expect(mean).toBeGreaterThan(0.48);
    expect(mean).toBeLessThan(0.52);
  });
});

describe("betStdDev", () => {
  it("rises with volatility for the same RTP", () => {
    expect(betStdDev(0.96, "low")).toBeLessThan(betStdDev(0.96, "medium"));
    expect(betStdDev(0.96, "medium")).toBeLessThan(betStdDev(0.96, "high"));
  });
});

describe("niceBucket", () => {
  it("rounds up to 1/2/5 steps", () => {
    expect(niceBucket(3)).toBe(5);
    expect(niceBucket(12)).toBe(20);
    expect(niceBucket(70)).toBe(100);
    expect(niceBucket(0.3)).toBeCloseTo(0.5);
  });
});

describe("simulate", () => {
  const common = { startingBalance: 200, betSize: 2, rtp: 0.96, sessions: 3000, seed: 7 } as const;

  it("mean return per bet matches the RTP (the payout is calibrated)", () => {
    // Huge bankroll, fixed number of bets: realised RTP ≈ configured RTP.
    const r = simulate({ ...common, startingBalance: 1e9, turnover: 2 * 2000, volatility: "medium", sessions: 200 });
    const realised = (r.meanFinalBalance - 1e9) / (2 * 2000) + 1;
    expect(realised).toBeGreaterThan(0.94);
    expect(realised).toBeLessThan(0.98);
  });

  it("everyone completes a trivial requirement", () => {
    const r = simulate({ ...common, turnover: 20, volatility: "low" });
    expect(r.completionRate).toBe(1);
    expect(r.meanBets).toBe(10);
  });

  it("35x on a 96 % slot busts a large share of sessions, more so with higher volatility", () => {
    const low = simulate({ ...common, turnover: 3500, volatility: "low" });
    const mid = simulate({ ...common, turnover: 3500, volatility: "medium" });
    const high = simulate({ ...common, turnover: 3500, volatility: "high" });
    expect(low.completionRate).toBeLessThan(0.8);
    expect(mid.completionRate).toBeLessThan(low.completionRate);
    expect(high.completionRate).toBeLessThan(mid.completionRate);
    // Busting caps the downside, so the mean final balance *rises* with volatility.
    expect(high.meanFinalBalance).toBeGreaterThan(low.meanFinalBalance);
    expect(low.histogram.reduce((s, b) => s + b.count, 0)).toBe(common.sessions);
  });

  it("respects the bet cap", () => {
    const r = simulate({ ...common, startingBalance: 1e9, turnover: 1e9, volatility: "low", sessions: 2, maxBets: 50 });
    expect(r.meanBets).toBe(50);
    expect(r.completionRate).toBe(0);
  });
});
