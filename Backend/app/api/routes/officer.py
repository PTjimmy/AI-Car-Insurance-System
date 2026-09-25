"""
Claims Officer routes:
  GET  /officer/profile             — get own profile (officer name, phone)
  PUT  /officer/profile             — update own profile (name, phone)
  GET  /officer/claims              — list claims assigned to this officer
  GET  /officer/claims/{claim_id}   — full claim detail with AI + images
  PUT  /officer/claims/{claim_id}/status — update status, add remarks

Note: Admin users also use these profile routes since admin accounts
      are linked to claim_officer rows via users.officer_id.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_user, require_officer, require_officer_or_admin
from app.db.session import get_db
from app.models.models import Claim, ClaimHistory, ClaimOfficer, Policy, User, Vehicle, UserRole
from app.schemas.schemas import ClaimHistoryOut, ClaimOut, ClaimStatusUpdate, OfficerOut, OfficerUpdate

router = APIRouter(prefix="/officer", tags=["officer"])


async def _get_officer(user: User, db: AsyncSession) -> ClaimOfficer:
    result = await db.execute(
        select(ClaimOfficer).where(ClaimOfficer.officer_id == user.officer_id)
    )
    officer = result.scalar_one_or_none()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer profile not found.")
    return officer


# ---------------------------------------------------------------------------
# Profile — available to both CLAIM_OFFICER and ADMIN
# ---------------------------------------------------------------------------

@router.get("/profile", response_model=OfficerOut)
async def get_officer_profile(
    current_user: User = Depends(require_officer_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """Return the current officer/admin's profile."""
    if current_user.officer_id is None:
        # Admin created without a linked officer row — return a minimal profile
        raise HTTPException(
            status_code=404,
            detail=(
                "No officer profile linked to this admin account. "
                "Create the admin account via POST /admin/officers to get a linked profile."
            ),
        )
    return await _get_officer(current_user, db)


@router.put("/profile", response_model=OfficerOut)
async def update_officer_profile(
    payload: OfficerUpdate,
    current_user: User = Depends(require_officer_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update name and/or phone for the current officer/admin."""
    if current_user.officer_id is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "No officer profile linked to this admin account. "
                "Create the admin account via POST /admin/officers to get a linked profile."
            ),
        )
    officer = await _get_officer(current_user, db)

    if payload.first_name is not None:
        officer.first_name = payload.first_name
    if payload.last_name is not None:
        officer.last_name = payload.last_name
    if payload.phone is not None:
        officer.phone = payload.phone

    return officer


@router.get("/claims", response_model=list[ClaimOut])
async def list_assigned_claims(
    current_user: User = Depends(require_officer),
    db: AsyncSession = Depends(get_db),
):
    officer = await _get_officer(current_user, db)
    result = await db.execute(
        select(Claim)
        .where(Claim.assigned_officer_id == officer.officer_id)
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
async def get_claim_detail(
    claim_id: int,
    current_user: User = Depends(require_officer),
    db: AsyncSession = Depends(get_db),
):
    officer = await _get_officer(current_user, db)
    result = await db.execute(
        select(Claim)
        .where(Claim.claim_id == claim_id)
        .where(Claim.assigned_officer_id == officer.officer_id)
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
        raise HTTPException(status_code=404, detail="Claim not found or not assigned to you.")
    return claim


@router.put("/claims/{claim_id}/status", response_model=ClaimOut)
async def update_claim_status(
    claim_id: int,
    payload: ClaimStatusUpdate,
    current_user: User = Depends(require_officer),
    db: AsyncSession = Depends(get_db),
):
    officer = await _get_officer(current_user, db)

    result = await db.execute(
        select(Claim)
        .where(Claim.claim_id == claim_id)
        .where(Claim.assigned_officer_id == officer.officer_id)
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
        raise HTTPException(status_code=404, detail="Claim not found or not assigned to you.")

    claim.status = payload.status
    if payload.remarks is not None:
        claim.decision_remarks = payload.remarks
    if payload.approved_amount is not None:
        claim.approved_amount = payload.approved_amount

    # Write history entry
    history = ClaimHistory(
        claim_id=claim_id,
        officer_id=officer.officer_id,
        status=payload.status,
        remarks=payload.remarks,
    )
    db.add(history)

    return claim
