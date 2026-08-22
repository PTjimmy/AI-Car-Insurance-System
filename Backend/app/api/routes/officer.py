"""
Claims Officer routes:
  GET  /officer/claims              — list claims assigned to this officer
  GET  /officer/claims/{claim_id}   — full claim detail with AI + images
  PUT  /officer/claims/{claim_id}/status — update status, add remarks
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import require_officer
from app.db.session import get_db
from app.models.models import Claim, ClaimHistory, ClaimOfficer, Policy, User, Vehicle
from app.schemas.schemas import ClaimHistoryOut, ClaimOut, ClaimStatusUpdate

router = APIRouter(prefix="/officer", tags=["officer"])


async def _get_officer(user: User, db: AsyncSession) -> ClaimOfficer:
    result = await db.execute(
        select(ClaimOfficer).where(ClaimOfficer.officer_id == user.officer_id)
    )
    officer = result.scalar_one_or_none()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer profile not found.")
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
