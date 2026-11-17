import { jsonNoStore, requireAuth } from "@/lib/supabase/server";

interface CreateStaffBody {
  email?: unknown;
  password?: unknown;
  full_name?: unknown;
}

export async function GET(request: Request) {
  const auth = await requireAuth(request, ["owner"]);
  if (!auth.ok) {
    return auth.response;
  }

  const { actor } = auth;
  const { data: staff, error } = await actor.ctx.supabase
    .from("staff_members")
    .select("id, tenant_id, user_id, email, full_name, role, status, created_at")
    .eq("tenant_id", actor.tenantId)
    .order("created_at", { ascending: true });

  if (error) {
    return jsonNoStore({ error: error.message }, { status: 400 });
  }

  return jsonNoStore({ staff: staff ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAuth(request, ["owner"]);
  if (!auth.ok) {
    return auth.response;
  }

  let body: CreateStaffBody;
  try {
    body = (await request.json()) as CreateStaffBody;
  } catch {
    return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";

  if (!email || !email.includes("@")) {
    return jsonNoStore({ error: "Valid staff email is required" }, { status: 422 });
  }
  if (password.length < 8) {
    return jsonNoStore(
      { error: "Temporary password must be at least 8 characters" },
      { status: 422 }
    );
  }

  const { actor } = auth;
  const tenantId = actor.tenantId!;

  const { data: createdUser, error: createUserError } =
    await actor.ctx.supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        tenant_id: tenantId,
        role: "staff",
      },
    });

  if (createUserError || !createdUser.user) {
    const status = createUserError?.status === 422 ? 409 : 400;
    return jsonNoStore(
      { error: createUserError?.message ?? "Failed to create staff auth account" },
      { status }
    );
  }

  const { data: member, error: insertError } = await actor.ctx.supabase
    .from("staff_members")
    .insert({
      tenant_id: tenantId,
      user_id: createdUser.user.id,
      email,
      full_name: fullName,
      role: "staff",
      status: "active",
    })
    .select("id, tenant_id, user_id, email, full_name, role, status, created_at")
    .single();

  if (insertError || !member) {
    await actor.ctx.supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);
    return jsonNoStore(
      { error: insertError?.message ?? "Failed to add staff member" },
      { status: 400 }
    );
  }

  return jsonNoStore({ staff_member: member }, { status: 201 });
}
