-- =============================================================
-- AI-Based Car Insurance Claim Analysis System
-- PostgreSQL Schema
-- =============================================================
-- SETUP INSTRUCTIONS:
--   1. Create the database:
--        createdb ai_car_insurance
--   2. Run this file:
--        psql -d ai_car_insurance -f ai_car_insurance_schema.sql
--   3. Schema is idempotent — safe to run on a fresh database.
--      All tables owned by the connected user (no postgres role dependency).
-- =============================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';
SET default_table_access_method = heap;

-- =============================================================
-- ENUM TYPES
-- =============================================================

DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('CUSTOMER', 'CLAIM_OFFICER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.claim_status AS ENUM (
        'Pending',
        'Under Review',
        'Evidence Requested',
        'Approved',
        'Rejected'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- =============================================================
-- TABLE: users
-- Central authentication table for all three roles.
-- customer_id / officer_id are set after the profile row is created.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.users (
    user_id               bigint                      NOT NULL GENERATED ALWAYS AS IDENTITY
                              (SEQUENCE NAME public.users_user_id_seq START WITH 1 INCREMENT BY 1),
    email                 character varying(100)      NOT NULL,
    password_hash         character varying(255)      NOT NULL,
    role                  public.user_role            NOT NULL DEFAULT 'CUSTOMER',
    is_active             boolean                     NOT NULL DEFAULT true,
    created_at            timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Email registration verification
    is_verified           boolean                     NOT NULL DEFAULT false,
    verification_code     character varying(6),
    code_expires_at       timestamp without time zone,
    -- Login 2FA
    login_code            character varying(6),
    login_code_expires_at timestamp without time zone,
    -- Role-specific profile links (nullable; set after profile row is created)
    customer_id           bigint,
    officer_id            bigint,
    CONSTRAINT users_pkey      PRIMARY KEY (user_id),
    CONSTRAINT users_email_key UNIQUE (email)
);

-- =============================================================
-- TABLE: customer
-- =============================================================

CREATE TABLE IF NOT EXISTS public.customer (
    customer_id   bigint                      NOT NULL GENERATED ALWAYS AS IDENTITY
                      (SEQUENCE NAME public.customer_customer_id_seq START WITH 1 INCREMENT BY 1),
    first_name    character varying(50)       NOT NULL,
    last_name     character varying(50)       NOT NULL,
    email         character varying(100)      NOT NULL,
    phone         character varying(20)       NOT NULL,
    address       text,
    created_at    timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status        character varying(20)       NOT NULL DEFAULT 'active',
    CONSTRAINT customer_pkey      PRIMARY KEY (customer_id),
    CONSTRAINT customer_email_key UNIQUE (email)
);

-- =============================================================
-- TABLE: claim_officer
-- =============================================================

CREATE TABLE IF NOT EXISTS public.claim_officer (
    officer_id  bigint                      NOT NULL GENERATED ALWAYS AS IDENTITY
                    (SEQUENCE NAME public.claim_officer_officer_id_seq START WITH 1 INCREMENT BY 1),
    first_name  character varying(50)       NOT NULL,
    last_name   character varying(50)       NOT NULL,
    email       character varying(100)      NOT NULL,
    phone       character varying(20),
    status      character varying(20)       NOT NULL DEFAULT 'active',
    CONSTRAINT claim_officer_pkey      PRIMARY KEY (officer_id),
    CONSTRAINT claim_officer_email_key UNIQUE (email)
);

-- =============================================================
-- TABLE: vehicle
-- =============================================================

CREATE TABLE IF NOT EXISTS public.vehicle (
    vehicle_id          bigint                      NOT NULL GENERATED ALWAYS AS IDENTITY
                            (SEQUENCE NAME public.vehicle_vehicle_id_seq START WITH 1 INCREMENT BY 1),
    customer_id         bigint                      NOT NULL,
    registration_number character varying(20)       NOT NULL,
    make                character varying(50)       NOT NULL,
    model               character varying(50)       NOT NULL,
    manufacturing_year  smallint                    NOT NULL,
    vehicle_value       numeric(12,2)               NOT NULL,
    created_at          timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vehicle_pkey                    PRIMARY KEY (vehicle_id),
    CONSTRAINT vehicle_registration_number_key UNIQUE (registration_number)
);

-- =============================================================
-- TABLE: policy_type
-- P001-P006 from RAG Policy Knowledge Base (academic prototype).
-- Per-severity coverage percentages, deductible, and max_claim
-- are stored here so the backend — not the frontend — is the
-- authoritative source for all policy calculations.
-- annual_premium is NULL for P001-P006 because the prototype
-- document does not specify annual premiums; do not invent values.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.policy_type (
    policy_type_id        bigint                  NOT NULL GENERATED ALWAYS AS IDENTITY
                              (SEQUENCE NAME public.policy_type_policy_type_id_seq START WITH 1 INCREMENT BY 1),
    policy_code           character varying(10),
    policy_name           character varying(100)  NOT NULL,
    -- annual_premium: NULL for prototype policies where no premium is documented.
    -- Legacy policies carry their original values.
    annual_premium        numeric(12,2),
    coverage_limit        numeric(12,2)            NOT NULL,
    -- Per-severity coverage percentages from policy document
    minor_coverage_pct    numeric(5,2),
    moderate_coverage_pct numeric(5,2),
    severe_coverage_pct   numeric(5,2),
    deductible            numeric(12,2),
    max_claim             numeric(12,2),
    description           text,
    is_active             boolean                 NOT NULL DEFAULT true,
    CONSTRAINT policy_type_pkey           PRIMARY KEY (policy_type_id),
    CONSTRAINT policy_type_policy_name_key UNIQUE (policy_name)
);

-- =============================================================
-- TABLE: coverage_type
-- =============================================================

CREATE TABLE IF NOT EXISTS public.coverage_type (
    coverage_type_id bigint                 NOT NULL GENERATED ALWAYS AS IDENTITY
                         (SEQUENCE NAME public.coverage_type_coverage_type_id_seq START WITH 1 INCREMENT BY 1),
    coverage_name    character varying(100) NOT NULL,
    description      text,
    is_active        boolean                NOT NULL DEFAULT true,
    CONSTRAINT coverage_type_pkey           PRIMARY KEY (coverage_type_id),
    CONSTRAINT coverage_type_coverage_name_key UNIQUE (coverage_name)
);

-- =============================================================
-- TABLE: policy_coverage  (M:N between policy_type and coverage_type)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.policy_coverage (
    policy_type_id   bigint NOT NULL,
    coverage_type_id bigint NOT NULL,
    CONSTRAINT pk_policy_coverage PRIMARY KEY (policy_type_id, coverage_type_id)
);

-- =============================================================
-- TABLE: policy
-- =============================================================

CREATE TABLE IF NOT EXISTS public.policy (
    policy_id      bigint                      NOT NULL GENERATED ALWAYS AS IDENTITY
                       (SEQUENCE NAME public.policy_policy_id_seq START WITH 1 INCREMENT BY 1),
    policy_number  character varying(30)       NOT NULL,
    vehicle_id     bigint                      NOT NULL,
    policy_type_id bigint                      NOT NULL,
    start_date     date                        NOT NULL,
    end_date       date                        NOT NULL,
    status         character varying(20)       NOT NULL DEFAULT 'active',
    created_at     timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT policy_pkey             PRIMARY KEY (policy_id),
    CONSTRAINT policy_policy_number_key UNIQUE (policy_number)
);

-- =============================================================
-- TABLE: claim
-- =============================================================

CREATE TABLE IF NOT EXISTS public.claim (
    claim_id             bigint                      NOT NULL GENERATED ALWAYS AS IDENTITY
                             (SEQUENCE NAME public.claim_claim_id_seq START WITH 1 INCREMENT BY 1),
    claim_number         character varying(30)       NOT NULL,
    policy_id            bigint                      NOT NULL,
    assigned_officer_id  bigint,
    accident_date        date                        NOT NULL,
    claim_date           timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    claim_type           character varying(50)       NOT NULL DEFAULT 'Vehicle Damage',
    location             character varying(200),
    description          text                        NOT NULL,
    -- claimed_amount: customer-submitted repair cost estimate (Option B input).
    -- Labelled in UI as "Customer Claimed Amount". NOT an AI prediction.
    claimed_amount       numeric(12,2)               NOT NULL,
    approved_amount      numeric(12,2),
    status               public.claim_status         NOT NULL DEFAULT 'Pending',
    decision_remarks     text,
    created_at           timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT claim_pkey             PRIMARY KEY (claim_id),
    CONSTRAINT claim_claim_number_key UNIQUE (claim_number)
);

-- =============================================================
-- TABLE: claim_image
-- =============================================================

CREATE TABLE IF NOT EXISTS public.claim_image (
    image_id    bigint                      NOT NULL GENERATED ALWAYS AS IDENTITY
                    (SEQUENCE NAME public.claim_image_image_id_seq START WITH 1 INCREMENT BY 1),
    claim_id    bigint                      NOT NULL,
    file_path   text                        NOT NULL,
    image_type  character varying(50)       NOT NULL DEFAULT 'damage',
    uploaded_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT claim_image_pkey PRIMARY KEY (image_id)
);

-- =============================================================
-- TABLE: ai_analysis
--
-- Field separation (see Backend/app/services/ for implementation):
--
--   AI prediction fields — populated by ViT inference (ai_inference.py):
--     damage_severity    : "Minor" | "Moderate" | "Severe"
--     confidence_score   : softmax probability 0.0-1.0
--     model_version      : checkpoint identifier
--     analyzed_at        : timestamp of inference
--
--   Business-rule fields — populated by claim_estimator.py:
--     coverage_pct_applied   : % selected for the predicted severity
--     deductible_applied     : deductible subtracted
--     estimated_claim_amount : final after floor + max_claim cap
--
--   Image strategy (Option B):
--     is_primary_image = true  : FIRST uploaded image, analysed by ViT.
--     is_primary_image = false : future use; currently always true.
--     Subsequent images are stored in claim_image as supporting evidence
--     and are NOT re-analysed. One ai_analysis row per claim.
--
--   Legacy fields — retained for backward compatibility only.
--     NOT actively populated by the current system.
--     estimated_repair_cost : was a hard-coded business rule, not AI output
--     risk_level            : no documented business rule implemented
--     fraud_score           : no fraud model; system does NOT perform
--                             fraud detection
-- =============================================================

CREATE TABLE IF NOT EXISTS public.ai_analysis (
    analysis_id             bigint                      NOT NULL GENERATED ALWAYS AS IDENTITY
                                (SEQUENCE NAME public.ai_analysis_analysis_id_seq START WITH 1 INCREMENT BY 1),
    claim_id                bigint                      NOT NULL,
    -- AI prediction fields
    damage_severity         character varying(50),
    confidence_score        numeric(5,4),
    model_version           character varying(50)       DEFAULT 'vit-b16-v1',
    analyzed_at             timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    -- Business-rule calculation fields
    coverage_pct_applied    numeric(5,2),
    deductible_applied      numeric(12,2),
    estimated_claim_amount  numeric(12,2),
    -- Image strategy marker
    is_primary_image        boolean                     NOT NULL DEFAULT true,
    -- Legacy fields (backward compat; not actively populated)
    estimated_repair_cost   numeric(12,2),
    risk_level              character varying(30),
    fraud_score             numeric(5,4),
    CONSTRAINT ai_analysis_pkey         PRIMARY KEY (analysis_id),
    CONSTRAINT ai_analysis_claim_id_key UNIQUE (claim_id)
);

-- =============================================================
-- TABLE: claim_history
-- =============================================================

CREATE TABLE IF NOT EXISTS public.claim_history (
    history_id  bigint                      NOT NULL GENERATED ALWAYS AS IDENTITY
                    (SEQUENCE NAME public.claim_history_history_id_seq START WITH 1 INCREMENT BY 1),
    claim_id    bigint                      NOT NULL,
    officer_id  bigint                      NOT NULL,
    status      public.claim_status         NOT NULL,
    remarks     text,
    changed_at  timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT claim_history_pkey PRIMARY KEY (history_id)
);

-- =============================================================
-- FOREIGN KEY CONSTRAINTS
-- NOTE: ALTER TABLE ... ADD CONSTRAINT IF NOT EXISTS is not valid
-- standard PostgreSQL syntax. The constraints are defined inline
-- in CREATE TABLE where possible; remaining FKs that cross tables
-- are added here using DO blocks so they are idempotent.
-- =============================================================

DO $$ BEGIN
    ALTER TABLE public.users
        ADD CONSTRAINT fk_users_customer
        FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id)
        ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.users
        ADD CONSTRAINT fk_users_officer
        FOREIGN KEY (officer_id) REFERENCES public.claim_officer(officer_id)
        ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.vehicle
        ADD CONSTRAINT fk_vehicle_customer
        FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.policy
        ADD CONSTRAINT fk_policy_vehicle
        FOREIGN KEY (vehicle_id) REFERENCES public.vehicle(vehicle_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.policy
        ADD CONSTRAINT fk_policy_policy_type
        FOREIGN KEY (policy_type_id) REFERENCES public.policy_type(policy_type_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.policy_coverage
        ADD CONSTRAINT fk_policy_coverage_policy_type
        FOREIGN KEY (policy_type_id) REFERENCES public.policy_type(policy_type_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.policy_coverage
        ADD CONSTRAINT fk_policy_coverage_coverage_type
        FOREIGN KEY (coverage_type_id) REFERENCES public.coverage_type(coverage_type_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.claim
        ADD CONSTRAINT fk_claim_policy
        FOREIGN KEY (policy_id) REFERENCES public.policy(policy_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.claim
        ADD CONSTRAINT fk_claim_assigned_officer
        FOREIGN KEY (assigned_officer_id) REFERENCES public.claim_officer(officer_id)
        ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.claim_image
        ADD CONSTRAINT fk_claim_image_claim
        FOREIGN KEY (claim_id) REFERENCES public.claim(claim_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.ai_analysis
        ADD CONSTRAINT fk_ai_analysis_claim
        FOREIGN KEY (claim_id) REFERENCES public.claim(claim_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.claim_history
        ADD CONSTRAINT fk_claim_history_claim
        FOREIGN KEY (claim_id) REFERENCES public.claim(claim_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.claim_history
        ADD CONSTRAINT fk_claim_history_officer
        FOREIGN KEY (officer_id) REFERENCES public.claim_officer(officer_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- =============================================================
-- SEED DATA: P001-P006 from RAG Policy Knowledge Base
-- IMPORTANT: Synthetic policies for an academic/prototype project.
-- These are NOT real insurance products, legal terms, or actual
-- insurer pricing. annual_premium is NULL because the document
-- does not specify annual premiums — no values are invented.
-- =============================================================

INSERT INTO public.policy_type (
    policy_code, policy_name,
    annual_premium, coverage_limit,
    minor_coverage_pct, moderate_coverage_pct, severe_coverage_pct,
    deductible, max_claim,
    description, is_active
)
VALUES
  ('P001', 'Basic Comprehensive',
   NULL, 100000.00,
   80.00, 75.00, 70.00, 5000.00, 100000.00,
   'Covers accidental own-vehicle damage. Minor: 80%, Moderate: 75%, Severe: 70%. '
   'Deductible ₹5,000. Maximum claim ₹1,00,000. '
   'Cosmetic damage unrelated to an accident is excluded. '
   '[Prototype — synthetic policy, not a real insurance product]',
   true),

  ('P002', 'Standard Comprehensive',
   NULL, 150000.00,
   85.00, 80.00, 75.00, 5000.00, 150000.00,
   'Covers accidental damage. Minor: 85%, Moderate: 80%, Severe: 75%. '
   'Deductible ₹5,000. Maximum claim ₹1,50,000. '
   'Pre-existing and intentional damage excluded. '
   '[Prototype — synthetic policy, not a real insurance product]',
   true),

  ('P003', 'Premium Comprehensive',
   NULL, 300000.00,
   90.00, 90.00, 85.00, 2000.00, 300000.00,
   'Higher coverage for accidental damage. Minor: 90%, Moderate: 90%, Severe: 85%. '
   'Deductible ₹2,000. Maximum claim ₹3,00,000. '
   '[Prototype — synthetic policy, not a real insurance product]',
   true),

  ('P004', 'Zero Depreciation',
   NULL, 500000.00,
   95.00, 95.00, 90.00, 2000.00, 500000.00,
   'Minor/Moderate: 95%, Severe: 90%. Deductible ₹2,000. Maximum claim ₹5,00,000. '
   '[Prototype — synthetic policy, not a real insurance product]',
   true),

  ('P005', 'Budget Own-Damage',
   NULL, 100000.00,
   75.00, 70.00, 65.00, 7500.00, 100000.00,
   'Lower-cost own-damage. Minor: 75%, Moderate: 70%, Severe: 65%. '
   'Deductible ₹7,500. Maximum claim ₹1,00,000. '
   '[Prototype — synthetic policy, not a real insurance product]',
   true),

  ('P006', 'Enhanced Protection',
   NULL, 400000.00,
   90.00, 88.00, 85.00, 3000.00, 400000.00,
   'Extended accidental-damage coverage. Minor: 90%, Moderate: 88%, Severe: 85%. '
   'Deductible ₹3,000. Maximum claim ₹4,00,000. '
   '[Prototype — synthetic policy, not a real insurance product]',
   true)
ON CONFLICT (policy_name) DO NOTHING;

-- =============================================================
-- END OF SCHEMA
-- =============================================================
