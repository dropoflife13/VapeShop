import {
  evaluatePhCompliance,
  isValidPhLegalId,
  type BannedProductRule,
} from "@/lib/compliance/ph";
import { jsonNoStore, requireAuth } from "@/lib/supabase/server";

interface PosSaleItemInput {
  product_id?: unknown;
  qty?: unknown;
  serial_number?: unknown;
}

interface CreatePosSaleBody {
  idempotency_key?: unknown;
  legal_id_type?: unknown;
  reservation_id?: unknown;
  items?: unknown;
}

export async function GET(request: Request) {
  const auth = await requireAuth(request, ["owner", "staff"]);
  if (!auth.ok) {
    return auth.response;
  }

  const { data, error } = await auth.actor.ctx.supabase
    .from("sales_ledger")
    .select(
      "id, tenant_id, staff_id, reservation_id, idempotency_key, legal_id_type, total_centavos, status, supersedes_id, created_at"
    )
    .eq("tenant_id", auth.actor.tenantId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return jsonNoStore({ error: error.message }, { status: 400 });
  }

  return jsonNoStore({ sales: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAuth(request, ["owner", "staff"]);
  if (!auth.ok) {
    return auth.response;
  }

  let body: CreatePosSaleBody;
  try {
    body = (await request.json()) as CreatePosSaleBody;
  } catch {
    return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
  }

  const idempotencyKey =
    typeof body.idempotency_key === "string"
      ? body.idempotency_key.trim()
      : "";
  const legalIdType = body.legal_id_type;
  const reservationId =
    typeof body.reservation_id === "string" &&
    body.reservation_id.trim().length > 0
      ? body.reservation_id.trim()
      : null;

  if (idempotencyKey.length < 8 || idempotencyKey.length > 128) {
    return jsonNoStore(
      { error: "idempotency_key must be between 8 and 128 characters" },
      { status: 422 }
    );
  }

  if (!isValidPhLegalId(legalIdType)) {
    return jsonNoStore(
      {
        error: "Valid 18+ Philippine Government legal_id_type is required (RA 11900)",
      },
      { status: 422 }
    );
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return jsonNoStore(
      { error: "At least one item is required for POS checkout" },
      { status: 422 }
    );
  }

  const normalizedItems: Array<{
    product_id: string;
    qty: number;
    serial_number: string | null;
  }> = [];

  for (const raw of body.items as PosSaleItemInput[]) {
    const productId =
      typeof raw?.product_id === "string" ? raw.product_id.trim() : "";
    const qty = typeof raw?.qty === "number" ? raw.qty : 0;
    const serialNumber =
      typeof raw?.serial_number === "string" && raw.serial_number.trim().length > 0
        ? raw.serial_number.trim()
        : null;

    if (!productId || !Number.isInteger(qty) || qty <= 0) {
      return jsonNoStore(
        { error: "Each item requires valid product_id and positive integer qty" },
        { status: 422 }
      );
    }
    normalizedItems.push({
      product_id: productId,
      qty,
      serial_number: serialNumber,
    });
  }

  // Pre-checkout RA 11900 / DTI compliance gate across all items
  const productIds = [...new Set(normalizedItems.map((i) => i.product_id))];
  const [productsRes, rulesRes] = await Promise.all([
    auth.actor.ctx.supabase
      .from("products")
      .select("id, brand, flavor_descriptor, dti_ps_mark")
      .eq("tenant_id", auth.actor.tenantId)
      .in("id", productIds),
    auth.actor.ctx.supabase
      .from("ph_banned_products")
      .select(
        "id, rule_type, brand_pattern, flavor_pattern, description, legal_basis, status"
      )
      .eq("status", "active"),
  ]);

  if (productsRes.error) {
    return jsonNoStore({ error: productsRes.error.message }, { status: 400 });
  }
  if (rulesRes.error) {
    return jsonNoStore({ error: rulesRes.error.message }, { status: 500 });
  }

  const activeRules = (rulesRes.data ?? []) as BannedProductRule[];
  for (const prod of productsRes.data ?? []) {
    const compliance = evaluatePhCompliance(
      {
        brand: prod.brand,
        flavorDescriptor: prod.flavor_descriptor,
        dtiPsMark: prod.dti_ps_mark,
      },
      activeRules
    );
    if (!compliance.allowed) {
      return jsonNoStore(
        {
          error: "Checkout blocked by Philippine RA 11900 / DTI compliance gate",
          code: compliance.code,
          reasons: compliance.reasons,
        },
        { status: 422 }
      );
    }
  }

  const { data: sale, error } = await auth.actor.ctx.supabase.rpc(
    "process_pos_sale",
    {
      p_idempotency_key: idempotencyKey,
      p_legal_id_type: legalIdType,
      p_items: normalizedItems,
      p_reservation_id: reservationId,
    }
  );

  if (error) {
    const msg = error.message ?? "POS checkout failed";
    if (msg.includes("INSUFFICIENT_STOCK") || msg.includes("RESERVATION_NOT_ACTIVE") || msg.includes("SERIAL_NOT_AVAILABLE")) {
      return jsonNoStore({ error: msg }, { status: 409 });
    }
    if (msg.includes("PRODUCT_NOT_AVAILABLE") || msg.includes("RESERVATION_NOT_FOUND")) {
      return jsonNoStore({ error: msg }, { status: 404 });
    }
    if (msg.includes("INVALID_LEGAL_ID_TYPE") || msg.includes("INVALID_IDEMPOTENCY_KEY")) {
      return jsonNoStore({ error: msg }, { status: 422 });
    }
    return jsonNoStore({ error: msg }, { status: 400 });
  }

  return jsonNoStore({ sale }, { status: 201 });
}
