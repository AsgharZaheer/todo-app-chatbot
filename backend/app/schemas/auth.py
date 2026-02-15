"""Pydantic schemas for authentication requests/responses."""

from pydantic import BaseModel, EmailStr, field_validator


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) < 1:
            raise ValueError("Name is required")
        if len(v) > 100:
            raise ValueError("Name must be 100 characters or less")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class SigninRequest(BaseModel):
    email: EmailStr
    password: str


class AuthUser(BaseModel):
    id: str
    email: str
    name: str


class AuthResponse(BaseModel):
    user: AuthUser
    token: str
