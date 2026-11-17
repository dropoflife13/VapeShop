-- TKT-002 & Admin Backend: PH Regulatory Watchlist (RA 11900), Legal IDs, and System Admin Console
-- Enforces: RS-01..06, BR-06, SEC-14, F-26 (FORCE RLS)

-- 1. Valid Philippine Government ID Types (RA 11900 18+ Verification)
CREATE TABLE IF NOT EXISTS public.ph_legal_id_types (
  code text PRIMARY KEY,
  label text NOT NULL,
  issuing_agency text NOT NULL,
  sort_order integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.ph_legal_id_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ph_legal_id_types FORCE ROW LEVEL SECURITY;

CREATE POLICY ph_legal_id_types_select_all
  ON public.ph_legal_id_types
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true OR public.jwt_role() = 'system_admin');

CREATE POLICY ph_legal_id_types_admin_write
  ON public.ph_legal_id_types
  FOR ALL
  TO authenticated
  USING (public.jwt_role() = 'system_admin')
  WITH CHECK (public.jwt_role() = 'system_admin');

INSERT INTO public.ph_legal_id_types (code, label, issuing_agency, sort_order)
VALUES
  ('philsys_national_id', 'Philippine Identification System (PhilSys / National ID)', 'PSA', 1),
  ('passport', 'Philippine Passport', 'DFA', 2),
  ('drivers_license', 'LTO Driver''s License', 'LTO', 3),
  ('umid_sss_gsis', 'UMID / SSS / GSIS ID', 'SSS / GSIS', 4),
  ('prc_id', 'PRC Professional ID', 'PRC', 5),
  ('postal_id', 'Philippine Postal ID', 'PHLPost', 6),
  ('voters_id', 'COMELEC Voter''s ID', 'COMELEC', 7),
  ('barangay_id', 'Barangay ID (with photo & birthdate)', 'Barangay', 8),
  ('senior_citizen_id', 'OSCA Senior Citizen ID', 'OSCA', 9),
  ('pwd_id', 'PWD ID', 'NCDA / LGU', 10)
ON CONFLICT (code) DO NOTHING;

-- 2. PH Banned / Suspended Vape Products Watchlist (RA 11900 / DTI)
CREATE TABLE IF NOT EXISTS public.ph_banned_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type text NOT NULL CHECK (rule_type IN ('banned_brand', 'prohibited_flavor_descriptor', 'missing_certification')),
  brand_pattern text,
  flavor_pattern text,
  description text NOT NULL CHECK (char_length(trim(description)) BETWEEN 3 AND 300),
  legal_basis text NOT NULL CHECK (char_length(trim(legal_basis)) BETWEEN 3 AND 200),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_ph_banned_has_pattern CHECK (
    brand_pattern IS NOT NULL OR flavor_pattern IS NOT NULL OR rule_type = 'missing_certification'
  )
);

CREATE INDEX IF NOT EXISTS idx_ph_banned_products_status ON public.ph_banned_products (status);

ALTER TABLE public.ph_banned_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ph_banned_products FORCE ROW LEVEL SECURITY;

CREATE POLICY ph_banned_products_select_active
  ON public.ph_banned_products
  FOR SELECT
  TO authenticated, anon
  USING (status = 'active' OR public.jwt_role() = 'system_admin');

CREATE POLICY ph_banned_products_admin_insert
  ON public.ph_banned_products
  FOR INSERT
  TO authenticated
  WITH CHECK (public.jwt_role() = 'system_admin');

CREATE POLICY ph_banned_products_admin_update
  ON public.ph_banned_products
  FOR UPDATE
  TO authenticated
  USING (public.jwt_role() = 'system_admin')
  WITH CHECK (public.jwt_role() = 'system_admin');

CREATE POLICY ph_banned_products_admin_delete
  ON public.ph_banned_products
  FOR DELETE
  TO authenticated
  USING (public.jwt_role() = 'system_admin');

INSERT INTO public.ph_banned_products (id, rule_type, brand_pattern, flavor_pattern, description, legal_basis, status)
VALUES
  (
    '00000000-0000-0000-0000-000000000101',
    'banned_brand',
    'flava',
    NULL,
    'DTI FTEB suspended Flava Corporation vape product lines',
    'RA 11900 §12 / DTI FTEB Enforcement Order',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'banned_brand',
    'romio',
    NULL,
    'DTI FTEB suspended ROMIO vape product lines',
    'RA 11900 §12 / DTI FTEB Enforcement Order',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    'prohibited_flavor_descriptor',
    NULL,
    'strawberry|mango|watermelon|grape|blueberry|apple|banana|peach|lychee|cherry|candy|gummy|bubblegum|cotton candy|lollipop|donut|cake|ice cream|milkshake|sundae|chocolate|cartoon',
    'Minor-appealing fruit, candy, dessert, or cartoon flavor descriptors prohibited under RA 11900',
    'RA 11900 §12 / DTI DAO No. 24-04',
    'active'
  )
ON CONFLICT (id) DO NOTHING;

-- 3. System Admin Settings & Repair Queue (TKT-008 Admin Backend)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id integer PRIMARY KEY CHECK (id = 1),
  maintenance_mode boolean NOT NULL DEFAULT false,
  maintenance_message text NOT NULL DEFAULT '',
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings FORCE ROW LEVEL SECURITY;

CREATE POLICY system_settings_select_all
  ON public.system_settings
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY system_settings_admin_update
  ON public.system_settings
  FOR UPDATE
  TO authenticated
  USING (public.jwt_role() = 'system_admin')
  WITH CHECK (public.jwt_role() = 'system_admin');

INSERT INTO public.system_settings (id, maintenance_mode, maintenance_message)
VALUES (1, false, '')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.system_repairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 3 AND 160),
  category text NOT NULL CHECK (category IN ('bugfix', 'security_patch', 'compliance_update', 'maintenance')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  notes text NOT NULL DEFAULT '',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_repairs_status ON public.system_repairs (status);

ALTER TABLE public.system_repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_repairs FORCE ROW LEVEL SECURITY;

CREATE POLICY system_repairs_admin_all
  ON public.system_repairs
  FOR ALL
  TO authenticated
  USING (public.jwt_role() = 'system_admin')
  WITH CHECK (public.jwt_role() = 'system_admin');
