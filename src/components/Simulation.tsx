import { lazy, Suspense } from "react";
import type { BonusInputs } from "../lib/bonus";
import { int, money, pct } from "../lib/format";
import { HIT_RATE, type SimResult, type Volatility } from "../lib/simulate";

const OutcomeHistogram = lazy(() => import("./Charts").then((m) => ({ default: m.OutcomeHistogram })));

interface Props {
  inputs: BonusInputs;
  volatility: Volatility;
  sim: SimResult | null;
  running: boolean;
  currency: string;
}

export function Simulation({ inputs, volatility, sim, running, currency }: Props) {
  return (
    <section aria-labelledby="sim-heading" className="border-t border-rule pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="sim-heading" className="text-base font-semibold">
          How often is the wagering actually finished?
        </h2>
        <p className="text-xs text-muted" aria-live="polite">
          {running ? "Simulating…" : sim ? `${int(sim.sessions)} simulated sessions` : ""}
        </p>
      </div>
      <p className="mt-1 max-w-prose text-sm text-ink-2">
        Expected value is an average over players who finish. Most do not: the bankroll runs out first. Each
        session below bets {money(inputs.betSize, currency)} at a time on a game that pays{" "}
        {pct(HIT_RATE[volatility], 0)} of the time, until
        the requirement is met or the balance is below one bet.
      </p>

      {sim && (
        <>
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted">Finish the wagering</dt>
              <dd className="num text-3xl font-bold">{pct(sim.completionRate, 1)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Bust first</dt>
              <dd className="num text-3xl font-bold text-neg">{pct(1 - sim.completionRate, 1)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Balance if finished</dt>
              <dd className="num text-lg font-semibold">{money(sim.meanBalanceIfCompleted, currency)}</dd>
              <dd className="text-xs text-muted">average, before any sticky deduction</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Bets per session</dt>
              <dd className="num text-lg font-semibold">{int(sim.meanBets)}</dd>
              <dd className="text-xs text-muted">average</dd>
            </div>
          </dl>
          <div className="mt-5">
            <Suspense fallback={<div className="h-[200px]" />}>
              <OutcomeHistogram sim={sim} currency={currency} deposit={inputs.deposit} />
            </Suspense>
          </div>
        </>
      )}
    </section>
  );
}
