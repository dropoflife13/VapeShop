---
version: 1.0
status: approved
owner: PM
---
# Logical Schema Plan — VapeShop SaaS (`PM-08`)

## 1. Entities & Mutability
| Entity | Key | Relations | Mutability / Rules |
|---|---|---|---|
| `shops` | `id` (UUID) | Tenant root; `reservations_enabled`, `delivery_enabled`, `pickup_grace_minutes` (default `60`) | Config (`owner` edits own shop; `system_admin` oversees) |
| `staff_members` | `id` (UUID) | Belongs to `shops` (`tenant_id`) & auth user | Created/disabled by `owner` |
| `suppliers` | `id` (UUID) | Belongs to `shops` (`tenant_id`); `name`, `availability_status`, `expected_delivery_date` | Minimalist (no contact fields, `BR`) |
| `products` | `id` (UUID) | Belongs to `shops`; `brand`, `flavor_descriptor`, `dti_ps_mark`, `is_banned_blocked` | Blocked on insert/update if matching `ph_banned_products` |
| `product_serials` | `id` (UUID) | `(tenant_id, serial_number)` UNIQUE; links `product_id`, `supplier_id`, `expected_delivery_date`, `qr_payload`, `status` (`in_stock | reserved | sold | haywire_returned`) | Posted by `owner`/`staff` from manufacturer serial |
| `reservations` | `id` (UUID) | Belongs to `shops`, `customer_id`, `product_id`; `qty`, `scheduled_pickup_at`, `expires_at` (`scheduled_pickup_at + 1 hour`), `status` (`reserved | picked_up | cancelled | expired`) | Editable while `reserved`; auto-expires after 1h grace |
| `sales_ledger` | `id` (UUID) | Belongs to `shops`, `staff_id`; `idempotency_key`, `legal_id_type`, `supersedes_id` | **Append-Only** (`REVOKE UPDATE, DELETE, TRUNCATE` + `P0001`) |
| `inventory_movements` | `id` (UUID) | Belongs to `shops`, `product_id`; `delta_qty`, `reason`, `supersedes_id` | **Append-Only** (`P0001`) |
| `available_inventory_view` | `(tenant_id, product_id)` | `SUM(inventory_movements.delta_qty) - SUM(active reserved qty)` | **Derived Read-Only View** (`DB-02`) |
| `ph_banned_products` | `id` (UUID) | Global regulatory watchlist (`brand_pattern`, `flavor_pattern`, `legal_basis`, `status`) | `SELECT` all; `INSERT/UPDATE` `system_admin` only |

## 2. Verbatim PostgreSQL 16 Migration Contracts (`DB-01..15`, `SEC-02..03`)
- **Tenant RLS (`F-26`):** `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY` using `tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid`.
- **Append-Only Trigger (`F-20`):** `BEFORE UPDATE OR DELETE` raising `ERRCODE = 'P0001'`.
- **Self-Reference FK (`F-16`/`F-36`):** Explicit `CONSTRAINT fk_sales_ledger_supersedes_id FOREIGN KEY (supersedes_id) REFERENCES sales_ledger(id) ON DELETE RESTRICT`.
- **SECURITY DEFINER (`F-31`):** `SECURITY DEFINER SET search_path = ''` on reservation lock & checkout RPCs.
