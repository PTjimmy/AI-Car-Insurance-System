"""
Auth routes
===========
POST /auth/register            — create customer account, send email verification code
POST /auth/verify-email        — verify registration code → activate account
POST /auth/resend-verification — resend registration code
POST /auth/login               — validate password, send 2FA login code to email
POST /auth/verify-login        — validate 2FA login code → return JWT
POST /auth/resend-login-code   — resend 2FA login code
GET  /auth/me                  — current user info (requires JWT)
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
from app.schemas.schemas import (
    LoginRequest,
    LoginPendingResponse,
    RegisterRequest,
    TokenResponse,
    UserOut,
)
from app.services.email_service import send_verification_email

router = APIRouter(prefix="/auth", tags=["auth"])

REGISTER_CODE_TTL = 15   # minutes
LOGIN_CODE_TTL    = 10   # minutes — shorter for login


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _generate_code() -> str:
    return "".join(random.choices(string.digits, k=6))


def _now_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _expiry(minutes: int) -> datetime:
    return (_now_naive() + timedelta(minutes=minutes))


def _is_expired(expires_at: datetime | None) -> bool:
    if expires_at is None:
        return True
    exp = expires_at if expires_at.tzinfo else expires_at.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) > exp


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
    """Create a new customer account and send email verification code."""
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

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

    code = _generate_code()
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=UserRole.CUSTOMER,
        customer_id=customer.customer_id,
        is_verified=False,
        verification_code=code,
        code_expires_at=_expiry(REGISTER_CODE_TTL),
    )
    db.add(user)
    await db.flush()

    full_name = f"{customer.first_name} {customer.last_name}"
    send_verification_email(payload.email, full_name, code)

    return {
        "message": "Account created. A 6-digit verification code has been sent to your email.",
        "email": payload.email,
        "requires_verification": True,
    }


# ---------------------------------------------------------------------------
# Verify email (registration)
# ---------------------------------------------------------------------------

@router.post("/verify-email", response_model=TokenResponse)
async def verify_email(payload: dict, db: AsyncSession = Depends(get_db)):
    """Confirm registration code. Activates account and returns JWT."""
    email = payload.get("email", "").strip().lower()
    code  = payload.get("code", "").strip()

    if not email or not code:
        raise HTTPException(status_code=422, detail="email and code are required.")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Account not found.")

    if user.is_verified:
        token = create_access_token({"sub": str(user.user_id)})
        return TokenResponse(
            access_token=token, user_id=user.user_id,
            email=user.email, role=user.role,
            full_name=await _resolve_full_name(user, db),
        )

    if not user.verification_code:
        raise HTTPException(status_code=400, detail="No code found. Please request a new one.")
    if _is_expired(user.code_expires_at):
        raise HTTPException(status_code=400, detail="Code has expired. Please request a new one.")
    if user.verification_code != code:
        raise HTTPException(
            status_code=400,
            detail="Incorrect code. Please check your email and try again.",
        )

    user.is_verified = True
    user.verification_code = None
    user.code_expires_at = None

    token = create_access_token({"sub": str(user.user_id)})
    return TokenResponse(
        access_token=token, user_id=user.user_id,
        email=user.email, role=user.role,
        full_name=await _resolve_full_name(user, db),
    )


# ---------------------------------------------------------------------------
# Resend registration verification
# ---------------------------------------------------------------------------

@router.post("/resend-verification", response_model=dict)
async def resend_verification(payload: dict, db: AsyncSession = Depends(get_db)):
    email = payload.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=422, detail="email is required.")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        return {"message": "If an account exists for this email, a new code has been sent."}
    if user.is_verified:
        return {"message": "This account is already verified. You can log in."}

    # Rate-limit: only resend if old code is expired
    if user.code_expires_at and not _is_expired(user.code_expires_at):
        exp = user.code_expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        remaining = int((exp - datetime.now(timezone.utc)).total_seconds() // 60) + 1
        raise HTTPException(
            status_code=429,
            detail=f"Please wait {remaining} minute(s) before requesting a new code.",
        )

    code = _generate_code()
    user.verification_code = code
    user.code_expires_at = _expiry(REGISTER_CODE_TTL)

    full_name = user.email
    if user.customer_id:
        r = await db.execute(select(Customer).where(Customer.customer_id == user.customer_id))
        c = r.scalar_one_or_none()
        if c:
            full_name = f"{c.first_name} {c.last_name}"

    send_verification_email(email, full_name, code)
    return {"message": "A new verification code has been sent to your email."}


# ---------------------------------------------------------------------------
# Login  (Step 1 of 2FA — validate password, send login code)
# ---------------------------------------------------------------------------

@router.post("/login", response_model=LoginPendingResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Step 1 of 2-factor login.
    Validates email + password, then sends a 6-digit code to the user's email.
    Returns LoginPendingResponse — NOT a JWT yet.
    Call POST /auth/verify-login with the code to get the real JWT.
    """
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
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="EMAIL_NOT_VERIFIED",
        )

    # Generate and save login code
    code = _generate_code()
    user.login_code = code
    user.login_code_expires_at = _expiry(LOGIN_CODE_TTL)

    # Resolve display name for email
    full_name = await _resolve_full_name(user, db)

    # Send code
    send_verification_email(payload.email, full_name, code)

    return LoginPendingResponse(
        email=payload.email,
        message=f"A 6-digit login code has been sent to {payload.email}. It expires in {LOGIN_CODE_TTL} minutes.",
    )


# ---------------------------------------------------------------------------
# Verify login (Step 2 of 2FA — validate code, return JWT)
# ---------------------------------------------------------------------------

@router.post("/verify-login", response_model=TokenResponse)
async def verify_login(payload: dict, db: AsyncSession = Depends(get_db)):
    """
    Step 2 of 2-factor login.
    Validates the 6-digit login code and returns the full JWT.
    """
    email = payload.get("email", "").strip().lower()
    code  = payload.get("code", "").strip()

    if not email or not code:
        raise HTTPException(status_code=422, detail="email and code are required.")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Account not found.")

    if not user.login_code:
        raise HTTPException(
            status_code=400,
            detail="No login code found. Please go back and sign in again.",
        )
    if _is_expired(user.login_code_expires_at):
        raise HTTPException(
            status_code=400,
            detail="Login code has expired. Please sign in again.",
        )
    if user.login_code != code:
        raise HTTPException(
            status_code=400,
            detail="Incorrect login code. Please check your email and try again.",
        )

    # Clear the used code
    user.login_code = None
    user.login_code_expires_at = None

    token = create_access_token({"sub": str(user.user_id)})
    return TokenResponse(
        access_token=token, user_id=user.user_id,
        email=user.email, role=user.role,
        full_name=await _resolve_full_name(user, db),
    )


# ---------------------------------------------------------------------------
# Resend login code
# ---------------------------------------------------------------------------

@router.post("/resend-login-code", response_model=dict)
async def resend_login_code(payload: dict, db: AsyncSession = Depends(get_db)):
    """Resend a fresh login 2FA code. Rate-limited to once every 2 minutes."""
    email = payload.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=422, detail="email is required.")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        return {"message": "If an account exists for this email, a new code has been sent."}

    # Rate-limit: 2-minute cooldown
    if user.login_code_expires_at and not _is_expired(user.login_code_expires_at):
        exp = user.login_code_expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        remaining_secs = (exp - datetime.now(timezone.utc)).total_seconds()
        # Allow resend only if more than (LOGIN_CODE_TTL - 2) minutes used
        if remaining_secs > (LOGIN_CODE_TTL - 2) * 60:
            raise HTTPException(
                status_code=429,
                detail="Please wait 2 minutes before requesting a new login code.",
            )

    code = _generate_code()
    user.login_code = code
    user.login_code_expires_at = _expiry(LOGIN_CODE_TTL)

    full_name = await _resolve_full_name(user, db)
    send_verification_email(email, full_name, code)

    return {"message": "A new login code has been sent to your email."}


# ---------------------------------------------------------------------------
# Me
# ---------------------------------------------------------------------------

@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
