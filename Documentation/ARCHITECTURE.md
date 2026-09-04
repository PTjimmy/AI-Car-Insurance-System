# System Architecture

## AI-Based Car Insurance Claim Analysis and Damage Assessment System

> **Prototype notice:** This is an academic/minor-project prototype.
> Policy values (P001–P006), coverage percentages, deductibles, and claim limits
> are synthetic values from the RAG Policy Knowledge Base document.
> They are not real insurance products, legal terms, or actual insurer pricing.

---

## Overview

```
Customer
    │
    ▼
React Frontend (Vite + TypeScript)
    │  REST API calls (/api/v1/...)
    ▼
FastAPI Backend (Python 3.12)
    │
    ├── PostgreSQL (structured transactional data)
    │
    ├── ViT-B/16 AI Inference Service
    │   └── best_model.pth  (trained weights — not in Git)
    │
    └── Deterministic Claim Estimator
        └── Policy rules from PostgreSQL
```

---

## Two Separate Systems — Critical Distinction

There are two implementations in this repository that must NOT be confused:

### System 1 — Notebook Demo (`AI-ML/`)

| Component | Technology |
|---|---|
| Damage classification | ViT-B/16 (`torchvision`) |
| Policy retrieval | FAISS vector store + LangChain + sentence-transformers |
| Claim calculation | `estimate_claim()` in Cell 32 |
| Environment | Google Colab |
| Purpose | Academic demonstration of RAG-based policy retrieval |

The notebook demonstrates how FAISS and LangChain can retrieve relevant
policy rules from the PDF knowledge base and feed them into a claim calculation.

**The live backend does NOT use FAISS, LangChain, or any vector database.**

### System 2 — Live Web Application (`Backend/` + `Frontend/`)

| Component | Technology |
|---|---|
| Damage classification | Same ViT-B/16 model (loaded from `best_model.pth`) |
| Policy retrieval | PostgreSQL `policy_type` table (structured, validated) |
| Claim calculation | `Backend/app/services/claim_estimator.py` (deterministic) |
| Environment | FastAPI + React running locally |
| Purpose | Working prototype web application |

Policy rules are stored in the `policy_type` table with typed columns
(`minor_coverage_pct`, `moderate_coverage_pct`, `severe_coverage_pct`,
`deductible`, `max_claim`). The backend reads these values directly from
PostgreSQL — there is no LLM, no vector search, and no RAG retrieval
in the deployed application.

---

## Full Request Flow (Live Web Application)

```
1. Customer registers account
       ↓ POST /auth/register → email verification code sent
2. Customer verifies email
       ↓ POST /auth/verify-email → account activated
3. Customer logs in
       ↓ POST /auth/login → 2FA code sent to email
4. Customer verifies login code
       ↓ POST /auth/verify-login → JWT returned
5. Customer registers vehicle
       ↓ POST /customer/vehicles
       ↓ Backend auto-generates INS-VEH-YYYY-NNNNN (system reference ID)
6. Customer purchases policy
       ↓ POST /customer/policies
       ↓ Policy rules (coverage %, deductible, max_claim) stored in PostgreSQL
7. Customer submits claim
       ↓ POST /customer/claims  (claimed_amount = customer repair estimate)
8. Customer uploads damage image
       ↓ POST /customer/claims/{id}/images
       ↓ First image → ViT-B/16 inference → damage_severity + confidence_score
       ↓ policy_service.py → load policy rules from PostgreSQL
       ↓ claim_estimator.py → deterministic 8-step calculation
       ↓ ai_analysis row stored: AI fields + calculation fields (separated)
9. Admin assigns claim to officer
       ↓ POST /admin/claims/{id}/assign
10. Officer reviews claim
        ↓ GET /officer/claims/{id}
        ↓ Sees: damage severity (AI), confidence (AI), estimated claim (business rule)
        ↓ Sees: customer info, vehicle, policy, images, claim history
11. Officer decides
        ↓ PUT /officer/claims/{id}/status  →  Approved / Rejected / Evidence Requested
12. Customer sees result
        ↓ GET /customer/claims  →  final status + approved_amount
```

---

## Claim Calculation — Deterministic Formula

**Source:** RAG Policy Knowledge Base, section 5 (8-step formula).

```
Input A:  damage_severity       ← ViT-B/16 AI prediction (Minor/Moderate/Severe)
Input B:  claimed_amount        ← Customer-submitted repair estimate (Option B)
Input C:  policy rules          ← From PostgreSQL policy_type row

Step 3:   coverage_pct   = policy_type[damage_severity + '_coverage_pct']
Step 5:   gross_covered  = claimed_amount × (coverage_pct / 100)
Step 6:   preliminary    = gross_covered − deductible
Step 7:   preliminary    = max(preliminary, 0)
Step 8:   estimated_claim = min(preliminary, max_claim)
```

**Outputs stored in `ai_analysis`:**

| Field | Source | Description |
|---|---|---|
| `damage_severity` | AI (ViT) | "Minor", "Moderate", or "Severe" |
| `confidence_score` | AI (ViT) | Softmax probability 0.0–1.0 |
| `coverage_pct_applied` | Business rule | % from policy for that severity |
| `deductible_applied` | Business rule | Deductible subtracted |
| `estimated_claim_amount` | Business rule | Step 8 result |

**The AI model does NOT approve or reject claims.**
That decision is made exclusively by the Claims Officer.

---

## Field Labelling Convention

| Label | Meaning |
|---|---|
| "AI Prediction" | Output directly from the ViT-B/16 model |
| "Policy Calculation" | Deterministic result from claim_estimator.py |
| "Customer Claimed Amount" | claimed_amount entered by customer at submission |
| "Not specified in prototype" | annual_premium not documented in policy document |

---

## What Each Layer Owns

### PostgreSQL (structured transactional data)
- Users, customers, officers, vehicles
- Policy types and purchased policies
- Claims, claim images, AI analysis results, claim history
- Authentication state (verification codes, 2FA codes)

### ViT-B/16 (AI model)
- Classifies damage image → Minor / Moderate / Severe
- Returns confidence score
- Runs once per claim on the first uploaded image (Option B)
- Does NOT predict repair cost, coverage, or claim amount

### claim_estimator.py (deterministic business logic)
- Takes `claimed_amount` (customer) + `damage_severity` (AI) + policy rules (DB)
- Applies the 8-step formula
- Guaranteed deterministic — same inputs always produce same output
- Unit-tested in `Backend/tests/test_claim_estimator.py` (69 tests)

### FastAPI (API layer)
- Authentication and role-based access (CUSTOMER / CLAIM_OFFICER / ADMIN)
- Request validation, file upload, image serving
- Orchestrates the ViT → policy lookup → estimator pipeline

### React Frontend
- Displays data from the API — does NOT contain policy logic
- Clearly labels AI results vs business-rule results vs customer inputs
- Does NOT hard-code policy names, coverage percentages, or deductibles

---

## Authentication Flow

```
Register → Email verification code (6 digits, 15 min TTL)
         → Account activated

Login    → Password validated
         → 2FA login code sent to email (6 digits, 10 min TTL)
         → JWT returned on correct code

JWT      → Role-based route guards (CUSTOMER / CLAIM_OFFICER / ADMIN)
         → Token expires after 60 minutes (configurable in .env)
```

---

## Vehicle ID Generation

Vehicle reference IDs are auto-generated by the backend in the format:

```
INS-VEH-YYYY-NNNNN
Example: INS-VEH-2026-00003
```

This is an InsureAI system reference number only.
It is NOT an official government or RTO vehicle registration number.
Customers do not enter a registration number manually.

---

## Prototype Limitations

1. **AI model weights** (`best_model.pth`) are not included in the repository.
   Train using the notebook and place at `Backend/ai_model/best_model.pth`.

2. **Annual premium** for P001–P006 is `NULL` — the prototype document
   does not specify annual premiums. Displayed as "Not specified in prototype".

3. **fraud_score** and **risk_level** columns exist in `ai_analysis`
   for backward compatibility but are not populated. The system does not
   perform fraud detection.

4. **Policy values** (P001–P006) are synthetic. Do not use for real insurance.

5. **Email** requires Gmail App Password in `Backend/.env` (SMTP_USER, SMTP_PASSWORD).
   Without configuration, verification codes are printed to the server console.
