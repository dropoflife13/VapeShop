import { createSupabaseContext } from "@supabase/server";
import { jsonNoStore } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { data: ctx, error } = await createSupabaseContext(request, {
    auth: "none",
  });

  if (error || !ctx) {
    return jsonNoStore(
      error ? error.toJSON() : { error: "Failed to initialize context" },
      { status: error?.status ?? 500 }
    );
  }

  const [idTypesRes, bannedRes] = await Promise.all([
    ctx.supabase
      .from("ph_legal_id_types")
      .select("code, label, issuing_agency, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    ctx.supabase
      .from("ph_banned_products")
      .select("id, rule_type, brand_pattern, flavor_pattern, description, legal_basis, status")
      .eq("status", "active")
      .order("created_at", { ascending: false }),
  ]);

  if (idTypesRes.error) {
    return jsonNoStore({ error: idTypesRes.error.message }, { status: 500 });
  }
  if (bannedRes.error) {
    return jsonNoStore({ error: bannedRes.error.message }, { status: 500 });
  }

  return jsonNoStore({
    legal_id_types: idTypesRes.data ?? [],
    banned_products: bannedRes.data ?? [],
  });
}
