import type { BonusInputs, BonusResult } from "../lib/bonus";
import { int, money, pct, signedMoney } from "../lib/format";

interface Props {
  inputs: BonusInputs;
  result: BonusResult;
  currency: string;
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="num text-lg font-semibold">{value}</dd>
      {note && <dd className="text-xs text-muted">{note}</dd>}
    </div>
  );
}

export function Results({ inputs, result, currency }: Props) {
  const ev = result.expectedValue;
  const tone = ev > 0 ? "text-pos" : ev < 0 ? "text-neg" : "text-ink";
  const verdict =
    inputs.bonusType === "sticky"
      ? "A sticky bonus can only ever cost you: the bonus is taken back at withdrawal, so the house edge on the turnover is the whole story."
      : ev > 0
        ? "Positive expected value: on average, the bonus is worth more than the wagering costs. That is rare and usually short-lived."
        : "Negative expected value: on average, the wagering costs more than the bonus is worth. Most bonuses are built this way.";

  return (
    <section aria-labelledby="ev-heading">
      <h2 id="ev-heading" className="text-xs text-muted">
        Expected value of taking the bonus
      </h2>
      <p className={`num mt-1 text-5xl font-bold tracking-tight sm:text-6xl ${tone}`}>
        {signedMoney(ev, currency)}
      </p>
      <p className="mt-2 max-w-prose text-sm text-ink-2">{verdict}</p>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-rule pt-4 sm:grid-cols-3">
        <Stat
          label="Must be staked"
          value={money(result.turnover, currency)}
          note={
            inputs.contribution < 1
              ? `${money(result.requiredCounting, currency)} counting at ${pct(inputs.contribution, 0)}`
              : `${inputs.multiplier}× ${money(result.wageringBase, currency)}`
          }
        />
        <Stat
          label="Expected cost of wagering"
          value={money(result.expectedCost, currency)}
          note={`${pct(1 - inputs.rtp, 1)} house edge × turnover`}
        />
        <Stat
          label="Bonus"
          value={money(inputs.bonus, currency)}
          note={`costs ${pct(result.costPerBonusUnit, 0)} of its face value`}
        />
        <Stat
          label="Break-even RTP"
          value={result.breakEvenRtp === null ? "—" : pct(result.breakEvenRtp, 2)}
          note={
            result.breakEvenRtp === null
              ? "never positive for sticky"
              : result.breakEvenRtp > 1
                ? "no real game reaches this"
                : "EV is zero at this RTP"
          }
        />
        <Stat
          label="Expected bets"
          value={int(result.expectedBets)}
          note={`at ${money(inputs.betSize, currency)} per bet`}
        />
        <Stat
          label="Expected withdrawable"
          value={money(Math.max(0, result.expectedWithdrawable), currency)}
          note={`from a ${money(inputs.deposit, currency)} deposit`}
        />
      </dl>
    </section>
  );
}
