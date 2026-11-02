/**
 * Bonus wagering maths.
 *
 * Conventions: money in the player's currency, rates as fractions (0.96, not 96).
 * "Turnover" is the total amount that must be staked; "wagering requirement"
 * is the headline multiplier the casino quotes.
 */

export type WageringBase = "bonus" | "deposit+bonus";
export type BonusType = "cashable" | "sticky";

export interface BonusInputs {
  deposit: number;
  /** Fixed bonus amount credited (already capped). */
  bonus: number;
  /** e.g. 35 for "35x". */
  multiplier: number;
  base: WageringBase;
  /** Game return to player, e.g. 0.96. */
  rtp: number;
  /** Share of each stake that counts towards wagering, e.g. 1 for slots, 0.1 for blackjack. */
  contribution: number;
  bonusType: BonusType;
  /** Stake per bet, used for bet counts and the simulation. */
  betSize: number;
}

export interface BonusResult {
  /** Amount the multiplier applies to. */
  wageringBase: number;
  /** Stakes that must *count*: base × multiplier. */
  requiredCounting: number;
  /** Stakes that must actually be placed, after game contribution. */
  turnover: number;
  /** Turnover × house edge. */
  expectedCost: number;
  /** Expected profit from taking the bonus versus not taking it. */
  expectedValue: number;
  /** Expected balance after finishing wagering, before any sticky deduction. */
  expectedFinalBalance: number;
  /** Expected withdrawable amount after wagering. */
  expectedWithdrawable: number;
  /** RTP at which EV is zero; null for sticky (never positive). */
  breakEvenRtp: number | null;
  /** Turnover ÷ bet size. */
  expectedBets: number;
  /** Expected cost as a share of the bonus, e.g. 1.4 = bonus costs 140 % of its face value. */
  costPerBonusUnit: number;
}

export function bonusFromPercent(deposit: number, percent: number, cap: number): number {
  const raw = (deposit * percent) / 100;
  return cap > 0 ? Math.min(raw, cap) : raw;
}

export function wageringBase(deposit: number, bonus: number, base: WageringBase): number {
  return base === "bonus" ? bonus : deposit + bonus;
}

export function calculate(i: BonusInputs): BonusResult {
  const base = wageringBase(i.deposit, i.bonus, i.base);
  const requiredCounting = base * i.multiplier;
  const contribution = i.contribution > 0 ? i.contribution : 1;
  const turnover = requiredCounting / contribution;
  const houseEdge = 1 - i.rtp;
  const expectedCost = turnover * houseEdge;

  const expectedFinalBalance = i.deposit + i.bonus - expectedCost;
  const expectedWithdrawable =
    i.bonusType === "sticky" ? expectedFinalBalance - i.bonus : expectedFinalBalance;
  const expectedValue = expectedWithdrawable - i.deposit;

  const breakEvenRtp = i.bonusType === "cashable" && turnover > 0 ? 1 - i.bonus / turnover : null;

  return {
    wageringBase: base,
    requiredCounting,
    turnover,
    expectedCost,
    expectedValue,
    expectedFinalBalance,
    expectedWithdrawable,
    breakEvenRtp,
    expectedBets: i.betSize > 0 ? turnover / i.betSize : 0,
    costPerBonusUnit: i.bonus > 0 ? expectedCost / i.bonus : 0,
  };
}

/** EV for each multiplier in `multipliers`, everything else held fixed. */
export function evByMultiplier(i: BonusInputs, multipliers: readonly number[]) {
  return multipliers.map((multiplier) => ({
    multiplier,
    ev: calculate({ ...i, multiplier }).expectedValue,
  }));
}

/** EV for each RTP in `rtps`, everything else held fixed. */
export function evByRtp(i: BonusInputs, rtps: readonly number[]) {
  return rtps.map((rtp) => ({ rtp, ev: calculate({ ...i, rtp }).expectedValue }));
}

export const GAME_PRESETS = [
  { id: "slot-high", label: "Slot, 96.5 % RTP", rtp: 0.965, contribution: 1 },
  { id: "slot-mid", label: "Slot, 95 % RTP", rtp: 0.95, contribution: 1 },
  { id: "slot-low", label: "Slot, 92 % RTP", rtp: 0.92, contribution: 1 },
  { id: "roulette", label: "European roulette (10 % counts)", rtp: 0.973, contribution: 0.1 },
  { id: "blackjack", label: "Blackjack (10 % counts)", rtp: 0.995, contribution: 0.1 },
  { id: "custom", label: "Custom", rtp: 0.96, contribution: 1 },
] as const;

export type GamePresetId = (typeof GAME_PRESETS)[number]["id"];
