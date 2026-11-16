---
version: 1.0
status: approved
owner: PM
---
# Defense Traceability Matrix (`PM-11`)

| Question | Rule IDs | Evidence |
|---|---|---|
| How does reservation reduce stock without letting expired holds block inventory forever? | `BR-02`, `BR-03`, `DB-02` | `available_inventory_view` deducts `status = 'reserved'` rows; sweep + lazy check expires `now() > scheduled_pickup_at + 1h` (`TKT-006`). |
| How do you trace a haywire vape back to its supplier? | `BR-05`, `DB-07` | Staff posts manufacturer `serial_number`; app displays QR code linked to `product_serials.supplier_id` and delivery ETA (`TKT-005`). |
| How are Philippine vape laws enforced? | `BR-06`, `RS-01..06` | `ph_banned_products` gate + 10-item PH Legal ID selector (`docs/PH_COMPLIANCE.md`, `TKT-002`, `TKT-007`). |
