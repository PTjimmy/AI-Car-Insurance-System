"""
Serve uploaded claim images.
GET /images/{filename}

Authentication: token can be supplied either as:
  - Authorization: Bearer <token>  header (API calls)
  - ?token=<jwt>                   query param (browser <img> tags)

The filename itself is a UUID-based name (e.g. 4_a1b2c3d4.jpg) which
provides sufficient obscurity — no sequential IDs are exposed.
"""

from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings
from app.core.security import decode_token
from app.db.session import get_db
from app.models.models import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/images", tags=["images"])

bearer_scheme = HTTPBearer(auto_error=False)


async def get_image_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    token: Optional[str] = Query(default=None, alias="token"),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Accept JWT from either Authorization header or ?token= query param.
    The query param is needed for browser <img src="...?token=..."> tags.
    """
    raw_token = None
    if credentials:
        raw_token = credentials.credentials
    elif token:
        raw_token = token

    if not raw_token:
        raise HTTPException(status_code=401, detail="Not authenticated.")

    payload = decode_token(raw_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.user_id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found.")
    return user


@router.get("/{filename}")
async def serve_image(
    filename: str,
    current_user: User = Depends(get_image_user),
):
    """Return a claim image. Requires authentication via header or ?token= param."""
    # Prevent path traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename.")

    path = settings.upload_dir_path / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Image not found.")

    return FileResponse(path)
