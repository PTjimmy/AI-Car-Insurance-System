"""
Serve uploaded claim images to authenticated users.
GET /images/{filename}
"""

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.deps import get_current_user
from app.models.models import User

router = APIRouter(prefix="/images", tags=["images"])


@router.get("/{filename}")
async def serve_image(
    filename: str,
    current_user: User = Depends(get_current_user),
):
    """Return a claim image file. Requires authentication."""
    # Prevent path traversal
    if ".." in filename or "/" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename.")

    path = settings.upload_dir_path / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Image not found.")

    return FileResponse(path)
