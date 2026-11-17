import {
  evaluatePhCompliance,
  type BannedProductRule,
} from "@/lib/compliance/ph";
import { jsonNoStore, requireAuth } from "@/lib/supabase/server";

interface UpdateProductBody {
  supplier_id?: unknown;
  brand?: unknown;
  name?: unknown;
  flavor_descriptor?: unknown;
  nicotine_mg?: unknown;
  dti_ps_mark?: unknown;
  unit_price_centavos?: unknown;
  status?: unknown;
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
    return jsonNoStore({ error: "Missing product id" }, { status: 400 });
  }

  let body: UpdateProductBody;
  try {
    body = (await request.json()) as UpdateProductBody;
  } catch {
    return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await auth.actor.ctx.supabase
    .from("products")
    .select("id, brand, flavor_descriptor, dti_ps_mark")
    .eq("id", id)
    .eq("tenant_id", auth.actor.tenantId)
    .single();

  if (fetchError || !existing) {
    return jsonNoStore({ error: "Product not found" }, { status: 404 });
  }

  const nextBrand =
    typeof body.brand === "string" ? body.brand.trim() : existing.brand;
  const nextFlavor =
    typeof body.flavor_descriptor === "string"
      ? body.flavor_descriptor.trim()
      : existing.flavor_descriptor;
  const nextPsMark =
    typeof body.dti_ps_mark === "string"
      ? body.dti_ps_mark.trim()
      : existing.dti_ps_mark;

  const { data: activeRules, error: rulesError } = await auth.actor.ctx.supabase
    .from("ph_banned_products")
    .select(
      "id, rule_type, brand_pattern, flavor_pattern, description, legal_basis, status"
    )
    .eq("status", "active");

  if (rulesError) {
    return jsonNoStore(
      { error: `Compliance check failed: ${rulesError.message}` },
      { status: 500 }
    );
  }

  const compliance = evaluatePhCompliance(
    {
      brand: nextBrand,
      flavorDescriptor: nextFlavor,
      dtiPsMark: nextPsMark,
    },
    (activeRules ?? []) as BannedProductRule[]
  );

  if (!compliance.allowed) {
    return jsonNoStore(
      {
        error: "Product update blocked by Philippine RA 11900 / DTI compliance gate",
        code: compliance.code,
        reasons: compliance.reasons,
      },
      { status: 422 }
    );
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    brand: nextBrand,
    flavor_descriptor: nextFlavor,
    dti_ps_mark: nextPsMark,
  };

  if (body.supplier_id === null) {
    updates.supplier_id = null;
  } else if (typeof body.supplier_id === "string" && body.supplier_id.trim()) {
    updates.supplier_id = body.supplier_id.trim();
  }
  if (typeof body.name === "string" && body.name.trim().length >= 2) {
    updates.name = body.name.trim();
  }
  if (typeof body.nicotine_mg === "number" && body.nicotine_mg >= 0 && body.nicotine_mg <= 100) {
    updates.nicotine_mg = body.nicotine_mg;
  }
  if (
    typeof body.unit_price_centavos === "number" &&
    Number.isInteger(body.unit_price_centavos) &&
    body.unit_price_centavos > 0
  ) {
    updates.unit_price_centavos = body.unit_price_centavos;
  }
  if (body.status === "active" || body.status === "inactive") {
    updates.status = body.status;
  }

  const { data, error } = await auth.actor.ctx.supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .eq("tenant_id", auth.actor.tenantId)
    .select(
      "id, tenant_id, supplier_id, sku, brand, name, flavor_descriptor, nicotine_mg, dti_ps_mark, unit_price_centavos, status, updated_at"
    )
    .single();

  if (error || !data) {
    return jsonNoStore(
      { error: error?.message ?? "Failed to update product" },
      { status: 400 }
    );
  }

  return jsonNoStore({ product: data });
}
