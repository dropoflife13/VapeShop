"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Store } from "lucide-react";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

export default function RegisterShopPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [fullName, setFullName] = useState("");
  const [reservationsEnabled, setReservationsEnabled] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdShopId, setCreatedShopId] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const supabase = getBrowserSupabaseClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        throw new Error("Please sign in first before registering a shop.");
      }

      const res = await fetch("/api/shops/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          slug,
          full_name: fullName,
          reservations_enabled: reservationsEnabled,
          delivery_enabled: deliveryEnabled,
        }),
      });

      const payload = (await res.json()) as {
        error?: string;
        shop?: { id: string };
      };
      if (!res.ok || !payload.shop) {
        throw new Error(payload.error ?? `Registration failed (${res.status})`);
      }

      await supabase.auth.refreshSession();
      setCreatedShopId(payload.shop.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#14161A] text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C400]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to Home
        </Link>

        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1FD17A]">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          18+ MULTI-TENANT SAAS
        </span>
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-8 px-6 py-8 lg:min-h-[calc(100vh-5.5rem)] lg:grid-cols-12">
        {/* Left Color-Blocked Intro */}
        <section className="relative overflow-hidden rounded-3xl bg-[#F5C400] p-8 text-[#111111] shadow-2xl sm:p-10 lg:col-span-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-6 -right-3 select-none font-display text-[9.5rem] uppercase leading-none tracking-tight text-black/10"
          >
            SHOP
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/10 px-3.5 py-1.5 font-mono text-[10px] font-extrabold uppercase tracking-[0.2em]">
              <Store className="h-3.5 w-3.5" aria-hidden="true" />
              PARTNER ONBOARDING
            </div>

            <h1 className="mt-6 font-display text-5xl uppercase leading-[0.9] tracking-tight sm:text-6xl">
              Register Your Vape Shop
            </h1>
            <p className="mt-4 text-sm font-semibold leading-relaxed text-[#111111]/85">
              Provisions an isolated multi-tenant store with live stock ledgers,
              1-hour customer reservations, and 18+ DTI compliance gates.
            </p>

            <div className="mt-6 rounded-2xl bg-black/10 p-4 font-mono text-[11px] font-bold uppercase tracking-[0.14em]">
              Need an account first?{" "}
              <Link href="/auth" className="underline underline-offset-4">
                Sign in here &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* Right Form */}
        <section className="rounded-3xl border border-white/12 bg-[#1B1E24] p-7 shadow-2xl sm:p-10 lg:col-span-7">
          {createdShopId ? (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#1FD17A] px-3.5 py-1.5 font-mono text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#071A10]">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                SHOP REGISTERED
              </div>
              <h2 className="font-display text-4xl uppercase tracking-wide text-white">
                Your Store Is Live
              </h2>
              <p className="font-mono text-xs text-white/75">
                TENANT ID:{" "}
                <code className="font-bold text-[#F5C400]">{createdShopId}</code>
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/auth"
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#1FD17A] px-6 font-mono text-xs font-extrabold uppercase tracking-[0.16em] text-[#071A10] transition-transform hover:scale-[1.02]"
                >
                  View Session Claims
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex min-h-[48px] items-center rounded-full border border-white/20 px-6 font-mono text-xs font-bold uppercase tracking-[0.16em] text-white hover:bg-white/10"
                >
                  Open Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="shopName"
                    className="block font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/80"
                  >
                    Shop Name
                  </label>
                  <input
                    id="shopName"
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Cloud Hub Store"
                    className="mt-2 min-h-[50px] w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white placeholder:text-white/35 focus:border-[#F5C400] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="shopSlug"
                    className="block font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/80"
                  >
                    Shop Slug
                  </label>
                  <input
                    id="shopSlug"
                    type="text"
                    required
                    pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="cloud-hub-store"
                    className="mt-2 min-h-[50px] w-full rounded-2xl border border-white/15 bg-black/40 px-4 font-mono text-sm text-white placeholder:text-white/35 focus:border-[#F5C400] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="ownerName"
                  className="block font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/80"
                >
                  Owner Full Name
                </label>
                <input
                  id="ownerName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  className="mt-2 min-h-[50px] w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white placeholder:text-white/35 focus:border-[#F5C400] focus:outline-none"
                />
              </div>

              <div className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4">
                <label className="flex cursor-pointer items-center gap-3 text-xs font-medium text-white/85">
                  <input
                    type="checkbox"
                    checked={reservationsEnabled}
                    onChange={(e) => setReservationsEnabled(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#1FD17A]"
                  />
                  Enable customer reservations (1-hour pickup window)
                </label>
                <label className="flex cursor-pointer items-center gap-3 text-xs font-medium text-white/85">
                  <input
                    type="checkbox"
                    checked={deliveryEnabled}
                    onChange={(e) => setDeliveryEnabled(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#1FD17A]"
                  />
                  Enable delivery option
                </label>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-[#F5C400] px-6 font-mono text-xs font-extrabold uppercase tracking-[0.18em] text-[#111111] shadow-lg transition-transform hover:scale-[1.01] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F5C400]"
              >
                {busy ? "Registering..." : "Register Shop"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          )}

          {error ? (
            <p
              role="alert"
              className="mt-5 rounded-2xl border border-[#FF3D5A]/50 bg-[#FF3D5A]/15 p-3.5 font-mono text-xs text-[#FFD6DD]"
            >
              {error}
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
