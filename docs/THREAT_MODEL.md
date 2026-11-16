---
version: 1.0
status: approved
owner: SEC
---
# STRIDE Threat Model (`SEC-01`, `SEC-06`)

| Threat | Vector | Mitigation (`SEC` / `DB`) |
|---|---|---|
| **Cross-Shop Data Leak** | Shop A accesses Shop B's sales/serials | `FORCE ROW LEVEL SECURITY` on `app_metadata.tenant_id` (`F-26`). |
| **Underage / Banned Sale** | Cashier bypasses UI ID check or lists banned brand | Server-side `legal_id_type` + `ph_banned_products` gate (`BR-06`). |
| **Reservation Hoarding / Race** | Simultaneous reserve on last unit | `SELECT ... FOR UPDATE` + 1-hour expiry + per-customer active cap. |
| **Ledger Tampering** | Staff edits past sale or stock count | `REVOKE UPDATE, DELETE, TRUNCATE` + `P0001` trigger (`F-20`). |
