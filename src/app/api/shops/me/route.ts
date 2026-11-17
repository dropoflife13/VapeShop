import { jsonNoStore, requireAuth } from "@/lib/supabase/server";

interface UpdateShopBody {
  reservations_enabled?: unknown;
  delivery_enabled?: unknown;
  pickup_grace_minutes?: unknown;
}

export async function GET(request: Request) {
  const auth = await requireAuth(request, ["owner", "staff"]);
  if (!auth.ok) {
    return auth.response;
  }

  const { actor } = auth;
  const { data: shop, error } = await actor.ctx.supabase
    .from("shops")
    .select("id, name, slug, reservations_enabled, delivery_enabled, pickup_grace_minutes, status, created_at, updated_at")
    .eq("id", actor.tenantId)
    .single();

  if (error || !shop) {
    return jsonNoStore(
      { error: error?.message ?? "Shop not found" },
      { status: 404 }
    );
  }

  return jsonNoStore({ shop, role: actor.role });
}

export async function PATCH(request: Request) {
  const auth = await requireAuth(request, ["owner"]);
  if (!auth.ok) {
    return auth.response;
  }

  let body: UpdateShopBody;
  try {
    body = (await request.json()) as UpdateShopBody;
  } catch {
    return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.reservations_enabled === "boolean") {
    updates.reservations_enabled = body.reservations_enabled;
  }
  if (typeof body.delivery_enabled === "boolean") {
    updates.delivery_enabled = body.delivery_enabled;
  }
  if (typeof body.pickup_grace_minutes === "number") {
    if (
      !Number.isInteger(body.pickup_grace_minutes) ||
      body.pickup_grace_minutes < 15 ||
      body.pickup_grace_minutes > 1440
    ) {
      return jsonNoStore(
        { error: "pickup_grace_minutes must be an integer between 15 and 1440" },
        { status: 422 }
      );
    }
    updates.pickup_grace_minutes = body.pickup_grace_minutes;
  }

  if (Object.keys(updates).length === 1) {
    return jsonNoStore({ error: "No valid fields to update" }, { status: 400 });
  }

  const { actor } = auth;
  const { data: shop, error } = await actor.ctx.supabase
    .from("shops")
    .update(updates)
    .eq("id", actor.tenantId)
    .select("id, name, slug, reservations_enabled, delivery_enabled, pickup_grace_minutes, status, updated_at")
    .single();

  if (error || !shop) {
    return jsonNoStore(
      { error: error?.message ?? "Failed to update shop" },
      { status: 400 }
    );
  }

  return jsonNoStore({ shop });
}
