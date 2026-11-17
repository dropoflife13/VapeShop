"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

interface ProductOption {
  id: string;
  sku: string;
  name: string;
}

interface SupplierOption {
  id: string;
  name: string;
}

interface SerialRow {
  id: string;
  serial_number: string;
  qr_payload: string;
  expected_delivery_date: string | null;
  received_at: string;
  status: string;
}

export default function SerialsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [serials, setSerials] = useState<SerialRow[]>([]);
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  const [productId, setProductId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [etaDate, setEtaDate] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadAll = useCallback(async (accessToken: string) => {
    const headers = { Authorization: `Bearer ${accessToken}` };
    const [prodRes, supRes, serRes] = await Promise.all([
      fetch("/api/products", { headers }),
      fetch("/api/suppliers", { headers }),
      fetch("/api/serials", { headers }),
    ]);

    if (prodRes.ok) {
      const p = (await prodRes.json()) as { products?: ProductOption[] };
      const list = p.products ?? [];
      setProducts(list);
      if (list[0]) setProductId(list[0].id);
    }
    if (supRes.ok) {
      const s = (await supRes.json()) as { suppliers?: SupplierOption[] };
      setSuppliers(s.suppliers ?? []);
    }
    if (serRes.ok) {
      const ser = (await serRes.json()) as { serials?: SerialRow[] };
      const rows = ser.serials ?? [];
      setSerials(rows);

      const nextQr: Record<string, string> = {};
      for (const row of rows) {
        const target =
          typeof window !== "undefined"
            ? `${window.location.origin}${row.qr_payload}`
            : row.qr_payload;
        nextQr[row.id] = await QRCode.toDataURL(target, { width: 128, margin: 1 });
      }
      setQrMap(nextQr);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const supabase = getBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token ?? null;
      setToken(accessToken);
      if (accessToken) {
        await loadAll(accessToken);
      } else {
        setError("Sign in as shop owner or staff to post serial numbers.");
      }
    }
    void init();
  }, [loadAll]);

  async function handlePostSerial(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/serials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: productId,
          supplier_id: supplierId || null,
          serial_number: serialNumber,
          expected_delivery_date: etaDate || null,
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Failed to post serial");
      setSerialNumber("");
      setStatusMsg("Serial number posted and QR code generated.");
      await loadAll(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post serial");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate-400">
        <Link href="/" className="hover:text-white">&larr; Home</Link>
      </nav>
      <h1 className="text-2xl font-bold text-white">
        Manufacturer Serial Numbers &amp; QR Provenance
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

      <form onSubmit={handlePostSerial} className="mt-6 grid gap-4 rounded-lg border border-slate-800 bg-slate-900/60 p-6 sm:grid-cols-2">
        <div>
          <label htmlFor="ser-prod" className="block text-xs font-medium text-slate-300">
            Product
          </label>
          <select
            id="ser-prod"
            required
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ser-sup" className="block text-xs font-medium text-slate-300">
            Supplier
          </label>
          <select
            id="ser-sup"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
          >
            <option value="">Select supplier...</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ser-num" className="block text-xs font-medium text-slate-300">
            Manufacturer Serial Number
          </label>
          <input
            id="ser-num"
            required
            minLength={3}
            autoCapitalize="none"
            spellCheck={false}
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
          />
        </div>
        <div>
          <label htmlFor="ser-eta" className="block text-xs font-medium text-slate-300">
            Expected Delivery Date
          </label>
          <input
            id="ser-eta"
            type="date"
            value={etaDate}
            onChange={(e) => setEtaDate(e.target.value)}
            className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="min-h-[48px] rounded-md bg-emerald-500 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            Post Serial &amp; Generate QR
          </button>
        </div>
      </form>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {serials.map((row) => (
          <article key={row.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs">
            {qrMap[row.id] ? (
              <img
                src={qrMap[row.id]}
                alt={`QR code for serial ${row.serial_number}`}
                width={128}
                height={128}
                className="mb-3 rounded bg-white p-1"
              />
            ) : null}
            <p className="font-mono text-sm font-semibold text-white">{row.serial_number}</p>
            <p className="mt-1 text-slate-400">Status: {row.status}</p>
            <Link
              href={row.qr_payload}
              className="mt-3 inline-block font-semibold text-emerald-400 hover:underline"
            >
              Inspect Provenance / Mark Haywire &rarr;
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
