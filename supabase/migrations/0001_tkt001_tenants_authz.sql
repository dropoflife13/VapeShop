-- TKT-001: Multi-Tenant Shop Self-Registration & 4-Role AuthZ
-- Enforces: SEC-01, SEC-02, AUTH-01, F-26 (FORCE RLS), F-31 (SECURITY DEFINER search_path = '')

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Helper functions (F-31: SECURITY DEFINER with empty search_path; never trust user_metadata)
CREATE OR REPLACE FUNCTION public.jwt_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::uuid;
$$;

CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NULLIF(auth.jwt() -> 'app_metadata' ->> 'role', '');
$$;

REVOKE ALL ON FUNCTION public.jwt_tenant_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.jwt_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.jwt_tenant_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.jwt_role() TO authenticated, anon;

-- 2. Shops (Tenant Root)
CREATE TABLE IF NOT EXISTS public.shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 120),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  reservations_enabled boolean NOT NULL DEFAULT true,
  delivery_enabled boolean NOT NULL DEFAULT false,
  pickup_grace_minutes integer NOT NULL DEFAULT 60 CHECK (pickup_grace_minutes BETWEEN 15 AND 1440),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shops_status ON public.shops (status);

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops FORCE ROW LEVEL SECURITY;

-- Public/customer can read active shops (catalog & reservation gating)
CREATE POLICY shops_select_active_or_tenant
  ON public.shops
  FOR SELECT
  TO authenticated, anon
  USING (
    status = 'active'
    OR id = public.jwt_tenant_id()
    OR public.jwt_role() = 'system_admin'
  );

-- Owner can update only their own shop's config
CREATE POLICY shops_update_owner
  ON public.shops
  FOR UPDATE
  TO authenticated
  USING (
    id = public.jwt_tenant_id()
    AND public.jwt_role() = 'owner'
  )
  WITH CHECK (
    id = public.jwt_tenant_id()
    AND public.jwt_role() = 'owner'
  );

-- System admin can update any shop (e.g., suspend/reactivate)
CREATE POLICY shops_update_system_admin
  ON public.shops
  FOR UPDATE
  TO authenticated
  USING (public.jwt_role() = 'system_admin')
  WITH CHECK (public.jwt_role() = 'system_admin');

-- 3. Staff Members (Tenant-Scoped Users)
CREATE TABLE IF NOT EXISTS public.staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL CHECK (role IN ('owner', 'staff')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_staff_members_tenant_user UNIQUE (tenant_id, user_id),
  CONSTRAINT uq_staff_members_tenant_email UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_staff_members_tenant_id ON public.staff_members (tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_user_id ON public.staff_members (user_id);

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members FORCE ROW LEVEL SECURITY;

-- Tenant members can read staff in their own shop; system_admin can read all
CREATE POLICY staff_members_select_tenant
  ON public.staff_members
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.jwt_tenant_id()
    OR public.jwt_role() = 'system_admin'
  );

-- Only shop owner can insert staff into their own tenant
CREATE POLICY staff_members_insert_owner
  ON public.staff_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.jwt_tenant_id()
    AND public.jwt_role() = 'owner'
  );

-- Only shop owner can update staff in their own tenant
CREATE POLICY staff_members_update_owner
  ON public.staff_members
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = public.jwt_tenant_id()
    AND public.jwt_role() = 'owner'
  )
  WITH CHECK (
    tenant_id = public.jwt_tenant_id()
    AND public.jwt_role() = 'owner'
  );
