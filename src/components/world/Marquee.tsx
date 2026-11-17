const MARQUEE_ITEMS = [
  "AUTHENTIC DEVICES",
  "LIVE STOCK",
  "1-HR PICKUP",
  "VERIFY SERIAL",
  "18+ ADULT STOREFRONT",
] as const;

export function Marquee() {
  return (
    <div className="relative w-full">
      {/* Checkered accent stripe */}
      <div
        aria-hidden="true"
        className="checker-stripe h-3 w-full border-y border-black/15"
      />

      {/* Fast mono marquee */}
      <div
        aria-label="Storefront highlights"
        className="relative overflow-hidden bg-[#111111] py-3 text-white"
      >
        <div className="marquee-fast flex w-max items-center gap-8 whitespace-nowrap font-mono text-xs font-bold uppercase tracking-[0.22em]">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map(
            (item, idx) => (
              <div
                key={`${item}-${idx}`}
                className="flex items-center gap-8"
                aria-hidden={idx >= MARQUEE_ITEMS.length}
              >
                <span>{item}</span>
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: "var(--accent)" }}
                />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
