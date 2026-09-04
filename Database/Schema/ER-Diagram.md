# ER Diagram

> **Status:** Current — matches live PostgreSQL database and SQLAlchemy models.
>
> Prototype: AI-Based Car Insurance Claim Analysis and Damage Assessment System.
> Policy values (P001–P006) are synthetic and created for an academic prototype.

```mermaid
erDiagram

    USERS ||--o| CUSTOMER       : "links to (customer_id)"
    USERS ||--o| CLAIM_OFFICER  : "links to (officer_id)"
    CUSTOMER ||--o{ VEHICLE     : owns
    VEHICLE  ||--o{ POLICY      : has
    POLICY_TYPE ||--o{ POLICY   : defines
    POLICY_TYPE ||--o{ POLICY_COVERAGE : includes
    COVERAGE_TYPE ||--o{ POLICY_COVERAGE : provides
    POLICY  ||--o{ CLAIM        : contains
    CLAIM   ||--o{ CLAIM_IMAGE  : has
    CLAIM   ||--o| AI_ANALYSIS  : "receives (1:1)"
    CLAIM   ||--o{ CLAIM_HISTORY : records
    CLAIM_OFFICER ||--o{ CLAIM_HISTORY : manages
    CLAIM_OFFICER ||--o{ CLAIM : "assigned to"


    USERS {
        bigint  user_id         PK
        varchar email           UK
        varchar password_hash
        enum    role            "CUSTOMER | CLAIM_OFFICER | ADMIN"
        boolean is_active
        timestamp created_at
        boolean is_verified
        varchar verification_code
        timestamp code_expires_at
        varchar login_code
        timestamp login_code_expires_at
        bigint  customer_id     FK "nullable"
        bigint  officer_id      FK "nullable"
    }


    CUSTOMER {
        bigint  customer_id     PK
        varchar first_name
        varchar last_name
        varchar email           UK
        varchar phone
        text    address
        timestamp created_at
        varchar status
    }


    CLAIM_OFFICER {
        bigint  officer_id      PK
        varchar first_name
        varchar last_name
        varchar email           UK
        varchar phone
        varchar status
    }


    VEHICLE {
        bigint  vehicle_id          PK
        bigint  customer_id         FK
        varchar registration_number UK
        varchar make
        varchar model
        smallint manufacturing_year
        decimal vehicle_value
        timestamp created_at
    }


    POLICY_TYPE {
        bigint  policy_type_id      PK
        varchar policy_code         "P001-P006"
        varchar policy_name         UK
        decimal annual_premium      "NULL for P001-P006 (not in doc)"
        decimal coverage_limit      "legacy display only"
        decimal minor_coverage_pct  "% covered for Minor damage"
        decimal moderate_coverage_pct "% covered for Moderate damage"
        decimal severe_coverage_pct "% covered for Severe damage"
        decimal deductible          "subtracted after coverage"
        decimal max_claim           "Step 8 cap — actual claim ceiling"
        text    description
        boolean is_active
    }


    COVERAGE_TYPE {
        bigint  coverage_type_id    PK
        varchar coverage_name       UK
        text    description
        boolean is_active
    }


    POLICY_COVERAGE {
        bigint  policy_type_id      PK FK
        bigint  coverage_type_id    PK FK
    }


    POLICY {
        bigint  policy_id       PK
        varchar policy_number   UK
        bigint  vehicle_id      FK
        bigint  policy_type_id  FK
        date    start_date
        date    end_date
        varchar status
        timestamp created_at
    }


    CLAIM {
        bigint  claim_id            PK
        varchar claim_number        UK
        bigint  policy_id           FK
        bigint  assigned_officer_id FK "nullable"
        date    accident_date
        timestamp claim_date
        varchar claim_type
        varchar location
        text    description
        decimal claimed_amount      "Customer repair estimate (Option B input)"
        decimal approved_amount     "Set by officer on approval"
        enum    status              "Pending | Under Review | Evidence Requested | Approved | Rejected"
        text    decision_remarks
        timestamp created_at
    }


    CLAIM_IMAGE {
        bigint  image_id        PK
        bigint  claim_id        FK
        text    file_path
        varchar image_type
        timestamp uploaded_at
    }


    AI_ANALYSIS {
        bigint  analysis_id             PK
        bigint  claim_id                FK UK
        varchar damage_severity         "AI: Minor | Moderate | Severe"
        decimal confidence_score        "AI: softmax probability 0.0-1.0"
        varchar model_version           "AI: checkpoint identifier"
        timestamp analyzed_at
        decimal coverage_pct_applied    "Calc: % from policy for severity"
        decimal deductible_applied      "Calc: deductible subtracted"
        decimal estimated_claim_amount  "Calc: Step 8 result"
        boolean is_primary_image        "Always true — Option B (first image only)"
        decimal estimated_repair_cost   "LEGACY — not populated (was hard-coded)"
        varchar risk_level              "LEGACY — not populated (no rule defined)"
        decimal fraud_score             "LEGACY — not populated (no fraud model)"
    }


    CLAIM_HISTORY {
        bigint  history_id  PK
        bigint  claim_id    FK
        bigint  officer_id  FK
        enum    status
        text    remarks
        timestamp changed_at
    }
```

---

## AI Analysis Field Notes

| Field | Type | Source | Description |
|---|---|---|---|
| `damage_severity` | AI Prediction | ViT-B/16 model | "Minor", "Moderate", or "Severe" |
| `confidence_score` | AI Prediction | ViT-B/16 model | Softmax probability 0.0–1.0 |
| `coverage_pct_applied` | Business Rule | `claim_estimator.py` | Coverage % selected for predicted severity |
| `deductible_applied` | Business Rule | `claim_estimator.py` | Deductible amount subtracted |
| `estimated_claim_amount` | Business Rule | `claim_estimator.py` | Final claim after all steps |
| `estimated_repair_cost` | **LEGACY** | Not populated | Was a hard-coded constant, not AI |
| `risk_level` | **LEGACY** | Not populated | No business rule defined |
| `fraud_score` | **LEGACY** | Not populated | No fraud model — system does NOT detect fraud |

---

## Claim Calculation Workflow

```
Customer submits claim (claimed_amount = repair estimate)
    ↓
Customer uploads first damage image
    ↓ (at upload time — not at officer assignment)
ViT-B/16 model → damage_severity + confidence_score
    ↓
policy_service.py → load policy rules (coverage_pct, deductible, max_claim)
    ↓
claim_estimator.py →
    gross  = claimed_amount × (coverage_pct / 100)
    prelim = gross − deductible          (≥ 0)
    final  = min(prelim, max_claim)
    ↓
Store in ai_analysis: all AI fields + all calculation fields
    ↓
Admin assigns claim to officer
    ↓
Officer reviews: severity, confidence, estimated claim, images, history
    ↓
Officer: Approve / Reject / Request Evidence
    ↓
Customer sees final status
```
