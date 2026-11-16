---
version: 1.0
status: approved
owner: SD
---
# Technical Requirements Document — VapeShop SaaS

## 1. Stack
- **Frontend / App:** Next.js App Router (TypeScript strict, Tailwind CSS, `qrcode` SVG/Canvas generator for serial QR display).
- **Database / Auth:** PostgreSQL 16 (Supabase/Postgres with `gen_random_uuid()`, `FORCE ROW LEVEL SECURITY`, `app_metadata.tenant_id`, `app_metadata.role`).
- **Background Expiry:** Periodic sweep + read-time lazy expiration for reservations exceeding `scheduled_pickup_at + interval '1 hour'`.

## 2. Feature-Flag Classification (`PM-17`)
| Subsystem | `tenant` | `append_only` | `ingestion` | `status` | `view` | `sec_definer` | `latest_per_key` |
|---|---|---|---|---|---|---|---|
| `sales_ledger` | `true` | `true` | `true` | `true` | `false` | `false` | `false` |
| `inventory_movements` | `true` | `true` | `true` | `false` | `false` | `false` | `false` |
| `reservations` | `true` | `false` | `true` | `true` | `false` | `true` | `false` |
| `product_serials` | `true` | `false` | `true` | `true` | `false` | `false` | `false` |
| `available_inventory_view` | `true` | `false` | `false` | `false` | `true` | `false` | `true` |
| `ph_banned_products` | `false` | `false` | `false` | `true` | `false` | `false` | `false` |

## 3. Key API Contracts
- `POST /api/shops/register` — Self-registers a new shop tenant, creates owner `app_metadata.tenant_id`, initializes `reservations_enabled`, `delivery_enabled`.
- `POST /api/reservations` & `PATCH /api/reservations/[id]` — Atomically checks `shops.reservations_enabled`, locks variant stock via `SELECT ... FOR UPDATE`, inserts/updates reservation, and enforces `scheduled_pickup_at + 1 hour` expiry.
- `POST /api/pos/sales` — Enforces `idempotency_key`, `legal_id_type` (18+ gate), and `ph_banned_products` check; writes append-only `sales_ledger` + `inventory_movements`.
- `POST /api/serials` & `GET /api/serials/[serial]/trace` — Posts manufacturer `serial_number`, returns QR payload, supplier availability/ETA, and haywire defect history.
- `GET /api/compliance/ph` & `POST /api/admin/banned-products` — Returns valid PH ID types + banned product registry (mutations restricted to `system_admin`).
