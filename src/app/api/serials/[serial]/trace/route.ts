import { jsonNoStore, requireAuth } from "@/lib/supabase/server";

interface MarkHaywireBody {
  action?: unknown;
  haywire_notes?: unknown;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ serial: string }> }
) {
  const auth = await requireAuth(request, ["owner", "staff"]);
  if (!auth.ok) {
    return auth.response;
  }

  const { serial } = await context.params;
  const decodedSerial = decodeURIComponent(serial).trim();

  const { data, error } = await auth.actor.ctx.supabase
    .from("product_serials")
    .select(
      `
      id,
      tenant_id,
      serial_number,
      qr_payload,
      expected_delivery_date,
      received_at,
      status,
      haywire_notes,
      haywire_reported_at,
      product:products ( id, sku, brand, name, flavor_descriptor, dti_ps_mark ),
      supplier:suppliers ( id, name, availability_status, expected_delivery_date )
    `
    )
    .eq("tenant_id", auth.actor.tenantId)
    .eq("serial_number", decodedSerial)
    .single();

  if (error || !data) {
    return jsonNoStore(
      { error: error?.message ?? "Serial number not found" },
      { status: 404 }
    );
  }

  return jsonNoStore({ trace: data });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ serial: string }> }
) {
  const auth = await requireAuth(request, ["owner", "staff"]);
  if (!auth.ok) {
    return auth.response;
  }

  const { serial } = await context.params;
  const decodedSerial = decodeURIComponent(serial).trim();

  let body: MarkHaywireBody;
  try {
    body = (await request.json()) as MarkHaywireBody;
  } catch {
    return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.action !== "mark_haywire") {
    return jsonNoStore(
      { error: "action must be mark_haywire" },
      { status: 422 }
    );
  }

  const haywireNotes =
    typeof body.haywire_notes === "string" ? body.haywire_notes.trim() : "";
  if (haywireNotes.length < 3) {
    return jsonNoStore(
      { error: "haywire_notes must be at least 3 characters" },
      { status: 422 }
    );
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await auth.actor.ctx.supabase
    .from("product_serials")
    .update({
      status: "haywire_returned",
      haywire_notes: haywireNotes,
      haywire_reported_at: nowIso,
      updated_at: nowIso,
    })
    .eq("tenant_id", auth.actor.tenantId)
    .eq("serial_number", decodedSerial)
    .select(
      "id, serial_number, status, haywire_notes, haywire_reported_at, updated_at"
    )
    .single();

  if (error || !data) {
    return jsonNoStore(
      { error: error?.message ?? "Serial number not found" },
      { status: error ? 400 : 404 }
    );
  }

  return jsonNoStore({ serial: data });
}
