-- =============================================================
-- AI-Based Car Insurance Claim Analysis System
-- PostgreSQL Schema
-- =============================================================
-- SETUP INSTRUCTIONS:
--   1. Create the database:
--        createdb ai_car_insurance
--   2. Run this file:
--        psql -d ai_car_insurance -f ai_car_insurance_schema.sql
--   3. The schema will create all tables owned by the current
--      connected user — no hardcoded "postgres" role dependency.
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
-- Central authentication table. All three roles authenticate
-- through this table. customer_id and officer_id are nullable
-- foreign keys that link to the role-specific profile tables.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.users (
    user_id     bigint                      NOT NULL GENERATED ALWAYS AS IDENTITY
                    (SEQUENCE NAME public.users_user_id_seq START WITH 1 INCREMENT BY 1),
    email       character varying(100)      NOT NULL,
    password_hash character varying(255)    NOT NULL,
    role        public.user_role            NOT NULL DEFAULT 'CUSTOMER',
    is_active   boolean                     NOT NULL DEFAULT true,
    created_at  timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- These are set after the profile row is created
    customer_id bigint,
    officer_id  bigint,
    CONSTRAINT users_pkey PRIMARY KEY (user_id),
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
    CONSTRAINT customer_pkey PRIMARY KEY (customer_id),
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
    CONSTRAINT claim_officer_pkey PRIMARY KEY (officer_id),
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
    CONSTRAINT vehicle_pkey PRIMARY KEY (vehicle_id),
    CONSTRAINT vehicle_registration_number_key UNIQUE (registration_number)
);

-- =============================================================
-- TABLE: policy_type
-- =============================================================

CREATE TABLE IF NOT EXISTS public.policy_type (
    policy_type_id  bigint                      NOT NULL GENERATED ALWAYS AS IDENTITY
                        (SEQUENCE NAME public.policy_type_policy_type_id_seq START WITH 1 INCREMENT BY 1),
    policy_name     character varying(100)      NOT NULL,
    annual_premium  numeric(12,2)               NOT NULL,
    coverage_limit  numeric(12,2)               NOT NULL,
    description     text,
    is_active       boolean                     NOT NULL DEFAULT true,
    CONSTRAINT policy_type_pkey PRIMARY KEY (policy_type_id),
    CONSTRAINT policy_type_policy_name_key UNIQUE (policy_name)
);

-- =============================================================
-- TABLE: coverage_type
-- =============================================================

CREATE TABLE IF NOT EXISTS public.coverage_type (
    coverage_type_id bigint                     NOT NULL GENERATED ALWAYS AS IDENTITY
                         (SEQUENCE NAME public.coverage_type_coverage_type_id_seq START WITH 1 INCREMENT BY 1),
    coverage_name    character varying(100)     NOT NULL,
    description      text,
    is_active        boolean                    NOT NULL DEFAULT true,
    CONSTRAINT coverage_type_pkey PRIMARY KEY (coverage_type_id),
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
    CONSTRAINT policy_pkey PRIMARY KEY (policy_id),
    CONSTRAINT policy_policy_number_key UNIQUE (policy_number)
);

-- =============================================================
-- TABLE: claim
-- Added: assigned_officer_id, location, claim_type
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
    claimed_amount       numeric(12,2)               NOT NULL,
    approved_amount      numeric(12,2),
    status               public.claim_status         NOT NULL DEFAULT 'Pending',
    decision_remarks     text,
    created_at           timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT claim_pkey PRIMARY KEY (claim_id),
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
-- =============================================================

CREATE TABLE IF NOT EXISTS public.ai_analysis (
    analysis_id          bigint                      NOT NULL GENERATED ALWAYS AS IDENTITY
                             (SEQUENCE NAME public.ai_analysis_analysis_id_seq START WITH 1 INCREMENT BY 1),
    claim_id             bigint                      NOT NULL,
    damage_severity      character varying(50),
    confidence_score     numeric(5,4),
    estimated_repair_cost numeric(12,2),
    risk_level           character varying(30),
    fraud_score          numeric(5,4),
    model_version        character varying(50)       DEFAULT 'vit-b16-v1',
    analyzed_at          timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ai_analysis_pkey PRIMARY KEY (analysis_id),
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
-- =============================================================

-- users → customer
ALTER TABLE public.users
    ADD CONSTRAINT IF NOT EXISTS fk_users_customer
    FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id)
    ON DELETE SET NULL;

-- users → claim_officer
ALTER TABLE public.users
    ADD CONSTRAINT IF NOT EXISTS fk_users_officer
    FOREIGN KEY (officer_id) REFERENCES public.claim_officer(officer_id)
    ON DELETE SET NULL;

-- vehicle → customer
ALTER TABLE public.vehicle
    ADD CONSTRAINT IF NOT EXISTS fk_vehicle_customer
    FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id);

-- policy → vehicle
ALTER TABLE public.policy
    ADD CONSTRAINT IF NOT EXISTS fk_policy_vehicle
    FOREIGN KEY (vehicle_id) REFERENCES public.vehicle(vehicle_id);

-- policy → policy_type
ALTER TABLE public.policy
    ADD CONSTRAINT IF NOT EXISTS fk_policy_policy_type
    FOREIGN KEY (policy_type_id) REFERENCES public.policy_type(policy_type_id);

-- policy_coverage → policy_type
ALTER TABLE public.policy_coverage
    ADD CONSTRAINT IF NOT EXISTS fk_policy_coverage_policy_type
    FOREIGN KEY (policy_type_id) REFERENCES public.policy_type(policy_type_id);

-- policy_coverage → coverage_type
ALTER TABLE public.policy_coverage
    ADD CONSTRAINT IF NOT EXISTS fk_policy_coverage_coverage_type
    FOREIGN KEY (coverage_type_id) REFERENCES public.coverage_type(coverage_type_id);

-- claim → policy
ALTER TABLE public.claim
    ADD CONSTRAINT IF NOT EXISTS fk_claim_policy
    FOREIGN KEY (policy_id) REFERENCES public.policy(policy_id);

-- claim → claim_officer (assigned officer, nullable)
ALTER TABLE public.claim
    ADD CONSTRAINT IF NOT EXISTS fk_claim_assigned_officer
    FOREIGN KEY (assigned_officer_id) REFERENCES public.claim_officer(officer_id)
    ON DELETE SET NULL;

-- claim_image → claim
ALTER TABLE public.claim_image
    ADD CONSTRAINT IF NOT EXISTS fk_claim_image_claim
    FOREIGN KEY (claim_id) REFERENCES public.claim(claim_id);

-- ai_analysis → claim
ALTER TABLE public.ai_analysis
    ADD CONSTRAINT IF NOT EXISTS fk_ai_analysis_claim
    FOREIGN KEY (claim_id) REFERENCES public.claim(claim_id);

-- claim_history → claim
ALTER TABLE public.claim_history
    ADD CONSTRAINT IF NOT EXISTS fk_claim_history_claim
    FOREIGN KEY (claim_id) REFERENCES public.claim(claim_id);

-- claim_history → claim_officer
ALTER TABLE public.claim_history
    ADD CONSTRAINT IF NOT EXISTS fk_claim_history_officer
    FOREIGN KEY (officer_id) REFERENCES public.claim_officer(officer_id);

-- =============================================================
-- SEED DATA: policy types and coverage types
-- =============================================================

INSERT INTO public.policy_type (policy_name, annual_premium, coverage_limit, description, is_active)
VALUES
    ('Comprehensive Motor Insurance', 24500.00, 1000000.00, 'Full coverage including own damage, third party, and theft', true),
    ('Third Party Insurance',          8500.00,   500000.00, 'Covers third party liability only', true),
    ('Basic Own Damage',              14000.00,   750000.00, 'Covers own vehicle damage only', true)
ON CONFLICT (policy_name) DO NOTHING;

INSERT INTO public.coverage_type (coverage_name, description, is_active)
VALUES
    ('Own Damage',       'Covers damage to own vehicle', true),
    ('Third Party',      'Covers third party liability', true),
    ('Theft',            'Covers vehicle theft', true),
    ('Natural Disaster', 'Covers flood, earthquake, and other natural events', true),
    ('Personal Accident','Covers personal accident to driver', true)
ON CONFLICT (coverage_name) DO NOTHING;

-- =============================================================
-- END OF SCHEMA
-- =============================================================
