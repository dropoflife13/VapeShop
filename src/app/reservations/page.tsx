"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, ShieldCheck } from "lucide-react";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

interface ReservationRow {
  id: string;
  tenant_id: string;
  product_id: string;
  qty: number;
  fulfillment_type: "pickup" | "delivery";
  scheduled_pickup_at: string;
  expires_at: string;
  status: string;
}

function toLocalDateTimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ReservationsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [tenantId, setTenantId] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("1");
  const [minPickupAt, setMinPickupAt] = useState("");
  const [pickupAt, setPickupAt] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<"pickup" | "delivery">("pickup");
  const [editTimes, setEditTimes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadReservations = useCallback(async (accessToken: string) => {
    const res = await fetch("/api/reservations", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const data = (await res.json()) as { reservations?: ReservationRow[] };
      setReservations(data.reservations ?? []);
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    setMinPickupAt(toLocalDateTimeValue(now));
    setPickupAt(toLocalDateTimeValue(new Date(now.getTime() + 60 * 60 * 1000)));

    const params = new URLSearchParams(window.location.search);
    const prefillTenant = params.get("tenantId");
    if (prefillTenant) {
      setTenantId(prefillTenant);
    }

    async function init() {
      const supabase = getBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token ?? null;
      setToken(accessToken);
      if (accessToken) {
        await loadReservations(accessToken);
      } else {
        setError("Sign in to create or manage reservations.");
      }
    }
    void init();
  }, [loadReservations]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setStatusMsg(null);

    const parsedQty = Number(qty);
    if (!Number.isInteger(parsedQty) || parsedQty < 1 || parsedQty > 50) {
      setError("Quantity must be between 1 and 50.");
      return;
    }

    const pickupTs = new Date(pickupAt).getTime();
    if (!Number.isFinite(pickupTs) || pickupTs < Date.now() - 60_000) {
      setError("Reservation pickup time cannot be in the past.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenant_id: tenantId.trim(),
          product_id: productId.trim(),
          qty: Number(qty),
          scheduled_pickup_at: new Date(pickupAt).toISOString(),
          fulfillment_type: fulfillmentType,
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Reservation failed");
      setStatusMsg("Reservation created (1-hour grace window active).");
      await loadReservations(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reservation failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdatePickup(id: string) {
    if (!token) return;
    const nextVal = editTimes[id];
    if (!nextVal) return;
    setError(null);
    setStatusMsg(null);

    const nextTs = new Date(nextVal).getTime();
    if (!Number.isFinite(nextTs) || nextTs < Date.now() - 60_000) {
      setError("Updated pickup time cannot be in the past.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scheduled_pickup_at: new Date(nextVal).toISOString(),
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Update failed");
      setStatusMsg("Pickup time updated.");
      await loadReservations(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#14161A] text-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B6FF4D]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Home
        </Link>

        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF4D]">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          18+ ID CHECK AT PICKUP
        </span>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-16 pt-4">
        {/* Hero Banner */}
        <div className="rounded-3xl bg-[#FF3D5A] p-7 text-[#0F0306] shadow-2xl sm:p-9">
          <div className="inline-flex items-center gap-2 rounded-full bg-black/10 px-3 py-1 font-mono text-[10px] font-extrabold uppercase tracking-[0.2em]">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            1-HOUR PAST-PICKUP AUTO-EXPIRY
          </div>
          <h1 className="mt-3 font-display text-5xl uppercase leading-[0.9] tracking-tight sm:text-6xl">
            Editable Reservations
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-[#0F0306]/85">
            Lock stock atomically before heading to the shop and adjust your
            pickup window anytime before expiry.
          </p>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#FF3D5A]/50 bg-[#FF3D5A]/15 px-5 py-4 font-mono text-xs text-[#FFD6DD]"
          >
            <span>{error}</span>
            {!token ? (
              <Link
                href="/auth"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#FFD23F] px-4 py-2 font-mono text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#111111] transition-transform hover:scale-105"
              >
                Sign In
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        ) : null}

        {statusMsg ? (
          <p
            aria-live="polite"
            className="mt-6 rounded-2xl border border-[#B6FF4D]/50 bg-[#B6FF4D]/15 px-5 py-3.5 font-mono text-xs text-[#B6FF4D]"
          >
            {statusMsg}
          </p>
        ) : null}

        <form
          onSubmit={handleCreate}
          className="mt-6 space-y-5 rounded-3xl border border-white/12 bg-[#1B1E24] p-6 shadow-2xl sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="res-shop"
                className="block font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/80"
              >
                Shop Tenant ID
              </label>
              <input
                id="res-shop"
                required
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="UUID from Available Shops"
                className="mt-2 min-h-[50px] w-full rounded-2xl border border-white/15 bg-black/40 px-4 font-mono text-sm text-white placeholder:text-white/35 focus:border-[#B6FF4D] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="res-prod"
                className="block font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/80"
              >
                Product ID
              </label>
              <input
                id="res-prod"
                required
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="Product UUID"
                className="mt-2 min-h-[50px] w-full rounded-2xl border border-white/15 bg-black/40 px-4 font-mono text-sm text-white placeholder:text-white/35 focus:border-[#B6FF4D] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="res-qty"
                className="block font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/80"
              >
                Quantity (1&ndash;50)
              </label>
              <input
                id="res-qty"
                type="number"
                min={1}
                max={50}
                step={1}
                required
                value={qty}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  if (!digits) {
                    setQty("");
                    return;
                  }
                  const clamped = Math.min(50, Math.max(1, Number(digits)));
                  setQty(String(clamped));
                }}
                className="mt-2 min-h-[50px] w-full rounded-2xl border border-white/15 bg-black/40 px-4 font-mono text-sm text-white focus:border-[#B6FF4D] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="res-time"
                className="block font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/80"
              >
                Scheduled Pickup Time
              </label>
              <input
                id="res-time"
                type="datetime-local"
                min={minPickupAt}
                required
                value={pickupAt}
                onChange={(e) => setPickupAt(e.target.value)}
                className="mt-2 min-h-[50px] w-full rounded-2xl border border-white/15 bg-black/40 px-4 font-mono text-sm text-white focus:border-[#B6FF4D] focus:outline-none"
              />
            </div>
          </div>

          <fieldset className="flex flex-wrap gap-6 rounded-2xl border border-white/10 bg-black/25 p-4">
            <legend className="px-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
              Fulfillment Type
            </legend>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-white/90">
              <input
                type="radio"
                name="fulfillment_type"
                value="pickup"
                checked={fulfillmentType === "pickup"}
                onChange={() => setFulfillmentType("pickup")}
                className="h-4 w-4 accent-[#B6FF4D]"
              />
              Store Pickup
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-white/90">
              <input
                type="radio"
                name="fulfillment_type"
                value="delivery"
                checked={fulfillmentType === "delivery"}
                onChange={() => setFulfillmentType("delivery")}
                className="h-4 w-4 accent-[#B6FF4D]"
              />
              Delivery (if shop enabled)
            </label>
          </fieldset>

          <button
            type="submit"
            disabled={busy || !token}
            className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-full bg-[#B6FF4D] px-8 font-mono text-xs font-extrabold uppercase tracking-[0.18em] text-[#0C1804] shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B6FF4D]"
          >
            Reserve Unit
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>

        <section className="mt-10 space-y-4">
          <h2 className="font-display text-3xl uppercase tracking-wide text-white">
            Active &amp; Past Reservations
          </h2>
          {reservations.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-[#1B1E24] p-5 font-mono text-xs text-white/60">
              No reservations found for this account yet.
            </p>
          ) : null}
          {reservations.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-white/12 bg-[#1B1E24] p-5 text-xs"
            >
              <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-white">
                Reservation {r.id.slice(0, 8)} &middot; Status:{" "}
                <span className="text-[#B6FF4D]">{r.status}</span> &middot; Qty:{" "}
                {r.qty}
              </p>
              <p className="mt-1.5 text-white/70">
                Pickup: {new Date(r.scheduled_pickup_at).toLocaleString()} &middot;
                Expires: {new Date(r.expires_at).toLocaleString()}
              </p>
              {r.status === "reserved" ? (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <label htmlFor={`edit-${r.id}`} className="sr-only">
                    New pickup time
                  </label>
                  <input
                    id={`edit-${r.id}`}
                    type="datetime-local"
                    min={minPickupAt}
                    value={editTimes[r.id] ?? r.scheduled_pickup_at.slice(0, 16)}
                    onChange={(e) =>
                      setEditTimes({ ...editTimes, [r.id]: e.target.value })
                    }
                    className="min-h-[42px] rounded-xl border border-white/15 bg-black/40 px-3 font-mono text-xs text-white"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleUpdatePickup(r.id)}
                    className="min-h-[42px] rounded-full border border-[#B6FF4D]/50 px-5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#B6FF4D] transition-colors hover:bg-[#B6FF4D]/15"
                  >
                    Update Pickup Time
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
