"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  getProductThemeCssVars,
  PRODUCT_THEMES,
  type ProductTheme,
  type ProductWorldId,
} from "@/lib/product-themes";
import { GiantWord } from "@/components/world/GiantWord";
import { FlavorAccents } from "@/components/world/FlavorAccents";
import { SmokeTransition } from "@/components/world/SmokeTransition";
import { CircleCTA } from "@/components/world/CircleCTA";
import { ThumbSwitcher } from "@/components/world/ThumbSwitcher";
import { Marquee } from "@/components/world/Marquee";

interface ProductWorldProps {
  activeId: ProductWorldId;
  onSelect: (id: ProductWorldId) => void;
}

const NAV_ITEMS = [
  { href: "#shops", label: "Shops" },
  { href: "/reservations", label: "Reserve" },
  { href: "#verify", label: "Verify Serial" },
  { href: "/register-shop", label: "For Shops" },
] as const;

export function ProductWorld({ activeId, onSelect }: ProductWorldProps) {
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const swipeStartX = useRef<number | null>(null);

  const [prevTheme, setPrevTheme] = useState<ProductTheme>(PRODUCT_THEMES[0]!);
  const [show3D, setShow3D] = useState(true);
  const [viewerLoaded, setViewerLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeIndex = Math.max(
    0,
    PRODUCT_THEMES.findIndex((t) => t.id === activeId)
  );
  const active = PRODUCT_THEMES[activeIndex] ?? PRODUCT_THEMES[0]!;
  const cssVars = getProductThemeCssVars(active);

  const handleSelect = useCallback(
    (nextId: ProductWorldId) => {
      if (nextId === activeId) return;
      setPrevTheme(active);
      setShow3D(true);
      setViewerLoaded(false);
      onSelect(nextId);
    },
    [active, activeId, onSelect]
  );

  const stepProduct = useCallback(
    (delta: number) => {
      const nextIdx =
        (activeIndex + delta + PRODUCT_THEMES.length) % PRODUCT_THEMES.length;
      const next = PRODUCT_THEMES[nextIdx];
      if (next) handleSelect(next.id);
    },
    [activeIndex, handleSelect]
  );

  // Keyboard arrow navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        stepProduct(1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        stepProduct(-1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stepProduct]);

  // Pointer tilt for hero cutout
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const tiltX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7, -7]), {
    stiffness: 180,
    damping: 20,
  });
  const tiltY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), {
    stiffness: 180,
    damping: 20,
  });

  // Scroll-linked subtle product rotation
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const scrollRotate = useTransform(scrollYProgress, [0, 1], [0, 10]);

  return (
    <section
      ref={heroRef}
      style={{
        ...(cssVars as React.CSSProperties),
        backgroundColor: prevTheme.bg,
      }}
      onPointerMove={(e) => {
        if (reduceMotion || show3D) return;
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
        mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onTouchStart={(e) => {
        swipeStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (swipeStartX.current === null) return;
        const endX = e.changedTouches[0]?.clientX ?? swipeStartX.current;
        const dx = endX - swipeStartX.current;
        swipeStartX.current = null;
        if (Math.abs(dx) > 48) {
          stepProduct(dx < 0 ? 1 : -1);
        }
      }}
      className="relative flex min-h-screen flex-col justify-between overflow-hidden text-[var(--ink)]"
    >
      {/* Circular clip-path wipe layer */}
      <AnimatePresence mode="sync">
        <motion.div
          key={active.id}
          aria-hidden="true"
          initial={
            reduceMotion
              ? { opacity: 0 }
              : { clipPath: "circle(0% at 50% 50%)" }
          }
          animate={
            reduceMotion
              ? { opacity: 1 }
              : { clipPath: "circle(150% at 50% 50%)" }
          }
          transition={
            reduceMotion
              ? { duration: 0.25 }
              : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
          }
          style={{ backgroundColor: active.bg }}
          className="pointer-events-none absolute inset-0 z-0"
        />
      </AnimatePresence>

      {/* Top Floating Nav Bar */}
      <header className="relative z-30 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 pt-5 sm:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-full bg-[var(--surface-tint)] px-3.5 py-2 backdrop-blur-md transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)]"
          >
            <img
              src="/images/logo-light.png"
              alt="VapeVault Logo"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
            <span className="font-display text-lg uppercase tracking-wider text-[var(--ink)]">
              VAPEVAULT
            </span>
          </Link>

          <span className="hidden items-center gap-2 rounded-full border border-current/20 bg-[var(--surface-tint)] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink)] backdrop-blur-md sm:inline-flex">
            18+ ADULT STOREFRONT
          </span>
        </div>

        {/* Desktop floating pill nav */}
        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 rounded-full border border-current/15 bg-[var(--surface-tint)] p-1.5 backdrop-blur-md md:flex"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink)] transition-colors hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)]"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/auth"
            style={{ backgroundColor: active.accent, color: active.accentInk }}
            className="ml-1 rounded-full px-4 py-1.5 font-mono text-[11px] font-extrabold uppercase tracking-[0.14em] shadow-sm transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)]"
          >
            Sign In
          </Link>
        </nav>

        {/* Mobile menu toggle */}
        <button
          type="button"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-current/20 bg-[var(--surface-tint)] text-[var(--ink)] backdrop-blur-md md:hidden"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-between bg-[var(--bg)] p-6 text-[var(--ink)] md:hidden">
          <div className="flex items-center justify-between">
            <span className="font-display text-2xl uppercase">VAPEVAULT</span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-current/25"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-2xl border border-current/20 bg-[var(--surface-tint)] px-5 py-4 font-display text-3xl uppercase tracking-wide"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/auth"
              onClick={() => setMobileMenuOpen(false)}
              style={{ backgroundColor: active.accent, color: active.accentInk }}
              className="mt-2 rounded-full py-4 text-center font-mono text-sm font-extrabold uppercase tracking-widest"
            >
              Sign In
            </Link>
          </nav>
          <p className="font-mono text-xs uppercase tracking-widest">
            18+ ADULT STOREFRONT &middot; AUTHENTIC DEVICES ONLY
          </p>
        </div>
      )}

      {/* Main Hero Stage: Giant Word + Flavor Accents + Centered 3D Model */}
      <div className="relative flex flex-1 items-center justify-center px-5 py-2 sm:px-8">
        <GiantWord
          word={active.word}
          wordColor={active.wordColor}
          wordStroke={active.wordStroke}
          containerRef={heroRef}
        />

        <FlavorAccents
          productId={active.id}
          accent={active.accent}
          containerRef={heroRef}
        />

        <SmokeTransition triggerKey={active.id} accent={active.accent} />

        <div className="relative z-10 flex w-full max-w-5xl flex-col items-center justify-center">
          <div className="relative flex h-[320px] w-full max-w-[440px] items-center justify-center sm:h-[400px]">
            {!show3D ? (
              <motion.div
                key={active.id}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
                animate={
                  reduceMotion
                    ? { opacity: 1 }
                    : { opacity: 1, scale: 1, y: [0, -10, 0] }
                }
                transition={
                  reduceMotion
                    ? { duration: 0.25 }
                    : {
                        opacity: { duration: 0.35 },
                        scale: { type: "spring", stiffness: 220, damping: 20 },
                        y: { duration: 4.6, repeat: Infinity, ease: "easeInOut" },
                      }
                }
                style={
                  reduceMotion
                    ? undefined
                    : {
                        rotateX: tiltX,
                        rotateY: tiltY,
                        rotateZ: scrollRotate,
                        transformPerspective: 900,
                      }
                }
                className="relative flex items-center justify-center"
              >
                <div
                  aria-hidden="true"
                  className="absolute -bottom-6 h-10 w-44 rounded-full bg-black/35 blur-xl"
                />
                <Image
                  src={active.image}
                  alt={`${active.name} — ${active.flavor}`}
                  width={360}
                  height={540}
                  priority
                  className="h-[290px] w-auto select-none object-contain drop-shadow-[0_28px_32px_rgba(0,0,0,0.42)] sm:h-[380px]"
                />
              </motion.div>
            ) : (
              <motion.div
                key={active.viewerSrc}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="relative h-full w-full"
              >
                {!viewerLoaded && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="rounded-full bg-black/70 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md">
                      Loading 3D View...
                    </span>
                  </div>
                )}
                <iframe
                  src={active.viewerSrc}
                  title={`${active.name} 3D Viewer`}
                  onLoad={() => setViewerLoaded(true)}
                  className={`h-full w-full border-0 bg-transparent transition-all duration-500 ease-out ${
                    viewerLoaded ? "scale-100 opacity-100" : "scale-95 opacity-0"
                  }`}
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Dock: Product Info + Specs + ThumbSwitcher + CircleCTA */}
      <div className="relative z-20 mx-auto grid w-full max-w-7xl items-end gap-5 px-5 pb-5 sm:px-8 lg:grid-cols-12">
        {/* Bottom-left: Product info + ThumbSwitcher */}
        <div className="flex flex-col gap-[22px] lg:col-span-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-current/20 bg-[var(--surface-tint)] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur-md sm:hidden">
              18+ ADULT STOREFRONT
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mt-2 flex flex-wrap items-baseline gap-3">
                  <span className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-[var(--ink)]">
                    {active.number} / {String(PRODUCT_THEMES.length).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                    {active.flavor}
                  </span>
                </div>
                <h1 className="mt-1 font-display text-4xl uppercase leading-[0.95] tracking-tight sm:text-5xl">
                  {active.name}
                </h1>
                <p className="mt-1.5 max-w-md text-sm font-medium leading-snug text-[var(--ink)]">
                  {active.tagline}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <ThumbSwitcher
            products={PRODUCT_THEMES}
            activeId={active.id}
            onSelect={handleSelect}
          />
        </div>

        {/* Bottom-center: Spec callouts */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="hidden flex-wrap items-center justify-center gap-3 lg:col-span-4 lg:flex"
          >
            {[
              { label: "CAPACITY", value: active.specs.puffs },
              { label: "CHASSIS", value: active.specs.finish },
              { label: "DISPLAY", value: active.specs.display },
            ].map((spec) => (
              <div
                key={spec.label}
                className="rounded-2xl border border-current/20 bg-[var(--surface-tint)] px-3.5 py-2.5 backdrop-blur-md"
              >
                <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                  {spec.label}
                </span>
                <span className="mt-0.5 block font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
                  {spec.value}
                </span>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Bottom-right: CircleCTA */}
        <div className="flex justify-end lg:col-span-3">
          <CircleCTA accent={active.accent} accentInk={active.accentInk} />
        </div>
      </div>

      {/* Bottom Edge: Checkered accent stripe + Fast Marquee */}
      <div className="relative z-20">
        <Marquee />
      </div>
    </section>
  );
}
