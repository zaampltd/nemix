from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

import models, database
from api import auth, datasets, training, models_api, inference, payments

# Create / migrate database tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="Nemix AI Platform API",
    version="1.0.0",
    description="Train, fine-tune and deploy AI models.",
)

# ── CORS ────────────────────────────────────────────────────────────────────
# When credentials=True, allow_origins cannot be ["*"] — specify real origins.
# ALLOWED_ORIGINS env var can be comma-separated list, e.g.:
#   ALLOWED_ORIGINS=https://nemix-jjjj.vercel.app,https://www.nemix.ai
_raw = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS = [o.strip() for o in _raw.split(",") if o.strip()] or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=bool(_raw),   # Only enable credentials when real origins set
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(datasets.router)
app.include_router(training.router)
app.include_router(models_api.router)
app.include_router(inference.router)
app.include_router(payments.router)


@app.get("/")
async def root():
    return {"message": "Nemix API is running", "version": "1.0.0", "docs": "/docs"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
