import { createSupabaseContext, type SupabaseContext } from "@supabase/server";
import { NextResponse } from "next/server";

export type AppRole = "system_admin" | "owner" | "staff" | "customer";

const VALID_ROLES: ReadonlySet<string> = new Set([
  "system_admin",
  "owner",
  "staff",
  "customer",
]);

export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, private",
} as const;

export interface AuthenticatedActor {
  userId: string;
  email: string;
  role: AppRole;
  tenantId: string | null;
  ctx: SupabaseContext;
}

export type AuthGuardResult =
  | { ok: true; actor: AuthenticatedActor }
  | { ok: false; response: NextResponse };

export function jsonNoStore(
  body: unknown,
  init?: Omit<ResponseInit, "headers"> & { headers?: Record<string, string> }
): NextResponse {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...NO_STORE_HEADERS,
      ...init?.headers,
    },
  });
}

/**
 * Verifies the caller's JWT using @supabase/server and extracts role + tenant_id
 * strictly from app_metadata (never user_metadata — SEC-01 / SEC-02 / AUTH-01).
 */
export async function requireAuth(
  request: Request,
  allowedRoles?: readonly AppRole[]
): Promise<AuthGuardResult> {
  const { data: ctx, error } = await createSupabaseContext(request, {
    auth: "user",
  });

  if (error || !ctx || !ctx.userClaims) {
    return {
      ok: false,
      response: jsonNoStore(
        error ? error.toJSON() : { message: "Unauthorized" },
        { status: error?.status ?? 401 }
      ),
    };
  }

  const jwtClaims = ctx.jwtClaims as Record<string, unknown> | null;
  const appMetadata =
    jwtClaims &&
    typeof jwtClaims.app_metadata === "object" &&
    jwtClaims.app_metadata !== null
      ? (jwtClaims.app_metadata as Record<string, unknown>)
      : {};

  const rawRole =
    typeof appMetadata.role === "string" ? appMetadata.role : "customer";
  if (!VALID_ROLES.has(rawRole)) {
    return {
      ok: false,
      response: jsonNoStore(
        { error: "Forbidden: invalid role claim" },
        { status: 403 }
      ),
    };
  }

  const role = rawRole as AppRole;
  const tenantId =
    typeof appMetadata.tenant_id === "string" &&
    appMetadata.tenant_id.trim().length > 0
      ? appMetadata.tenant_id.trim()
      : null;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return {
      ok: false,
      response: jsonNoStore(
        { error: `Forbidden: requires role ${allowedRoles.join(" or ")}` },
        { status: 403 }
      ),
    };
  }

  if ((role === "owner" || role === "staff") && !tenantId) {
    return {
      ok: false,
      response: jsonNoStore(
        { error: "Forbidden: missing tenant_id in app_metadata" },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    actor: {
      userId: ctx.userClaims.id,
      email: ctx.userClaims.email ?? "",
      role,
      tenantId,
      ctx,
    },
  };
}
