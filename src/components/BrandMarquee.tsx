const BRANDS = [
  "VAPORESSO",
  "OXVA",
  "GEEKVAPE",
  "UWELL",
  "VOOPOO",
  "LOST VAPE",
  "ASPIRE",
  "DOTMOD",
  "SMOK",
  "INNOKIN",
] as const;

export function BrandMarquee() {
  return (
    <section
      aria-label="Featured Authentic Vape Brands"
      className="relative overflow-hidden border-y border-[var(--border-subtle)] bg-[var(--bg-canvas-deep)] py-5 transition-colors duration-200"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[var(--bg-canvas-deep)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[var(--bg-canvas-deep)] to-transparent" />

      <div className="marquee-track flex w-max items-center gap-12 whitespace-nowrap">
        {[...BRANDS, ...BRANDS].map((brand, idx) => (
          <div
            key={`${brand}-${idx}`}
            className="flex items-center gap-12"
            aria-hidden={idx >= BRANDS.length}
          >
            <span className="font-display text-2xl tracking-[0.18em] text-[var(--text-muted)] transition-colors duration-200 hover:text-[#E86F12] dark:hover:text-[#F58A1F] sm:text-3xl">
              {brand}
            </span>
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
