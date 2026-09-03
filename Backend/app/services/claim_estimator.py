"""
Claim Estimator Service
=======================
Deterministic 8-step claim calculation defined by the RAG Policy
Knowledge Base (academic prototype document).

Source of truth for calculation rules:
  AI-Based Insurance Claim Analysis — RAG Policy Knowledge Base

Important distinction between fields
-------------------------------------
claimed_amount        — Customer-submitted repair estimate / claim amount.
                        Entered during claim submission. Used as the
                        repair-cost input for the calculation (Option B).
                        Labelled in UI as "Customer Claimed Amount".

damage_severity       — AI prediction from ViT-B/16 (Minor/Moderate/Severe).
                        Determines which coverage percentage is applied.

coverage_pct_applied  — Policy rule: the percentage from the applicable
                        policy row for the predicted severity.

estimated_claim_amount — Deterministic backend calculation result.
                         See 8-step formula below.

The ViT model does NOT predict repair cost, coverage percentage,
deductible, or final claim amount. Those are business rules.

8-step calculation (from policy document section 5)
---------------------------------------------------
Step 1  Receive damage_severity from ViT prediction.
Step 2  Retrieve the customer's applicable policy record.
Step 3  Select coverage_pct for that severity from the policy_type row.
Step 4  Use claimed_amount as the repair-cost input (Option B, approved
        by project owner — no midpoint formula, no invented ML output).
Step 5  gross_covered = claimed_amount × (coverage_pct / 100)
Step 6  preliminary_claim = gross_covered − deductible
Step 7  if preliminary_claim < 0: preliminary_claim = 0
Step 8  estimated_claim_amount = min(preliminary_claim, max_claim)

This function is deterministic and unit-testable. It does not touch
the database. Callers are responsible for loading policy rules first
(see policy_service.py) and then passing them here.

Prototype note
--------------
This document states its policies and values are synthetic and created
for an academic/minor-project prototype. They are not real insurance
products, legal terms, or actual insurer pricing.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal
from typing import Literal

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Severity type
# ---------------------------------------------------------------------------

SeverityLabel = Literal["Minor", "Moderate", "Severe"]


# ---------------------------------------------------------------------------
# Input / Output data classes
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class PolicyRules:
    """
    Structured policy rules retrieved from the policy_type row.
    All monetary amounts are in INR (₹).
    All coverage values are percentages (e.g. 80.0 = 80%).
    """
    policy_type_id: int
    policy_code: str                  # e.g. "P001"
    policy_name: str                  # e.g. "Basic Comprehensive"
    minor_coverage_pct: float         # e.g. 80.0
    moderate_coverage_pct: float      # e.g. 75.0
    severe_coverage_pct: float        # e.g. 70.0
    deductible: float                 # e.g. 5000.0
    max_claim: float                  # e.g. 100000.0


@dataclass(frozen=True)
class ClaimEstimate:
    """
    Result of the 8-step calculation.
    All monetary amounts are in INR (₹).
    """
    claimed_amount: float             # Input: customer-submitted repair estimate
    damage_severity: SeverityLabel    # Input: ViT AI prediction
    coverage_pct_applied: float       # Step 3: selected from policy
    gross_covered: float              # Step 5: claimed_amount × (coverage_pct/100)
    deductible_applied: float         # Step 6: deductible from policy
    preliminary_claim: float          # Step 6: gross_covered − deductible (≥0)
    estimated_claim_amount: float     # Step 8: min(preliminary, max_claim)
    capped_by_max: bool               # True if preliminary > max_claim


# ---------------------------------------------------------------------------
# Core calculation — pure function, no DB access, fully unit-testable
# ---------------------------------------------------------------------------

def calculate_claim(
    claimed_amount: float,
    damage_severity: SeverityLabel,
    rules: PolicyRules,
) -> ClaimEstimate:
    """
    Run the 8-step deterministic claim calculation.

    Parameters
    ----------
    claimed_amount : float
        Customer-submitted repair estimate (₹). This is the Option B
        repair-cost input approved for this prototype. It is NOT an AI
        prediction — it is what the customer says the repair costs.

    damage_severity : SeverityLabel
        ViT AI prediction: "Minor", "Moderate", or "Severe".

    rules : PolicyRules
        Structured policy rules loaded from the policy_type DB row.

    Returns
    -------
    ClaimEstimate
        All intermediate and final values for transparency and storage.

    Raises
    ------
    ValueError
        If damage_severity is not a valid label, or claimed_amount < 0,
        or required policy values are missing/zero.
    """
    # --- Input validation ---
    if claimed_amount < 0:
        raise ValueError(
            f"claimed_amount must be ≥ 0, got {claimed_amount}"
        )

    valid_severities = ("Minor", "Moderate", "Severe")
    if damage_severity not in valid_severities:
        raise ValueError(
            f"damage_severity must be one of {valid_severities}, got '{damage_severity}'"
        )

    if rules.deductible < 0:
        raise ValueError(
            f"deductible must be ≥ 0, got {rules.deductible}"
        )

    if rules.max_claim <= 0:
        raise ValueError(
            f"max_claim must be > 0, got {rules.max_claim}"
        )

    # --- Step 3: select coverage percentage for predicted severity ---
    coverage_pct_map: dict[str, float] = {
        "Minor":    rules.minor_coverage_pct,
        "Moderate": rules.moderate_coverage_pct,
        "Severe":   rules.severe_coverage_pct,
    }
    coverage_pct = coverage_pct_map[damage_severity]

    if coverage_pct is None or coverage_pct <= 0:
        raise ValueError(
            f"Policy '{rules.policy_name}' has no coverage percentage "
            f"configured for severity '{damage_severity}'. "
            f"Ensure the policy_type row has {damage_severity.lower()}_coverage_pct set."
        )

    # --- Step 5: gross_covered = claimed_amount × (coverage_pct / 100) ---
    # Use Decimal for exact arithmetic to avoid floating-point rounding errors
    d_claimed   = Decimal(str(claimed_amount))
    d_pct       = Decimal(str(coverage_pct))
    d_deductible = Decimal(str(rules.deductible))
    d_max_claim  = Decimal(str(rules.max_claim))

    gross_covered = d_claimed * (d_pct / Decimal("100"))

    # --- Step 6: preliminary_claim = gross_covered − deductible ---
    preliminary_claim_raw = gross_covered - d_deductible

    # --- Step 7: floor at 0 ---
    preliminary_claim = max(preliminary_claim_raw, Decimal("0"))

    # --- Step 8: final = min(preliminary, max_claim) ---
    estimated_claim_amount = min(preliminary_claim, d_max_claim)
    capped_by_max = preliminary_claim > d_max_claim

    # Round to 2 decimal places (INR paise)
    def to_float(d: Decimal) -> float:
        return float(d.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

    result = ClaimEstimate(
        claimed_amount=float(claimed_amount),
        damage_severity=damage_severity,
        coverage_pct_applied=float(coverage_pct),
        gross_covered=to_float(gross_covered),
        deductible_applied=float(rules.deductible),
        preliminary_claim=to_float(preliminary_claim),
        estimated_claim_amount=to_float(estimated_claim_amount),
        capped_by_max=capped_by_max,
    )

    logger.debug(
        "Claim estimate for policy %s severity=%s: "
        "claimed=₹%.2f coverage=%.1f%% gross=₹%.2f "
        "deductible=₹%.2f preliminary=₹%.2f final=₹%.2f capped=%s",
        rules.policy_code,
        damage_severity,
        claimed_amount,
        coverage_pct,
        result.gross_covered,
        result.deductible_applied,
        result.preliminary_claim,
        result.estimated_claim_amount,
        capped_by_max,
    )

    return result
