import { jsonNoStore, requireAuth } from "@/lib/supabase/server";

const VALID_CATEGORIES = new Set([
  "bugfix",
  "security_patch",
  "compliance_update",
  "maintenance",
]);

const VALID_REPAIR_STATUSES = new Set(["open", "in_progress", "resolved"]);

interface UpdateSettingsBody {
  maintenance_mode?: unknown;
  maintenance_message?: unknown;
  repair_id?: unknown;
  repair_status?: unknown;
  repair_notes?: unknown;
}

interface CreateRepairBody {
  title?: unknown;
  category?: unknown;
  notes?: unknown;
}

export async function GET(request: Request) {
  const auth = await requireAuth(request, ["system_admin"]);
  if (!auth.ok) {
    return auth.response;
  }

  const [settingsRes, repairsRes] = await Promise.all([
    auth.actor.ctx.supabase
      .from("system_settings")
      .select("id, maintenance_mode, maintenance_message, updated_by, updated_at")
      .eq("id", 1)
      .single(),
    auth.actor.ctx.supabase
      .from("system_repairs")
      .select("id, title, category, status, notes, created_by, created_at, updated_at")
      .order("created_at", { ascending: false }),
  ]);

  if (settingsRes.error) {
    return jsonNoStore({ error: settingsRes.error.message }, { status: 400 });
  }
  if (repairsRes.error) {
    return jsonNoStore({ error: repairsRes.error.message }, { status: 400 });
  }

  return jsonNoStore({
    health: { status: "ok", timestamp: new Date().toISOString() },
    settings: settingsRes.data,
    repairs: repairsRes.data ?? [],
  });
}

export async function POST(request: Request) {
  const auth = await requireAuth(request, ["system_admin"]);
  if (!auth.ok) {
    return auth.response;
  }

  let body: CreateRepairBody;
  try {
    body = (await request.json()) as CreateRepairBody;
  } catch {
    return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";

  if (title.length < 3 || title.length > 160) {
    return jsonNoStore(
      { error: "title must be between 3 and 160 characters" },
      { status: 422 }
    );
  }
  if (!VALID_CATEGORIES.has(category)) {
    return jsonNoStore(
      {
        error:
          "category must be bugfix, security_patch, compliance_update, or maintenance",
      },
      { status: 422 }
    );
  }

  const { data, error } = await auth.actor.ctx.supabase
    .from("system_repairs")
    .insert({
      title,
      category,
      notes,
      status: "open",
      created_by: auth.actor.userId,
    })
    .select("id, title, category, status, notes, created_at")
    .single();

  if (error || !data) {
    return jsonNoStore(
      { error: error?.message ?? "Failed to create repair item" },
      { status: 400 }
    );
  }

  return jsonNoStore({ repair: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireAuth(request, ["system_admin"]);
  if (!auth.ok) {
    return auth.response;
  }

  let body: UpdateSettingsBody;
  try {
    body = (await request.json()) as UpdateSettingsBody;
  } catch {
    return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.repair_id === "string" && body.repair_id.trim().length > 0) {
    const repairUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (
      typeof body.repair_status === "string" &&
      VALID_REPAIR_STATUSES.has(body.repair_status)
    ) {
      repairUpdates.status = body.repair_status;
    }
    if (typeof body.repair_notes === "string") {
      repairUpdates.notes = body.repair_notes.trim();
    }

    const { data, error } = await auth.actor.ctx.supabase
      .from("system_repairs")
      .update(repairUpdates)
      .eq("id", body.repair_id.trim())
      .select("id, title, category, status, notes, updated_at")
      .single();

    if (error || !data) {
      return jsonNoStore(
        { error: error?.message ?? "Repair item not found" },
        { status: error ? 400 : 404 }
      );
    }

    return jsonNoStore({ repair: data });
  }

  const settingsUpdates: Record<string, unknown> = {
    updated_by: auth.actor.userId,
    updated_at: new Date().toISOString(),
  };

  if (typeof body.maintenance_mode === "boolean") {
    settingsUpdates.maintenance_mode = body.maintenance_mode;
  }
  if (typeof body.maintenance_message === "string") {
    settingsUpdates.maintenance_message = body.maintenance_message.trim();
  }

  if (Object.keys(settingsUpdates).length === 2) {
    return jsonNoStore({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await auth.actor.ctx.supabase
    .from("system_settings")
    .update(settingsUpdates)
    .eq("id", 1)
    .select("id, maintenance_mode, maintenance_message, updated_by, updated_at")
    .single();

  if (error || !data) {
    return jsonNoStore(
      { error: error?.message ?? "Failed to update system settings" },
      { status: 400 }
    );
  }

  return jsonNoStore({ settings: data });
}
