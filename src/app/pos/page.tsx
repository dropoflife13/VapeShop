"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

interface LegalIdOption {
  code: string;
  label: string;
  issuing_agency: string;
}

interface InventoryItem {
  product_id: string;
  sku: string;
  name: string;
  available_qty: number;
}

interface SaleRow {
  id: string;
  idempotency_key: string;
  legal_id_type: string;
  total_centavos: number;
  status: string;
  created_at: string;
}

export default function PosTerminalPage() {
  const [token, setToken] = useState<string | null>(null);
  const [legalIds, setLegalIds] = useState<LegalIdOption[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [qty, setQty] = useState("1");
  const [serialNumber, setSerialNumber] = useState("");
  const [reservationId, setReservationId] = useState("");
  const [legalIdType, setLegalIdType] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async (accessToken: string) => {
    const headers = { Authorization: `Bearer ${accessToken}` };
    const [phRes, invRes, salesRes] = await Promise.all([
      fetch("/api/compliance/ph"),
      fetch("/api/inventory", { headers }),
      fetch("/api/pos/sales", { headers }),
    ]);

    if (phRes.ok) {
      const ph = (await phRes.json()) as { legal_id_types?: LegalIdOption[] };
      setLegalIds(ph.legal_id_types ?? []);
    }
    if (invRes.ok) {
      const inv = (await invRes.json()) as { inventory?: InventoryItem[] };
      const list = inv.inventory ?? [];
      setInventory(list);
      if (list[0]) setSelectedProductId(list[0].product_id);
    }
    if (salesRes.ok) {
      const s = (await salesRes.json()) as { sales?: SaleRow[] };
      setSales(s.sales ?? []);
    }
  }, []);

  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
    async function init() {
      const supabase = getBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token ?? null;
      setToken(accessToken);
      if (accessToken) {
        await loadData(accessToken);
      } else {
        setError("Sign in as shop owner or staff to operate POS.");
      }
    }
    void init();
  }, [loadData]);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/pos/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          idempotency_key: idempotencyKey,
          legal_id_type: legalIdType,
          reservation_id: reservationId.trim() || null,
          items: [
            {
              product_id: selectedProductId,
              qty: Number(qty),
              serial_number: serialNumber.trim() || null,
            },
          ],
        }),
      });

      const payload = (await res.json()) as {
        error?: string;
        code?: string;
        reasons?: string[];
        sale?: SaleRow;
      };

      if (!res.ok || !payload.sale) {
        const detail = payload.reasons?.join(" ") ?? payload.error ?? "Checkout failed";
        throw new Error(payload.code ? `${payload.code}: ${detail}` : detail);
      }

      setSuccess(
        `Sale recorded (${payload.sale.id}) — PHP ${(payload.sale.total_centavos / 100).toFixed(2)}`
      );
      setSerialNumber("");
      setReservationId("");
      // Rotate idempotency key only after a confirmed 201 response
      setIdempotencyKey(crypto.randomUUID());
      await loadData(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate-400">
        <Link href="/" className="hover:text-white">&larr; Home</Link>
      </nav>
      <h1 className="text-2xl font-bold text-white">POS Checkout Terminal</h1>
      <p className="mt-1 text-xs text-slate-400">
        Enforces RA 11900 18+ PH Legal ID verification and idempotent ledger writes.
      </p>

      {error ? (
        <p role="alert" className="mt-4 rounded-md border border-red-900 bg-red-950/60 p-3 text-xs text-red-300">
          {error}
        </p>
      ) : null}
      {success ? (
        <p aria-live="polite" className="mt-4 rounded-md border border-emerald-900 bg-emerald-950/60 p-3 text-xs text-emerald-300">
          {success}
        </p>
      ) : null}

      <form onSubmit={handleCheckout} className="mt-6 space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-6">
        <div>
          <label htmlFor="pos-prod" className="block text-xs font-medium text-slate-300">
            Product <span aria-hidden="true">*</span>
          </label>
          <select
            id="pos-prod"
            name="product_id"
            required
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
          >
            {inventory.map((i) => (
              <option key={i.product_id} value={i.product_id}>
                {i.sku} — {i.name} (Avail: {i.available_qty})
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pos-qty" className="block text-xs font-medium text-slate-300">
              Quantity <span aria-hidden="true">*</span>
            </label>
            <input
              id="pos-qty"
              name="qty"
              type="text"
              inputMode="numeric"
              required
              pattern="[1-9][0-9]*"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            />
          </div>
          <div>
            <label htmlFor="pos-serial" className="block text-xs font-medium text-slate-300">
              Serial Number (optional)
            </label>
            <input
              id="pos-serial"
              name="serial_number"
              type="text"
              autoCapitalize="none"
              spellCheck={false}
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            />
          </div>
        </div>

        <div>
          <label htmlFor="pos-res" className="block text-xs font-medium text-slate-300">
            Convert Reservation ID (optional)
          </label>
          <input
            id="pos-res"
            name="reservation_id"
            type="text"
            value={reservationId}
            onChange={(e) => setReservationId(e.target.value)}
            className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
          />
        </div>

        <div>
          <label htmlFor="pos-id" className="block text-xs font-medium text-slate-300">
            18+ Buyer PH Government ID Type <span aria-hidden="true">*</span>
          </label>
          <select
            id="pos-id"
            name="legal_id_type"
            required
            value={legalIdType}
            onChange={(e) => setLegalIdType(e.target.value)}
            className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
          >
            <option value="">Select verified 18+ PH ID...</option>
            {legalIds.map((id) => (
              <option key={id.code} value={id.code}>
                {id.label} ({id.issuing_agency})
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs text-slate-400">
          Idempotency Key: <code>{idempotencyKey}</code>
        </p>

        <button
          type="submit"
          disabled={busy}
          className="min-h-[48px] w-full rounded-md bg-emerald-500 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {busy ? "Processing Sale..." : "Complete POS Sale"}
        </button>
      </form>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">Recent Append-Only Sales</h2>
        <table className="mt-3 w-full text-left text-xs">
          <caption className="sr-only">Recent Append-Only Sales</caption>
          <thead className="border-b border-slate-800 text-slate-400">
            <tr>
              <th scope="col" className="py-2 pr-3">ID</th>
              <th scope="col" className="py-2 pr-3">Legal ID</th>
              <th scope="col" className="py-2 pr-3">Total (PHP)</th>
              <th scope="col" className="py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {sales.map((s) => (
              <tr key={s.id}>
                <td className="py-2 pr-3 font-mono text-slate-300">{s.id.slice(0, 8)}</td>
                <td className="py-2 pr-3">{s.legal_id_type}</td>
                <td className="py-2 pr-3">{(s.total_centavos / 100).toFixed(2)}</td>
                <td className="py-2">{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
