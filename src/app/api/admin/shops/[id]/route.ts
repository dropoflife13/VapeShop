import { jsonNoStore, requireAuth } from "@/lib/supabase/server";

interface UpdateShopStatusBody {
  status?: unknown;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ["system_admin"]);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  if (!id) {
    return jsonNoStore({ error: "Missing shop id" }, { status: 400 });
  }

  let body: UpdateShopStatusBody;
  try {
    body = (await request.json()) as UpdateShopStatusBody;
  } catch {
    return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.status !== "active" && body.status !== "suspended") {
    return jsonNoStore(
      { error: "status must be active or suspended" },
      { status: 422 }
    );
  }

  const { data, error } = await auth.actor.ctx.supabase
    .from("shops")
    .update({
      status: body.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, name, slug, status, updated_at")
    .single();

  if (error || !data) {
    return jsonNoStore(
      { error: error?.message ?? "Shop not found" },
      { status: error ? 400 : 404 }
    );
  }

  return jsonNoStore({ shop: data });
}
