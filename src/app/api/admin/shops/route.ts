import { jsonNoStore, requireAuth } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const auth = await requireAuth(request, ["system_admin"]);
  if (!auth.ok) {
    return auth.response;
  }

  const { data, error } = await auth.actor.ctx.supabase
    .from("shops")
    .select(
      "id, name, slug, reservations_enabled, delivery_enabled, pickup_grace_minutes, status, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return jsonNoStore({ error: error.message }, { status: 400 });
  }

  return jsonNoStore({ shops: data ?? [] });
}
