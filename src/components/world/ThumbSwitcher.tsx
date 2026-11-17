"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { ProductTheme, ProductWorldId } from "@/lib/product-themes";
import { cn } from "@/lib/utils";

interface ThumbSwitcherProps {
  products: ProductTheme[];
  activeId: ProductWorldId;
  onSelect: (id: ProductWorldId) => void;
}

const VISIBLE_COUNT = 4;

export function ThumbSwitcher({
  products,
  activeId,
  onSelect,
}: ThumbSwitcherProps) {
  const reduceMotion = useReducedMotion();
  const total = products.length;
  const activeIdx = Math.max(
    0,
    products.findIndex((p) => p.id === activeId)
  );

  // Keep a 4-item sliding window containing the active model
  const maxStart = Math.max(0, total - VISIBLE_COUNT);
  const start = Math.min(maxStart, Math.max(0, activeIdx - 1));
  const visibleProducts = products.slice(start, start + VISIBLE_COUNT);
  const extraCount = Math.max(0, total - VISIBLE_COUNT);

  function step(delta: number) {
    const nextIdx = (activeIdx + delta + total) % total;
    const target = products[nextIdx];
    if (target) onSelect(target.id);
  }

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
          SELECT DEVICE ({String(activeIdx + 1).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")})
        </span>
        {extraCount > 0 && (
          <span className="rounded-full border border-current/25 bg-[var(--surface-tint)] px-2.5 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--ink)]">
            {VISIBLE_COUNT} SHOWN &middot; +{extraCount} MORE
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous device"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-current/25 bg-[var(--surface-tint)] text-[var(--ink)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)]"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <div
          role="tablist"
          aria-label="Choose product world"
          className="flex items-center gap-2.5 sm:gap-3.5"
        >
          {visibleProducts.map((item) => {
            const isActive = item.id === activeId;
            return (
              <motion.button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Switch to ${item.name} (${item.flavor})`}
                onClick={() => onSelect(item.id)}
                whileHover={
                  reduceMotion ? undefined : { scale: isActive ? 1.14 : 1.08 }
                }
                whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                transition={{ type: "spring", stiffness: 360, damping: 22 }}
                style={{ backgroundColor: item.bg }}
                className={cn(
                  "relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 transition-all sm:h-14 sm:w-14",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ink)]",
                  isActive
                    ? "scale-110 border-[var(--ink)] ring-2 ring-[var(--ink)] ring-offset-2 ring-offset-[var(--bg)] shadow-lg"
                    : "border-white/50 opacity-85 hover:opacity-100"
                )}
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  width={40}
                  height={56}
                  className="h-10 w-auto object-contain sm:h-12"
                />
              </motion.button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next device"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-current/25 bg-[var(--surface-tint)] text-[var(--ink)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)]"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
