-- TKT-007: POS Checkout Terminal with 18+ Legal ID Gate & Idempotency
-- Enforces: IR-03, IR-04, SEC-04, BR-05, BR-06, F-31 (SECURITY DEFINER SET search_path = '')

-- Optional: store line items on sales_ledger or a dedicated append-only sales_ledger_items table
CREATE TABLE IF NOT EXISTS public.sales_ledger_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
  sale_id uuid NOT NULL REFERENCES public.sales_ledger(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  serial_number text,
  qty integer NOT NULL CHECK (qty > 0),
  unit_price_centavos integer NOT NULL CHECK (unit_price_centavos > 0),
  line_total_centavos integer NOT NULL CHECK (line_total_centavos > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_ledger_items_sale ON public.sales_ledger_items (sale_id);

ALTER TABLE public.sales_ledger_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_ledger_items FORCE ROW LEVEL SECURITY;

CREATE POLICY sales_ledger_items_select_tenant
  ON public.sales_ledger_items
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.jwt_tenant_id()
    OR public.jwt_role() = 'system_admin'
  );

CREATE POLICY sales_ledger_items_insert_owner_staff
  ON public.sales_ledger_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.jwt_tenant_id()
    AND public.jwt_role() IN ('owner', 'staff')
  );

REVOKE UPDATE, DELETE, TRUNCATE ON public.sales_ledger_items FROM authenticated, anon, PUBLIC;

DROP TRIGGER IF EXISTS trg_sales_ledger_items_immutable ON public.sales_ledger_items;
CREATE TRIGGER trg_sales_ledger_items_immutable
  BEFORE UPDATE OR DELETE ON public.sales_ledger_items
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_append_only_mutation();

-- Atomic POS Sale RPC (F-31)
CREATE OR REPLACE FUNCTION public.process_pos_sale(
  p_idempotency_key text,
  p_legal_id_type text,
  p_items jsonb,
  p_reservation_id uuid DEFAULT NULL
)
RETURNS public.sales_ledger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid;
  v_staff_id uuid;
  v_role text;
  v_existing public.sales_ledger%ROWTYPE;
  v_res public.reservations%ROWTYPE;
  v_item jsonb;
  v_product_id uuid;
  v_qty integer;
  v_serial text;
  v_product public.products%ROWTYPE;
  v_on_hand bigint;
  v_reserved bigint;
  v_available bigint;
  v_total_centavos integer := 0;
  v_sale public.sales_ledger%ROWTYPE;
BEGIN
  v_staff_id := auth.uid();
  v_tenant_id := NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::uuid;
  v_role := NULLIF(auth.jwt() -> 'app_metadata' ->> 'role', '');

  IF v_staff_id IS NULL OR v_tenant_id IS NULL OR v_role NOT IN ('owner', 'staff') THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = '42501';
  END IF;

  IF p_idempotency_key IS NULL OR char_length(trim(p_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'INVALID_IDEMPOTENCY_KEY' USING ERRCODE = '22023';
  END IF;

  -- Idempotency check: return existing sale if already processed
  SELECT * INTO v_existing
  FROM public.sales_ledger
  WHERE tenant_id = v_tenant_id
    AND idempotency_key = trim(p_idempotency_key);

  IF FOUND THEN
    RETURN v_existing;
  END IF;

  -- 18+ Legal ID Gate (RA 11900)
  PERFORM 1
  FROM public.ph_legal_id_types
  WHERE code = p_legal_id_type
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_LEGAL_ID_TYPE' USING ERRCODE = '22023';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'EMPTY_ITEMS' USING ERRCODE = '22023';
  END IF;

  -- Optional reservation conversion
  IF p_reservation_id IS NOT NULL THEN
    SELECT * INTO v_res
    FROM public.reservations
    WHERE id = p_reservation_id
      AND tenant_id = v_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'RESERVATION_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;

    IF v_res.status <> 'reserved' OR now() > v_res.expires_at THEN
      IF v_res.status = 'reserved' AND now() > v_res.expires_at THEN
        UPDATE public.reservations SET status = 'expired', updated_at = now() WHERE id = v_res.id;
      END IF;
      RAISE EXCEPTION 'RESERVATION_NOT_ACTIVE' USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.reservations
    SET status = 'picked_up',
        updated_at = now()
    WHERE id = v_res.id;
  END IF;

  -- Pre-validate all items & compute total
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_qty := (v_item ->> 'qty')::integer;
    v_serial := NULLIF(trim(COALESCE(v_item ->> 'serial_number', '')), '');

    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'INVALID_QTY' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_product_id
      AND tenant_id = v_tenant_id
    FOR UPDATE;

    IF NOT FOUND OR v_product.status <> 'active' OR v_product.is_banned_blocked THEN
      RAISE EXCEPTION 'PRODUCT_NOT_AVAILABLE' USING ERRCODE = 'P0002';
    END IF;

    -- Sweep overdue reservations for this product
    UPDATE public.reservations
    SET status = 'expired', updated_at = now()
    WHERE tenant_id = v_tenant_id
      AND product_id = v_product_id
      AND status = 'reserved'
      AND now() > expires_at;

    SELECT COALESCE(SUM(delta_qty), 0)::bigint INTO v_on_hand
    FROM public.inventory_movements
    WHERE tenant_id = v_tenant_id AND product_id = v_product_id;

    SELECT COALESCE(SUM(qty), 0)::bigint INTO v_reserved
    FROM public.reservations
    WHERE tenant_id = v_tenant_id
      AND product_id = v_product_id
      AND status = 'reserved'
      AND now() <= expires_at;

    v_available := v_on_hand - v_reserved;

    IF v_available < v_qty THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK' USING ERRCODE = 'P0001';
    END IF;

    IF v_serial IS NOT NULL THEN
      PERFORM 1
      FROM public.product_serials
      WHERE tenant_id = v_tenant_id
        AND product_id = v_product_id
        AND serial_number = v_serial
        AND status IN ('in_stock', 'reserved')
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'SERIAL_NOT_AVAILABLE' USING ERRCODE = 'P0001';
      END IF;
    END IF;

    v_total_centavos := v_total_centavos + (v_product.unit_price_centavos * v_qty);
  END LOOP;

  -- Insert append-only sales_ledger row
  INSERT INTO public.sales_ledger (
    tenant_id,
    staff_id,
    reservation_id,
    idempotency_key,
    legal_id_type,
    total_centavos,
    status
  )
  VALUES (
    v_tenant_id,
    v_staff_id,
    p_reservation_id,
    trim(p_idempotency_key),
    p_legal_id_type,
    v_total_centavos,
    'completed'
  )
  RETURNING * INTO v_sale;

  -- Insert line items, inventory movements, and update serials
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_qty := (v_item ->> 'qty')::integer;
    v_serial := NULLIF(trim(COALESCE(v_item ->> 'serial_number', '')), '');

    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_product_id AND tenant_id = v_tenant_id;

    INSERT INTO public.sales_ledger_items (
      tenant_id,
      sale_id,
      product_id,
      serial_number,
      qty,
      unit_price_centavos,
      line_total_centavos
    )
    VALUES (
      v_tenant_id,
      v_sale.id,
      v_product_id,
      v_serial,
      v_qty,
      v_product.unit_price_centavos,
      v_product.unit_price_centavos * v_qty
    );

    INSERT INTO public.inventory_movements (
      tenant_id,
      product_id,
      delta_qty,
      reason,
      reference_id,
      actor_id
    )
    VALUES (
      v_tenant_id,
      v_product_id,
      -v_qty,
      'sale',
      v_sale.id,
      v_staff_id
    );

    IF v_serial IS NOT NULL THEN
      UPDATE public.product_serials
      SET status = 'sold',
          updated_at = now()
      WHERE tenant_id = v_tenant_id
        AND product_id = v_product_id
        AND serial_number = v_serial;
    END IF;
  END LOOP;

  RETURN v_sale;
END;
$$;

REVOKE ALL ON FUNCTION public.process_pos_sale(text, text, jsonb, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_pos_sale(text, text, jsonb, uuid) TO authenticated;
