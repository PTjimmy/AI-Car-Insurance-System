-- =============================================================
-- Migration 001: Upgrade existing database to P001-P006 schema
-- =============================================================
--
-- Purpose:
--   Upgrades a database that was created from an earlier version
--   of the schema (before the P001-P006 policy system) to the
--   current schema used by the live application.
--
-- Safe to run on:
--   - A database that has never had these columns (fresh upgrade)
--   - A database that has already been partially migrated
--     (all steps are idempotent — they skip if already done)
--
-- DO NOT run on a fresh empty database.
-- For a fresh install use: Database/ai_car_insurance_schema.sql
--
-- Changes applied:
--   1. users       — add email verification + login 2FA columns
--   2. policy_type — make annual_premium nullable; add policy_code,
--                    per-severity coverage %, deductible, max_claim
--   3. ai_analysis — add claim calculation fields + is_primary_image;
--                    reorder columns for clarity (comment only)
--   4. vehicle     — widen registration_number to VARCHAR(30) for
--                    system-generated INS-VEH-YYYY-NNNNN IDs
--   5. claim       — add claim_type and location columns
--   6. Seed P001-P006 policy types (idempotent)
--   7. Deactivate old placeholder policy types
--   8. Backfill legacy policy types with coverage data
--
-- Run with:
--   psql -d ai_car_insurance -f Database/migrations/001_upgrade_to_p001_p006_schema.sql
--
-- =============================================================

BEGIN;

-- =============================================================
-- 1. users — email verification + login 2FA columns
-- =============================================================

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS is_verified           boolean                     NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS verification_code     character varying(6),
    ADD COLUMN IF NOT EXISTS code_expires_at       timestamp without time zone,
    ADD COLUMN IF NOT EXISTS login_code            character varying(6),
    ADD COLUMN IF NOT EXISTS login_code_expires_at timestamp without time zone;

-- Mark all existing accounts as pre-verified so they can still log in
-- after the migration without needing to go through email verification.
UPDATE public.users
   SET is_verified = true
 WHERE is_verified = false;

-- =============================================================
-- 2. policy_type — P001-P006 claim calculation fields
-- =============================================================

-- Make annual_premium nullable — prototype policies (P001-P006) do not
-- specify annual premiums in the policy document. Do not invent values.
ALTER TABLE public.policy_type
    ALTER COLUMN annual_premium DROP NOT NULL;

ALTER TABLE public.policy_type
    ADD COLUMN IF NOT EXISTS policy_code           character varying(10),
    ADD COLUMN IF NOT EXISTS minor_coverage_pct    numeric(5,2),
    ADD COLUMN IF NOT EXISTS moderate_coverage_pct numeric(5,2),
    ADD COLUMN IF NOT EXISTS severe_coverage_pct   numeric(5,2),
    ADD COLUMN IF NOT EXISTS deductible            numeric(12,2),
    ADD COLUMN IF NOT EXISTS max_claim             numeric(12,2);

-- =============================================================
-- 3. ai_analysis — claim calculation + image strategy fields
-- =============================================================

ALTER TABLE public.ai_analysis
    ADD COLUMN IF NOT EXISTS coverage_pct_applied   numeric(5,2),
    ADD COLUMN IF NOT EXISTS deductible_applied     numeric(12,2),
    ADD COLUMN IF NOT EXISTS estimated_claim_amount numeric(12,2),
    ADD COLUMN IF NOT EXISTS is_primary_image       boolean NOT NULL DEFAULT true;

-- =============================================================
-- 4. vehicle — widen registration_number for system-generated IDs
--    Format: INS-VEH-YYYY-NNNNN (20 chars min, 30 for safety)
-- =============================================================

ALTER TABLE public.vehicle
    ALTER COLUMN registration_number TYPE character varying(30);

-- =============================================================
-- 5. claim — add claim_type and location columns
-- =============================================================

ALTER TABLE public.claim
    ADD COLUMN IF NOT EXISTS claim_type character varying(50) NOT NULL DEFAULT 'Vehicle Damage',
    ADD COLUMN IF NOT EXISTS location   character varying(200);

-- =============================================================
-- 6. Enum types — add if missing
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
-- 7. Seed P001-P006 from RAG Policy Knowledge Base document
--
-- IMPORTANT: These are SYNTHETIC policies for an academic prototype.
-- They are NOT real insurance products or legal terms.
-- annual_premium is NULL — the document does not specify premiums.
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
   'Deductible Rs5,000. Maximum claim Rs1,00,000. '
   'Cosmetic damage unrelated to an accident is excluded. '
   '[Prototype — synthetic policy, not a real insurance product]',
   true),

  ('P002', 'Standard Comprehensive',
   NULL, 150000.00,
   85.00, 80.00, 75.00, 5000.00, 150000.00,
   'Covers accidental damage. Minor: 85%, Moderate: 80%, Severe: 75%. '
   'Deductible Rs5,000. Maximum claim Rs1,50,000. '
   'Pre-existing and intentional damage excluded. '
   '[Prototype — synthetic policy, not a real insurance product]',
   true),

  ('P003', 'Premium Comprehensive',
   NULL, 300000.00,
   90.00, 90.00, 85.00, 2000.00, 300000.00,
   'Higher coverage for accidental damage. Minor: 90%, Moderate: 90%, Severe: 85%. '
   'Deductible Rs2,000. Maximum claim Rs3,00,000. '
   '[Prototype — synthetic policy, not a real insurance product]',
   true),

  ('P004', 'Zero Depreciation',
   NULL, 500000.00,
   95.00, 95.00, 90.00, 2000.00, 500000.00,
   'Minor/Moderate: 95%, Severe: 90%. Deductible Rs2,000. Maximum claim Rs5,00,000. '
   '[Prototype — synthetic policy, not a real insurance product]',
   true),

  ('P005', 'Budget Own-Damage',
   NULL, 100000.00,
   75.00, 70.00, 65.00, 7500.00, 100000.00,
   'Lower-cost own-damage. Minor: 75%, Moderate: 70%, Severe: 65%. '
   'Deductible Rs7,500. Maximum claim Rs1,00,000. '
   '[Prototype — synthetic policy, not a real insurance product]',
   true),

  ('P006', 'Enhanced Protection',
   NULL, 400000.00,
   90.00, 88.00, 85.00, 3000.00, 400000.00,
   'Extended accidental-damage coverage. Minor: 90%, Moderate: 88%, Severe: 85%. '
   'Deductible Rs3,000. Maximum claim Rs4,00,000. '
   '[Prototype — synthetic policy, not a real insurance product]',
   true)

ON CONFLICT (policy_name) DO UPDATE SET
    policy_code            = EXCLUDED.policy_code,
    annual_premium         = EXCLUDED.annual_premium,
    coverage_limit         = EXCLUDED.coverage_limit,
    minor_coverage_pct     = EXCLUDED.minor_coverage_pct,
    moderate_coverage_pct  = EXCLUDED.moderate_coverage_pct,
    severe_coverage_pct    = EXCLUDED.severe_coverage_pct,
    deductible             = EXCLUDED.deductible,
    max_claim              = EXCLUDED.max_claim,
    description            = EXCLUDED.description,
    is_active              = EXCLUDED.is_active;

-- =============================================================
-- 8. Deactivate old placeholder policy types
--    Rows are KEPT (not deleted) to preserve referential integrity
--    for existing customer policies that reference them.
-- =============================================================

UPDATE public.policy_type
   SET is_active = false
 WHERE policy_name IN (
     'Third Party Insurance',
     'Comprehensive Insurance',
     'Premium Plus',
     'Comprehensive Motor Insurance',
     'Basic Own Damage'
 )
   AND policy_code IS NULL;   -- only deactivate old rows without a P-code

-- =============================================================
-- 9. Backfill legacy policy types with coverage data
--    So existing customer policies still work with the
--    DB-driven _policy_covers_own_vehicle() check.
--
--    Values chosen to match the closest equivalent P001-P006 plan.
--    Third Party → 0% own-vehicle coverage (not covered).
--    Others      → mapped to nearest equivalent plan values.
-- =============================================================

UPDATE public.policy_type SET
    policy_code           = 'LEGACY-TP',
    minor_coverage_pct    = 0.00,
    moderate_coverage_pct = 0.00,
    severe_coverage_pct   = 0.00,
    deductible            = 5000.00,
    max_claim             = 500000.00
WHERE policy_name = 'Third Party Insurance'
  AND (minor_coverage_pct IS NULL);

UPDATE public.policy_type SET
    policy_code           = 'LEGACY-CI',
    minor_coverage_pct    = 85.00,
    moderate_coverage_pct = 80.00,
    severe_coverage_pct   = 75.00,
    deductible            = 5000.00,
    max_claim             = 150000.00
WHERE policy_name = 'Comprehensive Insurance'
  AND (minor_coverage_pct IS NULL);

UPDATE public.policy_type SET
    policy_code           = 'LEGACY-PP',
    minor_coverage_pct    = 95.00,
    moderate_coverage_pct = 95.00,
    severe_coverage_pct   = 90.00,
    deductible            = 2000.00,
    max_claim             = 500000.00
WHERE policy_name = 'Premium Plus'
  AND (minor_coverage_pct IS NULL);

UPDATE public.policy_type SET
    policy_code           = 'LEGACY-CM',
    minor_coverage_pct    = 85.00,
    moderate_coverage_pct = 80.00,
    severe_coverage_pct   = 75.00,
    deductible            = 5000.00,
    max_claim             = 150000.00
WHERE policy_name = 'Comprehensive Motor Insurance'
  AND (minor_coverage_pct IS NULL);

UPDATE public.policy_type SET
    policy_code           = 'LEGACY-BO',
    minor_coverage_pct    = 80.00,
    moderate_coverage_pct = 75.00,
    severe_coverage_pct   = 70.00,
    deductible            = 5000.00,
    max_claim             = 100000.00
WHERE policy_name = 'Basic Own Damage'
  AND (minor_coverage_pct IS NULL);

-- =============================================================
-- Verify migration result
-- =============================================================

DO $$
DECLARE
    p001_count  integer;
    user_cols   integer;
    ai_cols     integer;
BEGIN
    -- Check P001-P006 were inserted
    SELECT COUNT(*) INTO p001_count
      FROM public.policy_type
     WHERE policy_code IN ('P001','P002','P003','P004','P005','P006')
       AND is_active = true;

    IF p001_count < 6 THEN
        RAISE WARNING 'Expected 6 active P001-P006 policies, found %', p001_count;
    ELSE
        RAISE NOTICE 'OK: % active P001-P006 policies present', p001_count;
    END IF;

    -- Check users table has new auth columns
    SELECT COUNT(*) INTO user_cols
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'users'
       AND column_name IN ('is_verified','verification_code','login_code');

    IF user_cols < 3 THEN
        RAISE WARNING 'users table missing auth columns (found %/3)', user_cols;
    ELSE
        RAISE NOTICE 'OK: users auth columns present (%/3)', user_cols;
    END IF;

    -- Check ai_analysis has new calculation columns
    SELECT COUNT(*) INTO ai_cols
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'ai_analysis'
       AND column_name IN ('coverage_pct_applied','deductible_applied',
                           'estimated_claim_amount','is_primary_image');

    IF ai_cols < 4 THEN
        RAISE WARNING 'ai_analysis missing calculation columns (found %/4)', ai_cols;
    ELSE
        RAISE NOTICE 'OK: ai_analysis calculation columns present (%/4)', ai_cols;
    END IF;

    RAISE NOTICE 'Migration 001 completed successfully.';
END $$;

COMMIT;
