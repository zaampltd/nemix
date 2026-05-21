"""
Training API — supports real providers (Together AI, Hugging Face)
and falls back to simulation when no API key is configured.
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

import models, schemas, database
from api.auth import get_current_user
from api.training_providers import start_training_job

router = APIRouter(prefix="/training", tags=["training"])


# ─── POST /training/jobs ──────────────────────────────────────────────
@router.post("/jobs", response_model=schemas.TrainingJob)
def create_training_job(
    job_data: schemas.TrainingJobBase,
    provider: Optional[str] = "auto",
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Start a new training job.
    - provider: "together_ai" | "huggingface" | "simulated" | "auto"
    - API keys are read from user settings stored in DB (or env vars as fallback).
    """
    # Verify dataset belongs to user
    dataset = db.query(models.Dataset).filter(
        models.Dataset.id == job_data.dataset_id,
        models.Dataset.owner_id == current_user.id,
    ).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Verify model belongs to user
    model_obj = db.query(models.AIModel).filter(
        models.AIModel.id == job_data.model_id,
        models.AIModel.owner_id == current_user.id,
    ).first()
    if not model_obj:
        raise HTTPException(status_code=404, detail="Model not found")

    job_id = str(uuid.uuid4())

    new_job = models.TrainingJob(
        job_id=job_id,
        status="pending",
        user_id=current_user.id,
        dataset_id=job_data.dataset_id,
        model_id=job_data.model_id,
        total_epochs=job_data.total_epochs,
        logs=[],
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    # Load user API keys from their settings (stored in user.settings JSON col if available)
    provider_config = {}
    try:
        if hasattr(current_user, "settings") and current_user.settings:
            import json
            s = current_user.settings if isinstance(current_user.settings, dict) else json.loads(current_user.settings)
            provider_config = {
                "together_api_key": s.get("together_api_key", ""),
                "hf_token":         s.get("hf_token", ""),
                "hf_username":      s.get("hf_username", ""),
            }
    except Exception:
        pass

    # Launch background training thread
    start_training_job(
        job_id=job_id,
        dataset_id=job_data.dataset_id,
        model_id=job_data.model_id,
        user_id=current_user.id,
        epochs=job_data.total_epochs,
        provider_name=provider or "auto",
        provider_config=provider_config,
    )

    return new_job


# ─── GET /training/jobs ───────────────────────────────────────────────
@router.get("/jobs", response_model=List[schemas.TrainingJob])
def list_training_jobs(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.TrainingJob)
        .filter(models.TrainingJob.user_id == current_user.id)
        .order_by(models.TrainingJob.created_at.desc())
        .all()
    )


# ─── GET /training/jobs/{job_id} ──────────────────────────────────────
@router.get("/jobs/{job_id}", response_model=schemas.TrainingJob)
def get_training_job(
    job_id: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    job = db.query(models.TrainingJob).filter(
        models.TrainingJob.job_id == job_id,
        models.TrainingJob.user_id == current_user.id,
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Training job not found")
    return job


# ─── DELETE /training/jobs/{job_id} (cancel) ─────────────────────────
@router.delete("/jobs/{job_id}")
def cancel_training_job(
    job_id: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    job = db.query(models.TrainingJob).filter(
        models.TrainingJob.job_id == job_id,
        models.TrainingJob.user_id == current_user.id,
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status in ("completed", "failed"):
        raise HTTPException(status_code=400, detail="Cannot cancel a finished job")

    job.status = "failed"
    logs = list(job.logs) if job.logs else []
    logs.append({"message": "⛔ Job cancelled by user.", "timestamp": __import__("time").time()})
    job.logs = logs
    db.commit()
    return {"ok": True, "job_id": job_id}


# ─── GET /training/providers ──────────────────────────────────────────
@router.get("/providers")
def list_providers(current_user: models.User = Depends(get_current_user)):
    """Return available providers and their configuration status."""
    import os
    return [
        {
            "id": "nvidia_nim",
            "name": "NVIDIA NIM",
            "logo": "⚡",
            "description": "Run inference on NVIDIA's optimized LLM endpoints (LLaMA 3, Mistral, Phi-3).",
            "signup_url": "https://build.nvidia.com",
            "requires_key": True,
            "env_var": "NVIDIA_API_KEY",
            "configured": bool(os.getenv("NVIDIA_API_KEY", "")),
            "free_tier": "Free API credits on signup",
            "recommended": True,
        },
        {
            "id": "openrouter",
            "name": "OpenRouter",
            "logo": "🔀",
            "description": "Access 200+ LLMs via a single OpenAI-compatible API.",
            "signup_url": "https://openrouter.ai",
            "requires_key": True,
            "env_var": "OPENROUTER_API_KEY",
            "configured": bool(os.getenv("OPENROUTER_API_KEY", "")),
            "free_tier": "Free credits on signup",
        },
        {
            "id": "mistral",
            "name": "Mistral AI",
            "logo": "🌊",
            "description": "Fine-tune and deploy Mistral 7B, Mixtral models.",
            "signup_url": "https://console.mistral.ai",
            "requires_key": True,
            "env_var": "MISTRAL_API_KEY",
            "configured": bool(os.getenv("MISTRAL_API_KEY", "")),
            "free_tier": "Free trial available",
        },
        {
            "id": "groq",
            "name": "Groq",
            "logo": "🚀",
            "description": "Ultra-fast LLaMA 3, Mixtral inference on Groq's LPU hardware.",
            "signup_url": "https://console.groq.com",
            "requires_key": True,
            "env_var": "GROQ_API_KEY",
            "configured": bool(os.getenv("GROQ_API_KEY", "")),
            "free_tier": "Generous free tier — no credit card",
        },
        {
            "id": "ollama_free",
            "name": "OllamaFreeAPI",
            "logo": "🦙",
            "description": "Free Ollama-compatible API — no key required. Limited rate.",
            "signup_url": "https://github.com/mfoud444/ollamafreeapi",
            "requires_key": False,
            "env_var": None,
            "configured": True,
            "free_tier": "Always free",
        },
    ]


# ─── POST /training/api-keys ──────────────────────────────────────────
@router.post("/api-keys")
def save_provider_keys(
    keys: dict = Body(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Save user's provider API keys to their profile settings.
    Body: { "together_api_key": "...", "hf_token": "...", "hf_username": "..." }
    """
    import json
    try:
        existing = {}
        if hasattr(current_user, "settings") and current_user.settings:
            existing = current_user.settings if isinstance(current_user.settings, dict) else json.loads(current_user.settings)
    except Exception:
        existing = {}

    existing.update({k: v for k, v in keys.items() if v is not None})

    if hasattr(current_user, "settings"):
        current_user.settings = existing
        db.commit()

    return {"ok": True, "message": "API keys saved. They will be used for your next training job."}
