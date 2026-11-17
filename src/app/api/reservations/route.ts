import { jsonNoStore, requireAuth } from "@/lib/supabase/server";

interface CreateReservationBody {
  tenant_id?: unknown;
  product_id?: unknown;
  qty?: unknown;
  scheduled_pickup_at?: unknown;
  fulfillment_type?: unknown;
}

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { actor } = auth;
  // Read-time lazy sweep so expired reservations never block available inventory
  await actor.ctx.supabase.rpc("expire_overdue_reservations", {
    p_tenant_id: actor.tenantId,
  });

  let query = actor.ctx.supabase
    .from("reservations")
    .select(
      "id, tenant_id, customer_id, product_id, qty, fulfillment_type, scheduled_pickup_at, expires_at, status, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (actor.role === "customer") {
    query = query.eq("customer_id", actor.userId);
  } else if (actor.tenantId) {
    query = query.eq("tenant_id", actor.tenantId);
  }

  const { data, error } = await query;
  if (error) {
    return jsonNoStore({ error: error.message }, { status: 400 });
  }

  return jsonNoStore({ reservations: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  let body: CreateReservationBody;
  try {
    body = (await request.json()) as CreateReservationBody;
  } catch {
    return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
  }

  const tenantId =
    typeof body.tenant_id === "string" ? body.tenant_id.trim() : "";
  const productId =
    typeof body.product_id === "string" ? body.product_id.trim() : "";
  const qty = typeof body.qty === "number" ? body.qty : 0;
  const scheduledPickupAt =
    typeof body.scheduled_pickup_at === "string"
      ? body.scheduled_pickup_at.trim()
      : "";
  const fulfillmentType =
    body.fulfillment_type === "delivery" ? "delivery" : "pickup";

  if (!tenantId || !productId) {
    return jsonNoStore(
      { error: "tenant_id and product_id are required" },
      { status: 422 }
    );
  }
  if (!Number.isInteger(qty) || qty <= 0) {
    return jsonNoStore(
      { error: "qty must be a positive integer" },
      { status: 422 }
    );
  }
  if (!scheduledPickupAt || Number.isNaN(Date.parse(scheduledPickupAt))) {
    return jsonNoStore(
      { error: "Valid ISO scheduled_pickup_at timestamp is required" },
      { status: 422 }
    );
  }

  const { data, error } = await auth.actor.ctx.supabase.rpc(
    "create_reservation_atomic",
    {
      p_tenant_id: tenantId,
      p_product_id: productId,
      p_qty: qty,
      p_scheduled_pickup_at: scheduledPickupAt,
      p_fulfillment_type: fulfillmentType,
    }
  );

  if (error) {
    const msg = error.message ?? "Reservation failed";
    if (msg.includes("RESERVATIONS_DISABLED") || msg.includes("DELIVERY_DISABLED")) {
      return jsonNoStore({ error: msg }, { status: 403 });
    }
    if (msg.includes("INSUFFICIENT_STOCK")) {
      return jsonNoStore({ error: msg }, { status: 409 });
    }
    if (msg.includes("SHOP_NOT_FOUND") || msg.includes("PRODUCT_NOT_AVAILABLE")) {
      return jsonNoStore({ error: msg }, { status: 404 });
    }
    return jsonNoStore({ error: msg }, { status: 400 });
  }

  return jsonNoStore({ reservation: data }, { status: 201 });
}
