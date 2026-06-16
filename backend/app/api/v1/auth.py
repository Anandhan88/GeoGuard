"""
GeoGuard AI - Authentication API
Now integrated with SQLAlchemy async database operations.
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import User
from app.core.security import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, decode_token, get_current_user,
)

router = APIRouter()


class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = "citizen"
    phone: Optional[str] = None
    language_pref: str = "en"
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


# Seed function to ensure demo users exist
async def seed_demo_users(db: AsyncSession):
    """Seed demo accounts if they do not exist in the database."""
    # Seed citizen
    result = await db.execute(select(User).filter(User.email == "citizen@demo.com"))
    citizen = result.scalars().first()
    if not citizen:
        new_citizen = User(
            id="demo-citizen",
            email="citizen@demo.com",
            name="Rajesh Kumar",
            role="citizen",
            hashed_password=hash_password("demo123"),
            phone="+91-9876543210",
            language_pref="en",
        )
        db.add(new_citizen)

    # Seed authority
    result = await db.execute(select(User).filter(User.email == "authority@demo.com"))
    authority = result.scalars().first()
    if not authority:
        new_authority = User(
            id="demo-authority",
            email="authority@demo.com",
            name="Dr. Priya IAS",
            role="authority",
            hashed_password=hash_password("demo123"),
            phone="+91-9876543211",
            language_pref="en",
        )
        db.add(new_authority)

    try:
        await db.commit()
    except Exception:
        await db.rollback()


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user in the database."""
    # Check if email exists
    result = await db.execute(select(User).filter(User.email == request.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user
    user = User(
        email=request.email,
        name=request.name,
        role=request.role,
        hashed_password=hash_password(request.password),
        phone=request.phone,
        language_pref=request.language_pref,
    )
    # Set coordinates if SQLite, or geography if PostGIS
    if hasattr(user, 'latitude'):
        user.latitude = request.latitude
        user.longitude = request.longitude

    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token({"sub": user.id, "role": user.role})
    refresh_token = create_refresh_token({"sub": user.id, "role": user.role})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={"id": user.id, "email": user.email, "name": user.name, "role": user.role},
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with email and password."""
    result = await db.execute(select(User).filter(User.email == request.email))
    user = result.scalars().first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token({"sub": user.id, "role": user.role})
    refresh_token = create_refresh_token({"sub": user.id, "role": user.role})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={"id": user.id, "email": user.email, "name": user.name, "role": user.role},
    )


@router.get("/me")
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Get current user's profile from database."""
    result = await db.execute(select(User).filter(User.id == current_user["id"]))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    response_data = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "phone": user.phone,
        "language_pref": user.language_pref,
    }
    if hasattr(user, 'latitude'):
        response_data["latitude"] = user.latitude
        response_data["longitude"] = user.longitude

    return response_data


@router.post("/refresh")
async def refresh_token(refresh_token: str):
    """Refresh access token."""
    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=400, detail="Invalid refresh token")

    new_access = create_access_token({"sub": payload["sub"], "role": payload.get("role", "citizen")})
    return {"access_token": new_access, "token_type": "bearer"}
