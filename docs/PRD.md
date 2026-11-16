---
version: 1.0
status: approved
owner: PM
---
# Product Requirements Document — VapeShop SaaS

## 1. Empathy Map (`PM-14`) — Customer & Counter Staff
- **Customer Says:** "Is the 35mg pod available right now? Can I reserve it for 3 PM pickup, or shift it to 5 PM if I'm stuck in traffic?"
- **Staff Says:** "A customer brought back a device that went haywire—let me scan/enter its serial number to see which supplier delivered it and when."
- **Shop Owner Says:** "I want to register my shop, create my staff logins, turn reservations/delivery on or off, and block anything DTI banned before I get fined."

## 2. Functional Requirements (Given / When / Then)
- **FR-01 (Shop Self-Registration & Tenant Isolation):** Any vape shop owner can register a shop, receiving an isolated `tenant_id` in `app_metadata`, and configure `reservations_enabled` and `delivery_enabled`.
- **FR-02 (Staff & Customer Accounts):** `owner` creates/disables `staff` accounts scoped to their shop; `customer` accounts browse participating shops.
- **FR-03 (Live Availability & Editable Reservations):** Online shoppers view live `available_qty`. Creating a reservation deducts `available_qty`. Customers can edit pickup date/time; if unpicked-up > **1 hour** after `scheduled_pickup_at`, status auto-expires and restores `available_qty`.
- **FR-04 (POS Checkout + Legal ID Verification):** Staff rings up walk-in or reserved orders, selects from the 10 **PH Legal ID Types** (`docs/PH_COMPLIANCE.md`) to confirm 18+, and writes an immutable `sales_ledger` row.
- **FR-05 (Manufacturer Serial Number + QR Display):** Staff/Owner posts existing manufacturer `serial_number` onto inventory items; app renders a QR code encoding `serial_number` + `shop_id` so scanning reveals supplier name, delivery ETA/received date, and warranty/haywire status.
- **FR-06 (Minimalist Supplier Tracking):** Owner/Staff records supplier product availability status (`available | backordered | discontinued`) and `expected_delivery_date`—no external supplier contact portal.
- **FR-07 (System Admin Repair & Banned Product Registry):** `system_admin` manages platform health/updates and updates `ph_banned_products`, which hard-blocks matching SKUs across all shops.
