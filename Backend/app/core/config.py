from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ai_car_insurance"

    # JWT
    SECRET_KEY: str = "change_this_to_a_random_secret_key_at_least_32_chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # File uploads
    UPLOAD_DIR: str = "uploads/claim_images"

    # AI model
    # ---------------------------------------------------------------
    # Place your trained best_model.pth at:
    #   Backend/ai_model/best_model.pth
    # Then set MODEL_PATH=ai_model/best_model.pth in your .env file.
    # The file is produced by the ViT-B/16 training notebook at:
    #   AI-ML/severity_of_vehicles_damage_using_ViT.ipynb
    # ---------------------------------------------------------------
    MODEL_PATH: str = "ai_model/best_model.pth"

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    @property
    def upload_dir_path(self) -> Path:
        p = Path(self.UPLOAD_DIR)
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def model_path_resolved(self) -> Path:
        return Path(self.MODEL_PATH)


settings = Settings()
