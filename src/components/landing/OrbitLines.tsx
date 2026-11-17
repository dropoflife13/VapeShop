"use client";

import { useEffect, useRef } from "react";

interface SmokePuff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  phase: number;
  speed: number;
  warm: boolean;
}

export function OrbitLines() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = 0;
    let height = 0;
    let rafId = 0;

    const puffs: SmokePuff[] = Array.from({ length: 20 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00022,
      vy: -(0.00018 + Math.random() * 0.00028),
      radius: 160 + Math.random() * 240,
      alpha: 0.06 + Math.random() * 0.08,
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.6,
      warm: i % 4 === 0,
    }));

    function resize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = canvas.clientWidth || window.innerWidth;
      height = canvas.clientHeight || 640;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(time: number) {
      if (!ctx || width === 0 || height === 0) return;
      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains("dark");
      const t = time * 0.001;

      for (const p of puffs) {
        if (!reduceMotion) {
          p.x += p.vx + Math.sin(t * p.speed + p.phase) * 0.00018;
          p.y += p.vy;
          if (p.y < -0.25) {
            p.y = 1.25;
            p.x = Math.random();
          }
          if (p.x < -0.2) p.x = 1.2;
          if (p.x > 1.2) p.x = -0.2;
        }

        const cx = p.x * width;
        const cy = p.y * height;
        const r =
          p.radius * (1 + 0.08 * Math.sin(t * p.speed * 0.8 + p.phase));

        const grad = ctx.createRadialGradient(cx, cy, r * 0.06, cx, cy, r);
        if (p.warm) {
          const a = isDark ? p.alpha * 1.15 : p.alpha * 0.8;
          grad.addColorStop(0, `rgba(245, 138, 31, ${a})`);
          grad.addColorStop(0.5, `rgba(232, 111, 18, ${a * 0.4})`);
          grad.addColorStop(1, "rgba(232, 111, 18, 0)");
        } else {
          const a = isDark ? p.alpha : p.alpha * 0.65;
          grad.addColorStop(0, `rgba(191, 219, 254, ${a})`);
          grad.addColorStop(0.5, `rgba(96, 165, 250, ${a * 0.35})`);
          grad.addColorStop(1, "rgba(59, 130, 246, 0)");
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduceMotion && !document.hidden) {
        rafId = requestAnimationFrame(draw);
      }
    }

    resize();
    rafId = requestAnimationFrame(draw);

    const onResize = () => resize();
    const onVisibility = () => {
      if (!document.hidden && !reduceMotion) {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(draw);
      }
    };

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Base cobalt & warm amber ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_45%,rgba(232,111,18,0.14),transparent_55%),radial-gradient(ellipse_at_20%_25%,rgba(37,99,235,0.16),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_72%_45%,rgba(232,111,18,0.22),transparent_55%),radial-gradient(ellipse_at_22%_28%,rgba(29,78,216,0.32),transparent_62%)]" />

      {/* Dynamic moving vapor / smoke canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
