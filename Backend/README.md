# InsureAI — Backend

FastAPI backend for the AI-Based Car Insurance Claim Analysis System.

---

## Project Structure

```
Backend/
├── app/
│   ├── api/routes/       # auth.py  customer.py  officer.py  admin.py  images.py
│   ├── core/             # config.py  security.py  deps.py
│   ├── db/               # session.py  (SQLAlchemy async engine + Base)
│   ├── models/           # models.py  (ORM models for all tables)
│   ├── schemas/          # schemas.py (Pydantic v2 request/response models)
│   ├── services/         # ai_inference.py  (ViT-B/16 inference service)
│   └── main.py           # FastAPI app + lifespan + CORS
├── ai_model/
│   ├── README.md         # ← READ THIS for model setup instructions
│   └── best_model.pth    # ← Place the trained weights here (not in git)
├── uploads/claim_images/ # Uploaded damage images (not in git)
├── requirements.txt
├── .env.example          # Copy to .env and fill in values
└── .gitignore
```

---

## Setup

### 1. PostgreSQL database

```bash
createdb ai_car_insurance
psql -d ai_car_insurance -f ../Database/ai_car_insurance_schema.sql
```

### 2. Python environment

```bash
cd Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Environment variables

```bash
cp .env.example .env
# Edit .env and set:
#   DATABASE_URL  — your PostgreSQL connection string
#   SECRET_KEY    — generate with: python -c "import secrets; print(secrets.token_hex(32))"
#   MODEL_PATH    — path to best_model.pth (default: ai_model/best_model.pth)
```

### 4. AI model weights

See `ai_model/README.md` for instructions on obtaining `best_model.pth`.

The server starts without the weights — AI endpoints return HTTP 503 until
the file is placed. Everything else (auth, claims, officers, admin) works.

### 5. Start the server

```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/v1/auth/register | — | Register customer |
| POST | /api/v1/auth/login | — | Login (returns JWT) |
| GET | /api/v1/auth/me | Any | Current user |
| GET | /api/v1/customer/profile | CUSTOMER | Get profile |
| PUT | /api/v1/customer/profile | CUSTOMER | Update profile |
| GET | /api/v1/customer/vehicles | CUSTOMER | List vehicles |
| POST | /api/v1/customer/vehicles | CUSTOMER | Add vehicle |
| GET | /api/v1/customer/policies | CUSTOMER | List policies |
| GET | /api/v1/customer/policy-types | CUSTOMER | Available plans |
| GET | /api/v1/customer/claims | CUSTOMER | My claims |
| POST | /api/v1/customer/claims | CUSTOMER | Submit claim |
| GET | /api/v1/customer/claims/{id} | CUSTOMER | Claim detail |
| POST | /api/v1/customer/claims/{id}/images | CUSTOMER | Upload image + run AI |
| GET | /api/v1/officer/claims | CLAIM_OFFICER | Assigned claims |
| GET | /api/v1/officer/claims/{id} | CLAIM_OFFICER | Claim detail |
| PUT | /api/v1/officer/claims/{id}/status | CLAIM_OFFICER | Update status/remarks |
| GET | /api/v1/admin/stats | ADMIN | Dashboard statistics |
| GET | /api/v1/admin/users | ADMIN | All users |
| PUT | /api/v1/admin/users/{id}/deactivate | ADMIN | Deactivate user |
| GET | /api/v1/admin/claims | ADMIN | All claims |
| POST | /api/v1/admin/claims/{id}/assign | ADMIN | Assign officer |
| GET | /api/v1/admin/officers | ADMIN | All officers |
| POST | /api/v1/admin/officers | ADMIN | Create officer account |
| GET | /api/v1/images/{filename} | Any auth | Serve claim image |

---

## Creating the first Admin user

The admin account is not created through the public register endpoint.
Run this script once after setting up the database:

```bash
cd Backend
source .venv/bin/activate
python3 - <<'EOF'
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.models.models import User, UserRole
from app.core.security import hash_password

async def create_admin():
    async with AsyncSessionLocal() as db:
        admin = User(
            email="admin@insureai.com",
            password_hash=hash_password("AdminPass123"),
            role=UserRole.ADMIN,
        )
        db.add(admin)
        await db.commit()
        print("Admin user created: admin@insureai.com / AdminPass123")

asyncio.run(create_admin())
EOF
```

Change the password immediately after first login.
