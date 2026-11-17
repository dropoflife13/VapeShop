"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { ArrowLeft, ArrowRight, QrCode, ShieldCheck } from "lucide-react";
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
    <div className="min-h-screen bg-[#14161A] text-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Home
        </Link>

        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#00E5FF]">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          SERIAL &amp; QR PROVENANCE
        </span>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-16 pt-4">
        <div className="rounded-3xl bg-[#00E5FF] p-7 text-[#061418] shadow-2xl sm:p-9">
          <div className="inline-flex items-center gap-2 rounded-full bg-black/10 px-3 py-1 font-mono text-[10px] font-extrabold uppercase tracking-[0.2em]">
            <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
            BATCH TRACEABILITY
          </div>
          <h1 className="mt-3 font-display text-5xl uppercase leading-[0.9] tracking-tight sm:text-6xl">
            Serial Numbers &amp; QR
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-[#061418]/85">
            Register manufacturer serials, generate scannable QR codes, and
            trace supplier delivery ETAs or defective unit returns.
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
                className="inline-flex items-center gap-1.5 rounded-full bg-[#00E5FF] px-4 py-2 font-mono text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#061418] transition-transform hover:scale-105"
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
            className="mt-6 rounded-2xl border border-[#1FD17A]/50 bg-[#1FD17A]/15 px-5 py-3.5 font-mono text-xs text-[#1FD17A]"
          >
            {statusMsg}
          </p>
        ) : null}

        <form
          onSubmit={handlePostSerial}
          className="mt-6 grid gap-5 rounded-3xl border border-white/12 bg-[#1B1E24] p-6 shadow-2xl sm:grid-cols-2 sm:p-8"
        >
          <div>
            <label
              htmlFor="ser-prod"
              className="block font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/80"
            >
              Product
            </label>
            <select
              id="ser-prod"
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="mt-2 min-h-[50px] w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white focus:border-[#00E5FF] focus:outline-none"
            >
              {products.length === 0 ? (
                <option value="">Select product...</option>
              ) : null}
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="ser-sup"
              className="block font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/80"
            >
              Supplier
            </label>
            <select
              id="ser-sup"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="mt-2 min-h-[50px] w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-sm text-white focus:border-[#00E5FF] focus:outline-none"
            >
              <option value="">Select supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="ser-num"
              className="block font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/80"
            >
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
              placeholder="VV-2026-8841"
              className="mt-2 min-h-[50px] w-full rounded-2xl border border-white/15 bg-black/40 px-4 font-mono text-sm text-white placeholder:text-white/35 focus:border-[#00E5FF] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="ser-eta"
              className="block font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/80"
            >
              Expected Delivery Date
            </label>
            <input
              id="ser-eta"
              type="date"
              value={etaDate}
              onChange={(e) => setEtaDate(e.target.value)}
              className="mt-2 min-h-[50px] w-full rounded-2xl border border-white/15 bg-black/40 px-4 font-mono text-sm text-white focus:border-[#00E5FF] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy || !token}
              className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-full bg-[#00E5FF] px-8 font-mono text-xs font-extrabold uppercase tracking-[0.18em] text-[#061418] shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#00E5FF]"
            >
              Post Serial &amp; Generate QR
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </form>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {serials.map((row) => (
            <article
              key={row.id}
              className="rounded-3xl border border-white/12 bg-[#1B1E24] p-5 text-xs shadow-lg"
            >
              {qrMap[row.id] ? (
                <img
                  src={qrMap[row.id]}
                  alt={`QR code for serial ${row.serial_number}`}
                  width={128}
                  height={128}
                  className="mb-4 rounded-xl bg-white p-1.5"
                />
              ) : null}
              <p className="font-mono text-sm font-bold text-white">
                {row.serial_number}
              </p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-white/65">
                Status: <span className="text-[#00E5FF]">{row.status}</span>
              </p>
              <Link
                href={row.qr_payload}
                className="mt-4 inline-flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#00E5FF] hover:underline"
              >
                Inspect Provenance / Mark Haywire &rarr;
              </Link>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
