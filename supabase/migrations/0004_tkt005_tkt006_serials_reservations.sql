-- TKT-005 & TKT-006: Manufacturer Serial QR Provenance & Editable Reservations with 1-Hour Expiry
-- Enforces: DB-07, DB-14, IR-03, IR-07, SD-01, BR-02, BR-03, BR-04, BR-05, F-26, F-31

-- 1. Product Serials (TKT-005)
CREATE TABLE IF NOT EXISTS public.product_serials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  serial_number text NOT NULL CHECK (char_length(trim(serial_number)) BETWEEN 3 AND 128),
  qr_payload text NOT NULL,
  expected_delivery_date date,
  received_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'in_stock'
    CHECK (status IN ('in_stock', 'reserved', 'sold', 'haywire_returned')),
  haywire_notes text NOT NULL DEFAULT '',
  haywire_reported_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_product_serials_tenant_serial UNIQUE (tenant_id, serial_number)
);

CREATE INDEX IF NOT EXISTS idx_product_serials_tenant_product
  ON public.product_serials (tenant_id, product_id);
CREATE INDEX IF NOT EXISTS idx_product_serials_serial_lookup
  ON public.product_serials (tenant_id, serial_number);

ALTER TABLE public.product_serials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_serials FORCE ROW LEVEL SECURITY;

CREATE POLICY product_serials_select_tenant
  ON public.product_serials
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.jwt_tenant_id()
    OR public.jwt_role() = 'system_admin'
  );

CREATE POLICY product_serials_insert_owner_staff
  ON public.product_serials
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.jwt_tenant_id()
    AND public.jwt_role() IN ('owner', 'staff')
  );

CREATE POLICY product_serials_update_owner_staff
  ON public.product_serials
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = public.jwt_tenant_id()
    AND public.jwt_role() IN ('owner', 'staff')
  )
  WITH CHECK (
    tenant_id = public.jwt_tenant_id()
    AND public.jwt_role() IN ('owner', 'staff')
  );

-- 2. Reservations (TKT-006)
CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  qty integer NOT NULL CHECK (qty > 0),
  fulfillment_type text NOT NULL DEFAULT 'pickup' CHECK (fulfillment_type IN ('pickup', 'delivery')),
  scheduled_pickup_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'picked_up', 'cancelled', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_tenant_status_expires
  ON public.reservations (tenant_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_reservations_customer
  ON public.reservations (customer_id, created_at DESC);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations FORCE ROW LEVEL SECURITY;

CREATE POLICY reservations_select_customer_or_tenant
  ON public.reservations
  FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid()
    OR tenant_id = public.jwt_tenant_id()
    OR public.jwt_role() = 'system_admin'
  );

CREATE POLICY reservations_update_staff_owner
  ON public.reservations
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = public.jwt_tenant_id()
    AND public.jwt_role() IN ('owner', 'staff')
  )
  WITH CHECK (
    tenant_id = public.jwt_tenant_id()
    AND public.jwt_role() IN ('owner', 'staff')
  );

-- 3. Update Derived Stock View to subtract active unexpired reservations (BR-02, BR-03)
CREATE OR REPLACE VIEW public.available_inventory_view
WITH (security_invoker = true) AS
WITH movement_totals AS (
  SELECT
    m.tenant_id,
    m.product_id,
    COALESCE(SUM(m.delta_qty), 0)::bigint AS on_hand_qty
  FROM public.inventory_movements m
  GROUP BY m.tenant_id, m.product_id
),
active_reservations AS (
  SELECT
    r.tenant_id,
    r.product_id,
    COALESCE(SUM(r.qty), 0)::bigint AS active_reserved_qty
  FROM public.reservations r
  WHERE r.status = 'reserved'
    AND now() <= r.expires_at
  GROUP BY r.tenant_id, r.product_id
)
SELECT
  p.tenant_id,
  p.id AS product_id,
  p.sku,
  p.brand,
  p.name,
  COALESCE(mt.on_hand_qty, 0)::bigint AS on_hand_qty,
  COALESCE(ar.active_reserved_qty, 0)::bigint AS active_reserved_qty,
  (COALESCE(mt.on_hand_qty, 0) - COALESCE(ar.active_reserved_qty, 0))::bigint AS available_qty
FROM public.products p
LEFT JOIN movement_totals mt
  ON mt.product_id = p.id AND mt.tenant_id = p.tenant_id
LEFT JOIN active_reservations ar
  ON ar.product_id = p.id AND ar.tenant_id = p.tenant_id;

-- 4. Atomic Reservation & Expiry RPCs (F-31: SECURITY DEFINER SET search_path = '')
CREATE OR REPLACE FUNCTION public.expire_overdue_reservations(p_tenant_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.reservations
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'reserved'
    AND now() > expires_at
    AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_reservation_atomic(
  p_tenant_id uuid,
  p_product_id uuid,
  p_qty integer,
  p_scheduled_pickup_at timestamptz,
  p_fulfillment_type text DEFAULT 'pickup'
)
RETURNS public.reservations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_customer_id uuid;
  v_shop public.shops%ROWTYPE;
  v_on_hand bigint;
  v_reserved bigint;
  v_available bigint;
  v_result public.reservations%ROWTYPE;
BEGIN
  v_customer_id := auth.uid();
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = '42501';
  END IF;

  IF p_qty IS NULL OR p_qty <= 0 THEN
    RAISE EXCEPTION 'INVALID_QTY' USING ERRCODE = '22023';
  END IF;

  IF p_fulfillment_type NOT IN ('pickup', 'delivery') THEN
    RAISE EXCEPTION 'INVALID_FULFILLMENT_TYPE' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_shop
  FROM public.shops
  WHERE id = p_tenant_id
  FOR SHARE;

  IF NOT FOUND OR v_shop.status <> 'active' THEN
    RAISE EXCEPTION 'SHOP_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF NOT v_shop.reservations_enabled THEN
    RAISE EXCEPTION 'RESERVATIONS_DISABLED' USING ERRCODE = '42501';
  END IF;

  IF p_fulfillment_type = 'delivery' AND NOT v_shop.delivery_enabled THEN
    RAISE EXCEPTION 'DELIVERY_DISABLED' USING ERRCODE = '42501';
  END IF;

  -- Lock product row to serialize concurrent reservations for the same SKU
  PERFORM 1
  FROM public.products
  WHERE id = p_product_id
    AND tenant_id = p_tenant_id
    AND status = 'active'
    AND is_banned_blocked = false
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PRODUCT_NOT_AVAILABLE' USING ERRCODE = 'P0002';
  END IF;

  -- Sweep overdue reservations for this product before checking stock
  UPDATE public.reservations
  SET status = 'expired',
      updated_at = now()
  WHERE tenant_id = p_tenant_id
    AND product_id = p_product_id
    AND status = 'reserved'
    AND now() > expires_at;

  SELECT COALESCE(SUM(delta_qty), 0)::bigint INTO v_on_hand
  FROM public.inventory_movements
  WHERE tenant_id = p_tenant_id
    AND product_id = p_product_id;

  SELECT COALESCE(SUM(qty), 0)::bigint INTO v_reserved
  FROM public.reservations
  WHERE tenant_id = p_tenant_id
    AND product_id = p_product_id
    AND status = 'reserved'
    AND now() <= expires_at;

  v_available := v_on_hand - v_reserved;

  IF v_available < p_qty THEN
    RAISE EXCEPTION 'INSUFFICIENT_STOCK' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.reservations (
    tenant_id,
    customer_id,
    product_id,
    qty,
    fulfillment_type,
    scheduled_pickup_at,
    expires_at,
    status
  )
  VALUES (
    p_tenant_id,
    v_customer_id,
    p_product_id,
    p_qty,
    p_fulfillment_type,
    p_scheduled_pickup_at,
    p_scheduled_pickup_at + make_interval(mins => v_shop.pickup_grace_minutes),
    'reserved'
  )
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_reservation_pickup(
  p_reservation_id uuid,
  p_scheduled_pickup_at timestamptz
)
RETURNS public.reservations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_customer_id uuid;
  v_res public.reservations%ROWTYPE;
  v_grace_minutes integer;
  v_updated public.reservations%ROWTYPE;
BEGIN
  v_customer_id := auth.uid();
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_res
  FROM public.reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RESERVATION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_res.customer_id <> v_customer_id THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF v_res.status <> 'reserved' THEN
    RAISE EXCEPTION 'RESERVATION_NOT_EDITABLE' USING ERRCODE = 'P0001';
  END IF;

  IF now() > v_res.expires_at THEN
    UPDATE public.reservations
    SET status = 'expired', updated_at = now()
    WHERE id = v_res.id;
    RAISE EXCEPTION 'RESERVATION_EXPIRED' USING ERRCODE = 'P0001';
  END IF;

  SELECT pickup_grace_minutes INTO v_grace_minutes
  FROM public.shops
  WHERE id = v_res.tenant_id;

  UPDATE public.reservations
  SET scheduled_pickup_at = p_scheduled_pickup_at,
      expires_at = p_scheduled_pickup_at + make_interval(mins => COALESCE(v_grace_minutes, 60)),
      updated_at = now()
  WHERE id = v_res.id
  RETURNING * INTO v_updated;

  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_overdue_reservations(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_reservation_atomic(uuid, uuid, integer, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_reservation_pickup(uuid, timestamptz) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.expire_overdue_reservations(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_reservation_atomic(uuid, uuid, integer, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_reservation_pickup(uuid, timestamptz) TO authenticated;
