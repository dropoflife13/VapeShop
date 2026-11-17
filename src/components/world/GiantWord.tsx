"use client";

import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { RefObject } from "react";

interface GiantWordProps {
  word: string;
  wordColor: string;
  wordStroke?: string;
  containerRef: RefObject<HTMLElement | null>;
}

export function GiantWord({
  word,
  wordColor,
  wordStroke,
  containerRef,
}: GiantWordProps) {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const letters = word.split("");

  return (
    <motion.div
      aria-hidden="true"
      style={reduceMotion ? undefined : { y: parallaxY }}
      className="pointer-events-none absolute inset-x-0 top-1/2 z-0 flex -translate-y-1/2 select-none items-center justify-center overflow-hidden px-2"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={word}
          initial={reduceMotion ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="flex w-full justify-center whitespace-nowrap font-display text-[clamp(6.2rem,24vw,26rem)] uppercase leading-[0.82] tracking-[-0.04em]"
          style={{
            color: wordColor,
            WebkitTextStroke: wordStroke ? `2px ${wordStroke}` : undefined,
          }}
        >
          {letters.map((char, idx) => (
            <motion.span
              key={`${word}-${idx}`}
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 48, rotate: idx % 2 === 0 ? -4 : 4 }
              }
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0.2 }
                  : {
                      type: "spring",
                      stiffness: 220,
                      damping: 20,
                      delay: idx * 0.032,
                    }
              }
              className="inline-block"
            >
              {char}
            </motion.span>
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
