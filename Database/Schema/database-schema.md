# Database Schema

## Project
AI-Based Car Insurance Claim Analysis and Damage Assessment System

## Status
Current — matches live PostgreSQL database and SQLAlchemy models.

---

## Entities

| Entity | Table | Purpose |
|---|---|---|
| User | `users` | Authentication for all roles (CUSTOMER, CLAIM_OFFICER, ADMIN) |
| Customer | `customer` | Customer personal profile |
| ClaimOfficer | `claim_officer` | Officer profile |
| Vehicle | `vehicle` | Customer-registered vehicle |
| PolicyType | `policy_type` | Insurance plan catalogue (P001–P006) |
| CoverageType | `coverage_type` | Coverage name catalogue |
| PolicyCoverage | `policy_coverage` | M:N join between policy_type and coverage_type |
| Policy | `policy` | A customer's purchased policy for a vehicle |
| Claim | `claim` | Submitted insurance claim |
| ClaimImage | `claim_image` | Uploaded damage images |
| AIAnalysis | `ai_analysis` | ViT prediction + deterministic claim calculation |
| ClaimHistory | `claim_history` | Status change audit trail |

---

## Key Design Decisions

### Users table
Central authentication. All three roles log in through `users`.
`customer_id` and `officer_id` are nullable FKs set after the profile row is created.
Includes email verification (`is_verified`, `verification_code`, `code_expires_at`)
and login 2FA (`login_code`, `login_code_expires_at`).

### policy_type — new fields (P001–P006 from RAG Policy Knowledge Base)
- `policy_code` — P001–P006 identifier
- `minor_coverage_pct`, `moderate_coverage_pct`, `severe_coverage_pct` — coverage % per severity
- `deductible` — amount subtracted after coverage applied
- `max_claim` — maximum payable claim amount (Step 8 of calculation)
- `annual_premium` — nullable; not specified in the prototype document for P001–P006
- `coverage_limit` — retained for legacy display only; **not used as a validation cap**

### claim — claimed_amount
`claimed_amount` is the customer-submitted repair estimate.
This is the Option B repair-cost input for the claim calculation.
It is labelled "Customer Claimed Amount" in the UI — not an AI prediction.

### ai_analysis — field separation
**AI prediction fields** (populated by ViT inference service):
- `damage_severity` — "Minor" | "Moderate" | "Severe"
- `confidence_score` — softmax probability 0.0–1.0
- `model_version`, `analyzed_at`

**Business-rule calculation fields** (populated by `claim_estimator.py`):
- `coverage_pct_applied` — % selected from policy for predicted severity
- `deductible_applied` — deductible subtracted
- `estimated_claim_amount` — final after floor + max_claim cap

**Image strategy marker**:
- `is_primary_image` — always True (one `ai_analysis` row per claim, Option B)

**Legacy fields** — retained for backward compatibility only, **not actively populated**:
- `estimated_repair_cost` — was a hard-coded constant, not an AI output
- `risk_level` — no documented business rule; system does NOT perform risk prediction
- `fraud_score` — no fraud model; system does NOT perform fraud detection

---

## Main Relationships

| Relationship | Type | Description |
|---|---|---|
| Customer → Vehicle | 1:M | One customer can own multiple vehicles |
| Vehicle → Policy | 1:M | One vehicle can have multiple policies (only one active at a time) |
| PolicyType → Policy | 1:M | A policy type can apply to many purchased policies |
| PolicyType ↔ CoverageType | M:N via policy_coverage | Coverage names associated with a plan |
| Policy → Claim | 1:M | One policy can have multiple claims |
| Claim → ClaimImage | 1:M | One claim can have multiple damage images |
| Claim → AIAnalysis | 1:1 | One AI analysis result per claim |
| Claim → ClaimHistory | 1:M | History of status changes |
| ClaimOfficer → ClaimHistory | 1:M | Officer who made each status change |
| ClaimOfficer → Claim | 1:M | Officer assigned to a claim (nullable FK) |

---

## Claim Calculation Formula

Source: RAG Policy Knowledge Base (academic prototype document).

```
Step 1: ViT predicts damage_severity (Minor/Moderate/Severe)
Step 2: Retrieve policy_type row for the claim's policy
Step 3: Select coverage_pct for that severity from policy_type
Step 4: Use claimed_amount as repair_cost (Option B — customer submitted)
Step 5: gross_covered = claimed_amount × (coverage_pct / 100)
Step 6: preliminary   = gross_covered − deductible
Step 7: preliminary   = max(preliminary, 0)
Step 8: estimated_claim_amount = min(preliminary, max_claim)
```

The final approval/rejection decision is made by the Claims Officer, not the AI.

---

## Notes

- All tables use BIGINT GENERATED ALWAYS AS IDENTITY primary keys.
- The schema is idempotent (safe to run on a fresh database).
- Foreign key constraints use `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$` for idempotency.
- Prototype policies (P001–P006) are synthetic and not real insurance products.
