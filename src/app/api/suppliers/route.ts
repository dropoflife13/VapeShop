import { jsonNoStore, requireAuth } from "@/lib/supabase/server";

const VALID_AVAILABILITY = new Set([
  "in_stock",
  "low_stock",
  "out_of_stock",
  "discontinued",
]);

interface CreateSupplierBody {
  name?: unknown;
  availability_status?: unknown;
  expected_delivery_date?: unknown;
}

export async function GET(request: Request) {
  const auth = await requireAuth(request, ["owner", "staff"]);
  if (!auth.ok) {
    return auth.response;
  }

  const { data, error } = await auth.actor.ctx.supabase
    .from("suppliers")
    .select(
      "id, tenant_id, name, availability_status, expected_delivery_date, created_at, updated_at"
    )
    .eq("tenant_id", auth.actor.tenantId)
    .order("name", { ascending: true });

  if (error) {
    return jsonNoStore({ error: error.message }, { status: 400 });
  }

  return jsonNoStore({ suppliers: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAuth(request, ["owner", "staff"]);
  if (!auth.ok) {
    return auth.response;
  }

  let body: CreateSupplierBody;
  try {
    body = (await request.json()) as CreateSupplierBody;
  } catch {
    return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const availabilityStatus =
    typeof body.availability_status === "string"
      ? body.availability_status.trim()
      : "in_stock";
  const expectedDeliveryDate =
    typeof body.expected_delivery_date === "string" &&
    body.expected_delivery_date.trim().length > 0
      ? body.expected_delivery_date.trim()
      : null;

  if (name.length < 2 || name.length > 120) {
    return jsonNoStore(
      { error: "Supplier name must be between 2 and 120 characters" },
      { status: 422 }
    );
  }
  if (!VALID_AVAILABILITY.has(availabilityStatus)) {
    return jsonNoStore(
      {
        error:
          "availability_status must be in_stock, low_stock, out_of_stock, or discontinued",
      },
      { status: 422 }
    );
  }

  const { data, error } = await auth.actor.ctx.supabase
    .from("suppliers")
    .insert({
      tenant_id: auth.actor.tenantId,
      name,
      availability_status: availabilityStatus,
      expected_delivery_date: expectedDeliveryDate,
    })
    .select(
      "id, tenant_id, name, availability_status, expected_delivery_date, created_at"
    )
    .single();

  if (error || !data) {
    const status = error?.code === "23505" ? 409 : 400;
    return jsonNoStore(
      { error: error?.message ?? "Failed to create supplier" },
      { status }
    );
  }

  return jsonNoStore({ supplier: data }, { status: 201 });
}
