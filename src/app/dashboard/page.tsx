"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

interface ShopConfig {
  id: string;
  name: string;
  slug: string;
  reservations_enabled: boolean;
  delivery_enabled: boolean;
  pickup_grace_minutes: number;
}

interface SupplierRow {
  id: string;
  name: string;
  availability_status: string;
  expected_delivery_date: string | null;
}

interface ProductRow {
  id: string;
  sku: string;
  brand: string;
  name: string;
  flavor_descriptor: string;
  dti_ps_mark: string;
  unit_price_centavos: number;
}

interface InventoryRow {
  product_id: string;
  sku: string;
  name: string;
  on_hand_qty: number;
  active_reserved_qty: number;
  available_qty: number;
}

export default function ShopDashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string>("customer");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [shop, setShop] = useState<ShopConfig | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);

  // Supplier form
  const [supName, setSupName] = useState("");
  const [supStatus, setSupStatus] = useState("in_stock");
  const [supEta, setSupEta] = useState("");

  // Product form
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("");
  const [prodName, setProdName] = useState("");
  const [flavor, setFlavor] = useState("");
  const [psMark, setPsMark] = useState("");
  const [pricePhp, setPricePhp] = useState("450");
  const [prodSupplierId, setProdSupplierId] = useState("");

  // Restock form
  const [restockProductId, setRestockProductId] = useState("");
  const [restockQty, setRestockQty] = useState("10");

  // Staff form (owner only)
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffName, setStaffName] = useState("");

  const loadDashboard = useCallback(async (accessToken: string) => {
    setLoading(true);
    setError(null);
    const headers = { Authorization: `Bearer ${accessToken}` };

    const [shopRes, supRes, prodRes, invRes] = await Promise.all([
      fetch("/api/shops/me", { headers }),
      fetch("/api/suppliers", { headers }),
      fetch("/api/products", { headers }),
      fetch("/api/inventory", { headers }),
    ]);

    if (!shopRes.ok) {
      const p = (await shopRes.json()) as { error?: string };
      setError(p.error ?? "Sign in as shop owner or staff to view dashboard.");
      setLoading(false);
      return;
    }

    const shopData = (await shopRes.json()) as { shop: ShopConfig; role: string };
    const supData = (await supRes.json()) as { suppliers?: SupplierRow[] };
    const prodData = (await prodRes.json()) as { products?: ProductRow[] };
    const invData = (await invRes.json()) as { inventory?: InventoryRow[] };

    setShop(shopData.shop);
    setRole(shopData.role);
    setSuppliers(supData.suppliers ?? []);
    const prods = prodData.products ?? [];
    setProducts(prods);
    if (prods[0] && !restockProductId) {
      setRestockProductId(prods[0].id);
    }
    setInventory(invData.inventory ?? []);
    setLoading(false);
  }, [restockProductId]);

  useEffect(() => {
    async function init() {
      const supabase = getBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token ?? null;
      setToken(accessToken);
      if (accessToken) {
        await loadDashboard(accessToken);
      } else {
        setError("Please sign in first.");
        setLoading(false);
      }
    }
    void init();
  }, [loadDashboard]);

  async function handleSaveToggles(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !shop) return;
    setBusy(true);
    setError(null);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/shops/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reservations_enabled: shop.reservations_enabled,
          delivery_enabled: shop.delivery_enabled,
          pickup_grace_minutes: shop.pickup_grace_minutes,
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Failed to update shop toggles");
      setStatusMsg("Shop settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: supName,
          availability_status: supStatus,
          expected_delivery_date: supEta || null,
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Failed to add supplier");
      setSupName("");
      setSupEta("");
      setStatusMsg("Supplier added.");
      await loadDashboard(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add supplier");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    setStatusMsg(null);
    try {
      const centavos = Math.round(Number(pricePhp) * 100);
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          supplier_id: prodSupplierId || null,
          sku,
          brand,
          name: prodName,
          flavor_descriptor: flavor,
          dti_ps_mark: psMark,
          unit_price_centavos: centavos,
        }),
      });
      const payload = (await res.json()) as {
        error?: string;
        code?: string;
        reasons?: string[];
      };
      if (!res.ok) {
        const detail = payload.reasons?.join(" ") ?? payload.error ?? "Failed";
        throw new Error(payload.code ? `${payload.code}: ${detail}` : detail);
      }
      setSku("");
      setBrand("");
      setProdName("");
      setFlavor("");
      setPsMark("");
      setStatusMsg("Product added to catalog.");
      await loadDashboard(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add product");
    } finally {
      setBusy(false);
    }
  }

  async function handleRestock(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !restockProductId) return;
    setBusy(true);
    setError(null);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: restockProductId,
          delta_qty: Number(restockQty),
          reason: "restock",
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Restock failed");
      setStatusMsg("Stock movement recorded.");
      await loadDashboard(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Restock failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/shops/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: staffEmail,
          password: staffPassword,
          full_name: staffName,
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Failed to create staff");
      setStaffEmail("");
      setStaffPassword("");
      setStaffName("");
      setStatusMsg("Staff account created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create staff");
    } finally {
      setBusy(false);
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
        Shop Operations Dashboard {shop ? `— ${shop.name}` : ""}
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
        <p className="mt-6 text-sm text-slate-400">Loading shop dashboard...</p>
      ) : shop ? (
        <div className="mt-8 space-y-10">
          {role === "owner" ? (
            <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-lg font-semibold text-white">Shop Feature Toggles</h2>
              <form onSubmit={handleSaveToggles} className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    id="res-en"
                    type="checkbox"
                    checked={shop.reservations_enabled}
                    onChange={(e) =>
                      setShop({ ...shop, reservations_enabled: e.target.checked })
                    }
                    className="h-5 w-5 accent-emerald-500"
                  />
                  <label htmlFor="res-en" className="text-sm text-slate-200">
                    Reservations Enabled
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="del-en"
                    type="checkbox"
                    checked={shop.delivery_enabled}
                    onChange={(e) =>
                      setShop({ ...shop, delivery_enabled: e.target.checked })
                    }
                    className="h-5 w-5 accent-emerald-500"
                  />
                  <label htmlFor="del-en" className="text-sm text-slate-200">
                    Delivery Enabled
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="min-h-[48px] rounded-md bg-emerald-500 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  Save Shop Toggles
                </button>
              </form>
            </section>
          ) : null}

          {/* Suppliers */}
          <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">Suppliers &amp; Delivery ETA</h2>
            <form onSubmit={handleAddSupplier} className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="sup-name" className="block text-xs text-slate-300">
                  Supplier Name
                </label>
                <input
                  id="sup-name"
                  type="text"
                  required
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="sup-status" className="block text-xs text-slate-300">
                  Availability
                </label>
                <select
                  id="sup-status"
                  value={supStatus}
                  onChange={(e) => setSupStatus(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
                >
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>
              <div>
                <label htmlFor="sup-eta" className="block text-xs text-slate-300">
                  Expected Delivery Date
                </label>
                <input
                  id="sup-eta"
                  type="date"
                  value={supEta}
                  onChange={(e) => setSupEta(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
                />
              </div>
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={busy}
                  className="min-h-[48px] rounded-md bg-emerald-500 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  Add Supplier
                </button>
              </div>
            </form>
            <ul className="mt-4 space-y-1 text-xs text-slate-300">
              {suppliers.map((s) => (
                <li key={s.id}>
                  <span className="font-semibold text-white">{s.name}</span> &middot;{" "}
                  {s.availability_status} &middot; ETA: {s.expected_delivery_date ?? "N/A"}
                </li>
              ))}
            </ul>
          </section>

          {/* Products */}
          <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">
              Catalog Products (RA 11900 Gated)
            </h2>
            <form onSubmit={handleAddProduct} className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="p-sku" className="block text-xs text-slate-300">SKU</label>
                <input id="p-sku" required value={sku} onChange={(e) => setSku(e.target.value)} className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
              </div>
              <div>
                <label htmlFor="p-brand" className="block text-xs text-slate-300">Brand</label>
                <input id="p-brand" required value={brand} onChange={(e) => setBrand(e.target.value)} className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
              </div>
              <div>
                <label htmlFor="p-name" className="block text-xs text-slate-300">Product Name</label>
                <input id="p-name" required value={prodName} onChange={(e) => setProdName(e.target.value)} className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
              </div>
              <div>
                <label htmlFor="p-flavor" className="block text-xs text-slate-300">Flavor Descriptor</label>
                <input id="p-flavor" value={flavor} onChange={(e) => setFlavor(e.target.value)} className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
              </div>
              <div>
                <label htmlFor="p-ps" className="block text-xs text-slate-300">DTI PS Mark</label>
                <input id="p-ps" required value={psMark} onChange={(e) => setPsMark(e.target.value)} className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
              </div>
              <div>
                <label htmlFor="p-price" className="block text-xs text-slate-300">Price (PHP)</label>
                <input id="p-price" required type="text" inputMode="decimal" value={pricePhp} onChange={(e) => setPricePhp(e.target.value)} className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
              </div>
              <div>
                <label htmlFor="p-sup" className="block text-xs text-slate-300">Supplier</label>
                <select id="p-sup" value={prodSupplierId} onChange={(e) => setProdSupplierId(e.target.value)} className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white">
                  <option value="">None</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-3">
                <button type="submit" disabled={busy} className="min-h-[48px] rounded-md bg-emerald-500 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">
                  Add Product
                </button>
              </div>
            </form>

            <h3 className="mt-6 text-sm font-semibold text-slate-200">Available Inventory</h3>
            <table className="mt-2 w-full text-left text-xs">
              <caption className="sr-only">Available Inventory</caption>
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th scope="col" className="py-2 pr-3">SKU</th>
                  <th scope="col" className="py-2 pr-3">Product</th>
                  <th scope="col" className="py-2 pr-3">On Hand</th>
                  <th scope="col" className="py-2 pr-3">Reserved</th>
                  <th scope="col" className="py-2">Available</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {inventory.map((i) => (
                  <tr key={i.product_id}>
                    <td className="py-2 pr-3 text-slate-400">{i.sku}</td>
                    <td className="py-2 pr-3 text-white">{i.name}</td>
                    <td className="py-2 pr-3">{i.on_hand_qty}</td>
                    <td className="py-2 pr-3">{i.active_reserved_qty}</td>
                    <td className="py-2 font-semibold text-emerald-400">{i.available_qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <form onSubmit={handleRestock} className="mt-6 flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="rs-prod" className="block text-xs text-slate-300">Restock Product</label>
                <select id="rs-prod" value={restockProductId} onChange={(e) => setRestockProductId(e.target.value)} className="mt-1 min-h-[48px] rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white">
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="rs-qty" className="block text-xs text-slate-300">Qty</label>
                <input id="rs-qty" type="text" inputMode="numeric" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} className="mt-1 min-h-[48px] w-24 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
              </div>
              <button type="submit" disabled={busy} className="min-h-[48px] rounded-md bg-emerald-500 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">
                Record Restock
              </button>
            </form>
          </section>

          {role === "owner" ? (
            <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-lg font-semibold text-white">Create Staff Account</h2>
              <form onSubmit={handleAddStaff} className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="st-email" className="block text-xs text-slate-300">Email</label>
                  <input id="st-email" type="email" required value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
                </div>
                <div>
                  <label htmlFor="st-pw" className="block text-xs text-slate-300">Temp Password (8+)</label>
                  <input id="st-pw" type="password" required minLength={8} value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
                </div>
                <div>
                  <label htmlFor="st-name" className="block text-xs text-slate-300">Full Name</label>
                  <input id="st-name" type="text" value={staffName} onChange={(e) => setStaffName(e.target.value)} className="mt-1 min-h-[48px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
                </div>
                <div className="sm:col-span-3">
                  <button type="submit" disabled={busy} className="min-h-[48px] rounded-md bg-emerald-500 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">
                    Add Staff Member
                  </button>
                </div>
              </form>
            </section>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
