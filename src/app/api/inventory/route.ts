import { jsonNoStore, requireAuth } from "@/lib/supabase/server";

const ALLOWED_MANUAL_REASONS = new Set([
  "restock",
  "void_reversal",
  "return_restock",
  "adjustment",
]);

interface CreateMovementBody {
  product_id?: unknown;
  delta_qty?: unknown;
  reason?: unknown;
  reference_id?: unknown;
  supersedes_id?: unknown;
}

export async function GET(request: Request) {
  const auth = await requireAuth(request, ["owner", "staff"]);
  if (!auth.ok) {
    return auth.response;
  }

  const { data, error } = await auth.actor.ctx.supabase
    .from("available_inventory_view")
    .select(
      "tenant_id, product_id, sku, brand, name, on_hand_qty, active_reserved_qty, available_qty"
    )
    .eq("tenant_id", auth.actor.tenantId)
    .order("name", { ascending: true });

  if (error) {
    return jsonNoStore({ error: error.message }, { status: 400 });
  }

  return jsonNoStore({ inventory: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAuth(request, ["owner", "staff"]);
  if (!auth.ok) {
    return auth.response;
  }

  let body: CreateMovementBody;
  try {
    body = (await request.json()) as CreateMovementBody;
  } catch {
    return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
  }

  const productId =
    typeof body.product_id === "string" ? body.product_id.trim() : "";
  const deltaQty = typeof body.delta_qty === "number" ? body.delta_qty : 0;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const referenceId =
    typeof body.reference_id === "string" && body.reference_id.trim().length > 0
      ? body.reference_id.trim()
      : null;
  const supersedesId =
    typeof body.supersedes_id === "string" && body.supersedes_id.trim().length > 0
      ? body.supersedes_id.trim()
      : null;

  if (!productId) {
    return jsonNoStore({ error: "product_id is required" }, { status: 422 });
  }
  if (!Number.isInteger(deltaQty) || deltaQty === 0) {
    return jsonNoStore(
      { error: "delta_qty must be a non-zero integer" },
      { status: 422 }
    );
  }
  if (!ALLOWED_MANUAL_REASONS.has(reason)) {
    return jsonNoStore(
      {
        error:
          "reason must be restock, void_reversal, return_restock, or adjustment",
      },
      { status: 422 }
    );
  }

  const { data, error } = await auth.actor.ctx.supabase
    .from("inventory_movements")
    .insert({
      tenant_id: auth.actor.tenantId,
      product_id: productId,
      delta_qty: deltaQty,
      reason,
      reference_id: referenceId,
      actor_id: auth.actor.userId,
      supersedes_id: supersedesId,
    })
    .select(
      "id, tenant_id, product_id, delta_qty, reason, reference_id, supersedes_id, created_at"
    )
    .single();

  if (error || !data) {
    return jsonNoStore(
      { error: error?.message ?? "Failed to record inventory movement" },
      { status: 400 }
    );
  }

  return jsonNoStore({ movement: data }, { status: 201 });
}
