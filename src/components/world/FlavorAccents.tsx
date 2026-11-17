"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import type { RefObject } from "react";
import type { ProductWorldId } from "@/lib/product-themes";

interface FlavorAccentsProps {
  productId: ProductWorldId;
  accent: string;
  containerRef: RefObject<HTMLElement | null>;
}

export function FlavorAccents({
  productId,
  accent,
  containerRef,
}: FlavorAccentsProps) {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const driftUp = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const driftDown = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[5] overflow-hidden"
    >
      {/* Subtle vapor swirl behind the center product */}
      <motion.svg
        viewBox="0 0 600 600"
        fill="none"
        style={reduceMotion ? undefined : { y: driftUp }}
        className="absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 opacity-25 sm:h-[580px] sm:w-[580px]"
      >
        <path
          d="M110 390 C140 240, 260 220, 290 310 C320 400, 440 360, 480 200"
          stroke={accent}
          strokeWidth="26"
          strokeLinecap="round"
          opacity="0.35"
        />
        <path
          d="M140 240 C210 140, 380 160, 420 290 C455 400, 310 470, 210 410"
          stroke="#FFFFFF"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.32"
        />
      </motion.svg>

      <AnimatePresence mode="wait">
        <motion.div
          key={productId}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {/* 01: X-V2 Plus — Tri-mode geometric rings & chevrons */}
          {productId === "xv2-plus" && (
            <>
              <motion.svg
                viewBox="0 0 100 100"
                style={reduceMotion ? undefined : { y: driftUp }}
                animate={reduceMotion ? undefined : { rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute left-[14%] top-[22%] h-20 w-20 sm:left-[26%]"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#FFD23F"
                  strokeWidth="4"
                  strokeDasharray="10 8"
                  fill="none"
                />
                <circle cx="50" cy="50" r="10" fill="#FFD23F" />
              </motion.svg>
              <motion.svg
                viewBox="0 0 90 60"
                style={reduceMotion ? undefined : { y: driftDown }}
                animate={reduceMotion ? undefined : { x: [0, 8, 0] }}
                transition={{ duration: 4.4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[25%] right-[14%] h-12 w-16 sm:right-[25%]"
              >
                <path
                  d="M12 12 L32 30 L12 48 M36 12 L56 30 L36 48 M60 12 L80 30 L60 48"
                  stroke="#FFD23F"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </motion.svg>
            </>
          )}

          {/* 02: XFLAVA 70000 — Sharp cyan diamond sparks */}
          {productId === "xflava-70000" && (
            <>
              <motion.svg
                viewBox="0 0 80 80"
                style={reduceMotion ? undefined : { y: driftUp }}
                animate={reduceMotion ? undefined : { rotate: [0, 18, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-[15%] top-[24%] h-16 w-16 sm:left-[26%]"
              >
                <path
                  d="M40 4 L47 33 L76 40 L47 47 L40 76 L33 47 L4 40 L33 33 Z"
                  fill="#00E5FF"
                />
              </motion.svg>
              <motion.svg
                viewBox="0 0 80 80"
                style={reduceMotion ? undefined : { y: driftDown }}
                animate={reduceMotion ? undefined : { rotate: [0, -20, 0] }}
                transition={{ duration: 5.4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[24%] right-[14%] h-12 w-12 sm:right-[25%]"
              >
                <path
                  d="M40 4 L47 33 L76 40 L47 47 L40 76 L33 47 L4 40 L33 33 Z"
                  stroke="#00E5FF"
                  strokeWidth="4"
                  fill="none"
                />
              </motion.svg>
            </>
          )}

          {/* 03: Violet Eclipse — Eclipse crescent & orbital halo */}
          {productId === "violet-eclipse" && (
            <>
              <motion.svg
                viewBox="0 0 100 100"
                style={reduceMotion ? undefined : { y: driftUp }}
                animate={reduceMotion ? undefined : { rotate: [-8, 8, -8], y: [0, -10, 0] }}
                transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-[14%] top-[22%] h-20 w-20 sm:left-[26%]"
              >
                <path
                  d="M62 16 A36 36 0 1 0 84 64 A28 28 0 1 1 62 16 Z"
                  fill="#B6FF4D"
                />
              </motion.svg>
              <motion.div
                style={reduceMotion ? undefined : { y: driftDown }}
                animate={reduceMotion ? undefined : { scale: [1, 1.15, 1], y: [0, 10, 0] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[24%] right-[16%] h-12 w-12 rounded-full border-4 border-[#B6FF4D] bg-black/20 sm:right-[26%]"
              />
            </>
          )}

          {/* 04: Yellow Freeze — Snowflake hex crystals */}
          {productId === "yellow-freeze" && (
            <>
              <motion.svg
                viewBox="0 0 80 80"
                style={reduceMotion ? undefined : { y: driftUp }}
                animate={reduceMotion ? undefined : { rotate: [0, 30, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-[15%] top-[22%] h-16 w-16 sm:left-[26%]"
              >
                <path
                  d="M40 6 V74 M6 40 H74 M16 16 L64 64 M64 16 L16 64"
                  stroke="#1FD17A"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </motion.svg>
              <motion.svg
                viewBox="0 0 80 80"
                style={reduceMotion ? undefined : { y: driftDown }}
                animate={reduceMotion ? undefined : { rotate: [0, -25, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[24%] right-[15%] h-14 w-14 sm:right-[25%]"
              >
                <polygon
                  points="40,8 68,24 68,56 40,72 12,56 12,24"
                  stroke="#1FD17A"
                  strokeWidth="5"
                  fill="none"
                />
              </motion.svg>
            </>
          )}

          {/* 05: X-Slimbar — Diagonal speed pill bars */}
          {productId === "x-slimbar" && (
            <>
              <motion.div
                style={reduceMotion ? undefined : { y: driftUp }}
                animate={reduceMotion ? undefined : { y: [0, -10, 0], x: [0, 6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-[14%] top-[24%] flex -rotate-12 flex-col gap-2.5 sm:left-[25%]"
              >
                <span className="h-3.5 w-20 rounded-full bg-[#00F0B5]" />
                <span className="h-3.5 w-14 rounded-full bg-[#FFE5DE]" />
              </motion.div>
              <motion.div
                style={reduceMotion ? undefined : { y: driftDown }}
                animate={reduceMotion ? undefined : { y: [0, 10, 0] }}
                transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[25%] right-[14%] h-14 w-5 rotate-12 rounded-full border-4 border-[#00F0B5] sm:right-[25%]"
              />
            </>
          )}

          {/* 06: Black Elite 60000 — Watermelon slices */}
          {productId === "black-elite-60000" && (
            <>
              <motion.svg
                viewBox="0 0 120 80"
                style={reduceMotion ? undefined : { y: driftUp }}
                animate={reduceMotion ? undefined : { y: [0, -10, 0], rotate: [-14, -8, -14] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-[14%] top-[24%] h-16 w-24 drop-shadow-md sm:left-[26%]"
              >
                <path d="M10 15 A50 50 0 0 0 110 15 Z" fill="#B6FF4D" />
                <path d="M18 15 A42 42 0 0 0 102 15 Z" fill="#FF1E42" />
                <circle cx="44" cy="30" r="2.6" fill="#111111" />
                <circle cx="60" cy="38" r="2.6" fill="#111111" />
                <circle cx="76" cy="30" r="2.6" fill="#111111" />
              </motion.svg>
              <motion.svg
                viewBox="0 0 120 80"
                style={reduceMotion ? undefined : { y: driftDown }}
                animate={reduceMotion ? undefined : { y: [0, 12, 0], rotate: [16, 22, 16] }}
                transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[22%] right-[12%] h-14 w-20 drop-shadow-md sm:right-[24%]"
              >
                <path d="M10 15 A50 50 0 0 0 110 15 Z" fill="#B6FF4D" />
                <path d="M18 15 A42 42 0 0 0 102 15 Z" fill="#FF1E42" />
                <circle cx="48" cy="32" r="2.5" fill="#111111" />
                <circle cx="72" cy="32" r="2.5" fill="#111111" />
              </motion.svg>
            </>
          )}

          {/* 07: ZFLAVA 50000 — Botanical leaves & dewdrop */}
          {productId === "zflava-50000" && (
            <>
              <motion.svg
                viewBox="0 0 100 100"
                style={reduceMotion ? undefined : { y: driftUp }}
                animate={reduceMotion ? undefined : { y: [0, -12, 0], rotate: [-12, -4, -12] }}
                transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-[14%] top-[22%] h-20 w-20 sm:left-[26%]"
              >
                <path d="M15 80 C15 35, 50 15, 85 15 C85 50, 65 85, 15 80 Z" fill="#FFE14D" />
                <path d="M18 78 L78 22" stroke="#042016" strokeWidth="3.5" strokeLinecap="round" />
              </motion.svg>
              <motion.div
                style={reduceMotion ? undefined : { y: driftDown }}
                animate={reduceMotion ? undefined : { scale: [1, 1.14, 1], y: [0, 10, 0] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[24%] right-[16%] h-10 w-10 rounded-full bg-[#FFE14D] sm:right-[26%]"
              />
            </>
          )}

          {/* 08: XFLAVA Metal — Brushed alloy hex frames & copper bolts */}
          {productId === "xflava-metal" && (
            <>
              <motion.svg
                viewBox="0 0 100 100"
                style={reduceMotion ? undefined : { y: driftUp }}
                animate={reduceMotion ? undefined : { rotate: [0, 24, 0] }}
                transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-[14%] top-[22%] h-20 w-20 sm:left-[26%]"
              >
                <polygon
                  points="50,8 86,29 86,71 50,92 14,71 14,29"
                  stroke="#FF8A3D"
                  strokeWidth="6"
                  fill="none"
                />
                <circle cx="50" cy="50" r="14" stroke="#FF8A3D" strokeWidth="4" fill="none" />
              </motion.svg>
              <motion.div
                style={reduceMotion ? undefined : { y: driftDown }}
                animate={reduceMotion ? undefined : { rotate: [-18, -8, -18], y: [0, 10, 0] }}
                transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[24%] right-[14%] h-4 w-20 rounded-sm bg-[#FF8A3D] sm:right-[24%]"
              />
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
