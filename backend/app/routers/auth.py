"""Authentication router — signup and signin endpoints."""

from datetime import datetime, timedelta

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt as jose_jwt
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.config import settings
from app.database import get_session
from app.models.user import User
from app.schemas.auth import AuthResponse, AuthUser, SigninRequest, SignupRequest

router = APIRouter(prefix="/api/auth", tags=["auth"])

TOKEN_EXPIRE_DAYS = 30


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def _create_token(user: User) -> str:
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "exp": datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS),
    }
    return jose_jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(
    body: SignupRequest,
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Register a new user account."""
    existing = await session.exec(select(User).where(User.email == body.email))
    if existing.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        name=body.name.strip(),
        email=body.email,
        hashed_password=_hash_password(body.password),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    token = _create_token(user)
    return {
        "data": AuthResponse(
            user=AuthUser(id=str(user.id), email=user.email, name=user.name),
            token=token,
        ).model_dump(),
        "error": None,
        "meta": None,
    }


@router.post("/signin")
async def signin(
    body: SigninRequest,
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Authenticate with email and password."""
    result = await session.exec(select(User).where(User.email == body.email))
    user = result.first()

    if not user or not _verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = _create_token(user)
    return {
        "data": AuthResponse(
            user=AuthUser(id=str(user.id), email=user.email, name=user.name),
            token=token,
        ).model_dump(),
        "error": None,
        "meta": None,
    }
