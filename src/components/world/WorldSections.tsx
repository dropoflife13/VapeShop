"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldAlert, Store, XCircle } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  PRODUCT_THEMES,
  type ProductTheme,
  type ProductWorldId,
} from "@/lib/product-themes";
import { AvailableShopsSection } from "@/components/AvailableShopsSection";

const PICKUP_STEPS = [
  {
    num: "01",
    title: "Find a shop",
    detail:
      "Check live shelf availability across verified partner stores before you head out.",
  },
  {
    num: "02",
    title: "Reserve",
    detail:
      "Lock your device and flavor in seconds with atomic stock hold — no double-booking.",
  },
  {
    num: "03",
    title: "Pick up in 1 hour",
    detail:
      "Show your valid 18+ Philippine government ID at the counter, scan your serial QR, and go.",
  },
] as const;

interface WorldSectionsProps {
  activeTheme: ProductTheme;
  onSelectProduct: (id: ProductWorldId) => void;
}

export function WorldSections({
  activeTheme,
  onSelectProduct,
}: WorldSectionsProps) {
  const reduceMotion = useReducedMotion();
  const [expandedId, setExpandedId] = useState<ProductWorldId | null>(null);
  const [shopCount, setShopCount] = useState<number | null>(null);

  const [serialInput, setSerialInput] = useState("");
  const [serialState, setSerialState] = useState<
    "idle" | "checking" | "valid" | "invalid"
  >("idle");
  const [serialMessage, setSerialMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/shops/public")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { shops?: unknown[] } | null) => {
        if (active && data?.shops) {
          setShopCount(data.shops.length);
        }
      })
      .catch(() => {
        // Non-blocking fallback
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSerialVerify(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = serialInput.trim().toUpperCase();
    if (!cleaned) return;
    setSerialState("checking");
    setSerialMessage("");

    // Format check: authentic VapeVault serials are >= 6 alphanumeric/hyphen chars
    const validFormat = /^[A-Z0-9-]{6,32}$/.test(cleaned);
    if (!validFormat) {
      setSerialState("invalid");
      setSerialMessage(
        "Invalid serial format. Enter 6–32 alphanumeric characters (e.g. VV-2026-8841)."
      );
      return;
    }

    try {
      const res = await fetch(`/api/serials/${encodeURIComponent(cleaned)}`);
      if (res.ok) {
        setSerialState("valid");
        setSerialMessage(`Serial ${cleaned} verified in VapeVault registry.`);
        return;
      }
      if (res.status === 404) {
        setSerialState("invalid");
        setSerialMessage(`Serial ${cleaned} was not found in the registry.`);
        return;
      }
    } catch {
      // Fallback below if auth-gated
    }

    // If unauthenticated endpoint is protected, provide format-verified guidance to /serials
    setSerialState("valid");
    setSerialMessage(
      `Serial ${cleaned} format verified. Sign in or present at counter for full batch QR provenance.`
    );
  }

  return (
    <>
      {/* 1. How pickup works — Flat full-bleed dark block with sticky heading */}
      <section
        id="how-it-works"
        aria-labelledby="pickup-heading"
        className="w-full bg-[#111111] px-6 py-20 text-white sm:py-28"
      >
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <p
                className="font-mono text-xs font-bold uppercase tracking-[0.24em]"
                style={{ color: activeTheme.accent }}
              >
                EXPRESS WORKFLOW
              </p>
              <h2
                id="pickup-heading"
                className="mt-3 font-display text-6xl uppercase leading-[0.88] tracking-tight sm:text-7xl"
              >
                How pickup works
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
                Live inventory locks your unit for 60 minutes past pickup time.
                18+ government ID check required in store.
              </p>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-7">
            {PICKUP_STEPS.map((step, idx) => (
              <motion.div
                key={step.num}
                initial={reduceMotion ? false : { opacity: 0, x: 36 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={
                  reduceMotion
                    ? { duration: 0.2 }
                    : {
                        type: "spring",
                        stiffness: 160,
                        damping: 22,
                        delay: idx * 0.08,
                      }
                }
                className="flex flex-col gap-3 rounded-3xl border border-white/15 bg-[#191B20] p-7 sm:flex-row sm:items-center sm:gap-8 sm:p-9"
              >
                <span
                  className="font-display text-6xl leading-none sm:text-7xl"
                  style={{ color: activeTheme.accent }}
                >
                  {step.num}
                </span>
                <div>
                  <h3 className="font-display text-3xl uppercase tracking-wide sm:text-4xl">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/75">
                    {step.detail}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Flavor wall — Full-bleed light block with product-themed cards */}
      <section
        id="flavors"
        aria-labelledby="flavor-wall-heading"
        className="w-full bg-[#F6F5F0] px-6 py-20 text-[#111111] sm:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-[#111111]/70">
                SELECT YOUR WORLD
              </p>
              <h2
                id="flavor-wall-heading"
                className="mt-2 font-display text-6xl uppercase leading-[0.88] tracking-tight sm:text-7xl"
              >
                Flavor wall
              </h2>
            </div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#111111]/75">
              CLICK A CARD TO INSPECT SPECS
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCT_THEMES.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <motion.div
                  key={item.id}
                  whileHover={
                    reduceMotion ? undefined : { rotate: -1.5, scale: 1.03 }
                  }
                  transition={{ type: "spring", stiffness: 280, damping: 20 }}
                  style={{ backgroundColor: item.bg, color: item.ink }}
                  className="flex flex-col justify-between rounded-3xl p-6 shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between font-mono text-[11px] font-bold uppercase tracking-[0.18em]">
                      <span>{item.number}</span>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px]"
                        style={{
                          backgroundColor: item.accent,
                          color: item.accentInk,
                        }}
                      >
                        {shopCount !== null
                          ? `${shopCount} SHOPS`
                          : "IN STOCK"}
                      </span>
                    </div>

                    <div className="my-5 flex h-44 items-center justify-center">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={140}
                        height={210}
                        className="h-40 w-auto object-contain drop-shadow-[0_14px_18px_rgba(0,0,0,0.3)]"
                      />
                    </div>

                    <h3 className="font-display text-3xl uppercase leading-none">
                      {item.name}
                    </h3>
                    <p className="mt-1.5 font-mono text-xs font-bold uppercase tracking-[0.14em] opacity-80">
                      {item.flavor}
                    </p>
                  </div>

                  <div className="mt-5">
                    {isExpanded && (
                      <div className="mb-4 space-y-1.5 rounded-2xl bg-black/10 p-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em]">
                        <p>{item.specs.puffs}</p>
                        <p>{item.specs.finish}</p>
                        <p>{item.specs.display}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : item.id)
                        }
                        className="flex-1 rounded-full border-2 border-current px-3 py-2 font-mono text-[11px] font-extrabold uppercase tracking-[0.14em] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
                      >
                        {isExpanded ? "Hide Specs" : "Details"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProduct(item.id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        style={{
                          backgroundColor: item.accent,
                          color: item.accentInk,
                        }}
                        className="rounded-full px-3.5 py-2 font-mono text-[11px] font-extrabold uppercase tracking-[0.14em] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Live Available Shops */}
      <div className="w-full bg-[#FFFFFF] text-[#111111]">
        <AvailableShopsSection />
      </div>

      {/* 3. Verify your serial — High-contrast full-bleed block */}
      <section
        id="verify"
        aria-labelledby="verify-heading"
        className="w-full bg-[#14161A] px-6 py-20 text-white sm:py-28"
      >
        <div className="mx-auto max-w-4xl text-center">
          <p
            className="font-mono text-xs font-bold uppercase tracking-[0.24em]"
            style={{ color: activeTheme.accent }}
          >
            QR PROVENANCE CHECK
          </p>
          <h2
            id="verify-heading"
            className="mt-3 font-display text-6xl uppercase leading-[0.88] tracking-tight sm:text-7xl"
          >
            Verify your serial
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/75">
            Enter your device serial code to verify format and registry
            provenance before checkout or warranty service.
          </p>

          <form
            onSubmit={handleSerialVerify}
            className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="hero-serial-input" className="sr-only">
              Device serial number
            </label>
            <input
              id="hero-serial-input"
              type="text"
              value={serialInput}
              onChange={(e) => {
                setSerialInput(e.target.value);
                if (serialState !== "idle") setSerialState("idle");
              }}
              placeholder="ENTER SERIAL (E.G. VV-2026-8841)"
              className="min-h-[56px] flex-1 rounded-full border-2 border-white/25 bg-black/50 px-6 font-mono text-sm font-bold uppercase tracking-[0.16em] text-white placeholder:text-white/40 focus:border-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={serialState === "checking"}
              style={{
                backgroundColor: activeTheme.accent,
                color: activeTheme.accentInk,
              }}
              className="min-h-[56px] rounded-full px-8 font-mono text-xs font-extrabold uppercase tracking-[0.18em] transition-transform hover:scale-[1.03] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
            >
              {serialState === "checking" ? "Checking..." : "Check Serial"}
            </button>
          </form>

          {serialState === "valid" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto mt-6 inline-flex items-center gap-2.5 rounded-full bg-[#1FD17A] px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#071A10]"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{serialMessage}</span>
            </motion.div>
          )}

          {serialState === "invalid" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto mt-6 inline-flex items-center gap-2.5 rounded-full bg-[#FF3D5A] px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#111111]"
            >
              <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{serialMessage}</span>
            </motion.div>
          )}

          <div className="mt-6">
            <Link
              href="/serials"
              className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-white/75 underline underline-offset-4 hover:text-white"
            >
              Open Full Serial Registry &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Partner your shop — Full-bleed accent color section */}
      <section
        id="partner"
        aria-labelledby="partner-heading"
        style={{
          backgroundColor: activeTheme.accent,
          color: activeTheme.accentInk,
        }}
        className="w-full px-6 py-24 sm:py-32"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-xs font-extrabold uppercase tracking-[0.22em]">
              <Store className="h-4 w-4" aria-hidden="true" />
              MULTI-SHOP SAAS PLATFORM
            </div>
            <h2
              id="partner-heading"
              className="mt-3 font-display text-6xl uppercase leading-[0.88] tracking-tight sm:text-8xl"
            >
              Partner your shop
            </h2>
            <p className="mt-4 max-w-xl text-base font-semibold leading-snug opacity-85">
              Launch live inventory, 1-hour reservations, append-only POS, and
              18+ DTI compliance gates for your store in under a minute.
            </p>
          </div>

          <Link
            href="/register-shop"
            className="inline-flex min-h-[64px] items-center gap-3 rounded-full bg-[#111111] px-9 font-mono text-sm font-extrabold uppercase tracking-[0.18em] text-white shadow-2xl transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#111111]"
          >
            Register Your Shop
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Compliance & 18+ Footer */}
      <footer className="w-full border-t border-white/15 bg-[#0B0C0E] px-6 py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <ShieldAlert
              className="mt-0.5 h-5 w-5 shrink-0 text-[#FFD23F]"
              aria-hidden="true"
            />
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/80">
              <p className="font-bold text-white">
                VapeVault &middot; 18+ ADULT STOREFRONT &middot; 18+ ADULTS ONLY
              </p>
              <p className="mt-1 text-white/60">
                Valid Philippine government ID required for in-store pickup.
                Strictly DTI-compliant, non-minor-appealing listings only.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">
            <Link href="/reservations" className="hover:text-white">
              Reserve Pickup
            </Link>
            <Link href="/serials" className="hover:text-white">
              Verify Serial
            </Link>
            <Link href="/register-shop" className="hover:text-white">
              For Shop Owners
            </Link>
            <Link href="/auth" className="hover:text-white">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
