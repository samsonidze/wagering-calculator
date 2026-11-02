# Wagering calculator

https://wagering-calculator.vercel.app

Type in a casino bonus (deposit, match, wagering, game) and see what it actually costs: required turnover, expected cost, EV, break-even RTP, and a simulation of how often the playthrough gets finished before the money runs out.

![screenshot](docs/screenshot.png)

## Background

I worked on the affiliate side of iGaming for about a year. The thing people get wrong about bonuses, including people who write the bonus pages, is that "35x wagering" sounds like a rule and is actually a price. You stake 35 times the bonus and pay the house edge on every one of those stakes. On a 96% slot that costs more than the bonus is worth.

EV is also only half of it. EV is an average over players who finish the wagering. With a normal bankroll most don't; they bust first. So there's a Monte Carlo panel that bets through the requirement 5,000 times and reports how many sessions make it.

## Formulas

```
turnover        = base × multiplier ÷ contribution      (base = bonus, or deposit + bonus)
expected cost   = turnover × (1 − RTP)
EV, cashable    = bonus − expected cost
EV, sticky      = −expected cost                        (bonus is removed at withdrawal)
break-even RTP  = 1 − bonus ÷ turnover
```

Game contribution matters more than people think. Blackjack at 99.5% RTP with 10% contribution needs 10× the stakes of a slot, so it costs more to clear a bonus with, not less.

The simulation is a two-outcome game: each bet either loses the stake or pays a fixed multiple. Hit rate comes from the volatility setting (45 / 25 / 8%) and the payout is scaled so the mean equals the RTP. Real slots have fatter tails than that, so treat the completion rate as a rough guide. It runs in a Web Worker with a seeded PRNG so the numbers are reproducible.

One thing the simulation shows that EV hides: higher volatility *increases* the average final balance while lowering the completion rate. Busting caps your loss at the bankroll. The full expected cost is only paid by the people who get to the end.

## Code

- `src/lib/bonus.ts` – the formulas, plus `evByMultiplier` / `evByRtp` for the charts
- `src/lib/simulate.ts` – the Monte Carlo, PRNG, histogram bucketing
- `src/worker/sim.worker.ts` + `src/hooks/useSimulation.ts` – worker plumbing, debounce, stale-reply guard
- `src/components/` – Inputs, Results, Charts, Simulation, Method

React, TypeScript, Vite, Tailwind, Recharts. Tests with Vitest (`npm test`): worked examples for the formulas and invariants for the simulation (payout calibrated to RTP, completion rate falls with volatility, bet cap respected).

```
npm install
npm run dev
```

Static site. No backend, no env vars.

---

Not modelled: max-bet rules, excluded games, time limits, max cashout, "irregular play" clauses. That's where terms actually bite and they differ per operator. This tells you what the arithmetic says; the T&Cs tell you the rest.
