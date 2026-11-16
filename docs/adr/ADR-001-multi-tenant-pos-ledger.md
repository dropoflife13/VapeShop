---
version: 1.0
status: approved
owner: SD
---
# ADR-001: Multi-Tenant Append-Only Ledger & 1-Hour Reservation Hold

- **Decision:** Model sales and stock as append-only ledgers (`P0001`, `supersedes_id`), derive available inventory via `available_inventory_view`, and enforce 1-hour grace expiry on editable reservations toggled per shop by the `owner`.
- **Consequences:** Prevents overselling and silent stock tampering while allowing multi-shop self-registration under strict `app_metadata.tenant_id` RLS (`F-26`).
