"""
Pydantic v2 schemas for request/response validation.

Field labelling convention used throughout:
  damage_severity, confidence_score, model_version
      → AI prediction fields (ViT output only)

  coverage_pct_applied, deductible_applied, estimated_claim_amount
      → Business-rule / policy calculation fields (claim_estimator.py)

  claimed_amount
      → Customer-submitted repair estimate (Option B input)
        Labelled in UI as "Customer Claimed Amount" — NOT an AI prediction.

  fraud_score, risk_level, estimated_repair_cost
      → Legacy fields kept for backward compatibility.
        Not actively populated. Excluded from new display schemas.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, field_validator

from app.models.models import ClaimStatus, UserRole


# ===========================================================================
# Auth
# ===========================================================================

class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    password: str
    address: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    role: UserRole
    full_name: str


class LoginPendingResponse(BaseModel):
    """Returned by /auth/login when 2FA code has been sent."""
    requires_verification: bool = True
    email: str
    message: str


# ===========================================================================
# User / Profile
# ===========================================================================

class UserOut(BaseModel):
    model_config = {"from_attributes": True}

    user_id: int
    email: str
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    customer_id: Optional[int]
    officer_id: Optional[int]


class CustomerOut(BaseModel):
    model_config = {"from_attributes": True}

    customer_id: int
    first_name: str
    last_name: str
    email: str
    phone: str
    address: Optional[str]
    created_at: datetime
    status: str


class CustomerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class OfficerOut(BaseModel):
    model_config = {"from_attributes": True}

    officer_id: int
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    status: str


# ===========================================================================
# Vehicle
# ===========================================================================

class VehicleCreate(BaseModel):
    registration_number: str
    make: str
    model: str
    manufacturing_year: int
    vehicle_value: float


class VehicleOut(BaseModel):
    model_config = {"from_attributes": True}

    vehicle_id: int
    customer_id: int
    registration_number: str
    make: str
    model: str
    manufacturing_year: int
    vehicle_value: float
    created_at: datetime


# ===========================================================================
# Policy
# ===========================================================================

class PolicyTypeOut(BaseModel):
    """
    Basic policy type information.
    Includes per-severity coverage percentages, deductible, and max_claim
    so the frontend can display policy rules without hard-coding them.
    """
    model_config = {"from_attributes": True}

    policy_type_id: int
    policy_code: Optional[str]
    policy_name: str
    annual_premium: float
    coverage_limit: float
    # Per-severity coverage percentages (from P001–P006 policy document)
    minor_coverage_pct: Optional[float]
    moderate_coverage_pct: Optional[float]
    severe_coverage_pct: Optional[float]
    deductible: Optional[float]
    max_claim: Optional[float]
    description: Optional[str]
    is_active: bool


class PolicyTypeDetailOut(BaseModel):
    """
    Policy type with coverage names list (for Buy Policy page).
    Includes all calculation fields so the frontend can display them.
    """
    model_config = {"from_attributes": True}

    policy_type_id: int
    policy_code: Optional[str]
    policy_name: str
    annual_premium: float
    coverage_limit: float
    minor_coverage_pct: Optional[float]
    moderate_coverage_pct: Optional[float]
    severe_coverage_pct: Optional[float]
    deductible: Optional[float]
    max_claim: Optional[float]
    description: Optional[str]
    is_active: bool
    coverages: List[str] = []


class PolicyCreate(BaseModel):
    vehicle_id: int
    policy_type_id: int
    start_date: date
    end_date: date


class PolicyOut(BaseModel):
    model_config = {"from_attributes": True}

    policy_id: int
    policy_number: str
    vehicle_id: int
    policy_type_id: int
    start_date: date
    end_date: date
    status: str
    created_at: datetime
    policy_type: Optional[PolicyTypeOut] = None
    vehicle: Optional[VehicleOut] = None


# ===========================================================================
# AI Analysis
#
# Field labelling — enforced in API response so the frontend can
# distinguish AI outputs from business-rule outputs:
#
#   AI prediction (ViT):
#     damage_severity, confidence_score, model_version, analyzed_at
#
#   Business-rule calculation (claim_estimator.py):
#     coverage_pct_applied, deductible_applied, estimated_claim_amount
#
#   Image strategy:
#     is_primary_image — True if this analysis is for the first/primary
#     image. Always True for the single ai_analysis row per claim.
#
#   Legacy (backward compat, not actively populated):
#     estimated_repair_cost, risk_level, fraud_score
#     Omitted from this schema — they are not displayed in the UI.
# ===========================================================================

class AIAnalysisOut(BaseModel):
    model_config = {"from_attributes": True}

    analysis_id: int
    claim_id: int

    # --- AI prediction fields ---
    damage_severity: Optional[str]       # "Minor" | "Moderate" | "Severe"
    confidence_score: Optional[float]    # 0.0 – 1.0

    # --- Business-rule calculation fields ---
    coverage_pct_applied: Optional[float]    # e.g. 90.0 (%)
    deductible_applied: Optional[float]      # e.g. 2000.0 (₹)
    estimated_claim_amount: Optional[float]  # final after deductible + max cap (₹)

    # --- Metadata ---
    is_primary_image: bool
    model_version: Optional[str]
    analyzed_at: datetime

    # Legacy fields excluded intentionally:
    #   estimated_repair_cost — was a hard-coded business rule, not AI
    #   risk_level            — removed (no documented rule)
    #   fraud_score           — removed (no fraud model)


# ===========================================================================
# Claim Image
# ===========================================================================

class ClaimImageOut(BaseModel):
    model_config = {"from_attributes": True}

    image_id: int
    claim_id: int
    file_path: str
    image_type: str
    uploaded_at: datetime


# ===========================================================================
# Claim History
# ===========================================================================

class ClaimHistoryOut(BaseModel):
    model_config = {"from_attributes": True}

    history_id: int
    claim_id: int
    officer_id: int
    status: ClaimStatus
    remarks: Optional[str]
    changed_at: datetime


# ===========================================================================
# Claim
# ===========================================================================

class ClaimCreate(BaseModel):
    policy_id: int
    accident_date: date
    claim_type: str = "Vehicle Damage"
    location: Optional[str] = None
    description: str
    claimed_amount: float  # Customer-submitted repair estimate (Option B input)


class ClaimStatusUpdate(BaseModel):
    status: ClaimStatus
    remarks: Optional[str] = None
    approved_amount: Optional[float] = None


class ClaimOut(BaseModel):
    model_config = {"from_attributes": True}

    claim_id: int
    claim_number: str
    policy_id: int
    assigned_officer_id: Optional[int]
    accident_date: date
    claim_date: datetime
    claim_type: str
    location: Optional[str]
    description: str
    claimed_amount: float       # Customer-submitted repair estimate
    approved_amount: Optional[float]
    status: ClaimStatus
    decision_remarks: Optional[str]
    created_at: datetime
    images: List[ClaimImageOut] = []
    ai_analysis: Optional[AIAnalysisOut] = None
    history: List[ClaimHistoryOut] = []
    policy: Optional[PolicyOut] = None


# ===========================================================================
# Admin
# ===========================================================================

class AdminUserOut(BaseModel):
    model_config = {"from_attributes": True}

    user_id: int
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime
    customer_id: Optional[int]
    officer_id: Optional[int]


class AssignOfficerRequest(BaseModel):
    officer_id: int


class AdminOfficerCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v
