export function Method() {
  return (
    <section aria-labelledby="method-heading" className="border-t border-rule pt-6 text-sm text-ink-2">
      <h2 id="method-heading" className="text-base font-semibold text-ink">
        How the numbers are calculated
      </h2>
      <dl className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-[auto_1fr]">
        <dt className="font-semibold text-ink">Turnover</dt>
        <dd>
          <code className="num">base × multiplier ÷ contribution</code>, where base is the bonus or deposit + bonus. A
          10 % contribution game needs ten times the stakes.
        </dd>
        <dt className="font-semibold text-ink">Expected cost</dt>
        <dd>
          <code className="num">turnover × (1 − RTP)</code>. The house edge is paid on every stake, so it is paid on
          the whole turnover.
        </dd>
        <dt className="font-semibold text-ink">Expected value</dt>
        <dd>
          Cashable: <code className="num">bonus − expected cost</code>. Sticky:{" "}
          <code className="num">− expected cost</code>, since the bonus is removed at withdrawal.
        </dd>
        <dt className="font-semibold text-ink">Break-even RTP</dt>
        <dd>
          <code className="num">1 − bonus ÷ turnover</code>. Above this the bonus is positive EV. With 35× wagering it
          lands above 97 %, which is why bonus terms exclude the high-RTP games.
        </dd>
        <dt className="font-semibold text-ink">Simulation</dt>
        <dd>
          A two-outcome game: each bet loses the stake or pays a fixed multiple. The hit rate comes from the volatility
          setting (45 %, 25 %, 8 %) and the payout is scaled so the mean return equals the RTP. Real slots have long
          payout tails, so treat the completion rate as an indication, not a prediction.
        </dd>
      </dl>
    </section>
  );
}
