import { jsonNoStore, requireAuth } from "@/lib/supabase/server";

interface CreateSerialBody {
  product_id?: unknown;
  supplier_id?: unknown;
  serial_number?: unknown;
  expected_delivery_date?: unknown;
  received_at?: unknown;
}

export async function GET(request: Request) {
  const auth = await requireAuth(request, ["owner", "staff"]);
  if (!auth.ok) {
    return auth.response;
  }

  const { data, error } = await auth.actor.ctx.supabase
    .from("product_serials")
    .select(
      "id, tenant_id, product_id, supplier_id, serial_number, qr_payload, expected_delivery_date, received_at, status, haywire_notes, haywire_reported_at, created_at"
    )
    .eq("tenant_id", auth.actor.tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    return jsonNoStore({ error: error.message }, { status: 400 });
  }

  return jsonNoStore({ serials: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAuth(request, ["owner", "staff"]);
  if (!auth.ok) {
    return auth.response;
  }

  let body: CreateSerialBody;
  try {
    body = (await request.json()) as CreateSerialBody;
  } catch {
    return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
  }

  const productId =
    typeof body.product_id === "string" ? body.product_id.trim() : "";
  const supplierId =
    typeof body.supplier_id === "string" && body.supplier_id.trim().length > 0
      ? body.supplier_id.trim()
      : null;
  const serialNumber =
    typeof body.serial_number === "string" ? body.serial_number.trim() : "";
  const expectedDeliveryDate =
    typeof body.expected_delivery_date === "string" &&
    body.expected_delivery_date.trim().length > 0
      ? body.expected_delivery_date.trim()
      : null;
  const receivedAt =
    typeof body.received_at === "string" && body.received_at.trim().length > 0
      ? body.received_at.trim()
      : new Date().toISOString();

  if (!productId) {
    return jsonNoStore({ error: "product_id is required" }, { status: 422 });
  }
  if (serialNumber.length < 3 || serialNumber.length > 128) {
    return jsonNoStore(
      { error: "serial_number must be between 3 and 128 characters" },
      { status: 422 }
    );
  }

  const qrPayload = `/serials/${encodeURIComponent(serialNumber)}`;

  const { data, error } = await auth.actor.ctx.supabase
    .from("product_serials")
    .insert({
      tenant_id: auth.actor.tenantId,
      product_id: productId,
      supplier_id: supplierId,
      serial_number: serialNumber,
      qr_payload: qrPayload,
      expected_delivery_date: expectedDeliveryDate,
      received_at: receivedAt,
      status: "in_stock",
      created_by: auth.actor.userId,
    })
    .select(
      "id, tenant_id, product_id, supplier_id, serial_number, qr_payload, expected_delivery_date, received_at, status, created_at"
    )
    .single();

  if (error || !data) {
    const status = error?.code === "23505" ? 409 : 400;
    return jsonNoStore(
      { error: error?.message ?? "Failed to post serial number" },
      { status }
    );
  }

  return jsonNoStore({ serial: data }, { status: 201 });
}
