import {
  evaluatePhCompliance,
  type BannedProductRule,
} from "@/lib/compliance/ph";
import { jsonNoStore, requireAuth } from "@/lib/supabase/server";

interface CreateProductBody {
  supplier_id?: unknown;
  sku?: unknown;
  brand?: unknown;
  name?: unknown;
  flavor_descriptor?: unknown;
  nicotine_mg?: unknown;
  dti_ps_mark?: unknown;
  unit_price_centavos?: unknown;
}

export async function GET(request: Request) {
  const auth = await requireAuth(request, ["owner", "staff"]);
  if (!auth.ok) {
    return auth.response;
  }

  const { data, error } = await auth.actor.ctx.supabase
    .from("products")
    .select(
      "id, tenant_id, supplier_id, sku, brand, name, flavor_descriptor, nicotine_mg, dti_ps_mark, unit_price_centavos, status, is_banned_blocked, created_at, updated_at"
    )
    .eq("tenant_id", auth.actor.tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    return jsonNoStore({ error: error.message }, { status: 400 });
  }

  return jsonNoStore({ products: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAuth(request, ["owner", "staff"]);
  if (!auth.ok) {
    return auth.response;
  }

  let body: CreateProductBody;
  try {
    body = (await request.json()) as CreateProductBody;
  } catch {
    return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
  }

  const supplierId =
    typeof body.supplier_id === "string" && body.supplier_id.trim().length > 0
      ? body.supplier_id.trim()
      : null;
  const sku = typeof body.sku === "string" ? body.sku.trim() : "";
  const brand = typeof body.brand === "string" ? body.brand.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const flavorDescriptor =
    typeof body.flavor_descriptor === "string"
      ? body.flavor_descriptor.trim()
      : "";
  const nicotineMg =
    typeof body.nicotine_mg === "number" ? body.nicotine_mg : 0;
  const dtiPsMark =
    typeof body.dti_ps_mark === "string" ? body.dti_ps_mark.trim() : "";
  const unitPriceCentavos =
    typeof body.unit_price_centavos === "number" ? body.unit_price_centavos : 0;

  if (!sku || sku.length > 64) {
    return jsonNoStore({ error: "Valid SKU is required (1-64 chars)" }, { status: 422 });
  }
  if (!brand || brand.length > 100) {
    return jsonNoStore({ error: "Brand is required" }, { status: 422 });
  }
  if (name.length < 2 || name.length > 160) {
    return jsonNoStore({ error: "Product name must be 2-160 chars" }, { status: 422 });
  }
  if (!Number.isInteger(unitPriceCentavos) || unitPriceCentavos <= 0) {
    return jsonNoStore(
      { error: "unit_price_centavos must be a positive integer" },
      { status: 422 }
    );
  }
  if (typeof nicotineMg !== "number" || nicotineMg < 0 || nicotineMg > 100) {
    return jsonNoStore(
      { error: "nicotine_mg must be between 0 and 100" },
      { status: 422 }
    );
  }

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
    { brand, flavorDescriptor, dtiPsMark },
    (activeRules ?? []) as BannedProductRule[]
  );

  if (!compliance.allowed) {
    return jsonNoStore(
      {
        error: "Product blocked by Philippine RA 11900 / DTI compliance gate",
        code: compliance.code,
        reasons: compliance.reasons,
      },
      { status: 422 }
    );
  }

  const { data, error } = await auth.actor.ctx.supabase
    .from("products")
    .insert({
      tenant_id: auth.actor.tenantId,
      supplier_id: supplierId,
      sku,
      brand,
      name,
      flavor_descriptor: flavorDescriptor,
      nicotine_mg: nicotineMg,
      dti_ps_mark: dtiPsMark,
      unit_price_centavos: unitPriceCentavos,
      status: "active",
      is_banned_blocked: false,
    })
    .select(
      "id, tenant_id, supplier_id, sku, brand, name, flavor_descriptor, nicotine_mg, dti_ps_mark, unit_price_centavos, status, created_at"
    )
    .single();

  if (error || !data) {
    const status = error?.code === "23505" ? 409 : 400;
    return jsonNoStore(
      { error: error?.message ?? "Failed to create product" },
      { status }
    );
  }

  return jsonNoStore({ product: data }, { status: 201 });
}
