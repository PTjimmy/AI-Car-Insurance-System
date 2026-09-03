"""
Policy Service
==============
Retrieves structured policy rules from the policy_type database table
and converts them into PolicyRules dataclasses for use by claim_estimator.py.

Responsibilities
----------------
- Load policy rules for a given policy_type_id from the database.
- Validate that the required calculation fields are present.
- Return a PolicyRules dataclass (pure data, no DB session held).

What this service does NOT do
------------------------------
- It does NOT perform claim calculations (see claim_estimator.py).
- It does NOT call the AI model (see ai_inference.py).
- It does NOT decide coverage eligibility (the claim route does that).

Usage in customer.py
---------------------
    from app.services.policy_service import get_policy_rules, PolicyRulesNotFoundError
    rules = await get_policy_rules(db, policy_type_id)
    estimate = calculate_claim(claimed_amount, damage_severity, rules)
"""

from __future__ import annotations

import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import PolicyType
from app.services.claim_estimator import PolicyRules

logger = logging.getLogger(__name__)


class PolicyRulesNotFoundError(Exception):
    """Raised when the policy_type row does not exist or is inactive."""
    pass


class PolicyRulesIncompleteError(Exception):
    """
    Raised when the policy_type row exists but is missing the calculation
    fields required for the 8-step formula (coverage percentages, deductible,
    max_claim). This means the policy was seeded without the RAG document
    values — operator must update the database row.
    """
    pass


async def get_policy_rules(db: AsyncSession, policy_type_id: int) -> PolicyRules:
    """
    Load policy calculation rules from the policy_type table.

    Parameters
    ----------
    db : AsyncSession
        Active SQLAlchemy async session.
    policy_type_id : int
        The policy_type_id of the customer's purchased policy.

    Returns
    -------
    PolicyRules
        Structured, validated policy rules ready for claim_estimator.

    Raises
    ------
    PolicyRulesNotFoundError
        If the policy_type row does not exist or is not active.
    PolicyRulesIncompleteError
        If the row exists but is missing required calculation fields.
    """
    result = await db.execute(
        select(PolicyType).where(PolicyType.policy_type_id == policy_type_id)
    )
    pt: PolicyType | None = result.scalar_one_or_none()

    if pt is None:
        raise PolicyRulesNotFoundError(
            f"policy_type_id={policy_type_id} not found in database."
        )

    if not pt.is_active:
        raise PolicyRulesNotFoundError(
            f"Policy '{pt.policy_name}' (id={policy_type_id}) is inactive. "
            "Inactive policies cannot be used for new claim calculations."
        )

    # Validate that all calculation fields are populated
    missing: list[str] = []
    if pt.minor_coverage_pct is None:
        missing.append("minor_coverage_pct")
    if pt.moderate_coverage_pct is None:
        missing.append("moderate_coverage_pct")
    if pt.severe_coverage_pct is None:
        missing.append("severe_coverage_pct")
    if pt.deductible is None:
        missing.append("deductible")
    if pt.max_claim is None:
        missing.append("max_claim")

    if missing:
        raise PolicyRulesIncompleteError(
            f"Policy '{pt.policy_name}' (id={policy_type_id}) is missing "
            f"required calculation fields: {', '.join(missing)}. "
            f"These fields come from the RAG Policy Knowledge Base document. "
            f"Run the policy seed script to populate them."
        )

    return PolicyRules(
        policy_type_id=pt.policy_type_id,
        policy_code=pt.policy_code or "",
        policy_name=pt.policy_name,
        minor_coverage_pct=float(pt.minor_coverage_pct),
        moderate_coverage_pct=float(pt.moderate_coverage_pct),
        severe_coverage_pct=float(pt.severe_coverage_pct),
        deductible=float(pt.deductible),
        max_claim=float(pt.max_claim),
    )
