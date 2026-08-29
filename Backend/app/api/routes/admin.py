"""
Admin routes:
  GET    /admin/users                         — list all users with metadata
  GET    /admin/users/{user_id}               — single user detail
  PUT    /admin/users/{user_id}/deactivate    — deactivate a user
  PUT    /admin/users/{user_id}/activate      — reactivate a user
  DELETE /admin/users/{user_id}               — permanently delete a user
  GET    /admin/claims                        — list all claims
  GET    /admin/claims/{claim_id}             — full claim detail
  POST   /admin/claims/{claim_id}/assign      — assign officer to claim
  GET    /admin/officers                      — list all officers
  POST   /admin/officers                      — create officer account
  GET    /admin/stats                         — dashboard statistics
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete as sql_delete
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import require_admin
from app.core.security import hash_password
from app.db.session import get_db
from app.models.models import (
    AIAnalysis,
    Claim,
    ClaimHistory,
    ClaimImage,
    ClaimOfficer,
    ClaimStatus,
    Customer,
    Policy,
    User,
    UserRole,
    Vehicle,
)
from app.schemas.schemas import (
    AdminOfficerCreate,
    AdminUserOut,
    AssignOfficerRequest,
    ClaimOut,
    OfficerOut,
)

router = APIRouter(prefix="/admin", tags=["admin"])


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

@router.get("/users", response_model=list[AdminUserOut])
async def list_users(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.get("/users/{user_id}", response_model=AdminUserOut)
async def get_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


@router.put("/users/{user_id}/deactivate", response_model=AdminUserOut)
async def deactivate_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account.")
    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_active = False
    return user


@router.put("/users/{user_id}/activate", response_model=AdminUserOut)
async def activate_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_active = True
    return user


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Permanently delete a user account.
    Also deletes the linked customer profile and their vehicles/policies/claims
    if it is a customer account.
    Cannot delete your own account or the last remaining admin.
    """
    if user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account.")

    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Protect last admin
    if user.role == UserRole.ADMIN:
        admin_count = (await db.execute(
            select(func.count()).select_from(User).where(User.role == UserRole.ADMIN)
        )).scalar()
        if admin_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete the last admin account.",
            )

    # For customers: clean up related records to avoid FK violations
    if user.role == UserRole.CUSTOMER and user.customer_id:
        cid = user.customer_id
        # Get all vehicles for this customer
        veh_result = await db.execute(select(Vehicle).where(Vehicle.customer_id == cid))
        vehicles = veh_result.scalars().all()
        for v in vehicles:
            # Get policies for this vehicle
            pol_result = await db.execute(select(Policy).where(Policy.vehicle_id == v.vehicle_id))
            policies = pol_result.scalars().all()
            for p in policies:
                # Delete claim history, images, ai analysis, then claims
                claims_r = await db.execute(select(Claim).where(Claim.policy_id == p.policy_id))
                claims = claims_r.scalars().all()
                for c in claims:
                    await db.execute(sql_delete(ClaimHistory).where(ClaimHistory.claim_id == c.claim_id))
                    await db.execute(sql_delete(ClaimImage).where(ClaimImage.claim_id == c.claim_id))
                    await db.execute(sql_delete(AIAnalysis).where(AIAnalysis.claim_id == c.claim_id))
                await db.execute(sql_delete(Claim).where(Claim.policy_id == p.policy_id))
                await db.execute(sql_delete(Policy).where(Policy.policy_id == p.policy_id))
            await db.execute(sql_delete(Vehicle).where(Vehicle.vehicle_id == v.vehicle_id))
        await db.execute(sql_delete(Customer).where(Customer.customer_id == cid))

    # For officers: unassign their claims
    if user.role == UserRole.CLAIM_OFFICER and user.officer_id:
        oid = user.officer_id
        claims_r = await db.execute(
            select(Claim).where(Claim.assigned_officer_id == oid)
        )
        for c in claims_r.scalars().all():
            c.assigned_officer_id = None
        await db.execute(
            sql_delete(ClaimHistory).where(ClaimHistory.officer_id == oid)
        )
        await db.execute(sql_delete(ClaimOfficer).where(ClaimOfficer.officer_id == oid))

    await db.delete(user)
    return None


# ---------------------------------------------------------------------------
# Claims
# ---------------------------------------------------------------------------

@router.get("/claims", response_model=list[ClaimOut])
async def list_all_claims(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Claim)
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
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
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
    claim = result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")
    return claim


@router.post("/claims/{claim_id}/assign", response_model=ClaimOut)
async def assign_officer(
    claim_id: int,
    payload: AssignOfficerRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    # Verify officer exists
    officer_result = await db.execute(
        select(ClaimOfficer).where(ClaimOfficer.officer_id == payload.officer_id)
    )
    if not officer_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Officer not found.")

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
    claim = result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")

    claim.assigned_officer_id = payload.officer_id
    if claim.status == ClaimStatus.PENDING:
        claim.status = ClaimStatus.UNDER_REVIEW

    return claim


# ---------------------------------------------------------------------------
# Officers
# ---------------------------------------------------------------------------

@router.get("/officers", response_model=list[OfficerOut])
async def list_officers(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ClaimOfficer).order_by(ClaimOfficer.officer_id))
    return result.scalars().all()


@router.post("/officers", response_model=OfficerOut, status_code=status.HTTP_201_CREATED)
async def create_officer(
    payload: AdminOfficerCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    # Check email uniqueness across users
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        )

    officer = ClaimOfficer(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        phone=payload.phone,
        status="active",
    )
    db.add(officer)
    await db.flush()

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=UserRole.CLAIM_OFFICER,
        officer_id=officer.officer_id,
    )
    db.add(user)

    return officer


# ---------------------------------------------------------------------------
# Dashboard stats
# ---------------------------------------------------------------------------

@router.get("/stats")
async def get_stats(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    total_users = (await db.execute(select(func.count()).select_from(User))).scalar()
    total_customers = (
        await db.execute(select(func.count()).select_from(User).where(User.role == UserRole.CUSTOMER))
    ).scalar()
    total_officers = (
        await db.execute(
            select(func.count()).select_from(User).where(User.role == UserRole.CLAIM_OFFICER)
        )
    ).scalar()
    total_claims = (await db.execute(select(func.count()).select_from(Claim))).scalar()
    pending = (
        await db.execute(
            select(func.count()).select_from(Claim).where(Claim.status == ClaimStatus.PENDING)
        )
    ).scalar()
    under_review = (
        await db.execute(
            select(func.count())
            .select_from(Claim)
            .where(Claim.status == ClaimStatus.UNDER_REVIEW)
        )
    ).scalar()
    approved = (
        await db.execute(
            select(func.count()).select_from(Claim).where(Claim.status == ClaimStatus.APPROVED)
        )
    ).scalar()
    rejected = (
        await db.execute(
            select(func.count()).select_from(Claim).where(Claim.status == ClaimStatus.REJECTED)
        )
    ).scalar()
    evidence_requested = (
        await db.execute(
            select(func.count())
            .select_from(Claim)
            .where(Claim.status == ClaimStatus.EVIDENCE_REQUESTED)
        )
    ).scalar()

    # AI stats
    ai_count = (await db.execute(select(func.count()).select_from(AIAnalysis))).scalar()
    avg_confidence_row = await db.execute(
        select(func.avg(AIAnalysis.confidence_score)).select_from(AIAnalysis)
    )
    avg_confidence = avg_confidence_row.scalar()

    return {
        "total_users": total_users,
        "total_customers": total_customers,
        "total_officers": total_officers,
        "total_claims": total_claims,
        "claims_by_status": {
            "Pending": pending,
            "Under Review": under_review,
            "Approved": approved,
            "Rejected": rejected,
            "Evidence Requested": evidence_requested,
        },
        "ai_assessments_completed": ai_count,
        "average_confidence": round(float(avg_confidence), 4) if avg_confidence else 0.0,
    }
