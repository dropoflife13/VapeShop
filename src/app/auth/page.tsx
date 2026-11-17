"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LogOut, ShieldCheck, Store } from "lucide-react";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{
    email: string;
    role: string;
    tenantId: string | null;
  } | null>(null);

  async function loadSession() {
    try {
      const supabase = getBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (user) {
        const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
        setSessionInfo({
          email: user.email ?? "",
          role: typeof appMeta.role === "string" ? appMeta.role : "customer",
          tenantId:
            typeof appMeta.tenant_id === "string" ? appMeta.tenant_id : null,
        });
      } else {
        setSessionInfo(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session");
    }
  }

  useEffect(() => {
    void loadSession();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = getBrowserSupabaseClient();
      if (mode === "signup") {
        const { error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpErr) throw signUpErr;
        setMessage("Account created. Check your email or sign in if auto-confirmed.");
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInErr) throw signInErr;
        setMessage("Signed in.");
      }
      await loadSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    setError(null);
    try {
      const supabase = getBrowserSupabaseClient();
      await supabase.auth.signOut();
      setSessionInfo(null);
      setMessage("Signed out.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign out failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#14161A] text-white">
      {/* Top Bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD23F]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to Home
        </Link>

        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFD23F]">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          18+ ADULT STOREFRONT
        </span>
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-8 px-6 py-8 lg:min-h-[calc(100vh-5.5rem)] lg:grid-cols-12">
        {/* Left Color-Blocked Brand Panel */}
        <section className="relative overflow-hidden rounded-3xl bg-[#6C7BFF] p-8 text-[#0B0E24] shadow-2xl sm:p-10 lg:col-span-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-6 -right-4 select-none font-display text-[11rem] uppercase leading-none tracking-tight text-[#E9ECFF]/45"
          >
            VAULT
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2.5 rounded-full bg-white/30 px-3.5 py-1.5 backdrop-blur-md">
              <img
                src="/images/logo-light.png"
                alt="VapeVault Logo"
                width={22}
                height={22}
                className="h-5 w-5 object-contain"
              />
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-[0.2em]">
                VAPEVAULT ACCOUNT
              </span>
            </div>

            <h1 className="mt-6 font-display text-5xl uppercase leading-[0.9] tracking-tight sm:text-6xl">
              {mode === "signin" ? "Welcome back" : "Join VapeVault"}
            </h1>
            <p className="mt-4 max-w-md text-sm font-semibold leading-relaxed text-[#0B0E24]/85">
              Sign in to lock 1-hour express in-store pickups, track serial QR
              provenance, or register and manage your own multi-tenant vape
              shop.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/25 p-4 backdrop-blur-sm">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
                  CUSTOMERS
                </span>
                <p className="mt-1 text-xs font-semibold">
                  1-hour pickup holds &amp; editable arrival windows.
                </p>
              </div>
              <div className="rounded-2xl bg-white/25 p-4 backdrop-blur-sm">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
                  SHOP OWNERS
                </span>
                <p className="mt-1 text-xs font-semibold">
                  Live shelf stock, POS, &amp; 18+ DTI compliance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Form / Active Session Panel */}
        <section className="rounded-3xl border border-white/12 bg-[#1B1E24] p-7 shadow-2xl sm:p-10 lg:col-span-6">
          {sessionInfo ? (
            <div>
              <span className="inline-flex rounded-full bg-[#B6FF4D] px-3 py-1 font-mono text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0C1804]">
                ACTIVE SESSION
              </span>
              <h2 className="mt-4 font-display text-4xl uppercase tracking-wide text-white">
                Signed In
              </h2>
              <p className="mt-2 text-sm text-white/80">
                Account:{" "}
                <span className="font-semibold text-white">
                  {sessionInfo.email}
                </span>
              </p>
              <p className="mt-1 font-mono text-xs text-white/65">
                ROLE:{" "}
                <code className="font-bold text-[#FFD23F]">
                  {sessionInfo.role}
                </code>
                {sessionInfo.tenantId ? (
                  <>
                    {" "}
                    &middot; TENANT:{" "}
                    <code className="font-bold text-[#00E5FF]">
                      {sessionInfo.tenantId}
                    </code>
                  </>
                ) : null}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {!sessionInfo.tenantId && sessionInfo.role === "customer" ? (
                  <Link
                    href="/register-shop"
                    className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#FFD23F] px-6 font-mono text-xs font-extrabold uppercase tracking-[0.16em] text-[#111111] transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD23F]"
                  >
                    <Store className="h-4 w-4" aria-hidden="true" />
                    Register a Shop
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#FFD23F] px-6 font-mono text-xs font-extrabold uppercase tracking-[0.16em] text-[#111111] transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD23F]"
                  >
                    Open Dashboard
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}

                <Link
                  href="/reservations"
                  className="inline-flex min-h-[48px] items-center rounded-full border border-white/20 px-6 font-mono text-xs font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-white/10"
                >
                  Reservations
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={busy}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-white/20 px-5 font-mono text-xs font-bold uppercase tracking-[0.16em] text-white/80 transition-colors hover:border-[#FF3D5A] hover:text-[#FF3D5A] disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Mode Switcher Pills */}
              <div className="inline-flex rounded-full border border-white/15 bg-black/35 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                    setMessage(null);
                  }}
                  className={`rounded-full px-5 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${
                    mode === "signin"
                      ? "bg-[#FFD23F] text-[#111111]"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setMessage(null);
                  }}
                  className={`rounded-full px-5 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${
                    mode === "signup"
                      ? "bg-[#FFD23F] text-[#111111]"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/80"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-2 min-h-[50px] w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white placeholder:text-white/35 focus:border-[#FFD23F] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/80"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="mt-2 min-h-[50px] w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white placeholder:text-white/35 focus:border-[#FFD23F] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-[#FFD23F] px-6 font-mono text-xs font-extrabold uppercase tracking-[0.18em] text-[#111111] shadow-lg transition-transform hover:scale-[1.01] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFD23F]"
                >
                  {busy
                    ? "Please wait..."
                    : mode === "signin"
                      ? "Sign In"
                      : "Create Account"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "signin" ? "signup" : "signin");
                    setError(null);
                    setMessage(null);
                  }}
                  className="w-full text-center font-mono text-[11px] uppercase tracking-[0.14em] text-white/65 hover:text-white"
                >
                  {mode === "signin"
                    ? "Need an account? Sign up"
                    : "Already have an account? Sign in"}
                </button>
              </form>
            </div>
          )}

          {error ? (
            <p
              role="alert"
              className="mt-5 rounded-2xl border border-[#FF3D5A]/50 bg-[#FF3D5A]/15 p-3.5 font-mono text-xs text-[#FFD6DD]"
            >
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="mt-5 rounded-2xl border border-[#B6FF4D]/50 bg-[#B6FF4D]/15 p-3.5 font-mono text-xs text-[#B6FF4D]">
              {message}
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
