"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

interface SessionState {
  email: string;
  role: string;
  tenantId: string | null;
}

export function SessionStatusBanner() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const supabase = getBrowserSupabaseClient();
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user;
        if (user) {
          const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
          setSession({
            email: user.email ?? "",
            role: typeof appMeta.role === "string" ? appMeta.role : "customer",
            tenantId:
              typeof appMeta.tenant_id === "string" ? appMeta.tenant_id : null,
          });
        }
      } catch {
        // Optional on public landing
      } finally {
        setChecked(true);
      }
    }
    void load();
  }, []);

  if (!checked || !session) {
    return null;
  }

  const target =
    session.role === "system_admin"
      ? { href: "/admin", label: "OPEN ADMIN CONSOLE" }
      : session.role === "owner" || session.role === "staff"
      ? { href: "/dashboard", label: "OPEN SHOP DASHBOARD" }
      : { href: "/reservations", label: "MY RESERVATIONS" };

  return (
    <div className="border-b border-white/10 bg-[#05143E]/90 px-6 py-2.5 text-xs">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <p className="text-blue-100/90">
          Signed in as <span className="font-semibold text-white">{session.email}</span>{" "}
          <span className="mx-1.5 text-white/30">&bull;</span>
          <span className="font-mono uppercase tracking-wider text-[#F58A1F]">
            {session.role}
          </span>
        </p>
        <Link
          href={target.href}
          className="font-semibold tracking-wider text-[#F58A1F] hover:text-amber-300"
        >
          {target.label} &rarr;
        </Link>
      </div>
    </div>
  );
}
