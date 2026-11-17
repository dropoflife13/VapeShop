"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

interface BannedRule {
  id: string;
  rule_type: string;
  brand_pattern: string | null;
  flavor_pattern: string | null;
  description: string;
  legal_basis: string;
  status: "active" | "archived";
}

interface ShopRow {
  id: string;
  name: string;
  slug: string;
  reservations_enabled: boolean;
  delivery_enabled: boolean;
  status: "active" | "suspended";
}

interface RepairRow {
  id: string;
  title: string;
  category: string;
  status: "open" | "in_progress" | "resolved";
  notes: string;
}

export default function AdminConsolePage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [repairs, setRepairs] = useState<RepairRow[]>([]);
  const [rules, setRules] = useState<BannedRule[]>([]);
  const [shops, setShops] = useState<ShopRow[]>([]);

  // New banned rule form
  const [ruleType, setRuleType] = useState("banned_brand");
  const [brandPattern, setBrandPattern] = useState("");
  const [flavorPattern, setFlavorPattern] = useState("");
  const [ruleDesc, setRuleDesc] = useState("");
  const [legalBasis, setLegalBasis] = useState("RA 11900 §12 / DTI");

  // New repair form
  const [repairTitle, setRepairTitle] = useState("");
  const [repairCategory, setRepairCategory] = useState("maintenance");
  const [repairNotes, setRepairNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const loadAll = useCallback(async (accessToken: string) => {
    setLoading(true);
    setError(null);
    const headers = { Authorization: `Bearer ${accessToken}` };

    const [sysRes, rulesRes, shopsRes] = await Promise.all([
      fetch("/api/admin/system", { headers }),
      fetch("/api/admin/banned-products", { headers }),
      fetch("/api/admin/shops", { headers }),
    ]);

    if (!sysRes.ok) {
      const payload = (await sysRes.json()) as { error?: string };
      setError(payload.error ?? `Admin access denied (${sysRes.status})`);
      setLoading(false);
      return;
    }

    const sysData = (await sysRes.json()) as {
      settings: { maintenance_mode: boolean; maintenance_message: string };
      repairs: RepairRow[];
    };
    const rulesData = (await rulesRes.json()) as { rules?: BannedRule[] };
    const shopsData = (await shopsRes.json()) as { shops?: ShopRow[] };

    setMaintenanceMode(sysData.settings?.maintenance_mode ?? false);
    setMaintenanceMessage(sysData.settings?.maintenance_message ?? "");
    setRepairs(sysData.repairs ?? []);
    setRules(rulesData.rules ?? []);
    setShops(shopsData.shops ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const supabase = getBrowserSupabaseClient();
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token ?? null;
        setToken(accessToken);
        if (accessToken) {
          await loadAll(accessToken);
        } else {
          setError("Sign in as system_admin to access the Admin Console.");
          setLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize");
        setLoading(false);
      }
    }
    void init();
  }, [loadAll]);

  async function handleSaveMaintenance(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/system", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          maintenance_mode: maintenanceMode,
          maintenance_message: maintenanceMessage,
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Failed to update settings");
      setStatusMsg("System maintenance settings updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/banned-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rule_type: ruleType,
          brand_pattern: brandPattern || null,
          flavor_pattern: flavorPattern || null,
          description: ruleDesc,
          legal_basis: legalBasis,
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Failed to add rule");
      setBrandPattern("");
      setFlavorPattern("");
      setRuleDesc("");
      setStatusMsg("PH banned product rule added.");
      await loadAll(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add rule");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleRuleStatus(rule: BannedRule) {
    if (!token) return;
    const nextStatus = rule.status === "active" ? "archived" : "active";
    const res = await fetch(`/api/admin/banned-products/${rule.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      await loadAll(token);
    }
  }

  async function toggleShopStatus(shop: ShopRow) {
    if (!token) return;
    const nextStatus = shop.status === "active" ? "suspended" : "active";
    const res = await fetch(`/api/admin/shops/${shop.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      await loadAll(token);
    }
  }

  async function handleCreateRepair(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/system", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: repairTitle,
          category: repairCategory,
          notes: repairNotes,
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Failed to log repair");
      setRepairTitle("");
      setRepairNotes("");
      setStatusMsg("Repair ticket created.");
      await loadAll(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log repair");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateRepairStatus(id: string, status: "in_progress" | "resolved") {
    if (!token) return;
    const res = await fetch("/api/admin/system", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ repair_id: id, repair_status: status }),
    });
    if (res.ok) {
      await loadAll(token);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate-400">
        <Link href="/" className="hover:text-white">
          &larr; Home
        </Link>
      </nav>
      <h1 className="text-2xl font-bold text-white">
        System Admin Console (RA 11900 &amp; Platform Ops)
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

      {loading ? (
        <p className="mt-6 text-sm text-slate-400">Loading admin console...</p>
      ) : !error || rules.length > 0 || shops.length > 0 ? (
        <div className="mt-8 space-y-10">
          {/* Maintenance Mode */}
          <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">System Maintenance Mode</h2>
            <form onSubmit={handleSaveMaintenance} className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <input
                  id="maint-mode"
                  name="maintenance_mode"
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-700 bg-slate-950 accent-emerald-500"
                />
                <label htmlFor="maint-mode" className="text-sm text-slate-200">
                  Enable platform-wide maintenance mode
                </label>
              </div>
              <div>
                <label htmlFor="maint-msg" className="block text-xs font-medium text-slate-300">
                  Maintenance Notice
                </label>
                <input
                  id="maint-msg"
                  name="maintenance_message"
                  type="text"
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="min-h-[48px] rounded-md bg-emerald-500 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                Save Maintenance Settings
              </button>
            </form>
          </section>

          {/* PH Banned Products Watchlist */}
          <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">
              PH Banned Products Watchlist (RA 11900)
            </h2>
            <form onSubmit={handleAddRule} className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="rule-type" className="block text-xs font-medium text-slate-300">
                  Rule Type
                </label>
                <select
                  id="rule-type"
                  name="rule_type"
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
                >
                  <option value="banned_brand">Banned Brand</option>
                  <option value="prohibited_flavor_descriptor">Prohibited Flavor Descriptor</option>
                  <option value="missing_certification">Missing Certification</option>
                </select>
              </div>
              <div>
                <label htmlFor="legal-basis" className="block text-xs font-medium text-slate-300">
                  Legal Basis
                </label>
                <input
                  id="legal-basis"
                  name="legal_basis"
                  type="text"
                  required
                  value={legalBasis}
                  onChange={(e) => setLegalBasis(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="brand-pat" className="block text-xs font-medium text-slate-300">
                  Brand Pattern (regex/text)
                </label>
                <input
                  id="brand-pat"
                  name="brand_pattern"
                  type="text"
                  value={brandPattern}
                  onChange={(e) => setBrandPattern(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="flavor-pat" className="block text-xs font-medium text-slate-300">
                  Flavor Pattern (regex/text)
                </label>
                <input
                  id="flavor-pat"
                  name="flavor_pattern"
                  type="text"
                  value={flavorPattern}
                  onChange={(e) => setFlavorPattern(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="rule-desc" className="block text-xs font-medium text-slate-300">
                  Description
                </label>
                <input
                  id="rule-desc"
                  name="description"
                  type="text"
                  required
                  minLength={3}
                  value={ruleDesc}
                  onChange={(e) => setRuleDesc(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[48px] rounded-md bg-emerald-500 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  Add Watchlist Rule
                </button>
              </div>
            </form>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">PH Banned Products Watchlist</caption>
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th scope="col" className="py-2 pr-3">Type</th>
                    <th scope="col" className="py-2 pr-3">Pattern</th>
                    <th scope="col" className="py-2 pr-3">Legal Basis</th>
                    <th scope="col" className="py-2 pr-3">Status</th>
                    <th scope="col" className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {rules.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 pr-3 text-slate-200">{r.rule_type}</td>
                      <td className="py-2 pr-3 text-slate-300">
                        {r.brand_pattern ?? r.flavor_pattern ?? "—"}
                      </td>
                      <td className="py-2 pr-3 text-slate-400">{r.legal_basis}</td>
                      <td className="py-2 pr-3">{r.status}</td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => void toggleRuleStatus(r)}
                          className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800"
                        >
                          {r.status === "active" ? "Archive" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Shops Oversight */}
          <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">Registered Tenant Shops</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">Registered Tenant Shops</caption>
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th scope="col" className="py-2 pr-3">Shop</th>
                    <th scope="col" className="py-2 pr-3">Slug</th>
                    <th scope="col" className="py-2 pr-3">Reservations</th>
                    <th scope="col" className="py-2 pr-3">Status</th>
                    <th scope="col" className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {shops.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2 pr-3 font-medium text-white">{s.name}</td>
                      <td className="py-2 pr-3 text-slate-400">{s.slug}</td>
                      <td className="py-2 pr-3">{s.reservations_enabled ? "On" : "Off"}</td>
                      <td className="py-2 pr-3">{s.status}</td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => void toggleShopStatus(s)}
                          className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800"
                        >
                          {s.status === "active" ? "Suspend" : "Reactivate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Repair Queue */}
          <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">System Repair &amp; Patch Queue</h2>
            <form onSubmit={handleCreateRepair} className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="rep-title" className="block text-xs font-medium text-slate-300">
                  Repair Title
                </label>
                <input
                  id="rep-title"
                  name="title"
                  type="text"
                  required
                  minLength={3}
                  value={repairTitle}
                  onChange={(e) => setRepairTitle(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="rep-cat" className="block text-xs font-medium text-slate-300">
                  Category
                </label>
                <select
                  id="rep-cat"
                  name="category"
                  value={repairCategory}
                  onChange={(e) => setRepairCategory(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
                >
                  <option value="maintenance">Maintenance</option>
                  <option value="bugfix">Bugfix</option>
                  <option value="security_patch">Security Patch</option>
                  <option value="compliance_update">Compliance Update</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="rep-notes" className="block text-xs font-medium text-slate-300">
                  Notes
                </label>
                <input
                  id="rep-notes"
                  name="notes"
                  type="text"
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[48px] rounded-md bg-emerald-500 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  Log Repair Item
                </button>
              </div>
            </form>

            <ul className="mt-4 space-y-2 text-xs">
              {repairs.map((rep) => (
                <li
                  key={rep.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-800 bg-slate-950 p-3"
                >
                  <div>
                    <span className="font-semibold text-white">{rep.title}</span>{" "}
                    <span className="text-slate-400">({rep.category} &middot; {rep.status})</span>
                  </div>
                  <div className="flex gap-2">
                    {rep.status !== "in_progress" ? (
                      <button
                        type="button"
                        onClick={() => void updateRepairStatus(rep.id, "in_progress")}
                        className="rounded border border-slate-700 px-2 py-1 hover:bg-slate-800"
                      >
                        In Progress
                      </button>
                    ) : null}
                    {rep.status !== "resolved" ? (
                      <button
                        type="button"
                        onClick={() => void updateRepairStatus(rep.id, "resolved")}
                        className="rounded border border-emerald-700 px-2 py-1 text-emerald-300 hover:bg-emerald-950"
                      >
                        Resolve
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </main>
  );
}
