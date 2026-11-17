"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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

export default function ReservationsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [tenantId, setTenantId] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("1");
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
    const defaultTime = new Date(Date.now() + 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16);
    setPickupAt(defaultTime);

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
    setBusy(true);
    setError(null);
    setStatusMsg(null);
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
    setBusy(true);
    setError(null);
    setStatusMsg(null);
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
    <main className="mx-auto max-w-4xl px-6 py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate-400">
        <Link href="/" className="hover:text-white">&larr; Home</Link>
      </nav>
      <h1 className="text-2xl font-bold text-white">
        Editable Reservations (1-Hour Past-Pickup Auto-Expiry)
      </h1>

      {error ? (
        <p role="alert" className="mt-4 rounded-md border border-red-900 bg-red-950/60 p-3 text-xs text-red-300">
          {error}
        </p>
      ) : null}
      {statusMsg ? (
        <p aria-live="polite" className="mt-4 rounded-md border border-emerald-900 bg-emerald-950/60 p-3 text-xs text-emerald-300">
          {statusMsg}
        </p>
      ) : null}

      <form onSubmit={handleCreate} className="mt-6 space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="res-shop" className="block text-xs font-medium text-slate-300">
              Shop Tenant ID
            </label>
            <input
              id="res-shop"
              required
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            />
          </div>
          <div>
            <label htmlFor="res-prod" className="block text-xs font-medium text-slate-300">
              Product ID
            </label>
            <input
              id="res-prod"
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            />
          </div>
          <div>
            <label htmlFor="res-qty" className="block text-xs font-medium text-slate-300">
              Quantity
            </label>
            <input
              id="res-qty"
              type="text"
              inputMode="numeric"
              required
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            />
          </div>
          <div>
            <label htmlFor="res-time" className="block text-xs font-medium text-slate-300">
              Scheduled Pickup Time
            </label>
            <input
              id="res-time"
              type="datetime-local"
              required
              value={pickupAt}
              onChange={(e) => setPickupAt(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            />
          </div>
        </div>

        <fieldset className="flex gap-6 pt-1">
          <legend className="text-xs font-medium text-slate-300">Fulfillment Type</legend>
          <label className="flex items-center gap-2 text-xs text-slate-200">
            <input
              type="radio"
              name="fulfillment_type"
              value="pickup"
              checked={fulfillmentType === "pickup"}
              onChange={() => setFulfillmentType("pickup")}
              className="h-4 w-4 accent-emerald-500"
            />
            Store Pickup
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-200">
            <input
              type="radio"
              name="fulfillment_type"
              value="delivery"
              checked={fulfillmentType === "delivery"}
              onChange={() => setFulfillmentType("delivery")}
              className="h-4 w-4 accent-emerald-500"
            />
            Delivery (if shop enabled)
          </label>
        </fieldset>

        <button
          type="submit"
          disabled={busy}
          className="min-h-[48px] rounded-md bg-emerald-500 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          Reserve Unit
        </button>
      </form>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-white">Active &amp; Past Reservations</h2>
        {reservations.map((r) => (
          <article key={r.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs">
            <p className="font-semibold text-white">
              Reservation {r.id.slice(0, 8)} &middot; Status:{" "}
              <span className="text-emerald-400">{r.status}</span> &middot; Qty: {r.qty}
            </p>
            <p className="mt-1 text-slate-400">
              Pickup: {new Date(r.scheduled_pickup_at).toLocaleString()} &middot; Expires:{" "}
              {new Date(r.expires_at).toLocaleString()}
            </p>
            {r.status === "reserved" ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label htmlFor={`edit-${r.id}`} className="sr-only">
                  New pickup time
                </label>
                <input
                  id={`edit-${r.id}`}
                  type="datetime-local"
                  value={editTimes[r.id] ?? r.scheduled_pickup_at.slice(0, 16)}
                  onChange={(e) =>
                    setEditTimes({ ...editTimes, [r.id]: e.target.value })
                  }
                  className="min-h-[40px] rounded border border-slate-700 bg-slate-950 px-2 text-xs text-white"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleUpdatePickup(r.id)}
                  className="min-h-[40px] rounded border border-emerald-700 px-3 text-emerald-300 hover:bg-emerald-950"
                >
                  Update Pickup Time
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </main>
  );
}
