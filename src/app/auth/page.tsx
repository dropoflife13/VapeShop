"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="text-xs text-slate-400 hover:text-white">
        &larr; Back to Home
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-white">
        {mode === "signin" ? "Sign In" : "Create Account"}
      </h1>

      {sessionInfo ? (
        <section className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-300">
            Signed in as <span className="font-semibold text-white">{sessionInfo.email}</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Role: <code className="text-emerald-400">{sessionInfo.role}</code>
            {sessionInfo.tenantId ? (
              <>
                {" "}
                &middot; Tenant: <code className="text-emerald-400">{sessionInfo.tenantId}</code>
              </>
            ) : null}
          </p>
          <div className="mt-4 flex gap-3">
            {!sessionInfo.tenantId && sessionInfo.role === "customer" ? (
              <Link
                href="/register-shop"
                className="rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Register a Shop
              </Link>
            ) : null}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={busy}
              className="rounded-md border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50"
            >
              Sign Out
            </button>
          </div>
        </section>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {busy ? "Please wait..." : mode === "signin" ? "Sign In" : "Sign Up"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setMessage(null);
            }}
            className="w-full text-center text-xs text-slate-400 hover:text-white"
          >
            {mode === "signin"
              ? "Need an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </form>
      )}

      {error ? (
        <p role="alert" className="mt-4 rounded-md border border-red-900 bg-red-950/60 p-3 text-xs text-red-300">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-4 rounded-md border border-emerald-900 bg-emerald-950/60 p-3 text-xs text-emerald-300">
          {message}
        </p>
      ) : null}
    </main>
  );
}
