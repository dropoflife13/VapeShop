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

  const { data, error: queryError } = await ctx.supabase
    .from("shops")
    .select(
      "id, name, slug, reservations_enabled, delivery_enabled, pickup_grace_minutes, status"
    )
    .eq("status", "active")
    .order("name", { ascending: true })
    .limit(24);

  if (queryError) {
    return jsonNoStore({ error: queryError.message }, { status: 400 });
  }

  return jsonNoStore({ shops: data ?? [] });
}
