"""
SQLAlchemy ORM models — mirror of the PostgreSQL schema.
Table names match the schema exactly: users, customer, claim_officer,
vehicle, policy_type, coverage_type, policy_coverage, policy, claim,
claim_image, ai_analysis, claim_history.
"""

import enum
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    Enum,
    ForeignKey,
    Numeric,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


# ---------------------------------------------------------------------------
# Enums (must match the PostgreSQL enum types)
# ---------------------------------------------------------------------------

class UserRole(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    CLAIM_OFFICER = "CLAIM_OFFICER"
    ADMIN = "ADMIN"


class ClaimStatus(str, enum.Enum):
    PENDING = "Pending"
    UNDER_REVIEW = "Under Review"
    EVIDENCE_REQUESTED = "Evidence Requested"
    APPROVED = "Approved"
    REJECTED = "Rejected"


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", schema="public"),
        nullable=False,
        default=UserRole.CUSTOMER,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    # Email verification
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    verification_code: Mapped[Optional[str]] = mapped_column(String(6), nullable=True)
    code_expires_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    # Login 2FA
    login_code: Mapped[Optional[str]] = mapped_column(String(6), nullable=True)
    login_code_expires_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    customer_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("customer.customer_id", ondelete="SET NULL"), nullable=True
    )
    officer_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("claim_officer.officer_id", ondelete="SET NULL"), nullable=True
    )

    customer: Mapped[Optional["Customer"]] = relationship("Customer", back_populates="user")
    officer: Mapped[Optional["ClaimOfficer"]] = relationship("ClaimOfficer", back_populates="user")


# ---------------------------------------------------------------------------
# Customer
# ---------------------------------------------------------------------------

class Customer(Base):
    __tablename__ = "customer"

    customer_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")

    user: Mapped[Optional["User"]] = relationship("User", back_populates="customer")
    vehicles: Mapped[List["Vehicle"]] = relationship("Vehicle", back_populates="customer")


# ---------------------------------------------------------------------------
# ClaimOfficer
# ---------------------------------------------------------------------------

class ClaimOfficer(Base):
    __tablename__ = "claim_officer"

    officer_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")

    user: Mapped[Optional["User"]] = relationship("User", back_populates="officer")
    claim_history: Mapped[List["ClaimHistory"]] = relationship(
        "ClaimHistory", back_populates="officer"
    )
    assigned_claims: Mapped[List["Claim"]] = relationship(
        "Claim", back_populates="assigned_officer", foreign_keys="Claim.assigned_officer_id"
    )


# ---------------------------------------------------------------------------
# Vehicle
# ---------------------------------------------------------------------------

class Vehicle(Base):
    __tablename__ = "vehicle"

    vehicle_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    customer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("customer.customer_id"), nullable=False
    )
    registration_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    make: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str] = mapped_column(String(50), nullable=False)
    manufacturing_year: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    vehicle_value: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    customer: Mapped["Customer"] = relationship("Customer", back_populates="vehicles")
    policies: Mapped[List["Policy"]] = relationship("Policy", back_populates="vehicle")


# ---------------------------------------------------------------------------
# PolicyType
# ---------------------------------------------------------------------------

class PolicyType(Base):
    __tablename__ = "policy_type"

    policy_type_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    policy_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    annual_premium: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    coverage_limit: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    policies: Mapped[List["Policy"]] = relationship("Policy", back_populates="policy_type")


# ---------------------------------------------------------------------------
# CoverageType
# ---------------------------------------------------------------------------

class CoverageType(Base):
    __tablename__ = "coverage_type"

    coverage_type_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    coverage_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


# ---------------------------------------------------------------------------
# PolicyCoverage (M:N join table)
# ---------------------------------------------------------------------------

class PolicyCoverage(Base):
    __tablename__ = "policy_coverage"
    __table_args__ = (
        UniqueConstraint("policy_type_id", "coverage_type_id", name="pk_policy_coverage"),
    )

    policy_type_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("policy_type.policy_type_id"), primary_key=True
    )
    coverage_type_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("coverage_type.coverage_type_id"), primary_key=True
    )


# ---------------------------------------------------------------------------
# Policy
# ---------------------------------------------------------------------------

class Policy(Base):
    __tablename__ = "policy"

    policy_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    policy_number: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    vehicle_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("vehicle.vehicle_id"), nullable=False
    )
    policy_type_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("policy_type.policy_type_id"), nullable=False
    )
    start_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    end_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="policies")
    policy_type: Mapped["PolicyType"] = relationship("PolicyType", back_populates="policies")
    claims: Mapped[List["Claim"]] = relationship("Claim", back_populates="policy")


# ---------------------------------------------------------------------------
# Claim
# ---------------------------------------------------------------------------

class Claim(Base):
    __tablename__ = "claim"

    claim_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    claim_number: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    policy_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("policy.policy_id"), nullable=False
    )
    assigned_officer_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("claim_officer.officer_id", ondelete="SET NULL"),
        nullable=True,
    )
    accident_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    claim_date: Mapped[datetime] = mapped_column(server_default=func.now())
    claim_type: Mapped[str] = mapped_column(String(50), nullable=False, default="Vehicle Damage")
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    claimed_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    approved_amount: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    status: Mapped[ClaimStatus] = mapped_column(
        Enum(ClaimStatus, name="claim_status", schema="public",
             values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=ClaimStatus.PENDING,
    )
    decision_remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    policy: Mapped["Policy"] = relationship("Policy", back_populates="claims")
    assigned_officer: Mapped[Optional["ClaimOfficer"]] = relationship(
        "ClaimOfficer",
        back_populates="assigned_claims",
        foreign_keys=[assigned_officer_id],
    )
    images: Mapped[List["ClaimImage"]] = relationship("ClaimImage", back_populates="claim")
    ai_analysis: Mapped[Optional["AIAnalysis"]] = relationship(
        "AIAnalysis", back_populates="claim", uselist=False
    )
    history: Mapped[List["ClaimHistory"]] = relationship(
        "ClaimHistory", back_populates="claim", order_by="ClaimHistory.changed_at"
    )


# ---------------------------------------------------------------------------
# ClaimImage
# ---------------------------------------------------------------------------

class ClaimImage(Base):
    __tablename__ = "claim_image"

    image_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    claim_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("claim.claim_id"), nullable=False
    )
    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    image_type: Mapped[str] = mapped_column(String(50), nullable=False, default="damage")
    uploaded_at: Mapped[datetime] = mapped_column(server_default=func.now())

    claim: Mapped["Claim"] = relationship("Claim", back_populates="images")


# ---------------------------------------------------------------------------
# AIAnalysis
# ---------------------------------------------------------------------------

class AIAnalysis(Base):
    __tablename__ = "ai_analysis"

    analysis_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    claim_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("claim.claim_id"), unique=True, nullable=False
    )
    damage_severity: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    confidence_score: Mapped[Optional[float]] = mapped_column(Numeric(5, 4), nullable=True)
    estimated_repair_cost: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    risk_level: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    fraud_score: Mapped[Optional[float]] = mapped_column(Numeric(5, 4), nullable=True)
    model_version: Mapped[str] = mapped_column(String(50), default="vit-b16-v1")
    analyzed_at: Mapped[datetime] = mapped_column(server_default=func.now())

    claim: Mapped["Claim"] = relationship("Claim", back_populates="ai_analysis")


# ---------------------------------------------------------------------------
# ClaimHistory
# ---------------------------------------------------------------------------

class ClaimHistory(Base):
    __tablename__ = "claim_history"

    history_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    claim_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("claim.claim_id"), nullable=False
    )
    officer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("claim_officer.officer_id"), nullable=False
    )
    status: Mapped[ClaimStatus] = mapped_column(
        Enum(ClaimStatus, name="claim_status", schema="public",
             values_callable=lambda x: [e.value for e in x]), nullable=False
    )
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    changed_at: Mapped[datetime] = mapped_column(server_default=func.now())

    claim: Mapped["Claim"] = relationship("Claim", back_populates="history")
    officer: Mapped["ClaimOfficer"] = relationship("ClaimOfficer", back_populates="claim_history")
