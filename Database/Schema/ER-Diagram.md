# ER Diagram — Draft

> **Status:** Database design in progress.
>
> This diagram represents the current proposed database structure. Attributes and relationships may change during database design review and AI/ML integration.

```mermaid
erDiagram

    CUSTOMER ||--o{ VEHICLE : owns
    VEHICLE ||--o{ POLICY : has
    POLICY_TYPE ||--o{ POLICY : defines
    POLICY_TYPE ||--o{ POLICY_COVERAGE : includes
    COVERAGE_TYPE ||--o{ POLICY_COVERAGE : provides
    POLICY ||--o{ CLAIM : contains
    CLAIM ||--o{ CLAIM_IMAGE : has
    CLAIM ||--|| AI_ANALYSIS : receives
    CLAIM ||--o{ CLAIM_HISTORY : records
    CLAIM_OFFICER ||--o{ CLAIM_HISTORY : manages


    CUSTOMER {
        bigint customer_id PK
        varchar first_name
        varchar last_name
        varchar email UK
        varchar phone
        varchar password_hash
        text address
        timestamp created_at
        varchar status
    }

    VEHICLE {
        bigint vehicle_id PK
        bigint customer_id FK
        varchar registration_number UK
        varchar make
        varchar model
        smallint manufacturing_year
        decimal vehicle_value
        timestamp created_at
    }

    POLICY_TYPE {
        bigint policy_type_id PK
        varchar policy_name UK
        decimal annual_premium
        decimal coverage_limit
        text description
        boolean is_active
    }

    COVERAGE_TYPE {
        bigint coverage_type_id PK
        varchar coverage_name UK
        text description
        boolean is_active
    }

    POLICY_COVERAGE {
        bigint policy_type_id PK, FK
        bigint coverage_type_id PK, FK
    }

    POLICY {
        bigint policy_id PK
        varchar policy_number UK
        bigint vehicle_id FK
        bigint policy_type_id FK
        date start_date
        date end_date
        varchar status
        timestamp created_at
    }

    CLAIM {
        bigint claim_id PK
        varchar claim_number UK
        bigint policy_id FK
        date accident_date
        timestamp claim_date
        text description
        decimal claimed_amount
        varchar status
        timestamp created_at
    }

    CLAIM_IMAGE {
        bigint image_id PK
        bigint claim_id FK
        text file_path
        varchar image_type
        timestamp uploaded_at
    }

    AI_ANALYSIS {
        bigint analysis_id PK
        bigint claim_id FK
        varchar damage_severity
        decimal confidence_score
        decimal estimated_repair_cost
        varchar risk_level
        varchar model_version
        timestamp analyzed_at
    }

    CLAIM_HISTORY {
        bigint history_id PK
        bigint claim_id FK
        bigint officer_id FK
        varchar status
        text remarks
        timestamp changed_at
    }

    CLAIM_OFFICER {
        bigint officer_id PK
        varchar first_name
        varchar last_name
        varchar email UK
        varchar phone
        varchar status
    }
```
