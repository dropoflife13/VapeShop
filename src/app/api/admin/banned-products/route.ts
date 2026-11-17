import { jsonNoStore, requireAuth } from "@/lib/supabase/server";

const VALID_RULE_TYPES = new Set([
  "banned_brand",
  "prohibited_flavor_descriptor",
  "missing_certification",
]);

interface CreateBannedRuleBody {
  rule_type?: unknown;
  brand_pattern?: unknown;
  flavor_pattern?: unknown;
  description?: unknown;
  legal_basis?: unknown;
}

export async function GET(request: Request) {
  const auth = await requireAuth(request, ["system_admin"]);
  if (!auth.ok) {
    return auth.response;
  }

  const { data, error } = await auth.actor.ctx.supabase
    .from("ph_banned_products")
    .select(
      "id, rule_type, brand_pattern, flavor_pattern, description, legal_basis, status, created_by, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return jsonNoStore({ error: error.message }, { status: 400 });
  }

  return jsonNoStore({ rules: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAuth(request, ["system_admin"]);
  if (!auth.ok) {
    return auth.response;
  }

  let body: CreateBannedRuleBody;
  try {
    body = (await request.json()) as CreateBannedRuleBody;
  } catch {
    return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
  }

  const ruleType =
    typeof body.rule_type === "string" ? body.rule_type.trim() : "";
  const brandPattern =
    typeof body.brand_pattern === "string" && body.brand_pattern.trim().length > 0
      ? body.brand_pattern.trim()
      : null;
  const flavorPattern =
    typeof body.flavor_pattern === "string" && body.flavor_pattern.trim().length > 0
      ? body.flavor_pattern.trim()
      : null;
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const legalBasis =
    typeof body.legal_basis === "string" ? body.legal_basis.trim() : "";

  if (!VALID_RULE_TYPES.has(ruleType)) {
    return jsonNoStore(
      {
        error:
          "rule_type must be banned_brand, prohibited_flavor_descriptor, or missing_certification",
      },
      { status: 422 }
    );
  }

  if (
    ruleType !== "missing_certification" &&
    !brandPattern &&
    !flavorPattern
  ) {
    return jsonNoStore(
      { error: "Provide brand_pattern or flavor_pattern" },
      { status: 422 }
    );
  }

  if (description.length < 3 || description.length > 300) {
    return jsonNoStore(
      { error: "description must be between 3 and 300 characters" },
      { status: 422 }
    );
  }

  if (legalBasis.length < 3 || legalBasis.length > 200) {
    return jsonNoStore(
      { error: "legal_basis must be between 3 and 200 characters" },
      { status: 422 }
    );
  }

  const { data, error } = await auth.actor.ctx.supabase
    .from("ph_banned_products")
    .insert({
      rule_type: ruleType,
      brand_pattern: brandPattern,
      flavor_pattern: flavorPattern,
      description,
      legal_basis: legalBasis,
      status: "active",
      created_by: auth.actor.userId,
    })
    .select(
      "id, rule_type, brand_pattern, flavor_pattern, description, legal_basis, status, created_at"
    )
    .single();

  if (error || !data) {
    return jsonNoStore(
      { error: error?.message ?? "Failed to create banned product rule" },
      { status: 400 }
    );
  }

  return jsonNoStore({ rule: data }, { status: 201 });
}
