"""
Auth routes: POST /auth/register, POST /auth/login
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.models import ClaimOfficer, Customer, User, UserRole
from app.schemas.schemas import LoginRequest, RegisterRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new customer. Officers and Admins are created by the Admin."""

    # Check email uniqueness
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Create customer profile row
    customer = Customer(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        phone=payload.phone,
        address=payload.address,
        status="active",
    )
    db.add(customer)
    await db.flush()  # get customer_id before commit

    # Create user auth row
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=UserRole.CUSTOMER,
        customer_id=customer.customer_id,
    )
    db.add(user)
    await db.flush()

    token = create_access_token({"sub": str(user.user_id)})
    return TokenResponse(
        access_token=token,
        user_id=user.user_id,
        email=user.email,
        role=user.role,
        full_name=f"{customer.first_name} {customer.last_name}",
    )


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

    # Resolve display name
    full_name = user.email
    if user.role == UserRole.CUSTOMER and user.customer_id:
        r = await db.execute(
            select(Customer).where(Customer.customer_id == user.customer_id)
        )
        c = r.scalar_one_or_none()
        if c:
            full_name = f"{c.first_name} {c.last_name}"
    elif user.role in (UserRole.CLAIM_OFFICER, UserRole.ADMIN) and user.officer_id:
        r = await db.execute(
            select(ClaimOfficer).where(ClaimOfficer.officer_id == user.officer_id)
        )
        o = r.scalar_one_or_none()
        if o:
            full_name = f"{o.first_name} {o.last_name}"

    token = create_access_token({"sub": str(user.user_id)})
    return TokenResponse(
        access_token=token,
        user_id=user.user_id,
        email=user.email,
        role=user.role,
        full_name=full_name,
    )


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
