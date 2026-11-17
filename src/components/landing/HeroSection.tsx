"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { SHOWCASE_DEVICES, type ShowcaseDeviceId } from "@/lib/theme";
import { buttonVariants } from "@/components/ui/button";
import { OrbitLines } from "@/components/landing/OrbitLines";
import { Ruler } from "@/components/landing/Ruler";
import { Ticker } from "@/components/landing/Ticker";
import { Product3DViewer } from "@/components/Product3DViewer";

export function HeroSection() {
  const [activeId, setActiveId] = useState<ShowcaseDeviceId>("x-slimbar");
  const activeIndex = Math.max(
    0,
    SHOWCASE_DEVICES.findIndex((d) => d.id === activeId)
  );

  return (
    <div className="flex flex-col lg:min-h-[calc(100vh-4.5rem)] lg:justify-between">
      <section className="relative flex flex-1 items-center overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200">
        <OrbitLines />
        <Ruler activeIndex={activeIndex} />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl -translate-y-1 items-center gap-6 px-6 py-5 lg:grid-cols-12 lg:py-6">
          {/* Left column: Editorial headline & CTAs */}
          <div className="lg:col-span-6">
            <div className="animate-fade-up inline-flex items-center gap-2.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-glass)] px-3.5 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F58A1F] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E86F12]" />
              </span>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                VAPEVAULT &bull; 18+ ADULT STOREFRONT
              </span>
            </div>

            <h1 className="mt-5 flex flex-col">
              <span className="animate-fade-up font-display text-[clamp(4rem,8.4vw,6.8rem)] uppercase leading-[0.88] tracking-tight text-[var(--text-primary)] [animation-delay:80ms]">
                OWN THE
              </span>
              <span className="animate-fade-up font-serif text-[clamp(3.8rem,8vw,6.4rem)] font-light italic leading-[0.95] tracking-tight [animation-delay:180ms]">
                <span className="bg-gradient-to-r from-[#E86F12] via-[#F58A1F] to-[#FFE0B2] bg-clip-text text-transparent">
                  cloud.
                </span>
              </span>
            </h1>

            <p className="animate-fade-up mt-6 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--text-muted)] [animation-delay:320ms]">
              AUTHENTIC DEVICES &middot; LIVE STOCK &middot; 1-HR EXPRESS PICKUP
            </p>

            <div className="animate-fade-up mt-8 flex flex-wrap items-center gap-3 [animation-delay:400ms]">
              <Link
                href="/reservations"
                className={buttonVariants({
                  variant: "primary",
                  size: "lg",
                  className: "animate-cta-glow font-mono",
                })}
              >
                RESERVE IN-STORE PICKUP
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <Link
                href="#shops"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className: "font-mono",
                })}
              >
                <MapPin className="h-4 w-4 text-[#E86F12] dark:text-[#F58A1F]" aria-hidden="true" />
                AVAILABLE SHOPS
              </Link>
            </div>

            <div className="animate-fade-up mt-4 [animation-delay:460ms]">
              <Link
                href="/register-shop"
                className="inline-flex items-center font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--text-muted)] transition-colors duration-200 hover:text-[#E86F12] dark:hover:text-[#F58A1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F58A1F]"
              >
                PARTNER YOUR SHOP &rarr;
              </Link>
            </div>
          </div>

          {/* Right column: Scaled interactive 3D showcase + floating product cards */}
          <div className="lg:col-span-6">
            <Product3DViewer
              activeId={activeId}
              onSelectDevice={setActiveId}
            />
          </div>
        </div>
      </section>

      <Ticker />
    </div>
  );
}
