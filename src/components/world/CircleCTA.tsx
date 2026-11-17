"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

interface CircleCTAProps {
  accent: string;
  accentInk: string;
}

export function CircleCTA({ accent, accentInk }: CircleCTAProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col items-end gap-2.5">
      <motion.div
        whileHover={reduceMotion ? undefined : { scale: 1.07 }}
        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
      >
        <Link
          href="/reservations"
          aria-label="Reserve in-store pickup"
          style={{ backgroundColor: accent, color: accentInk }}
          className="group relative flex h-28 w-28 items-center justify-center rounded-full shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ink)] sm:h-32 sm:w-32"
        >
          {/* Rotating circular text ring */}
          <svg
            viewBox="0 0 140 140"
            aria-hidden="true"
            className="spin-ring pointer-events-none absolute inset-0 h-full w-full"
          >
            <defs>
              <path
                id="reserve-ring-path"
                d="M 70, 70 m -52, 0 a 52,52 0 1,1 104,0 a 52,52 0 1,1 -104,0"
              />
            </defs>
            <text
              fill="currentColor"
              className="font-mono text-[9.5px] font-bold uppercase tracking-[0.22em]"
            >
              <textPath href="#reserve-ring-path" startOffset="0%">
                RESERVE PICKUP &bull; 1-HR EXPRESS &bull;
              </textPath>
            </text>
          </svg>

          <span className="relative z-10 flex flex-col items-center text-center">
            <ArrowUpRight
              className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
            <span className="mt-0.5 font-mono text-[10px] font-extrabold uppercase leading-tight tracking-[0.14em]">
              RESERVE
              <br />
              PICKUP
            </span>
          </span>
        </Link>
      </motion.div>

      <Link
        href="#shops"
        className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink)] underline decoration-2 underline-offset-4 transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)]"
      >
        Available shops &darr;
      </Link>
    </div>
  );
}
