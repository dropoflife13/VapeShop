import { jsonNoStore, requireAuth } from "@/lib/supabase/server";

const VALID_AVAILABILITY = new Set([
  "in_stock",
  "low_stock",
  "out_of_stock",
  "discontinued",
]);

interface UpdateSupplierBody {
  name?: unknown;
  availability_status?: unknown;
  expected_delivery_date?: unknown;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ["owner", "staff"]);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  if (!id) {
    return jsonNoStore({ error: "Missing supplier id" }, { status: 400 });
  }

  let body: UpdateSupplierBody;
  try {
    body = (await request.json()) as UpdateSupplierBody;
  } catch {
    return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.name === "string" && body.name.trim().length >= 2) {
    updates.name = body.name.trim();
  }
  if (
    typeof body.availability_status === "string" &&
    VALID_AVAILABILITY.has(body.availability_status.trim())
  ) {
    updates.availability_status = body.availability_status.trim();
  }
  if (body.expected_delivery_date === null) {
    updates.expected_delivery_date = null;
  } else if (typeof body.expected_delivery_date === "string") {
    updates.expected_delivery_date = body.expected_delivery_date.trim() || null;
  }

  if (Object.keys(updates).length === 1) {
    return jsonNoStore({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await auth.actor.ctx.supabase
    .from("suppliers")
    .update(updates)
    .eq("id", id)
    .eq("tenant_id", auth.actor.tenantId)
    .select(
      "id, tenant_id, name, availability_status, expected_delivery_date, updated_at"
    )
    .single();

  if (error || !data) {
    return jsonNoStore(
      { error: error?.message ?? "Supplier not found" },
      { status: error ? 400 : 404 }
    );
  }

  return jsonNoStore({ supplier: data });
}
