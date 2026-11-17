"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Truck, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PublicShop {
  id: string;
  name: string;
  slug: string;
  reservations_enabled: boolean;
  delivery_enabled: boolean;
  pickup_grace_minutes: number;
}

type FilterMode = "all" | "pickup" | "delivery";

export function AvailableShopsSection() {
  const [shops, setShops] = useState<PublicShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("all");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/shops/public");
        if (res.ok) {
          const data = (await res.json()) as { shops?: PublicShop[] };
          setShops(data.shops ?? []);
        }
      } catch {
        // Non-blocking if backend is not yet migrated
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const filtered = shops.filter((s) => {
    if (filter === "pickup") return s.reservations_enabled;
    if (filter === "delivery") return s.delivery_enabled;
    return true;
  });

  return (
    <section
      id="shops"
      aria-labelledby="shops-heading"
      className="mx-auto max-w-6xl px-6 py-16"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#E86F12] dark:text-[#F58A1F]">
            LIVE PARTNER STORES
          </p>
          <h2
            id="shops-heading"
            className="mt-2 font-display text-4xl uppercase tracking-wide text-[var(--text-primary)] sm:text-5xl"
          >
            Available Shops
          </h2>
        </div>

        <div
          role="group"
          aria-label="Filter available shops"
          className="flex flex-wrap gap-2"
        >
          {(
            [
              { id: "all", label: "All Shops" },
              { id: "pickup", label: "Pickup Ready" },
              { id: "delivery", label: "Delivery Available" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={buttonVariants({
                variant: filter === tab.id ? "primary" : "outline",
                size: "sm",
              })}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-48 animate-pulse rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/50"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>No Shops Registered Yet</CardTitle>
            <CardDescription>
              Be the first vape shop in your area to launch live stock, 1-hour
              express pickup, and verified serial QR provenance.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link
              href="/register-shop"
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              Register Your Shop <ArrowRight className="h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((shop) => (
            <Card key={shop.id} className="hover-lift flex flex-col justify-between">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  {shop.reservations_enabled ? (
                    <Badge variant="amber">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {shop.pickup_grace_minutes}m Pickup Hold
                    </Badge>
                  ) : (
                    <Badge variant="subtle">Walk-In Only</Badge>
                  )}
                  {shop.delivery_enabled ? (
                    <Badge variant="telemetry">
                      <Truck className="h-3 w-3" aria-hidden="true" />
                      Delivery
                    </Badge>
                  ) : null}
                </div>
                <CardTitle className="mt-3 flex items-center gap-2">
                  <MapPin
                    className="h-4 w-4 shrink-0 text-[#E86F12] dark:text-[#F58A1F]"
                    aria-hidden="true"
                  />
                  {shop.name}
                </CardTitle>
                <CardDescription>/{shop.slug}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0" />
              <CardFooter>
                <Link
                  href={`/reservations?tenantId=${encodeURIComponent(shop.id)}`}
                  className={buttonVariants({
                    variant: shop.reservations_enabled ? "primary" : "outline",
                    size: "sm",
                    className: "w-full",
                  })}
                >
                  {shop.reservations_enabled
                    ? "Reserve at This Shop"
                    : "View Shop"}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
