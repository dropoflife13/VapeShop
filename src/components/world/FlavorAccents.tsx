"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
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

      {productId === "black-elite-60000" && (
        <>
          {/* Watermelon slices */}
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

      {productId === "zflava-50000" && (
        <>
          {/* Botanical leaves & bubbles */}
          <motion.svg
            viewBox="0 0 100 100"
            style={reduceMotion ? undefined : { y: driftUp }}
            animate={reduceMotion ? undefined : { y: [0, -12, 0], rotate: [-12, -4, -12] }}
            transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[14%] top-[22%] h-20 w-20 sm:left-[26%]"
          >
            <path d="M15 80 C15 35, 50 15, 85 15 C85 50, 65 85, 15 80 Z" fill="#1FD17A" />
            <path d="M18 78 L78 22" stroke="#111111" strokeWidth="3" strokeLinecap="round" />
          </motion.svg>
          <motion.div
            style={reduceMotion ? undefined : { y: driftDown }}
            animate={reduceMotion ? undefined : { scale: [1, 1.14, 1], y: [0, 10, 0] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[24%] right-[16%] h-12 w-12 rounded-full border-4 border-[#1FD17A] bg-white/30 sm:right-[26%]"
          />
          <motion.div
            animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-[20%] top-[28%] h-6 w-6 rounded-full bg-[#1FD17A]"
          />
        </>
      )}

      {productId === "xflava-metal" && (
        <>
          {/* Cyan geometric sparks */}
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

      {productId === "x-slimbar" && (
        <>
          {/* Soft geometric blobs */}
          <motion.div
            style={reduceMotion ? undefined : { y: driftUp }}
            animate={reduceMotion ? undefined : { y: [0, -12, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[15%] top-[24%] h-16 w-20 rounded-[44%_56%_62%_38%/48%_40%_60%_52%] bg-[#FFD23F]/85 sm:left-[26%]"
          />
          <motion.div
            style={reduceMotion ? undefined : { y: driftDown }}
            animate={reduceMotion ? undefined : { y: [0, 10, 0], rotate: [0, -12, 0] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[25%] right-[14%] h-14 w-14 rounded-[58%_42%_45%_55%/44%_62%_38%_56%] border-4 border-[#FFD23F] bg-[#E9ECFF]/30 sm:right-[25%]"
          />
        </>
      )}
    </div>
  );
}
