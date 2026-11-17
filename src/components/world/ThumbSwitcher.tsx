"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { ProductTheme, ProductWorldId } from "@/lib/product-themes";
import { cn } from "@/lib/utils";

interface ThumbSwitcherProps {
  products: ProductTheme[];
  activeId: ProductWorldId;
  onSelect: (id: ProductWorldId) => void;
}

export function ThumbSwitcher({
  products,
  activeId,
  onSelect,
}: ThumbSwitcherProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      role="tablist"
      aria-label="Choose product world"
      className="flex items-center gap-3 sm:gap-4"
    >
      {products.map((item) => {
        const isActive = item.id === activeId;
        return (
          <motion.button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`Switch to ${item.name} (${item.flavor})`}
            onClick={() => onSelect(item.id)}
            whileHover={reduceMotion ? undefined : { scale: isActive ? 1.14 : 1.08 }}
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
  );
}
