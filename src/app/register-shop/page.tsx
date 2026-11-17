"use client";

import { useState } from "react";
import Link from "next/link";
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
    const autoSlug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(autoSlug);
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
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <Link href="/" className="text-xs text-slate-400 hover:text-white">
        &larr; Back to Home
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-white">Register Your Vape Shop</h1>
      <p className="mt-1 text-xs text-slate-400">
        Provisions an isolated multi-tenant shop and binds your account as owner.
      </p>

      {createdShopId ? (
        <section className="mt-6 rounded-lg border border-emerald-800 bg-emerald-950/40 p-5">
          <p className="text-sm font-semibold text-emerald-300">Shop Registered</p>
          <p className="mt-1 text-xs text-slate-300">
            Tenant ID: <code>{createdShopId}</code>
          </p>
          <Link
            href="/auth"
            className="mt-4 inline-block rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
          >
            View Session Claims
          </Link>
        </section>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="shopName" className="block text-xs font-medium text-slate-300">
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
              placeholder="Manila Cloud Hub"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="shopSlug" className="block text-xs font-medium text-slate-300">
              Shop Slug
            </label>
            <input
              id="shopSlug"
              type="text"
              required
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="manila-cloud-hub"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="ownerName" className="block text-xs font-medium text-slate-300">
              Owner Full Name
            </label>
            <input
              id="ownerName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Juan Dela Cruz"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={reservationsEnabled}
                onChange={(e) => setReservationsEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
              />
              Enable customer reservations (1-hour pickup window)
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={deliveryEnabled}
                onChange={(e) => setDeliveryEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
              />
              Enable delivery option
            </label>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {busy ? "Registering..." : "Register Shop"}
          </button>
        </form>
      )}

      {error ? (
        <p role="alert" className="mt-4 rounded-md border border-red-900 bg-red-950/60 p-3 text-xs text-red-300">
          {error}
        </p>
      ) : null}
    </main>
  );
}
