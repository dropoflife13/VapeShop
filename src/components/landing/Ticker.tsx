const TICKER_ITEMS = [
  "AUTHENTIC DEVICES",
  "LIVE STOCK",
  "1-HR EXPRESS PICKUP",
  "VERIFY SERIAL",
  "PARTNER SHOPS",
  "REGISTER YOUR SHOP",
] as const;

export function Ticker() {
  return (
    <section
      aria-label="Storefront highlights ticker"
      className="relative overflow-hidden border-y border-[var(--border-subtle)] bg-[var(--bg-canvas-deep)] py-3.5 transition-colors duration-200"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[var(--bg-canvas-deep)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[var(--bg-canvas-deep)] to-transparent" />

      <div className="marquee-track flex w-max items-center gap-8 whitespace-nowrap font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
        {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
          <div
            key={`${item}-${idx}`}
            className="flex items-center gap-8"
            aria-hidden={idx >= TICKER_ITEMS.length}
          >
            <span>{item}</span>
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-[#E86F12]"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
