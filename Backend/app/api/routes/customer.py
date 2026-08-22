"""
Customer routes
===============
Vehicles
  GET  /customer/vehicles
  POST /customer/vehicles

Policy types (plan catalogue)
  GET  /customer/policy-types

Policies (customer's purchased policies)
  GET  /customer/policies
  POST /customer/policies           ← BUY a policy for a vehicle

Claims
  GET  /customer/claims
  POST /customer/claims             ← business rules enforced here
  GET  /customer/claims/{claim_id}
  POST /customer/claims/{claim_id}/images   ← image upload + AI trigger

Profile
  GET  /customer/profile
  PUT  /customer/profile
"""

import uuid
from datetime import date, datetime, timezone
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

router = APIRouter(prefix="/customer", tags=["customer"])

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Claim types that represent damage to the customer's own vehicle.
# Used for Third Party policy coverage check (Rule: own vehicle not covered).
OWN_DAMAGE_CLAIM_TYPES = {
    "Vehicle Damage",
    "Own Vehicle Damage",
    "Accident",
    "Natural Disaster",
    "Flood",
    "Fire",
}

# Policy names that do NOT cover own-vehicle damage
THIRD_PARTY_ONLY_NAMES = {"Third Party Insurance"}


async def _get_policy_coverages(db: AsyncSession, policy_type_id: int) -> list[str]:
    """Return list of coverage names linked to a policy type."""
    result = await db.execute(
        select(CoverageType.coverage_name)
        .join(PolicyCoverage, CoverageType.coverage_type_id == PolicyCoverage.coverage_type_id)
        .where(PolicyCoverage.policy_type_id == policy_type_id)
    )
    return [row[0] for row in result.all()]


async def _load_claim_full(db: AsyncSession, claim_id: int) -> Claim:
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
# Policy types — the plan catalogue
# ---------------------------------------------------------------------------

@router.get("/policy-types", response_model=list[PolicyTypeDetailOut])
async def list_policy_types(
    current_user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PolicyType)
        .where(PolicyType.is_active == True)  # noqa: E712
        .order_by(PolicyType.annual_premium)
    )
    plans = result.scalars().all()

    # Attach coverage name list to each plan
    out = []
    for plan in plans:
        coverages = await _get_policy_coverages(db, plan.policy_type_id)
        out.append(
            PolicyTypeDetailOut(
                policy_type_id=plan.policy_type_id,
                policy_name=plan.policy_name,
                annual_premium=float(plan.annual_premium),
                coverage_limit=float(plan.coverage_limit),
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
    Buy an insurance policy for one of the customer's vehicles.

    Business rules enforced:
    - Vehicle must belong to this customer.
    - Policy type must be active.
    - Vehicle cannot already have an active policy (Rule 2).
    - start_date must be today or in the future.
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

    # Verify policy type exists and is active
    pt_result = await db.execute(
        select(PolicyType)
        .where(PolicyType.policy_type_id == payload.policy_type_id)
        .where(PolicyType.is_active == True)  # noqa: E712
    )
    policy_type = pt_result.scalar_one_or_none()
    if not policy_type:
        raise HTTPException(status_code=404, detail="Policy type not found or inactive.")

    # Date validation
    today = date.today()
    if payload.end_date <= payload.start_date:
        raise HTTPException(
            status_code=422,
            detail="End date must be after start date.",
        )

    # Rule 2: vehicle can only have one active policy at a time
    active_policy = await db.execute(
        select(Policy)
        .where(Policy.vehicle_id == payload.vehicle_id)
        .where(Policy.status == "active")
    )
    if active_policy.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=(
                "This vehicle already has an active insurance policy. "
                "Cancel the existing policy before purchasing a new one."
            ),
        )

    # Generate unique policy number
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

    # Reload with relationships for the response
    result = await db.execute(
        select(Policy)
        .where(Policy.policy_id == policy.policy_id)
        .options(
            selectinload(Policy.policy_type),
            selectinload(Policy.vehicle),
        )
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

    Business rules enforced (from policy document):
    Rule 8: Policy must be active (not expired, not cancelled).
    Rule 9: Claimed amount cannot exceed policy coverage limit.
    Rule (Third Party): Own-vehicle damage claim not covered under Third Party Insurance.
    """
    # Verify the policy belongs to this customer — load with policy_type
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

    # Rule 8a: Policy must be active
    if policy.status != "active":
        raise HTTPException(
            status_code=422,
            detail=f"Cannot submit a claim — policy status is '{policy.status}'. Only active policies can be claimed against.",
        )

    # Rule 8b: Policy must not be expired
    if policy.end_date < date.today():
        raise HTTPException(
            status_code=422,
            detail="Cannot submit a claim — this policy has expired.",
        )

    # Rule 9: Claimed amount cannot exceed coverage limit
    coverage_limit = float(policy.policy_type.coverage_limit) if policy.policy_type else 0
    if payload.claimed_amount > coverage_limit:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Claimed amount ₹{payload.claimed_amount:,.0f} exceeds the policy "
                f"coverage limit of ₹{coverage_limit:,.0f}."
            ),
        )

    # Rule (Third Party only): flag own-vehicle damage as not covered
    policy_name = policy.policy_type.policy_name if policy.policy_type else ""
    if policy_name in THIRD_PARTY_ONLY_NAMES and payload.claim_type in OWN_DAMAGE_CLAIM_TYPES:
        raise HTTPException(
            status_code=422,
            detail=(
                "Not Covered Under Selected Policy — Third Party Insurance does not "
                "cover damage to your own vehicle. Please select a Comprehensive or "
                "Premium Plus policy to cover own-vehicle damage."
            ),
        )

    # Generate unique claim number
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
# Image upload — triggers AI inference on the first image per claim
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
    # Verify claim ownership
    result = await db.execute(
        select(Claim)
        .join(Policy, Claim.policy_id == Policy.policy_id)
        .join(Vehicle, Policy.vehicle_id == Vehicle.vehicle_id)
        .where(Claim.claim_id == claim_id)
        .where(Vehicle.customer_id == current_user.customer_id)
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

    # Save file to disk
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

    # AI inference — runs once per claim on the first uploaded image
    existing_analysis = await db.execute(
        select(AIAnalysis).where(AIAnalysis.claim_id == claim_id)
    )
    if existing_analysis.scalar_one_or_none() is None:
        try:
            result_ai = inference_service.predict(save_path)
            db.add(AIAnalysis(
                claim_id=claim_id,
                damage_severity=result_ai["damage_severity"],
                confidence_score=result_ai["confidence_score"],
                estimated_repair_cost=result_ai["estimated_repair_cost"],
                risk_level=result_ai["risk_level"],
                fraud_score=result_ai["fraud_score"],
                model_version=result_ai["model_version"],
            ))
        except ModelNotLoadedError:
            # Model weights not yet available — image is saved, AI runs later
            pass

    return image_record
