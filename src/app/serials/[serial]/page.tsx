"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

interface TraceData {
  id: string;
  serial_number: string;
  status: string;
  expected_delivery_date: string | null;
  received_at: string;
  haywire_notes: string;
  haywire_reported_at: string | null;
  product: { sku: string; brand: string; name: string; dti_ps_mark: string } | null;
  supplier: { name: string; availability_status: string; expected_delivery_date: string | null } | null;
}

export default function SerialTracePage() {
  const params = useParams<{ serial: string }>();
  const serial = params.serial ?? "";

  const [token, setToken] = useState<string | null>(null);
  const [trace, setTrace] = useState<TraceData | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadTrace = useCallback(
    async (accessToken: string) => {
      const res = await fetch(`/api/serials/${encodeURIComponent(serial)}/trace`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const p = (await res.json()) as { error?: string };
        setError(p.error ?? "Serial not found");
        return;
      }
      const data = (await res.json()) as { trace: TraceData };
      setTrace(data.trace);
    },
    [serial]
  );

  useEffect(() => {
    async function init() {
      const supabase = getBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token ?? null;
      setToken(accessToken);
      if (accessToken && serial) {
        await loadTrace(accessToken);
      } else if (!accessToken) {
        setError("Sign in as shop owner or staff to trace serial provenance.");
      }
    }
    void init();
  }, [serial, loadTrace]);

  async function handleMarkHaywire(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/serials/${encodeURIComponent(serial)}/trace`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "mark_haywire",
          haywire_notes: notes,
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Failed to mark haywire");
      setStatusMsg("Unit marked as haywire / defective return.");
      await loadTrace(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark haywire");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate-400">
        <Link href="/serials" className="hover:text-white">&larr; Back to Serials</Link>
      </nav>
      <h1 className="text-2xl font-bold text-white">Serial Provenance Trace</h1>

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

      {trace ? (
        <section className="mt-6 space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-sm">
          <p>
            <span className="text-slate-400">Serial:</span>{" "}
            <code className="font-semibold text-white">{trace.serial_number}</code>
          </p>
          <p>
            <span className="text-slate-400">Status:</span>{" "}
            <span className="font-semibold text-emerald-400">{trace.status}</span>
          </p>
          <p>
            <span className="text-slate-400">Product:</span>{" "}
            {trace.product ? `${trace.product.brand} ${trace.product.name} (${trace.product.sku})` : "N/A"}
          </p>
          <p>
            <span className="text-slate-400">Supplier:</span>{" "}
            {trace.supplier ? `${trace.supplier.name} (${trace.supplier.availability_status})` : "N/A"}
          </p>
          <p>
            <span className="text-slate-400">Expected Delivery Date:</span>{" "}
            {trace.expected_delivery_date ?? trace.supplier?.expected_delivery_date ?? "N/A"}
          </p>
          <p>
            <span className="text-slate-400">Received At:</span>{" "}
            {new Date(trace.received_at).toLocaleString()}
          </p>

          {trace.status === "haywire_returned" ? (
            <div className="rounded border border-amber-800 bg-amber-950/40 p-3 text-xs text-amber-200">
              <p className="font-semibold">Haywire / Defective Return Logged</p>
              <p className="mt-1">{trace.haywire_notes}</p>
            </div>
          ) : (
            <form onSubmit={handleMarkHaywire} className="space-y-3 border-t border-slate-800 pt-4">
              <label htmlFor="hw-notes" className="block text-xs font-medium text-slate-300">
                Mark Haywire / Defective Return Notes
              </label>
              <input
                id="hw-notes"
                required
                minLength={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Auto-firing coil defect reported by customer"
                className="min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
              />
              <button
                type="submit"
                disabled={busy}
                className="min-h-[48px] rounded-md bg-amber-500 px-4 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
              >
                Mark Haywire / Defective Return
              </button>
            </form>
          )}
        </section>
      ) : null}
    </main>
  );
}
