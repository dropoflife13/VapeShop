import { jsonNoStore, requireAuth } from "@/lib/supabase/server";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface RegisterShopBody {
  name?: unknown;
  slug?: unknown;
  reservations_enabled?: unknown;
  delivery_enabled?: unknown;
  full_name?: unknown;
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { actor } = auth;
  if (actor.tenantId || actor.role === "owner" || actor.role === "staff" || actor.role === "system_admin") {
    return jsonNoStore(
      { error: "Account is already bound to a shop or elevated role" },
      { status: 409 }
    );
  }

  let body: RegisterShopBody;
  try {
    body = (await request.json()) as RegisterShopBody;
  } catch {
    return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const reservationsEnabled =
    typeof body.reservations_enabled === "boolean" ? body.reservations_enabled : true;
  const deliveryEnabled =
    typeof body.delivery_enabled === "boolean" ? body.delivery_enabled : false;

  if (name.length < 2 || name.length > 120) {
    return jsonNoStore(
      { error: "Shop name must be between 2 and 120 characters" },
      { status: 422 }
    );
  }

  if (!SLUG_REGEX.test(slug)) {
    return jsonNoStore(
      { error: "Shop slug must be lowercase alphanumeric with single hyphens" },
      { status: 422 }
    );
  }

  const admin = actor.ctx.supabaseAdmin;

  const { data: shop, error: shopError } = await admin
    .from("shops")
    .insert({
      name,
      slug,
      reservations_enabled: reservationsEnabled,
      delivery_enabled: deliveryEnabled,
    })
    .select("id, name, slug, reservations_enabled, delivery_enabled, pickup_grace_minutes, status, created_at")
    .single();

  if (shopError || !shop) {
    const status = shopError?.code === "23505" ? 409 : 400;
    return jsonNoStore(
      { error: shopError?.message ?? "Failed to create shop" },
      { status }
    );
  }

  const { error: staffError } = await admin.from("staff_members").insert({
    tenant_id: shop.id,
    user_id: actor.userId,
    email: actor.email,
    full_name: fullName,
    role: "owner",
    status: "active",
  });

  if (staffError) {
    await admin.from("shops").delete().eq("id", shop.id);
    return jsonNoStore(
      { error: `Failed to register shop owner: ${staffError.message}` },
      { status: 500 }
    );
  }

  const { error: authUpdateError } = await admin.auth.admin.updateUserById(
    actor.userId,
    {
      app_metadata: {
        tenant_id: shop.id,
        role: "owner",
      },
    }
  );

  if (authUpdateError) {
    await admin.from("staff_members").delete().eq("tenant_id", shop.id);
    await admin.from("shops").delete().eq("id", shop.id);
    return jsonNoStore(
      { error: `Failed to bind tenant_id to user: ${authUpdateError.message}` },
      { status: 500 }
    );
  }

  return jsonNoStore(
    {
      shop,
      role: "owner",
      tenant_id: shop.id,
      message: "Shop registered. Refresh your session to activate owner claims.",
    },
    { status: 201 }
  );
}
