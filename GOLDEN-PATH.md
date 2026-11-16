---
version: 1.0
status: approved
owner: PM
project: VapeShop
---
# VapeShop SaaS — Cortex Golden Path Pipeline

> **Pre-Flight Invariant (`BN-00`):** All 8 Core Agents (`PM`, `UX`, `GR`, `SD`, `IR`, `DB`, `SEC`, `RS`) must exist in `agents/` and `brain/` must be present before implementing any ticket.

| Step | Command | Owning Agents | Artifact(s) in `VapeShop` | Status |
|---|---|---|---|---|
| **1** | `/grill` | `[PM]` | `PROBLEM.md`, `docs/PRD.md` | `COMPLETED` |
| **2** | `/pitch` | `[GR]` + `[PM]` | `PROBLEM.md` (§ Value Prop), `docs/UTM_REGISTRY.md`, `docs/EVENTS.md` | `COMPLETED` |
| **3** | `/to-spec` | `[SD]` + `[DB]` + `[SEC]` + `[RS]` | `docs/TRD.md`, `docs/SCHEMA_PLAN.md`, `docs/PH_COMPLIANCE.md`, `docs/SLO.md`, `docs/THREAT_MODEL.md`, `docs/adr/ADR-001-multi-tenant-pos-ledger.md` | `COMPLETED` |
| **4** | `/to-tickets` | `[PM]` + `[SD]` | `docs/TICKETS.md`, `docs/IMPLEMENTATION_PLAN.md` (`TKT-001..TKT-009`) | `READY FOR /implement` |
| **5** | `/implement TKT-00N` | `[DB]` `[SEC]` `[IR]` `[UX]` | Code + SQL migrations audited by Deterministic Compiler & `F-01..F-39` | `NEXT` |
| **6** | `/review` | `[SEC]` + `[SD]` | STRIDE + `BN-00` + PH RA 11900 gate review | `PENDING` |
| **7** | `/harden` | `[SEC]` + `[DB]` | RLS bypass tests (`F-26`), `P0001` immutability, 1-hr reservation race test | `PENDING` |
| **8** | `/research` | `[RS]` | Continuous DTI / RA 11900 banned product watchlist updates (`docs/PH_COMPLIANCE.md`) | `ACTIVE` |
| **—** | `/retro` | `[RS]` + Meta | Verified lessons staged via Utility Gate into `brain/06-raw/inbox.md` (`IR-10`) | `CONTINUOUS` |
