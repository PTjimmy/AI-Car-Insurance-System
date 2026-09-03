"""
Unit tests for app/services/claim_estimator.py
================================================
Tests the deterministic 8-step claim calculation defined in the
RAG Policy Knowledge Base document.

Coverage:
  - All 6 policies (P001–P006) × 3 severities (Minor/Moderate/Severe)
  - Worked examples A, B, C from policy document (exact value checks)
  - Step 7: preliminary_claim floored at 0 when gross < deductible
  - Step 8: estimated_claim_amount capped at max_claim
  - Step 8: capped_by_max flag is set/unset correctly
  - Invalid input rejection (negative amount, unknown severity, bad policy)
  - Decimal precision: ₹0.01 rounding, no floating-point drift

Important distinction tested:
  claimed_amount        = customer-submitted repair estimate (Option B)
  damage_severity       = AI prediction label from ViT
  coverage_pct_applied  = selected from policy row for that severity
  estimated_claim_amount = deterministic calculation result

Source of truth for expected values: RAG Policy Knowledge Base
  (AI-Based Insurance Claim Analysis — Demo Project)
"""

import pytest
from decimal import Decimal

from app.services.claim_estimator import (
    ClaimEstimate,
    PolicyRules,
    calculate_claim,
)

# ---------------------------------------------------------------------------
# Policy fixtures — exact values from the RAG policy document
# ---------------------------------------------------------------------------

P001 = PolicyRules(
    policy_type_id=9,  policy_code="P001", policy_name="Basic Comprehensive",
    minor_coverage_pct=80.0, moderate_coverage_pct=75.0, severe_coverage_pct=70.0,
    deductible=5000.0, max_claim=100000.0,
)
P002 = PolicyRules(
    policy_type_id=10, policy_code="P002", policy_name="Standard Comprehensive",
    minor_coverage_pct=85.0, moderate_coverage_pct=80.0, severe_coverage_pct=75.0,
    deductible=5000.0, max_claim=150000.0,
)
P003 = PolicyRules(
    policy_type_id=11, policy_code="P003", policy_name="Premium Comprehensive",
    minor_coverage_pct=90.0, moderate_coverage_pct=90.0, severe_coverage_pct=85.0,
    deductible=2000.0, max_claim=300000.0,
)
P004 = PolicyRules(
    policy_type_id=12, policy_code="P004", policy_name="Zero Depreciation",
    minor_coverage_pct=95.0, moderate_coverage_pct=95.0, severe_coverage_pct=90.0,
    deductible=2000.0, max_claim=500000.0,
)
P005 = PolicyRules(
    policy_type_id=13, policy_code="P005", policy_name="Budget Own-Damage",
    minor_coverage_pct=75.0, moderate_coverage_pct=70.0, severe_coverage_pct=65.0,
    deductible=7500.0, max_claim=100000.0,
)
P006 = PolicyRules(
    policy_type_id=14, policy_code="P006", policy_name="Enhanced Protection",
    minor_coverage_pct=90.0, moderate_coverage_pct=88.0, severe_coverage_pct=85.0,
    deductible=3000.0, max_claim=400000.0,
)

ALL_POLICIES = [P001, P002, P003, P004, P005, P006]


# ---------------------------------------------------------------------------
# Helper: formula expressed in plain Python for cross-checking
# ---------------------------------------------------------------------------

def expected(claimed: float, pct: float, deductible: float, max_claim: float) -> dict:
    gross      = claimed * (pct / 100)
    prelim_raw = gross - deductible
    prelim     = max(prelim_raw, 0.0)
    final      = min(prelim, max_claim)
    return {
        "gross_covered":            round(gross, 2),
        "deductible_applied":       deductible,
        "preliminary_claim":        round(prelim, 2),
        "estimated_claim_amount":   round(final, 2),
        "capped_by_max":            prelim > max_claim,
        "coverage_pct_applied":     pct,
    }


# ---------------------------------------------------------------------------
# Worked examples from the policy document (must match exactly)
# ---------------------------------------------------------------------------

class TestDocumentExamples:

    def test_example_A_moderate_P003(self):
        """Example A: Moderate + P003. gross=₹45,000. final=₹43,000."""
        result = calculate_claim(50_000.0, "Moderate", P003)
        assert result.gross_covered            == 45_000.0, f"gross={result.gross_covered}"
        assert result.deductible_applied       == 2_000.0
        assert result.preliminary_claim        == 43_000.0
        assert result.estimated_claim_amount   == 43_000.0
        assert result.capped_by_max            is False
        assert result.coverage_pct_applied     == 90.0

    def test_example_B_minor_P001(self):
        """Example B: Minor + P001. gross=₹12,000. final=₹7,000."""
        result = calculate_claim(15_000.0, "Minor", P001)
        assert result.gross_covered            == 12_000.0
        assert result.deductible_applied       == 5_000.0
        assert result.preliminary_claim        == 7_000.0
        assert result.estimated_claim_amount   == 7_000.0
        assert result.capped_by_max            is False
        assert result.coverage_pct_applied     == 80.0

    def test_example_C_severe_P004(self):
        """Example C: Severe + P004. gross=₹1,80,000. final=₹1,78,000."""
        result = calculate_claim(200_000.0, "Severe", P004)
        assert result.gross_covered            == 180_000.0
        assert result.deductible_applied       == 2_000.0
        assert result.preliminary_claim        == 178_000.0
        assert result.estimated_claim_amount   == 178_000.0
        assert result.capped_by_max            is False
        assert result.coverage_pct_applied     == 90.0


# ---------------------------------------------------------------------------
# All 6 policies × 3 severities — coverage percentage selection
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("policy,severity,expected_pct", [
    # P001
    (P001, "Minor",    80.0),
    (P001, "Moderate", 75.0),
    (P001, "Severe",   70.0),
    # P002
    (P002, "Minor",    85.0),
    (P002, "Moderate", 80.0),
    (P002, "Severe",   75.0),
    # P003
    (P003, "Minor",    90.0),
    (P003, "Moderate", 90.0),
    (P003, "Severe",   85.0),
    # P004
    (P004, "Minor",    95.0),
    (P004, "Moderate", 95.0),
    (P004, "Severe",   90.0),
    # P005
    (P005, "Minor",    75.0),
    (P005, "Moderate", 70.0),
    (P005, "Severe",   65.0),
    # P006
    (P006, "Minor",    90.0),
    (P006, "Moderate", 88.0),
    (P006, "Severe",   85.0),
])
def test_coverage_pct_selection(policy, severity, expected_pct):
    """Verify the correct coverage percentage is selected for every policy/severity combo."""
    result = calculate_claim(50_000.0, severity, policy)
    assert result.coverage_pct_applied == expected_pct, (
        f"{policy.policy_code} {severity}: expected {expected_pct}%, got {result.coverage_pct_applied}%"
    )


# ---------------------------------------------------------------------------
# All 6 policies × 3 severities — full calculation correctness
# using the same formula as the policy document
# ---------------------------------------------------------------------------

CLAIMED = 80_000.0  # arbitrary repair estimate for matrix test

@pytest.mark.parametrize("policy,severity", [
    (p, s)
    for p in ALL_POLICIES
    for s in ("Minor", "Moderate", "Severe")
])
def test_full_calculation_matrix(policy, severity):
    """
    For every policy × severity combination, verify the complete
    8-step calculation against the reference formula.
    """
    pct_map = {
        "Minor":    policy.minor_coverage_pct,
        "Moderate": policy.moderate_coverage_pct,
        "Severe":   policy.severe_coverage_pct,
    }
    ref = expected(CLAIMED, pct_map[severity], policy.deductible, policy.max_claim)
    result = calculate_claim(CLAIMED, severity, policy)

    assert result.gross_covered          == ref["gross_covered"], \
        f"{policy.policy_code}/{severity} gross"
    assert result.deductible_applied     == ref["deductible_applied"], \
        f"{policy.policy_code}/{severity} deductible"
    assert result.preliminary_claim      == ref["preliminary_claim"], \
        f"{policy.policy_code}/{severity} preliminary"
    assert result.estimated_claim_amount == ref["estimated_claim_amount"], \
        f"{policy.policy_code}/{severity} final"
    assert result.capped_by_max          == ref["capped_by_max"], \
        f"{policy.policy_code}/{severity} capped flag"


# ---------------------------------------------------------------------------
# Step 7: floor at 0 (gross < deductible)
# ---------------------------------------------------------------------------

class TestFloorAtZero:

    def test_gross_less_than_deductible_gives_zero(self):
        """₹1,000 × 80% = ₹800. 800 − 5000 = −4200 → 0."""
        result = calculate_claim(1_000.0, "Minor", P001)
        assert result.gross_covered          == 800.0
        assert result.preliminary_claim      == 0.0
        assert result.estimated_claim_amount == 0.0
        assert result.capped_by_max          is False

    def test_gross_exactly_equals_deductible_gives_zero(self):
        """₹6,250 × 80% = ₹5,000 = deductible → preliminary = 0."""
        result = calculate_claim(6_250.0, "Minor", P001)
        assert result.gross_covered          == 5_000.0
        assert result.preliminary_claim      == 0.0
        assert result.estimated_claim_amount == 0.0

    def test_gross_one_rupee_above_deductible(self):
        """₹6,251.25 × 80% = ₹5,001.00. 5001 − 5000 = ₹1.00 final."""
        result = calculate_claim(6_251.25, "Minor", P001)
        assert result.gross_covered          == 5_001.0
        assert result.preliminary_claim      == 1.0
        assert result.estimated_claim_amount == 1.0

    def test_zero_claimed_amount(self):
        """claimed_amount=0 → everything is 0."""
        result = calculate_claim(0.0, "Moderate", P003)
        assert result.gross_covered          == 0.0
        assert result.preliminary_claim      == 0.0
        assert result.estimated_claim_amount == 0.0


# ---------------------------------------------------------------------------
# Step 8: max_claim cap
# ---------------------------------------------------------------------------

class TestMaxClaimCap:

    def test_preliminary_exceeds_max_claim(self):
        """P001 max_claim=₹1,00,000. Submit ₹2,00,000 Moderate (75%) = ₹1,50,000 − ₹5,000 = ₹1,45,000 → capped ₹1,00,000."""
        result = calculate_claim(200_000.0, "Moderate", P001)
        assert result.preliminary_claim      == 145_000.0
        assert result.estimated_claim_amount == 100_000.0
        assert result.capped_by_max          is True

    def test_preliminary_exactly_at_max_claim_not_capped(self):
        """When preliminary exactly equals max_claim, capped_by_max should be False."""
        # Need preliminary = max_claim = 100_000
        # gross = 105_000 → claimed = 105_000 / 0.80 = 131_250 → gross = 105_000 − 5_000 = 100_000
        result = calculate_claim(131_250.0, "Minor", P001)
        assert result.preliminary_claim      == 100_000.0
        assert result.estimated_claim_amount == 100_000.0
        assert result.capped_by_max          is False

    def test_preliminary_one_rupee_above_max_claim(self):
        """preliminary = max_claim + ₹1 → capped_by_max is True, final = max_claim."""
        # gross = 131251.25 × 80% = 105_001 − 5000 = 100_001 → capped
        result = calculate_claim(131_251.25, "Minor", P001)
        assert result.preliminary_claim      == 100_001.0
        assert result.estimated_claim_amount == 100_000.0
        assert result.capped_by_max          is True

    def test_large_claim_P004_not_capped(self):
        """P004 max_claim=₹5,00,000. ₹4,00,000 Severe (90%) = ₹3,60,000 − ₹2,000 = ₹3,58,000. Not capped."""
        result = calculate_claim(400_000.0, "Severe", P004)
        assert result.estimated_claim_amount == 358_000.0
        assert result.capped_by_max          is False

    def test_P005_small_max_claim(self):
        """P005 max_claim=₹1,00,000. ₹3,00,000 Minor (75%) = ₹2,25,000 − ₹7,500 = ₹2,17,500 → ₹1,00,000."""
        result = calculate_claim(300_000.0, "Minor", P005)
        assert result.estimated_claim_amount == 100_000.0
        assert result.capped_by_max          is True


# ---------------------------------------------------------------------------
# Decimal precision
# ---------------------------------------------------------------------------

class TestDecimalPrecision:

    def test_no_floating_point_drift(self):
        """Amounts that are irrational in binary float should round correctly."""
        # 33333.33 × 90% = 29999.997 → round to 30000.00
        result = calculate_claim(33_333.33, "Minor", P003)
        # gross = 33333.33 × 0.90 = 29999.997 → 30000.00
        assert result.gross_covered == 30_000.0
        assert result.preliminary_claim == 28_000.0  # − 2000 deductible

    def test_paise_level_precision(self):
        """₹10,000.01 × 80% = ₹8,000.008 → ₹8,000.01 (rounded to nearest paise)."""
        result = calculate_claim(10_000.01, "Minor", P001)
        assert result.gross_covered == 8_000.01


# ---------------------------------------------------------------------------
# Invalid input rejection
# ---------------------------------------------------------------------------

class TestInvalidInputs:

    def test_negative_claimed_amount_raises(self):
        with pytest.raises(ValueError, match="claimed_amount must be"):
            calculate_claim(-100.0, "Minor", P001)

    def test_unknown_severity_raises(self):
        with pytest.raises(ValueError, match="damage_severity must be"):
            calculate_claim(50_000.0, "Catastrophic", P001)  # type: ignore[arg-type]

    def test_empty_string_severity_raises(self):
        with pytest.raises(ValueError):
            calculate_claim(50_000.0, "", P001)  # type: ignore[arg-type]

    def test_negative_max_claim_raises(self):
        bad = PolicyRules(
            policy_type_id=99, policy_code="BADX", policy_name="Bad Policy",
            minor_coverage_pct=80.0, moderate_coverage_pct=75.0, severe_coverage_pct=70.0,
            deductible=5_000.0, max_claim=-1.0,
        )
        with pytest.raises(ValueError, match="max_claim must be"):
            calculate_claim(50_000.0, "Minor", bad)

    def test_zero_coverage_pct_raises(self):
        """A policy with 0% coverage for a severity is a config error — must raise."""
        bad = PolicyRules(
            policy_type_id=99, policy_code="BADX", policy_name="Bad Policy",
            minor_coverage_pct=0.0, moderate_coverage_pct=75.0, severe_coverage_pct=70.0,
            deductible=5_000.0, max_claim=100_000.0,
        )
        with pytest.raises(ValueError, match="no coverage percentage"):
            calculate_claim(50_000.0, "Minor", bad)

    def test_none_coverage_pct_raises(self):
        """A policy with NULL coverage for a severity is a config error — must raise."""
        bad = PolicyRules(
            policy_type_id=99, policy_code="BADX", policy_name="Bad Policy",
            minor_coverage_pct=None,  # type: ignore[arg-type]
            moderate_coverage_pct=75.0, severe_coverage_pct=70.0,
            deductible=5_000.0, max_claim=100_000.0,
        )
        with pytest.raises(ValueError, match="no coverage percentage"):
            calculate_claim(50_000.0, "Minor", bad)


# ---------------------------------------------------------------------------
# Return type
# ---------------------------------------------------------------------------

def test_returns_claim_estimate_dataclass():
    result = calculate_claim(50_000.0, "Moderate", P003)
    assert isinstance(result, ClaimEstimate)
    assert result.claimed_amount    == 50_000.0
    assert result.damage_severity   == "Moderate"


# ---------------------------------------------------------------------------
# All 6 policies — verify deductibles are subtracted correctly
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("policy,expected_deductible", [
    (P001, 5_000.0),
    (P002, 5_000.0),
    (P003, 2_000.0),
    (P004, 2_000.0),
    (P005, 7_500.0),
    (P006, 3_000.0),
])
def test_deductible_subtracted_correctly(policy, expected_deductible):
    """Verify each policy's deductible is reflected in the result."""
    # Use a large enough claimed_amount so preliminary_claim > 0
    result = calculate_claim(200_000.0, "Minor", policy)
    assert result.deductible_applied == expected_deductible
    # gross - deductible should equal preliminary (since it won't be negative)
    expected_prelim = round(result.gross_covered - expected_deductible, 2)
    assert result.preliminary_claim == expected_prelim


# ---------------------------------------------------------------------------
# All 6 policies — verify max_claim limits are honoured
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("policy,expected_max", [
    (P001, 100_000.0),
    (P002, 150_000.0),
    (P003, 300_000.0),
    (P004, 500_000.0),
    (P005, 100_000.0),
    (P006, 400_000.0),
])
def test_max_claim_limit_honoured(policy, expected_max):
    """Submit an extremely large amount to trigger the cap for every policy."""
    result = calculate_claim(10_000_000.0, "Severe", policy)
    assert result.estimated_claim_amount == expected_max, (
        f"{policy.policy_code} expected cap ₹{expected_max}, got ₹{result.estimated_claim_amount}"
    )
    assert result.capped_by_max is True
