---
version: 1.0
status: approved
owner: PM
project: VapeShop
---
# VapeShop SaaS — Implementation Ticket Backlog (`/to-tickets`)

> Execute sequentially with `/implement TKT-00N`. **DoD (`PM-09`):** `GATE: PASS` from all owning agents + zero `F-01..F-39` SQL collisions.

---

### `TKT-001` — Multi-Tenant Shop Self-Registration & 4-Role AuthZ
- **Owning Agents:** `[SEC]` `[SD]` `[UX]`
- **Dependencies:** None
- **Feature Flags (`PM-17`):** `tenant=true, append_only=false, ingestion=false, status=true, view=false, sec_definer=true, latest_per_key=false`
- **Rules Enforced:** `SEC-01`, `SEC-02`, `AUTH-01`, `F-26`, `F-31`
- **Scope:**
  - Shop self-registration flow (`POST /api/shops/register`) provisioning a new `shops` tenant and assigning `app_metadata.tenant_id` + `app_metadata.role = 'owner'`.
  - Role guards for `system_admin`, `owner` (creates `staff` accounts & toggles `reservations_enabled` / `delivery_enabled`), `staff`, and `customer`.
- **Verification Gate:** Zero `user_metadata` trust; `owner` of Shop A cannot view or create staff in Shop B.

---

### `TKT-002` — PH Regulatory Watchlist & Legal ID Types Registry (`RA 11900`)
- **Owning Agents:** `[RS]` `[SEC]` `[DB]`
- **Dependencies:** `TKT-001`
- **Feature Flags (`PM-17`):** `tenant=false, append_only=false, ingestion=false, status=true, view=false, sec_definer=false, latest_per_key=false`
- **Rules Enforced:** `RS-01..06`, `BR-06`, `SEC-14`
- **Scope:**
  - Seed `ph_banned_products` (DTI-suspended brands like *Flava*/*ROMIO*, minor-appealing fruit/candy/dessert/cartoon descriptors, missing DTI PS mark) and expose `system_admin` CRUD console.
  - Seed the 10 valid **PH Government ID types** (`PhilSys`, `Passport`, `Driver's License`, `UMID/SSS/GSIS`, `PRC`, `Postal`, `Voter's`, `Barangay`, `Senior Citizen`, `PWD`) for age-gate UIs.
- **Verification Gate:** Attempting to add a banned product or prohibited flavor descriptor fails `422 GATE: REG-PH`.

---

### `TKT-003` — Catalog, Minimalist Supplier Availability & ETA Schema
- **Owning Agents:** `[DB]` `[PM]`
- **Dependencies:** `TKT-001`, `TKT-002`
- **Feature Flags (`PM-17`):** `tenant=true, append_only=false, ingestion=false, status=true, view=false, sec_definer=false, latest_per_key=false`
- **Rules Enforced:** `DB-04`, `DB-06`, `DB-07`, `DB-14`, `DB-15`, `F-01`, `F-16`
- **Scope:**
  - Tables for `suppliers` (`name`, `availability_status`, `expected_delivery_date` — zero contact fields) and `products` (brand, flavor, nicotine mg, `dti_ps_mark`, supplier link) with `FORCE ROW LEVEL SECURITY`.
  - Pre-insert/update compliance check against `ph_banned_products`.
- **Verification Gate:** `F-01..F-39` SQL Forensics pass; supplier view shows only availability & expected delivery date.

---

### `TKT-004` — Append-Only Sales Ledger, Inventory Movements & Derived Stock View
- **Owning Agents:** `[DB]` `[SEC]`
- **Dependencies:** `TKT-003`
- **Feature Flags (`PM-17`):** `tenant=true, append_only=true, ingestion=true, status=true, view=true, sec_definer=true, latest_per_key=false`
- **Rules Enforced:** `DB-01`, `DB-02`, `DB-05`, `DB-13`, `SEC-03`, `BR-01`, `BR-02`, `F-20`, `F-27`, `F-31`, `F-36`
- **Scope:**
  - Create `sales_ledger` and `inventory_movements` with `REVOKE UPDATE, DELETE, TRUNCATE`, append-only RLS, `P0001` trigger, and explicit `CONSTRAINT fk_<table>_supersedes_id FOREIGN KEY`.
  - Create `available_inventory_view` computing `on_hand_qty - active_reserved_qty`.
- **Verification Gate:** `UPDATE`/`DELETE` raises `P0001`; `supersedes_id` reversal restores net stock accurately.

---

### `TKT-005` — Manufacturer Serial Number Posting & QR Code Provenance Engine
- **Owning Agents:** `[DB]` `[UX]` `[PM]`
- **Dependencies:** `TKT-003`, `TKT-04`
- **Feature Flags (`PM-17`):** `tenant=true, append_only=false, ingestion=true, status=true, view=false, sec_definer=false, latest_per_key=false`
- **Rules Enforced:** `DB-07`, `DB-14`, `UX-01..17`, `BR-05`
- **Scope:**
  - Staff/Owner form to post existing manufacturer `serial_number` onto received units and render a printable/on-screen **QR code** inside the app.
  - QR scan / serial lookup page (`/serials/[serial]`) displaying unit status, `supplier_name`, `expected_delivery_date` / `received_at`, and **"Mark Haywire / Defective Return"** workflow for supplier traceability.
- **Verification Gate:** Posting duplicate serial within same tenant fails cleanly; scanning QR traces back to exact supplier & delivery date.

---

### `TKT-006` — Editable Reservation Engine with 1-Hour Expiry & Stock Lock
- **Owning Agents:** `[IR]` `[DB]` `[UX]`
- **Dependencies:** `TKT-004`
- **Feature Flags (`PM-17`):** `tenant=true, append_only=false, ingestion=true, status=true, view=true, sec_definer=true, latest_per_key=false`
- **Rules Enforced:** `IR-03`, `IR-07`, `SD-01`, `BR-02`, `BR-03`, `BR-04`
- **Scope:**
  - Customer reservation flow (gated by `shops.reservations_enabled` and optional `shops.delivery_enabled`) that immediately reduces `available_inventory_view`.
  - `PATCH /api/reservations/[id]` allowing customers to edit pickup date/time before expiration.
  - Deterministic expiry sweep: any `reserved` order where `now() > scheduled_pickup_at + interval '1 hour'` transitions to `expired` and immediately restores available inventory.
- **Verification Gate:** Concurrency test prevents overselling last unit; advancing clock past `pickup_at + 61m` makes unit available again.

---

### `TKT-007` — POS Checkout Terminal with 18+ Legal ID Gate & Idempotency
- **Owning Agents:** `[UX]` `[IR]` `[SEC]`
- **Dependencies:** `TKT-002`, `TKT-004`, `TKT-005`, `TKT-006`
- **Feature Flags (`PM-17`):** `tenant=true, append_only=true, ingestion=true, status=true, view=false, sec_definer=true, latest_per_key=false`
- **Rules Enforced:** `UX-01..17`, `IR-03`, `IR-04`, `SEC-04`, `BR-05`
- **Scope:**
  - Fast POS screen for Staff: scan barcode/serial, convert active reservation to sale, or ring walk-in items.
  - Mandatory **18+ Legal ID selector** displaying the 10 valid PH IDs before checkout completes.
  - Client-generated `idempotency_key` preventing double-charges on flaky shop Wi-Fi.
- **Verification Gate:** Checkout without `legal_id_type` fails `422`; 3× identical retry creates exactly 1 `sales_ledger` row.

---

### `TKT-008` — Shop Owner Dashboard & System Admin Repair/Update Console
- **Owning Agents:** `[UX]` `[GR]` `[SD]`
- **Dependencies:** `TKT-001..TKT-007`
- **Feature Flags (`PM-17`):** `tenant=true, append_only=false, ingestion=false, status=true, view=true, sec_definer=false, latest_per_key=true`
- **Rules Enforced:** `SEC-15`, `SD-09`, `UX-05`, `UX-17`
- **Scope:**
  - Shop Owner panel: toggle `reservations_enabled` / `delivery_enabled`, manage `staff`, view supplier ETAs, haywire serial claims, and daily sales.
  - System Admin panel: system health/maintenance mode, repair queue, and PH Banned Product watchlist editor.
- **Verification Gate:** `Cache-Control: no-store, private` on all tenant/admin APIs (`SEC-15`).

---

### `TKT-009` — Adversarial Hardening, RLS Bypass Suite & `/harden` Sign-Off
- **Owning Agents:** `[SEC]` `[DB]` `[RS]`
- **Dependencies:** `TKT-001..TKT-008`
- **Feature Flags (`PM-17`):** `tenant=true, append_only=true, ingestion=true, status=true, view=true, sec_definer=true, latest_per_key=true`
- **Rules Enforced:** `SEC-01..16`, `DB-01..15`, `IR-10`, `RS-06`
- **Scope:**
  - Run `/review` and `/harden`: cross-tenant RLS probes, `user_metadata` spoofing, `P0001` ledger mutation attempts, 1-hour reservation expiry race tests, and PH banned product bypass attempts.
- **Verification Gate:** Zero `GATE: FAIL` findings across all 8 agents.
