import { jsonNoStore, requireAuth } from "@/lib/supabase/server";

interface UpdateBannedRuleBody {
  status?: unknown;
  brand_pattern?: unknown;
  flavor_pattern?: unknown;
  description?: unknown;
  legal_basis?: unknown;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ["system_admin"]);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  if (!id) {
    return jsonNoStore({ error: "Missing rule id" }, { status: 400 });
  }

  let body: UpdateBannedRuleBody;
  try {
    body = (await request.json()) as UpdateBannedRuleBody;
  } catch {
    return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.status === "active" || body.status === "archived") {
    updates.status = body.status;
  }
  if (typeof body.brand_pattern === "string") {
    updates.brand_pattern = body.brand_pattern.trim() || null;
  }
  if (typeof body.flavor_pattern === "string") {
    updates.flavor_pattern = body.flavor_pattern.trim() || null;
  }
  if (typeof body.description === "string" && body.description.trim().length >= 3) {
    updates.description = body.description.trim();
  }
  if (typeof body.legal_basis === "string" && body.legal_basis.trim().length >= 3) {
    updates.legal_basis = body.legal_basis.trim();
  }

  if (Object.keys(updates).length === 1) {
    return jsonNoStore({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await auth.actor.ctx.supabase
    .from("ph_banned_products")
    .update(updates)
    .eq("id", id)
    .select(
      "id, rule_type, brand_pattern, flavor_pattern, description, legal_basis, status, updated_at"
    )
    .single();

  if (error || !data) {
    return jsonNoStore(
      { error: error?.message ?? "Rule not found" },
      { status: error ? 400 : 404 }
    );
  }

  return jsonNoStore({ rule: data });
}
