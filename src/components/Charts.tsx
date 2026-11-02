import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { evByMultiplier, evByRtp, type BonusInputs } from "../lib/bonus";
import { money, pct, signedMoney } from "../lib/format";
import type { SimResult } from "../lib/simulate";

const axisTick = { fill: "var(--color-muted)", fontSize: 11 };
const tooltipStyle = {
  background: "var(--color-paper)",
  border: "1px solid var(--color-rule)",
  borderRadius: 4,
  fontSize: 12,
  color: "var(--color-ink)",
};

const MULTIPLIERS = Array.from({ length: 12 }, (_, i) => (i + 1) * 5); // 5…60
const RTPS = Array.from({ length: 13 }, (_, i) => 0.9 + i * 0.01); // 90…102 %

export function EvByMultiplierChart({ inputs, currency }: { inputs: BonusInputs; currency: string }) {
  const data = evByMultiplier(inputs, MULTIPLIERS);
  const current = evByMultiplier(inputs, [inputs.multiplier])[0]!;
  return (
    <figure>
      <figcaption className="mb-2 text-sm font-semibold">EV by wagering requirement</figcaption>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--color-rule)" vertical={false} />
          <XAxis dataKey="multiplier" tickFormatter={(v: number) => `${v}×`} tick={axisTick} tickLine={false} axisLine={{ stroke: "var(--color-rule)" }} />
          <YAxis tickFormatter={(v: number) => money(v, "")} tick={axisTick} tickLine={false} axisLine={false} width={64} />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => `${v}× wagering`} formatter={(v) => [signedMoney(Number(v), currency), "EV"]} />
          <ReferenceLine y={0} stroke="var(--color-ink-2)" strokeDasharray="3 3" />
          <Line type="linear" dataKey="ev" stroke="var(--color-accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
          <ReferenceDot x={current.multiplier} y={current.ev} r={4} fill="var(--color-accent)" stroke="var(--color-paper)" />
        </LineChart>
      </ResponsiveContainer>
    </figure>
  );
}

export function EvByRtpChart({ inputs, currency }: { inputs: BonusInputs; currency: string }) {
  const data = evByRtp(inputs, RTPS);
  const current = evByRtp(inputs, [inputs.rtp])[0]!;
  return (
    <figure>
      <figcaption className="mb-2 text-sm font-semibold">EV by game RTP</figcaption>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--color-rule)" vertical={false} />
          <XAxis dataKey="rtp" tickFormatter={(v: number) => pct(v, 0)} tick={axisTick} tickLine={false} axisLine={{ stroke: "var(--color-rule)" }} />
          <YAxis tickFormatter={(v: number) => money(v, "")} tick={axisTick} tickLine={false} axisLine={false} width={64} />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => `${pct(Number(v), 0)} RTP`} formatter={(v) => [signedMoney(Number(v), currency), "EV"]} />
          <ReferenceLine y={0} stroke="var(--color-ink-2)" strokeDasharray="3 3" />
          <Line type="linear" dataKey="ev" stroke="var(--color-accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
          <ReferenceDot x={current.rtp} y={current.ev} r={4} fill="var(--color-accent)" stroke="var(--color-paper)" />
        </LineChart>
      </ResponsiveContainer>
    </figure>
  );
}

export function OutcomeHistogram({ sim, currency, deposit }: { sim: SimResult; currency: string; deposit: number }) {
  const data = sim.histogram.map((b) => ({
    label: b.from === 0 ? "Bust" : money(b.from, ""),
    from: b.from,
    share: b.count / sim.sessions,
  }));
  return (
    <figure>
      <figcaption className="mb-2 text-sm font-semibold">Where sessions end up</figcaption>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--color-rule)" vertical={false} />
          <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: "var(--color-rule)" }} interval="preserveStartEnd" />
          <YAxis tickFormatter={(v: number) => pct(v, 0)} tick={axisTick} tickLine={false} axisLine={false} width={44} />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "var(--color-panel)" }}
            labelFormatter={(_, p) => {
              const d = p?.[0]?.payload as { from: number } | undefined;
              return d ? (d.from === 0 ? "Busted before finishing" : `${money(d.from, currency)} – ${money(d.from + sim.bucketSize, currency)}`) : "";
            }}
            formatter={(v) => [pct(Number(v), 1), "of sessions"]}
          />
          <ReferenceLine x={data.find((d) => d.from >= deposit)?.label} stroke="var(--color-ink-2)" strokeDasharray="3 3" label={{ value: "deposit", fill: "var(--color-muted)", fontSize: 11, position: "insideTopRight" }} />
          <Bar dataKey="share" fill="var(--color-accent)" isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
