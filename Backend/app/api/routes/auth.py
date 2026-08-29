"""
Auth routes
===========
POST /auth/register           — create customer account, send verification code
POST /auth/verify-email       — submit 6-digit code, activate account
POST /auth/resend-verification — resend a fresh code
POST /auth/login              — login (blocked if not verified)
GET  /auth/me                 — current user info
"""

import random
import string
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.models import ClaimOfficer, Customer, User, UserRole
from app.schemas.schemas import LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.services.email_service import send_verification_email

router = APIRouter(prefix="/auth", tags=["auth"])

CODE_TTL_MINUTES = 15


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _generate_code() -> str:
    """Return a random 6-digit numeric string."""
    return "".join(random.choices(string.digits, k=6))


def _code_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=CODE_TTL_MINUTES)


async def _resolve_full_name(user: User, db: AsyncSession) -> str:
    if user.role == UserRole.CUSTOMER and user.customer_id:
        r = await db.execute(
            select(Customer).where(Customer.customer_id == user.customer_id)
        )
        c = r.scalar_one_or_none()
        if c:
            return f"{c.first_name} {c.last_name}"
    elif user.role in (UserRole.CLAIM_OFFICER, UserRole.ADMIN) and user.officer_id:
        r = await db.execute(
            select(ClaimOfficer).where(ClaimOfficer.officer_id == user.officer_id)
        )
        o = r.scalar_one_or_none()
        if o:
            return f"{o.first_name} {o.last_name}"
    return user.email


# ---------------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------------

@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Create a new customer account.
    Sends a 6-digit verification code to the provided email.
    Account cannot be used until the code is verified.
    """
    # Email uniqueness check
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Create customer profile
    customer = Customer(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        phone=payload.phone,
        address=payload.address,
        status="active",
    )
    db.add(customer)
    await db.flush()

    # Generate verification code
    code = _generate_code()

    # Create user auth row — NOT verified yet
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=UserRole.CUSTOMER,
        customer_id=customer.customer_id,
        is_verified=False,
        verification_code=code,
        code_expires_at=_code_expiry().replace(tzinfo=None),  # store naive UTC
    )
    db.add(user)
    await db.flush()

    # Send email (falls back to console log if SMTP not configured)
    full_name = f"{customer.first_name} {customer.last_name}"
    send_verification_email(payload.email, full_name, code)

    return {
        "message": "Account created. A 6-digit verification code has been sent to your email.",
        "email": payload.email,
        "requires_verification": True,
    }


# ---------------------------------------------------------------------------
# Verify email
# ---------------------------------------------------------------------------

@router.post("/verify-email", response_model=TokenResponse)
async def verify_email(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    """
    Submit the 6-digit code.
    On success: marks account verified and returns a JWT (user is now logged in).
    """
    email = payload.get("email", "").strip().lower()
    code  = payload.get("code", "").strip()

    if not email or not code:
        raise HTTPException(status_code=422, detail="email and code are required.")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Account not found.")

    if user.is_verified:
        # Already verified — just return a token
        token = create_access_token({"sub": str(user.user_id)})
        full_name = await _resolve_full_name(user, db)
        return TokenResponse(
            access_token=token,
            user_id=user.user_id,
            email=user.email,
            role=user.role,
            full_name=full_name,
        )

    # Check code exists
    if not user.verification_code:
        raise HTTPException(
            status_code=400,
            detail="No verification code found. Please request a new one.",
        )

    # Check expiry
    if user.code_expires_at:
        expires = user.code_expires_at
        # Make timezone-aware for comparison
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(
                status_code=400,
                detail="Verification code has expired. Please request a new one.",
            )

    # Check code matches
    if user.verification_code != code:
        raise HTTPException(
            status_code=400,
            detail="Incorrect verification code. Please check your email and try again.",
        )

    # Activate account
    user.is_verified = True
    user.verification_code = None
    user.code_expires_at = None

    token = create_access_token({"sub": str(user.user_id)})
    full_name = await _resolve_full_name(user, db)

    return TokenResponse(
        access_token=token,
        user_id=user.user_id,
        email=user.email,
        role=user.role,
        full_name=full_name,
    )


# ---------------------------------------------------------------------------
# Resend verification
# ---------------------------------------------------------------------------

@router.post("/resend-verification", response_model=dict)
async def resend_verification(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    """Generate and send a fresh 6-digit code."""
    email = payload.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=422, detail="email is required.")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        # Don't reveal whether account exists
        return {"message": "If an account exists for this email, a new code has been sent."}

    if user.is_verified:
        return {"message": "This account is already verified. You can log in."}

    # Rate-limit: only resend if old code is expired or missing
    if user.code_expires_at:
        expires = user.code_expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        remaining = (expires - datetime.now(timezone.utc)).total_seconds()
        if remaining > 0:
            mins = int(remaining // 60) + 1
            raise HTTPException(
                status_code=429,
                detail=f"A code was already sent. Please wait {mins} minute(s) before requesting a new one.",
            )

    # Issue fresh code
    code = _generate_code()
    user.verification_code = code
    user.code_expires_at = _code_expiry().replace(tzinfo=None)

    # Resolve name for email
    full_name = user.email
    if user.customer_id:
        r = await db.execute(
            select(Customer).where(Customer.customer_id == user.customer_id)
        )
        c = r.scalar_one_or_none()
        if c:
            full_name = f"{c.first_name} {c.last_name}"

    send_verification_email(email, full_name, code)

    return {"message": "A new verification code has been sent to your email."}


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Contact an administrator.",
        )

    # Block unverified customers
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="EMAIL_NOT_VERIFIED",
        )

    token = create_access_token({"sub": str(user.user_id)})
    full_name = await _resolve_full_name(user, db)

    return TokenResponse(
        access_token=token,
        user_id=user.user_id,
        email=user.email,
        role=user.role,
        full_name=full_name,
    )


# ---------------------------------------------------------------------------
# Me
# ---------------------------------------------------------------------------

@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
