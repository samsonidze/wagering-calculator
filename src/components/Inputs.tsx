import type { ReactNode } from "react";
import { GAME_PRESETS, type BonusType, type GamePresetId, type WageringBase } from "../lib/bonus";
import type { Volatility } from "../lib/simulate";

export type BonusMode = "percent" | "fixed";

export interface FormState {
  currency: string;
  deposit: number;
  bonusMode: BonusMode;
  bonusPercent: number;
  bonusCap: number;
  bonusFixed: number;
  multiplier: number;
  base: WageringBase;
  preset: GamePresetId;
  rtpPercent: number;
  contributionPercent: number;
  bonusType: BonusType;
  betSize: number;
  volatility: Volatility;
}

export const DEFAULT_FORM: FormState = {
  currency: "EUR",
  deposit: 100,
  bonusMode: "percent",
  bonusPercent: 100,
  bonusCap: 200,
  bonusFixed: 100,
  multiplier: 35,
  base: "bonus",
  preset: "slot-high",
  rtpPercent: 96.5,
  contributionPercent: 100,
  bonusType: "cashable",
  betSize: 2,
  volatility: "medium",
};

interface Props {
  form: FormState;
  onChange: (patch: Partial<FormState>) => void;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold">{label}</span>
      {hint && <span className="block text-xs text-muted">{hint}</span>}
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

const inputCls =
  "num w-full rounded border border-rule bg-paper px-2.5 py-1.5 text-sm text-ink disabled:text-muted";

function Num({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <span className="relative block">
      <input
        type="number"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        step={step}
        inputMode="decimal"
        onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
        className={`${inputCls} ${suffix ? "pr-10" : ""}`}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-sm text-muted">
          {suffix}
        </span>
      )}
    </span>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex rounded border border-rule text-sm">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={`flex-1 px-2 py-1.5 first:rounded-l last:rounded-r ${
            o.value === value ? "bg-ink text-paper" : "hover:bg-panel"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Inputs({ form, onChange }: Props) {
  return (
    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
      <fieldset className="space-y-3">
        <legend className="mb-1 text-xs text-muted">The offer</legend>
        <div className="grid grid-cols-[1fr_5rem] gap-3">
          <Field label="Deposit">
            <Num value={form.deposit} onChange={(deposit) => onChange({ deposit })} step={10} />
          </Field>
          <Field label="Currency">
            <input
              value={form.currency}
              maxLength={4}
              onChange={(e) => onChange({ currency: e.target.value.toUpperCase() })}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Bonus">
          <Segmented
            label="Bonus type"
            value={form.bonusMode}
            onChange={(bonusMode) => onChange({ bonusMode })}
            options={[
              { value: "percent", label: "Match %" },
              { value: "fixed", label: "Fixed amount" },
            ]}
          />
        </Field>
        {form.bonusMode === "percent" ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Match" hint="of the deposit">
              <Num value={form.bonusPercent} onChange={(bonusPercent) => onChange({ bonusPercent })} step={5} suffix="%" />
            </Field>
            <Field label="Max bonus" hint="0 = no cap">
              <Num value={form.bonusCap} onChange={(bonusCap) => onChange({ bonusCap })} step={10} />
            </Field>
          </div>
        ) : (
          <Field label="Bonus amount">
            <Num value={form.bonusFixed} onChange={(bonusFixed) => onChange({ bonusFixed })} step={10} />
          </Field>
        )}
        <div className="grid grid-cols-[6rem_1fr] gap-3">
          <Field label="Wagering">
            <Num value={form.multiplier} onChange={(multiplier) => onChange({ multiplier })} step={1} suffix="×" />
          </Field>
          <Field label="Applies to">
            <Segmented
              label="Wagering base"
              value={form.base}
              onChange={(base) => onChange({ base })}
              options={[
                { value: "bonus", label: "Bonus" },
                { value: "deposit+bonus", label: "Deposit + bonus" },
              ]}
            />
          </Field>
        </div>
        <Field label="Bonus funds" hint="Sticky bonuses are removed from the balance at withdrawal.">
          <Segmented
            label="Cashable or sticky"
            value={form.bonusType}
            onChange={(bonusType) => onChange({ bonusType })}
            options={[
              { value: "cashable", label: "Cashable" },
              { value: "sticky", label: "Sticky" },
            ]}
          />
        </Field>
      </fieldset>

      <fieldset className="space-y-3 border-t border-rule pt-4">
        <legend className="mb-1 pt-4 text-xs text-muted">The game</legend>
        <Field label="Game">
          <select
            value={form.preset}
            onChange={(e) => {
              const preset = e.target.value as GamePresetId;
              const p = GAME_PRESETS.find((g) => g.id === preset)!;
              onChange({ preset, rtpPercent: p.rtp * 100, contributionPercent: p.contribution * 100 });
            }}
            className={inputCls}
          >
            {GAME_PRESETS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="RTP">
            <Num
              value={form.rtpPercent}
              onChange={(rtpPercent) => onChange({ rtpPercent, preset: "custom" })}
              min={50}
              max={100}
              step={0.1}
              suffix="%"
            />
          </Field>
          <Field label="Counts toward wagering">
            <Num
              value={form.contributionPercent}
              onChange={(contributionPercent) => onChange({ contributionPercent, preset: "custom" })}
              max={100}
              step={5}
              suffix="%"
            />
          </Field>
        </div>
        <div className="grid grid-cols-[6rem_1fr] gap-3">
          <Field label="Bet size">
            <Num value={form.betSize} onChange={(betSize) => onChange({ betSize })} step={0.5} min={0.01} />
          </Field>
          <Field label="Volatility" hint="How often the game pays">
            <Segmented
              label="Volatility"
              value={form.volatility}
              onChange={(volatility) => onChange({ volatility })}
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
              ]}
            />
          </Field>
        </div>
      </fieldset>
    </form>
  );
}
