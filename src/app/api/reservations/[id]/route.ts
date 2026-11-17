import { jsonNoStore, requireAuth } from "@/lib/supabase/server";

interface PatchReservationBody {
  scheduled_pickup_at?: unknown;
  status?: unknown;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  if (!id) {
    return jsonNoStore({ error: "Missing reservation id" }, { status: 400 });
  }

  let body: PatchReservationBody;
  try {
    body = (await request.json()) as PatchReservationBody;
  } catch {
    return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Staff/Owner can cancel or mark picked_up for their own tenant
  if (
    (auth.actor.role === "owner" || auth.actor.role === "staff") &&
    (body.status === "cancelled" || body.status === "picked_up")
  ) {
    const { data, error } = await auth.actor.ctx.supabase
      .from("reservations")
      .update({
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", auth.actor.tenantId)
      .eq("status", "reserved")
      .select(
        "id, tenant_id, customer_id, product_id, qty, fulfillment_type, scheduled_pickup_at, expires_at, status, updated_at"
      )
      .single();

    if (error || !data) {
      return jsonNoStore(
        { error: error?.message ?? "Reservation not found or not editable" },
        { status: 404 }
      );
    }

    return jsonNoStore({ reservation: data });
  }

  // Customer editing pickup date/time while status = 'reserved' (BR-03)
  const scheduledPickupAt =
    typeof body.scheduled_pickup_at === "string"
      ? body.scheduled_pickup_at.trim()
      : "";
  if (!scheduledPickupAt || Number.isNaN(Date.parse(scheduledPickupAt))) {
    return jsonNoStore(
      { error: "Valid ISO scheduled_pickup_at timestamp is required" },
      { status: 422 }
    );
  }

  const { data, error } = await auth.actor.ctx.supabase.rpc(
    "update_reservation_pickup",
    {
      p_reservation_id: id,
      p_scheduled_pickup_at: scheduledPickupAt,
    }
  );

  if (error) {
    const msg = error.message ?? "Failed to update reservation";
    if (msg.includes("FORBIDDEN")) {
      return jsonNoStore({ error: msg }, { status: 403 });
    }
    if (msg.includes("RESERVATION_EXPIRED") || msg.includes("RESERVATION_NOT_EDITABLE")) {
      return jsonNoStore({ error: msg }, { status: 409 });
    }
    if (msg.includes("RESERVATION_NOT_FOUND")) {
      return jsonNoStore({ error: msg }, { status: 404 });
    }
    return jsonNoStore({ error: msg }, { status: 400 });
  }

  return jsonNoStore({ reservation: data });
}
