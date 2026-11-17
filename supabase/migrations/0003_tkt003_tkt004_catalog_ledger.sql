-- TKT-003 & TKT-004: Catalog, Minimalist Supplier ETA, Append-Only Ledgers & Derived Stock View
-- Enforces: DB-01, DB-02, DB-04..07, DB-13..15, SEC-03, BR-01, BR-02, F-16, F-20, F-26, F-31, F-36

-- 1. Minimalist Suppliers (Zero contact fields per MVP scope cut)
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 120),
  availability_status text NOT NULL DEFAULT 'in_stock'
    CHECK (availability_status IN ('in_stock', 'low_stock', 'out_of_stock', 'discontinued')),
  expected_delivery_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_suppliers_tenant_name UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id ON public.suppliers (tenant_id);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers FORCE ROW LEVEL SECURITY;

CREATE POLICY suppliers_select_tenant
  ON public.suppliers
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.jwt_tenant_id()
    OR public.jwt_role() = 'system_admin'
  );

CREATE POLICY suppliers_insert_owner_staff
  ON public.suppliers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.jwt_tenant_id()
    AND public.jwt_role() IN ('owner', 'staff')
  );

CREATE POLICY suppliers_update_owner_staff
  ON public.suppliers
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

-- 2. Products Catalog (RA 11900 / DTI PS Mark defense-in-depth)
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  sku text NOT NULL CHECK (char_length(trim(sku)) BETWEEN 1 AND 64),
  brand text NOT NULL CHECK (char_length(trim(brand)) BETWEEN 1 AND 100),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 160),
  flavor_descriptor text NOT NULL DEFAULT '',
  nicotine_mg numeric(5,2) NOT NULL DEFAULT 0 CHECK (nicotine_mg >= 0 AND nicotine_mg <= 100),
  dti_ps_mark text NOT NULL CHECK (char_length(trim(dti_ps_mark)) > 0),
  unit_price_centavos integer NOT NULL CHECK (unit_price_centavos > 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  is_banned_blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_products_tenant_sku UNIQUE (tenant_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_products_tenant_status ON public.products (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products (supplier_id);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;

-- Customers/public can read active, non-banned products; tenant staff/owner can read all their own
CREATE POLICY products_select_catalog
  ON public.products
  FOR SELECT
  TO authenticated, anon
  USING (
    (status = 'active' AND is_banned_blocked = false)
    OR tenant_id = public.jwt_tenant_id()
    OR public.jwt_role() = 'system_admin'
  );

CREATE POLICY products_insert_owner_staff
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.jwt_tenant_id()
    AND public.jwt_role() IN ('owner', 'staff')
  );

CREATE POLICY products_update_owner_staff
  ON public.products
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

-- 3. Append-Only Immutability Trigger (F-20, F-31, BR-01)
CREATE OR REPLACE FUNCTION public.prevent_append_only_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Append-only ledger violation: % on % is forbidden', TG_OP, TG_TABLE_NAME
    USING ERRCODE = 'P0001';
END;
$$;

-- 4. Sales Ledger (Append-Only)
CREATE TABLE IF NOT EXISTS public.sales_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
  staff_id uuid NOT NULL,
  reservation_id uuid,
  idempotency_key text NOT NULL CHECK (char_length(trim(idempotency_key)) BETWEEN 8 AND 128),
  legal_id_type text NOT NULL REFERENCES public.ph_legal_id_types(code),
  total_centavos integer NOT NULL,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'voided', 'returned')),
  supersedes_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_sales_ledger_tenant_idempotency UNIQUE (tenant_id, idempotency_key),
  CONSTRAINT fk_sales_ledger_supersedes_id FOREIGN KEY (supersedes_id)
    REFERENCES public.sales_ledger(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_sales_ledger_tenant_created ON public.sales_ledger (tenant_id, created_at DESC);

ALTER TABLE public.sales_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_ledger FORCE ROW LEVEL SECURITY;

CREATE POLICY sales_ledger_select_tenant
  ON public.sales_ledger
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.jwt_tenant_id()
    OR public.jwt_role() = 'system_admin'
  );

CREATE POLICY sales_ledger_insert_owner_staff
  ON public.sales_ledger
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.jwt_tenant_id()
    AND public.jwt_role() IN ('owner', 'staff')
  );

REVOKE UPDATE, DELETE, TRUNCATE ON public.sales_ledger FROM authenticated, anon, PUBLIC;

DROP TRIGGER IF EXISTS trg_sales_ledger_immutable ON public.sales_ledger;
CREATE TRIGGER trg_sales_ledger_immutable
  BEFORE UPDATE OR DELETE ON public.sales_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_append_only_mutation();

-- 5. Inventory Movements (Append-Only)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  delta_qty integer NOT NULL CHECK (delta_qty <> 0),
  reason text NOT NULL CHECK (reason IN ('restock', 'sale', 'void_reversal', 'return_restock', 'adjustment')),
  reference_id uuid,
  actor_id uuid NOT NULL,
  supersedes_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_inventory_movements_supersedes_id FOREIGN KEY (supersedes_id)
    REFERENCES public.inventory_movements(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_tenant_product
  ON public.inventory_movements (tenant_id, product_id, created_at DESC);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements FORCE ROW LEVEL SECURITY;

CREATE POLICY inventory_movements_select_tenant
  ON public.inventory_movements
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.jwt_tenant_id()
    OR public.jwt_role() = 'system_admin'
  );

CREATE POLICY inventory_movements_insert_owner_staff
  ON public.inventory_movements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.jwt_tenant_id()
    AND public.jwt_role() IN ('owner', 'staff')
  );

REVOKE UPDATE, DELETE, TRUNCATE ON public.inventory_movements FROM authenticated, anon, PUBLIC;

DROP TRIGGER IF EXISTS trg_inventory_movements_immutable ON public.inventory_movements;
CREATE TRIGGER trg_inventory_movements_immutable
  BEFORE UPDATE OR DELETE ON public.inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_append_only_mutation();

-- 6. Derived Stock View (DB-02, BR-02; TKT-006 will extend active_reserved_qty with reservations)
CREATE OR REPLACE VIEW public.available_inventory_view
WITH (security_invoker = true) AS
SELECT
  p.tenant_id,
  p.id AS product_id,
  p.sku,
  p.brand,
  p.name,
  COALESCE(SUM(m.delta_qty), 0)::bigint AS on_hand_qty,
  0::bigint AS active_reserved_qty,
  COALESCE(SUM(m.delta_qty), 0)::bigint AS available_qty
FROM public.products p
LEFT JOIN public.inventory_movements m
  ON m.product_id = p.id
  AND m.tenant_id = p.tenant_id
GROUP BY p.tenant_id, p.id, p.sku, p.brand, p.name;
