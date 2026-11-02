import { lazy, Suspense, useMemo, useState } from "react";
import { DEFAULT_FORM, Inputs, type FormState } from "./components/Inputs";
import { Method } from "./components/Method";
import { Results } from "./components/Results";
import { Simulation } from "./components/Simulation";
import { useSimulation } from "./hooks/useSimulation";
import { bonusFromPercent, calculate, type BonusInputs } from "./lib/bonus";
import type { SimInputs } from "./lib/simulate";

const EvByMultiplierChart = lazy(() => import("./components/Charts").then((m) => ({ default: m.EvByMultiplierChart })));
const EvByRtpChart = lazy(() => import("./components/Charts").then((m) => ({ default: m.EvByRtpChart })));

const SESSIONS = 5000;

function clean(n: number, fallback: number) {
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function toInputs(f: FormState): BonusInputs {
  const deposit = clean(f.deposit, 0);
  const bonus =
    f.bonusMode === "percent"
      ? bonusFromPercent(deposit, clean(f.bonusPercent, 0), clean(f.bonusCap, 0))
      : clean(f.bonusFixed, 0);
  return {
    deposit,
    bonus,
    multiplier: clean(f.multiplier, 0),
    base: f.base,
    rtp: Math.min(1.5, clean(f.rtpPercent, 96) / 100),
    contribution: Math.min(1, clean(f.contributionPercent, 100) / 100),
    bonusType: f.bonusType,
    betSize: Math.max(0.01, clean(f.betSize, 1)),
  };
}

export default function App() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));

  const inputs = useMemo(() => toInputs(form), [form]);
  const result = useMemo(() => calculate(inputs), [inputs]);

  const simInputs = useMemo<SimInputs | null>(() => {
    if (result.turnover <= 0 || inputs.deposit + inputs.bonus <= 0) return null;
    return {
      startingBalance: inputs.deposit + inputs.bonus,
      turnover: result.turnover,
      betSize: inputs.betSize,
      rtp: Math.min(0.999, inputs.rtp),
      volatility: form.volatility,
      sessions: SESSIONS,
      seed: 1,
    };
  }, [inputs, result.turnover, form.volatility]);
  const { result: sim, running } = useSimulation(simInputs);

  return (
    <div className="min-h-screen">
      <header className="border-b border-rule">
        <div className="mx-auto max-w-[1120px] px-4 py-5 sm:px-6">
          <h1 className="text-xl font-bold leading-tight">Wagering calculator</h1>
          <p className="max-w-prose text-sm text-muted">
            What a casino bonus really costs: required turnover, expected cost, EV, break-even RTP — and how often
            the playthrough is actually finished.
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1120px] gap-10 px-4 py-6 sm:px-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Inputs form={form} onChange={patch} />
        </aside>

        <div className="space-y-8">
          <Results inputs={inputs} result={result} currency={form.currency} />

          <div className="grid gap-8 border-t border-rule pt-6 md:grid-cols-2">
            <Suspense fallback={<div className="h-[228px]" />}>
              <EvByMultiplierChart inputs={inputs} currency={form.currency} />
              <EvByRtpChart inputs={inputs} currency={form.currency} />
            </Suspense>
          </div>

          <Simulation inputs={inputs} volatility={form.volatility} sim={sim} running={running} currency={form.currency} />

          <Method />
        </div>
      </main>

      <footer className="mx-auto max-w-[1120px] px-4 pb-8 pt-6 text-xs text-muted sm:px-6">
        <p>
          For understanding bonus terms, not for beating them: a positive EV says nothing about variance, bet caps,
          excluded games, time limits or withdrawal rules. Built by{" "}
          <a href="https://github.com/samsonidze/wagering-calculator" className="underline underline-offset-2 hover:text-ink">
            Giorgi Samsonidze
          </a>
          .
        </p>
      </footer>
    </div>
  );
}
