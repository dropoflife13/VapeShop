---
version: 1.0
status: approved
owner: RS
---
# Philippine Regulatory Compliance & Banned Products Baseline (`RS-01..RS-06`)

> Grounded in **Republic Act No. 11900** (*Vaporized Nicotine and Non-Nicotine Products Regulation Act*) and **DTI Department Administrative Orders (DAO No. 22-06, DAO No. 24-02, DAO No. 24-04, DAO No. 24-11)**.

## 1. Accepted Philippine Legal Government IDs (18+ Verification)
Under RA 11900, retailers (in-store and online/delivery) must verify that buyers are **18 years old or above** using a valid government-issued photo ID showing date of birth. The app displays and records one of the following `legal_id_type` enum values:
1. `philsys_national_id` — **Philippine Identification System (PhilSys / National ID)**
2. `passport` — **Philippine Passport**
3. `drivers_license` — **LTO Driver's License**
4. `umid_sss_gsis` — **UMID / SSS / GSIS ID**
5. `prc_id` — **PRC Professional ID**
6. `postal_id` — **Philippine Postal ID**
7. `voters_id` — **COMELEC Voter's ID**
8. `barangay_id` — **Barangay ID** (with photo & birthdate)
9. `senior_citizen_id` — **OSCA Senior Citizen ID**
10. `pwd_id` — **PWD ID**

*(Note: Store **ID type + verification timestamp + verified_by_user_id** only; do not store raw ID card photos/numbers unnecessarily to minimize PII blast radius per `PM-08` / `SEC-14`.)*

## 2. Illegal / Banned Vape Products Watchlist (`ph_banned_products`)
Maintained by `system_admin` and enforced as a pre-listing & pre-checkout gate (`BR-06`):
1. **DTI FTEB Suspended / Banned Brands & Lines:**
   - **Flava** (Flava Corporation — including suspended *Flava* and *ROMIO* lines cited by DTI FTEB for RA 11900 §12 violations and uncertified imports).
   - Any uncertified brand/model lacking valid **DTI Philippine Standard (PS) Licensing Mark** (note: DAO 24-11 phased out old ICC marks in favor of strict PS Licensing + DTI-OSMV registration).
2. **Prohibited Flavor Descriptors (RA 11900 §12 / DAO 24-04):**
   - Products marketed, labeled, or named with descriptors appealing to minors: **fruits, candy brands, desserts, or cartoon characters**.
3. **Illicit / Untaxed Inventory:**
   - Products lacking **BIR Fiscal / Excise Stamps** or technical toxicological/batch filings required under **DAO 24-02**.
