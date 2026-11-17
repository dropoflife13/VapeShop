import { jsonNoStore, requireAuth } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const auth = await requireAuth(request, ["system_admin", "owner", "staff"]);
  if (!auth.ok) {
    return auth.response;
  }

  const tenantScope =
    auth.actor.role === "system_admin" ? null : auth.actor.tenantId;

  const { data, error } = await auth.actor.ctx.supabase.rpc(
    "expire_overdue_reservations",
    {
      p_tenant_id: tenantScope,
    }
  );

  if (error) {
    return jsonNoStore({ error: error.message }, { status: 400 });
  }

  return jsonNoStore({ expired_count: data ?? 0 });
}
