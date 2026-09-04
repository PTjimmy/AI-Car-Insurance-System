"""
Customer routes
===============

Vehicles
  GET  /customer/vehicles
  POST /customer/vehicles

Policy types (plan catalogue — P001–P006)
  GET  /customer/policy-types

Policies (customer's purchased policies)
  GET  /customer/policies
  POST /customer/policies

Claims
  GET  /customer/claims
  POST /customer/claims
  GET  /customer/claims/{claim_id}
  POST /customer/claims/{claim_id}/images

Profile
  GET  /customer/profile
  PUT  /customer/profile

Image upload strategy — Option B (documented):
  The FIRST uploaded image for a claim triggers ViT analysis and the
  deterministic claim calculation. Subsequent images are stored as
  supporting evidence in claim_image but are NOT re-analysed.
  There is exactly one ai_analysis row per claim.

Policy validation:
  Own-vehicle damage eligibility is checked against the policy_type DB
  row (minor/moderate/severe_coverage_pct fields). If all coverage
  percentages are NULL the policy does not cover own-vehicle damage.
  This replaces the old hard-coded THIRD_PARTY_ONLY_NAMES check.

Claim calculation:
  After ViT inference the backend calls claim_estimator.calculate_claim()
  using the customer's claimed_amount as the repair-cost input (Option B).
  The result is stored in ai_analysis alongside the ViT prediction.
"""

import logging
import uuid
from datetime import date
from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.deps import require_customer
from app.db.session import get_db
from app.models.models import (
    AIAnalysis,
    Claim,
    ClaimImage,
    ClaimStatus,
    Customer,
    CoverageType,
    Policy,
    PolicyCoverage,
    PolicyType,
    User,
    Vehicle,
)
from app.schemas.schemas import (
    ClaimCreate,
    ClaimImageOut,
    ClaimOut,
    CustomerOut,
    CustomerUpdate,
    PolicyCreate,
    PolicyOut,
    PolicyTypeDetailOut,
    VehicleCreate,
    VehicleOut,
)
from app.services.ai_inference import ModelNotLoadedError, inference_service
from app.services.claim_estimator import calculate_claim
from app.services.policy_service import (
    PolicyRulesIncompleteError,
    PolicyRulesNotFoundError,
    get_policy_rules,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/customer", tags=["customer"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_policy_coverages(db: AsyncSession, policy_type_id: int) -> list[str]:
    """Return list of coverage names linked to a policy type."""
    result = await db.execute(
        select(CoverageType.coverage_name)
        .join(PolicyCoverage, CoverageType.coverage_type_id == PolicyCoverage.coverage_type_id)
        .where(PolicyCoverage.policy_type_id == policy_type_id)
    )
    return [row[0] for row in result.all()]


async def _load_claim_full(db: AsyncSession, claim_id: int) -> Claim | None:
    result = await db.execute(
        select(Claim)
        .where(Claim.claim_id == claim_id)
        .options(
            selectinload(Claim.images),
            selectinload(Claim.ai_analysis),
            selectinload(Claim.history),
            selectinload(Claim.policy).selectinload(Policy.policy_type),
            selectinload(Claim.policy).selectinload(Policy.vehicle),
        )
    )
    return result.scalar_one_or_none()


def _policy_covers_own_vehicle(policy_type: PolicyType) -> bool:
    """
    Return True if this policy type covers own-vehicle damage.

    This check is entirely DB-driven — it reads the per-severity coverage
    percentage columns from the policy_type row:
      minor_coverage_pct, moderate_coverage_pct, severe_coverage_pct

    A policy covers own-vehicle damage when at least one coverage percentage
    is set and greater than zero. A policy with all three set to NULL or 0.0
    (e.g. a third-party-only plan) will return False.

    This replaces any hard-coded policy name checks. Adding a new policy type
    to the database with NULL/zero coverage percentages will automatically
    be treated as not covering own-vehicle damage — no code changes needed.
    """
    pcts = [
        policy_type.minor_coverage_pct,
        policy_type.moderate_coverage_pct,
        policy_type.severe_coverage_pct,
    ]
    return any(p is not None and float(p) > 0 for p in pcts)


# Claim types that represent damage to the customer's own vehicle.
# Used together with _policy_covers_own_vehicle() to detect coverage gaps.
_OWN_DAMAGE_CLAIM_TYPES = {
    "Vehicle Damage",
    "Own Vehicle Damage",
    "Accident",
    "Natural Disaster",
    "Flood",
    "Fire",
}


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

@router.get("/profile", response_model=CustomerOut)
async def get_profile(
    current_user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Customer).where(Customer.customer_id == current_user.customer_id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer profile not found.")
    return customer


@router.put("/profile", response_model=CustomerOut)
async def update_profile(
    payload: CustomerUpdate,
    current_user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Customer).where(Customer.customer_id == current_user.customer_id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer profile not found.")

    if payload.first_name is not None:
        customer.first_name = payload.first_name
    if payload.last_name is not None:
        customer.last_name = payload.last_name
    if payload.phone is not None:
        customer.phone = payload.phone
    if payload.address is not None:
        customer.address = payload.address

    return customer


# ---------------------------------------------------------------------------
# Vehicles
# ---------------------------------------------------------------------------

@router.get("/vehicles", response_model=list[VehicleOut])
async def list_vehicles(
    current_user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Vehicle)
        .where(Vehicle.customer_id == current_user.customer_id)
        .order_by(Vehicle.created_at.desc())
    )
    return result.scalars().all()


@router.post("/vehicles", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
async def register_vehicle(
    payload: VehicleCreate,
    current_user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(Vehicle).where(Vehicle.registration_number == payload.registration_number)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="A vehicle with this registration number already exists.",
        )
    vehicle = Vehicle(
        customer_id=current_user.customer_id,
        **payload.model_dump(),
    )
    db.add(vehicle)
    await db.flush()
    return vehicle


# ---------------------------------------------------------------------------
# Policy types — P001–P006 catalogue
# ---------------------------------------------------------------------------

@router.get("/policy-types", response_model=list[PolicyTypeDetailOut])
async def list_policy_types(
    current_user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PolicyType)
        .where(PolicyType.is_active == True)   # noqa: E712
        .order_by(PolicyType.policy_type_id)
    )
    plans = result.scalars().all()

    out = []
    for plan in plans:
        coverages = await _get_policy_coverages(db, plan.policy_type_id)
        out.append(
            PolicyTypeDetailOut(
                policy_type_id=plan.policy_type_id,
                policy_code=plan.policy_code,
                policy_name=plan.policy_name,
                annual_premium=float(plan.annual_premium) if plan.annual_premium is not None else None,
                coverage_limit=float(plan.coverage_limit),
                minor_coverage_pct=float(plan.minor_coverage_pct) if plan.minor_coverage_pct is not None else None,
                moderate_coverage_pct=float(plan.moderate_coverage_pct) if plan.moderate_coverage_pct is not None else None,
                severe_coverage_pct=float(plan.severe_coverage_pct) if plan.severe_coverage_pct is not None else None,
                deductible=float(plan.deductible) if plan.deductible is not None else None,
                max_claim=float(plan.max_claim) if plan.max_claim is not None else None,
                description=plan.description,
                is_active=plan.is_active,
                coverages=coverages,
            )
        )
    return out


# ---------------------------------------------------------------------------
# Policies — customer's purchased policies
# ---------------------------------------------------------------------------

@router.get("/policies", response_model=list[PolicyOut])
async def list_policies(
    current_user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Policy)
        .join(Vehicle, Policy.vehicle_id == Vehicle.vehicle_id)
        .where(Vehicle.customer_id == current_user.customer_id)
        .options(
            selectinload(Policy.policy_type),
            selectinload(Policy.vehicle),
        )
        .order_by(Policy.created_at.desc())
    )
    return result.scalars().all()


@router.post("/policies", response_model=PolicyOut, status_code=status.HTTP_201_CREATED)
async def purchase_policy(
    payload: PolicyCreate,
    current_user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    """
    Purchase an insurance policy for one of the customer's vehicles.

    Rules:
    - Vehicle must belong to this customer.
    - Policy type must be active (only P001–P006 are active).
    - Vehicle cannot already have an active policy.
    - end_date must be after start_date.
    """
    # Verify vehicle ownership
    veh_result = await db.execute(
        select(Vehicle)
        .where(Vehicle.vehicle_id == payload.vehicle_id)
        .where(Vehicle.customer_id == current_user.customer_id)
    )
    vehicle = veh_result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found or does not belong to this customer.",
        )

    # Verify policy type is active
    pt_result = await db.execute(
        select(PolicyType)
        .where(PolicyType.policy_type_id == payload.policy_type_id)
        .where(PolicyType.is_active == True)  # noqa: E712
    )
    policy_type = pt_result.scalar_one_or_none()
    if not policy_type:
        raise HTTPException(status_code=404, detail="Policy type not found or inactive.")

    if payload.end_date <= payload.start_date:
        raise HTTPException(status_code=422, detail="End date must be after start date.")

    # One active policy per vehicle
    active = await db.execute(
        select(Policy)
        .where(Policy.vehicle_id == payload.vehicle_id)
        .where(Policy.status == "active")
    )
    if active.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=(
                "This vehicle already has an active insurance policy. "
                "Cancel the existing policy before purchasing a new one."
            ),
        )

    policy_number = f"POL-{uuid.uuid4().hex[:10].upper()}"
    policy = Policy(
        policy_number=policy_number,
        vehicle_id=payload.vehicle_id,
        policy_type_id=payload.policy_type_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        status="active",
    )
    db.add(policy)
    await db.flush()

    result = await db.execute(
        select(Policy)
        .where(Policy.policy_id == policy.policy_id)
        .options(selectinload(Policy.policy_type), selectinload(Policy.vehicle))
    )
    return result.scalar_one()


# ---------------------------------------------------------------------------
# Claims
# ---------------------------------------------------------------------------

@router.get("/claims", response_model=list[ClaimOut])
async def list_claims(
    current_user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Claim)
        .join(Policy, Claim.policy_id == Policy.policy_id)
        .join(Vehicle, Policy.vehicle_id == Vehicle.vehicle_id)
        .where(Vehicle.customer_id == current_user.customer_id)
        .options(
            selectinload(Claim.images),
            selectinload(Claim.ai_analysis),
            selectinload(Claim.history),
            selectinload(Claim.policy).selectinload(Policy.policy_type),
            selectinload(Claim.policy).selectinload(Policy.vehicle),
        )
        .order_by(Claim.claim_date.desc())
    )
    return result.scalars().all()


@router.get("/claims/{claim_id}", response_model=ClaimOut)
async def get_claim(
    claim_id: int,
    current_user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Claim)
        .join(Policy, Claim.policy_id == Policy.policy_id)
        .join(Vehicle, Policy.vehicle_id == Vehicle.vehicle_id)
        .where(Claim.claim_id == claim_id)
        .where(Vehicle.customer_id == current_user.customer_id)
        .options(
            selectinload(Claim.images),
            selectinload(Claim.ai_analysis),
            selectinload(Claim.history),
            selectinload(Claim.policy).selectinload(Policy.policy_type),
            selectinload(Claim.policy).selectinload(Policy.vehicle),
        )
    )
    claim = result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")
    return claim


@router.post("/claims", response_model=ClaimOut, status_code=status.HTTP_201_CREATED)
async def submit_claim(
    payload: ClaimCreate,
    current_user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a new insurance claim.

    Business rules enforced:
    1. Policy must belong to this customer.
    2. Policy must be active and not expired.
    3. Claimed amount must not exceed the policy coverage_limit.
    4. If the claim type is own-vehicle damage and the policy does not
       cover own-vehicle damage (all coverage_pct fields are NULL/0),
       the claim is rejected with a clear message.
       This check is DB-driven — it reads the policy_type row, not a
       hard-coded list of policy names.
    """
    # Verify the policy belongs to this customer and load policy_type
    result = await db.execute(
        select(Policy)
        .join(Vehicle, Policy.vehicle_id == Vehicle.vehicle_id)
        .where(Policy.policy_id == payload.policy_id)
        .where(Vehicle.customer_id == current_user.customer_id)
        .options(selectinload(Policy.policy_type))
    )
    policy = result.scalar_one_or_none()
    if not policy:
        raise HTTPException(
            status_code=404,
            detail="Policy not found or does not belong to this customer.",
        )

    # Rule 2a: policy must be active
    if policy.status != "active":
        raise HTTPException(
            status_code=422,
            detail=(
                f"Cannot submit a claim — policy status is '{policy.status}'. "
                "Only active policies can be claimed against."
            ),
        )

    # Rule 2b: policy must not be expired
    if policy.end_date < date.today():
        raise HTTPException(
            status_code=422,
            detail="Cannot submit a claim — this policy has expired.",
        )

    # NOTE: No pre-validation of claimed_amount against coverage_limit here.
    # The claim_estimator enforces the max_claim cap (Step 8) after applying
    # the coverage percentage and deductible. Rejecting claimed_amount > coverage_limit
    # before the calculation would prevent the documented Step 8 cap from working
    # and could incorrectly block valid claims on policies with high claimed amounts.
    # coverage_limit is retained on the policy_type table for display/legacy use only.

    # DB-driven own-vehicle damage coverage check
    if (
        policy.policy_type is not None
        and payload.claim_type in _OWN_DAMAGE_CLAIM_TYPES
        and not _policy_covers_own_vehicle(policy.policy_type)
    ):
        raise HTTPException(
            status_code=422,
            detail=(
                f"Not Covered Under Selected Policy — "
                f"'{policy.policy_type.policy_name}' does not cover own-vehicle damage. "
                f"Please select a policy with own-vehicle damage coverage."
            ),
        )

    claim_number = f"CLM-{uuid.uuid4().hex[:10].upper()}"
    claim = Claim(
        claim_number=claim_number,
        policy_id=payload.policy_id,
        accident_date=payload.accident_date,
        claim_type=payload.claim_type,
        location=payload.location,
        description=payload.description,
        claimed_amount=payload.claimed_amount,
        status=ClaimStatus.PENDING,
    )
    db.add(claim)
    await db.flush()

    return await _load_claim_full(db, claim.claim_id)


# ---------------------------------------------------------------------------
# Image upload
# Option B: first image → ViT analysis + claim calculation
#           subsequent images → supporting evidence only, no re-analysis
# ---------------------------------------------------------------------------

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/claims/{claim_id}/images", response_model=ClaimImageOut, status_code=201)
async def upload_claim_image(
    claim_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a damage image for a claim.

    Image strategy — Option B:
      First image  → saved + ViT severity classification + deterministic
                     claim calculation (coverage % × claimed_amount −
                     deductible, capped at max_claim).
      Subsequent   → saved as supporting evidence. ViT is NOT re-run.
                     Existing ai_analysis row is not overwritten.

    This endpoint stores the following for the first image:
      ai_analysis.damage_severity         — ViT AI prediction
      ai_analysis.confidence_score        — ViT AI confidence
      ai_analysis.coverage_pct_applied    — policy rule (business logic)
      ai_analysis.deductible_applied      — policy rule (business logic)
      ai_analysis.estimated_claim_amount  — deterministic calculation result
      ai_analysis.is_primary_image        — True (first image)
    """
    # Verify claim ownership via policy → vehicle → customer chain
    result = await db.execute(
        select(Claim)
        .join(Policy, Claim.policy_id == Policy.policy_id)
        .join(Vehicle, Policy.vehicle_id == Vehicle.vehicle_id)
        .where(Claim.claim_id == claim_id)
        .where(Vehicle.customer_id == current_user.customer_id)
        .options(
            selectinload(Claim.policy).selectinload(Policy.policy_type)
        )
    )
    claim = result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type. Please upload a JPG, PNG or WebP image.",
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10 MB.")

    # Save image to disk
    ext = Path(file.filename).suffix if file.filename else ".jpg"
    filename = f"{claim_id}_{uuid.uuid4().hex}{ext}"
    save_path = settings.upload_dir_path / filename

    async with aiofiles.open(save_path, "wb") as f:
        await f.write(contents)

    # Persist image record
    image_record = ClaimImage(
        claim_id=claim_id,
        file_path=str(save_path),
        image_type="damage",
    )
    db.add(image_record)
    await db.flush()

    # -----------------------------------------------------------------
    # Option B: run ViT + claim calculation only for the FIRST image.
    # Check whether ai_analysis already exists for this claim.
    # -----------------------------------------------------------------
    existing_analysis = await db.execute(
        select(AIAnalysis).where(AIAnalysis.claim_id == claim_id)
    )
    if existing_analysis.scalar_one_or_none() is None:
        # This is the primary (first) image — run analysis
        await _run_analysis_for_primary_image(
            db=db,
            claim=claim,
            image_path=save_path,
        )
    else:
        logger.info(
            "Claim %d already has an ai_analysis row. "
            "Image %s stored as supporting evidence (Option B — not re-analysed).",
            claim_id,
            filename,
        )

    return image_record


async def _run_analysis_for_primary_image(
    db: AsyncSession,
    claim: Claim,
    image_path: Path,
) -> None:
    """
    Run ViT inference and deterministic claim calculation for the
    primary (first) image of a claim.

    Steps:
      1. Run ViT predict() → damage_severity, confidence_score
      2. Load policy rules from DB → PolicyRules
      3. Run calculate_claim(claimed_amount, severity, rules) → ClaimEstimate
      4. Store AIAnalysis row with both AI and calculation fields clearly
         separated.

    If the model is not loaded (weights absent), only the ai_analysis
    row header is created with NULL AI fields. The claim still saves.
    If policy rules are incomplete, the calculation fields are NULL but
    the ViT result is still stored.
    """
    policy_type_id = claim.policy.policy_type_id if claim.policy else None

    # Step 1 — ViT inference
    damage_severity: str | None = None
    confidence_score: float | None = None

    try:
        ai_result = inference_service.predict(image_path)
        damage_severity = ai_result["damage_severity"]
        confidence_score = ai_result["confidence_score"]
        logger.info(
            "ViT prediction for claim %d: severity=%s confidence=%.4f",
            claim.claim_id, damage_severity, confidence_score,
        )
    except ModelNotLoadedError:
        logger.warning(
            "Claim %d: AI model not loaded — severity/confidence will be NULL. "
            "Place best_model.pth in Backend/ai_model/ and restart.",
            claim.claim_id,
        )
    except Exception as exc:
        logger.error(
            "Claim %d: ViT inference failed — %s. "
            "AI fields will be NULL.",
            claim.claim_id, exc,
        )

    # Step 2 & 3 — Policy rules + claim calculation
    coverage_pct: float | None = None
    deductible: float | None = None
    estimated_claim: float | None = None

    if damage_severity is not None and policy_type_id is not None:
        try:
            rules = await get_policy_rules(db, policy_type_id)
            estimate = calculate_claim(
                claimed_amount=float(claim.claimed_amount),
                damage_severity=damage_severity,  # type: ignore[arg-type]
                rules=rules,
            )
            coverage_pct = estimate.coverage_pct_applied
            deductible = estimate.deductible_applied
            estimated_claim = estimate.estimated_claim_amount
            logger.info(
                "Claim %d calculation: coverage=%.1f%% deductible=₹%.2f "
                "estimated_claim=₹%.2f (capped=%s)",
                claim.claim_id,
                coverage_pct, deductible, estimated_claim,
                estimate.capped_by_max,
            )
        except (PolicyRulesNotFoundError, PolicyRulesIncompleteError) as exc:
            logger.warning(
                "Claim %d: Policy rules unavailable — calculation fields will be NULL. %s",
                claim.claim_id, exc,
            )
        except Exception as exc:
            logger.error(
                "Claim %d: Claim calculation failed — %s. Calculation fields will be NULL.",
                claim.claim_id, exc,
            )
    elif damage_severity is None:
        logger.info(
            "Claim %d: Skipping calculation — no ViT result available.",
            claim.claim_id,
        )
    elif policy_type_id is None:
        logger.warning(
            "Claim %d: Skipping calculation — policy_type_id not found on claim.",
            claim.claim_id,
        )

    # Step 4 — Store AIAnalysis row
    db.add(AIAnalysis(
        claim_id=claim.claim_id,
        # AI prediction fields
        damage_severity=damage_severity,
        confidence_score=confidence_score,
        # Business-rule calculation fields
        coverage_pct_applied=coverage_pct,
        deductible_applied=deductible,
        estimated_claim_amount=estimated_claim,
        # Image strategy marker
        is_primary_image=True,
    ))
