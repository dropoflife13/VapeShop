"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export function Hero3DDevice() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const ry = (x - 0.5) * 16;
    const rx = (0.5 - y) * 14;
    setTilt({ rx, ry, gx: Math.round(x * 100), gy: Math.round(y * 100) });
  }

  function handlePointerLeave() {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 });
  }

  return (
    <div
      className="w-full max-w-md"
      style={{ perspective: "1100px" }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div
        ref={cardRef}
        className="relative rounded-3xl border border-white/20 bg-[#071A52]/85 p-6 text-white shadow-2xl shadow-black/40 backdrop-blur-xl transition-transform duration-200 ease-out dark:bg-[#071A52]/80"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        }}
      >
        {/* Dynamic specular highlight layer */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-50 transition-opacity duration-200"
          style={{
            background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(245, 138, 31, 0.28), transparent 60%)`,
          }}
        />

        {/* Floating 3D Logo & Device Preview */}
        <div
          className="relative flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#05143E]/80 p-4"
          style={{ transform: "translateZ(24px)" }}
        >
          <div className="flex items-center gap-3">
            <img
              src="/images/logo-dark.png"
              alt="VapeVault 3D Emblem"
              width={44}
              height={44}
              className="h-11 w-11 object-contain drop-shadow-[0_6px_14px_rgba(245,138,31,0.45)]"
            />
            <div>
              <Badge variant="amber">EXPRESS PICKUP PASS</Badge>
              <p className="mt-1.5 font-display text-2xl uppercase tracking-wide text-white">
                Zero Line. Live Stock.
              </p>
            </div>
          </div>
        </div>

        {/* 3D Depth Metrics */}
        <ul
          className="relative mt-5 space-y-2.5 text-xs text-blue-100/90"
          style={{ transform: "translateZ(36px)" }}
        >
          <li className="flex items-center justify-between border-b border-white/10 pb-2">
            <span>Pickup Hold Window</span>
            <span className="font-bold text-[#F58A1F]">60 Minutes</span>
          </li>
          <li className="flex items-center justify-between border-b border-white/10 pb-2">
            <span>Authenticity Check</span>
            <span className="font-bold text-white">Serial + QR</span>
          </li>
          <li className="flex items-center justify-between">
            <span>Accepted 18+ PH IDs</span>
            <span className="font-bold text-white">10 Valid IDs</span>
          </li>
        </ul>

        <div className="relative mt-5" style={{ transform: "translateZ(48px)" }}>
          <Link
            href="#shops"
            className={buttonVariants({
              variant: "primary",
              size: "sm",
              className: "w-full",
            })}
          >
            Browse Available Shops &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
