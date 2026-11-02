const nf = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function money(v: number, currency: string): string {
  const abs = Math.abs(v);
  const s = abs >= 1000 ? nf.format(abs) : nf2.format(abs);
  return `${v < 0 ? "−" : ""}${s} ${currency}`;
}

export function signedMoney(v: number, currency: string): string {
  return v > 0 ? `+${money(v, currency)}` : money(v, currency);
}

export function pct(v: number, digits = 1): string {
  return `${(v * 100).toFixed(digits)} %`;
}

export function int(v: number): string {
  return nf.format(Math.round(v));
}
