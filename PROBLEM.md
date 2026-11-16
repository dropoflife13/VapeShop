---
version: 1.0
status: approved
owner: PM
project: VapeShop
---
# VapeShop SaaS — Problem Seed, Grill Decisions & Business Rules

## 1. Core Problem Statement
Multi-tenant vape shop owners, staff, and online customers face four operational failures:
1. **No Real-Time Product Availability or Reservation:** Customers do not know if a specific vape device, pod, or flavor is in stock, and cannot reserve units with reliable pickup windows.
2. **Supplier Availability & Delivery Blind Spots:** Shops lack visibility into supplier stock availability and expected delivery dates (ETA).
3. **Product Failure ("Haywire") & Legitimacy Traceability:** When a vape malfunctions or goes haywire, shops need to trace the manufacturer's **serial number** (with a scannable **QR code** displayed in-app) back to its supplier and delivery batch.
4. **Philippine Regulatory Risk (RA 11900 / DTI):** Shops risk closure or fines if they sell DTI-banned/suspended vape products, items missing PS/BIR compliance, or fail to verify 18+ buyers with valid Philippine government IDs.

## 2. User Roles (`PM-15`)
- **System Admin (`system_admin`):** Platform operator responsible for system repairs/updates, shop onboarding oversight, and maintaining the **PH Banned Products Registry** & legal ID types.
- **Shop Owner (`owner`):** Self-registers their vape shop onto the SaaS platform, toggles **Reservation** and/or **Delivery** availability per shop, creates **Staff** accounts, posts inventory/serial numbers, and tracks supplier availability & expected delivery dates.
- **Staff (`staff`):** Operates POS checkout, fulfills or cancels reservations, posts manufacturer serial numbers (generating/displaying QR codes), and logs defective/haywire returns.
- **Customer (`customer`):** Online shopper who views live product availability, checks accepted legal ID types, and creates/edits reservations for pickup.

## 3. MVP Scope Cut (Approved — `BA-07`)
- **IN MVP:** Shop self-registration, 4-role hierarchy (`system_admin`, `owner`, `staff`, `customer`), shop-level toggles for `reservations_enabled` and `delivery_enabled`, POS + append-only sales & inventory ledger (`P0001`), **editable reservations with 1-hour past-pickup auto-expiry**, manufacturer serial number posting + QR code display, minimalist supplier availability + expected delivery date (ETA) tracking, PH legal ID selector, and PH Banned Products gate.
- **CUT TO v2:** External supplier login/contact portal, automated courier dispatch API, automated online payment gateway webhooks.

## 4. Business Rules Registry (`PM-04`)
| ID | Business Rule | Enforcing Layer | Owner | Verification Test |
|---|---|---|---|---|
| **BR-01** | Completed sales and stock movements are strictly append-only (`REVOKE UPDATE, DELETE, TRUNCATE` + trigger `P0001`); voids/returns insert compensating rows with `supersedes_id`. | PostgreSQL Trigger + RLS | `DB` | Attempt `UPDATE`/`DELETE` -> raises `P0001` (`F-20`). |
| **BR-02** | Available stock = `on_hand_qty - active_reserved_qty`, derived strictly from `inventory_movements` and active `reservations`. Creating a reservation immediately reduces available inventory. | SQL View + Transaction Lock | `DB` | Reserving 1 unit of 3 available leaves 2 available. |
| **BR-03** | **Editable Reservation & 1-Hour Expiry:** Customers may edit reservation pickup date/time while `status = 'reserved'`. If unpicked-up > 1 hour past `scheduled_pickup_at`, reservation transitions to `expired` and restores available stock. | Scheduled Worker / Lazy Sweep + DB | `IR` / `DB` | `now() > scheduled_pickup_at + 1h` returns stock to available. |
| **BR-04** | **Shop Feature Toggles:** Reservation and Delivery workflows are gated per shop by `shops.reservations_enabled` and `shops.delivery_enabled` controlled by `owner`. | API + RLS / Check | `PM` / `SEC` | Reservation POST against shop with `reservations_enabled = false` returns `403`. |
| **BR-05** | **Serial Number + QR Provenance:** Staff/Owner posts existing manufacturer `serial_number` into the app; app renders a scannable QR code linked to `product_variant`, `supplier_name`, `expected_delivery_at`, and `received_at`. | App + DB Unique Index | `DB` / `UX` | Scanning QR resolves full supplier & delivery lineage. |
| **BR-06** | **Philippine RA 11900 Legal Age & Banned Product Gate:** Buyers must be **18+** verified via an accepted **PH Government ID**; products matching `ph_banned_products` (or missing DTI PS mark / prohibited minor-appealing descriptors) are hard-blocked from active catalog & POS. | API + DB Constraint / Gate | `RS` / `SEC` | Listing/selling a banned brand (e.g. *Flava*) fails `422 GATE: REG-PH`. |
| **BR-07** | **Multi-Tenant Isolation:** Every shop-scoped table enforces `FORCE ROW LEVEL SECURITY` keyed on `(auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid` (never `user_metadata`). | PostgreSQL RLS | `SEC` / `DB` | Cross-tenant read/write test leaks 0 rows (`F-26`). |
