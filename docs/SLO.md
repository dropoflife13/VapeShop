---
version: 1.0
status: approved
owner: SD
---
# Service Level Objectives (`SD-03`)

| Operation | Availability | Latency (p95 / p99) | Notes |
|---|---|---|---|
| **Live Stock & Shop Availability Browse** | 99.9% | p95 <= 200ms / p99 <= 450ms | Indexed `available_inventory_view` |
| **Reservation Create / Edit** | 99.9% | p95 <= 300ms / p99 <= 600ms | Row-locked atomic stock check |
| **POS Checkout (`POST /api/pos/sales`)** | 99.9% | p95 <= 350ms / p99 <= 750ms | Client `idempotency_key` protects retries |
| **Serial QR Trace Lookup** | 99.9% | p95 <= 150ms / p99 <= 300ms | Unique index `(tenant_id, serial_number)` |
