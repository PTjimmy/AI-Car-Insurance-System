"""
InsureAI — FastAPI Backend
Entry point: uvicorn app.main:app --reload
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import admin, auth, customer, images, officer
from app.core.config import settings
from app.services.ai_inference import ModelNotLoadedError, inference_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # -----------------------------------------------------------------------
    # Startup: attempt to load the ViT-B/16 model weights.
    # If the file is missing the server starts normally and returns 503
    # on AI endpoints only — everything else works.
    # -----------------------------------------------------------------------
    try:
        inference_service.load(settings.model_path_resolved)
        logger.info("AI model loaded successfully.")
    except ModelNotLoadedError as e:
        logger.warning("AI model NOT loaded: %s", e)
        logger.warning(
            "Place best_model.pth at '%s' and restart to enable AI inference.",
            settings.model_path_resolved.resolve(),
        )
    except Exception as e:
        logger.error("Unexpected error loading AI model: %s", e)

    yield
    # Shutdown (nothing to clean up for torch)


app = FastAPI(
    title="InsureAI API",
    description="AI-Based Car Insurance Claim Analysis System — Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow the Vite dev server and the production frontend URL
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router, prefix="/api/v1")
app.include_router(customer.router, prefix="/api/v1")
app.include_router(officer.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(images.router, prefix="/api/v1")


@app.get("/", tags=["health"])
async def health():
    return {
        "status": "ok",
        "service": "InsureAI API",
        "version": "1.0.0",
        "ai_model_loaded": inference_service.is_loaded,
    }
