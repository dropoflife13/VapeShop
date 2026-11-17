import { SHOWCASE_DEVICES } from "@/lib/theme";

interface RulerProps {
  activeIndex: number;
}

export function Ruler({ activeIndex }: RulerProps) {
  const paddedActive = String(activeIndex + 1).padStart(2, "0");
  const paddedTotal = String(SHOWCASE_DEVICES.length).padStart(2, "0");

  return (
    <aside
      aria-label="Product showcase scale"
      className="pointer-events-none absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-end gap-3 font-mono text-[10px] tracking-[0.2em] text-[var(--text-muted)] opacity-70 lg:flex"
    >
      <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface-glass)] px-2 py-1 text-[10px] font-semibold text-[var(--text-primary)] backdrop-blur-md">
        {paddedActive} / {paddedTotal}
      </div>

      <div className="flex flex-col items-end gap-2 py-2">
        {SHOWCASE_DEVICES.map((dev, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div key={dev.id} className="flex items-center gap-2">
              <span
                className={
                  isActive
                    ? "font-bold text-[#E86F12] dark:text-[#F58A1F]"
                    : "opacity-55"
                }
              >
                {dev.indexLabel}
              </span>
              <span
                className={
                  isActive
                    ? "h-[2px] w-6 bg-gradient-to-r from-[#E86F12] to-[#F58A1F]"
                    : "h-px w-3 bg-current opacity-40"
                }
              />
            </div>
          );
        })}
        <span className="h-px w-2 bg-current opacity-25" />
        <span className="h-px w-2 bg-current opacity-25" />
        <span className="h-px w-4 bg-current opacity-35" />
      </div>
    </aside>
  );
}
