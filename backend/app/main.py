"""FastAPI application factory."""

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.config import settings
from app.database import create_db_and_tables
from app.routers.auth import router as auth_router
from app.routers.tasks import router as tasks_router
from app.utils.responses import error_response


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Create DB tables on startup."""
    await create_db_and_tables()
    yield


app = FastAPI(
    title="Hackathon Todo – Phase 2",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — explicit origins only (Constitution Principle IV)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth_router)
app.include_router(tasks_router)


# ── Dev-only token endpoint (NOT for production) ──────────────────
@app.post("/api/dev/token")
async def dev_token() -> dict:
    """Issue a JWT for the dev user. Only available when using SQLite."""
    if not settings.database_url.startswith("sqlite"):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    from jose import jwt as jose_jwt
    from datetime import datetime, timedelta
    payload = {
        "sub": "dev-user-001",
        "email": "dev@localhost",
        "exp": datetime.utcnow() + timedelta(days=30),
    }
    token = jose_jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
    return {
        "data": {
            "user": {"id": "dev-user-001", "email": "dev@localhost", "name": "Dev User"},
            "token": token,
        },
        "error": None,
        "meta": None,
    }


# Global exception handlers for consistent { data, error, meta } envelope
@app.exception_handler(ValidationError)
async def validation_exception_handler(
    request: Request, exc: ValidationError
) -> JSONResponse:
    details = [
        {"field": str(err.get("loc", ["unknown"])[-1]), "message": err["msg"]}
        for err in exc.errors()
    ]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_response("VALIDATION_ERROR", "Validation failed", details),
    )


@app.exception_handler(Exception)
async def general_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response("INTERNAL_ERROR", "An unexpected error occurred"),
    )
