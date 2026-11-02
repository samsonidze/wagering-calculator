import { describe, expect, it } from "vitest";
import { bonusFromPercent, calculate, evByMultiplier, type BonusInputs } from "./bonus";

const base: BonusInputs = {
  deposit: 100,
  bonus: 100,
  multiplier: 35,
  base: "bonus",
  rtp: 0.96,
  contribution: 1,
  bonusType: "cashable",
  betSize: 2,
};

describe("bonusFromPercent", () => {
  it("applies the percentage and the cap", () => {
    expect(bonusFromPercent(100, 100, 200)).toBe(100);
    expect(bonusFromPercent(500, 100, 200)).toBe(200);
    expect(bonusFromPercent(50, 50, 0)).toBe(25); // no cap
  });
});

describe("calculate", () => {
  it("100 % match, 35x bonus-only, 96 % slot: the textbook example", () => {
    const r = calculate(base);
    expect(r.wageringBase).toBe(100);
    expect(r.turnover).toBe(3500);
    expect(r.expectedCost).toBeCloseTo(140);
    expect(r.expectedValue).toBeCloseTo(-40); // bonus 100 minus 140 cost
    expect(r.breakEvenRtp).toBeCloseTo(1 - 100 / 3500); // 97.14 %
    expect(r.expectedBets).toBe(1750);
    expect(r.costPerBonusUnit).toBeCloseTo(1.4);
  });

  it("wagering on deposit + bonus doubles the turnover", () => {
    const r = calculate({ ...base, base: "deposit+bonus" });
    expect(r.turnover).toBe(7000);
    expect(r.expectedValue).toBeCloseTo(100 - 280);
  });

  it("low contribution games inflate the real turnover", () => {
    const r = calculate({ ...base, rtp: 0.995, contribution: 0.1 }); // blackjack
    expect(r.turnover).toBe(35000);
    expect(r.expectedCost).toBeCloseTo(175);
  });

  it("a sticky bonus is never positive EV: the bonus itself is deducted", () => {
    const r = calculate({ ...base, bonusType: "sticky" });
    expect(r.expectedWithdrawable).toBeCloseTo(100 - 140);
    expect(r.expectedValue).toBeCloseTo(-140);
    expect(r.breakEvenRtp).toBeNull();
  });

  it("a generous bonus with low wagering is positive EV", () => {
    const r = calculate({ ...base, multiplier: 10, rtp: 0.97 });
    expect(r.turnover).toBe(1000);
    expect(r.expectedValue).toBeCloseTo(100 - 30);
  });

  it("guards against zero contribution and zero bet size", () => {
    const r = calculate({ ...base, contribution: 0, betSize: 0 });
    expect(r.turnover).toBe(3500);
    expect(r.expectedBets).toBe(0);
  });
});

describe("evByMultiplier", () => {
  it("is linear and crosses zero at bonus / (base × edge)", () => {
    const rows = evByMultiplier(base, [10, 25, 50]);
    expect(rows.map((r) => r.ev)).toEqual([60, 0, -100].map((v) => expect.closeTo(v, 6)));
  });
});
