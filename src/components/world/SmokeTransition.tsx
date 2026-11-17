"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface SmokeTransitionProps {
  triggerKey: string;
  accent: string;
}

const PLUMES = [
  { id: 0, dx: -180, dy: -90, scale: 1.9, delay: 0, size: "h-64 w-64", tint: false },
  { id: 1, dx: 190, dy: -110, scale: 2.0, delay: 0.04, size: "h-72 w-72", tint: true },
  { id: 2, dx: -140, dy: 120, scale: 1.85, delay: 0.06, size: "h-60 w-60", tint: true },
  { id: 3, dx: 160, dy: 110, scale: 2.1, delay: 0.03, size: "h-72 w-72", tint: false },
  { id: 4, dx: 0, dy: -40, scale: 2.35, delay: 0, size: "h-80 w-80", tint: false },
] as const;

export function SmokeTransition({ triggerKey, accent }: SmokeTransitionProps) {
  const reduceMotion = useReducedMotion();
  const isFirstRender = useRef(true);
  const [burstId, setBurstId] = useState<string | null>(null);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (reduceMotion) return;
    setBurstId(`${triggerKey}-${Date.now()}`);
    const timer = window.setTimeout(() => setBurstId(null), 820);
    return () => window.clearTimeout(timer);
  }, [triggerKey, reduceMotion]);

  if (reduceMotion) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[15] flex items-center justify-center overflow-hidden"
    >
      <AnimatePresence>
        {burstId ? (
          <motion.div
            key={burstId}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.78, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex items-center justify-center"
          >
            {PLUMES.map((plume) => (
              <motion.div
                key={plume.id}
                initial={{
                  x: 0,
                  y: 20,
                  scale: 0.35,
                  opacity: 0.65,
                }}
                animate={{
                  x: plume.dx,
                  y: plume.dy,
                  scale: plume.scale,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.75,
                  delay: plume.delay,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  background: plume.tint
                    ? `radial-gradient(circle, ${accent}66 0%, ${accent}22 45%, transparent 72%)`
                    : "radial-gradient(circle, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.18) 45%, transparent 72%)",
                }}
                className={`absolute rounded-full blur-2xl ${plume.size}`}
              />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
