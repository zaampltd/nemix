"""
Training Provider Module with Automatic Fallback Chain
=======================================================
When training hits an error on one provider or model, the system
automatically switches to the next one and keeps going.

Fallback order (configurable):
  1. Together AI — llama3-8b  (primary)
  2. Together AI — mistral-7b  (smaller model, same provider)
  3. Together AI — gpt2        (tiny model, very cheap)
  4. Hugging Face — bert       (CPU, always available with token)

Each step is logged clearly so the user can see exactly what happened.
"""
import os
import time
import uuid
import threading
import requests
from typing import Optional, Dict, List, Callable

from database import SessionLocal
import models


# ─── Provider base ────────────────────────────────────────────────────
class TrainingProvider:
    name: str = "base"

    def start_job(self, config: Dict) -> Dict:
        raise NotImplementedError

    def get_status(self, external_id: str) -> Dict:
        raise NotImplementedError

    def cancel_job(self, external_id: str) -> bool:
        return False


# ─── Together AI ──────────────────────────────────────────────────────
class TogetherAIProvider(TrainingProvider):
    name = "together_ai"
    BASE = "https://api.together.xyz/v1"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    def upload_file(self, file_path: str) -> str:
        with open(file_path, "rb") as f:
            resp = requests.post(
                f"{self.BASE}/files",
                headers={"Authorization": f"Bearer {self.api_key}"},
                files={"file": (os.path.basename(file_path), f, "application/json")},
                data={"purpose": "fine-tune"},
                timeout=120,
            )
        resp.raise_for_status()
        return resp.json()["id"]

    def start_job(self, config: Dict) -> Dict:
        file_id = config.get("training_file_id")
        if not file_id and config.get("file_path"):
            file_id = self.upload_file(config["file_path"])

        resp = requests.post(
            f"{self.BASE}/fine-tunes",
            headers=self.headers,
            json={
                "training_file": file_id,
                "model": config["model"],
                "n_epochs": config.get("n_epochs", 3),
                "learning_rate": config.get("learning_rate", 1e-5),
                "batch_size": config.get("batch_size", 4),
                "suffix": config.get("suffix", "nemix"),
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        return {"external_id": data["id"], "provider": self.name, "model": config["model"]}

    def get_status(self, external_id: str) -> Dict:
        resp = requests.get(
            f"{self.BASE}/fine-tunes/{external_id}",
            headers=self.headers,
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        events = data.get("events", [])
        status_map = {
            "queued": "pending", "pending": "pending",
            "running": "training", "completed": "completed",
            "failed": "failed", "cancelled": "failed", "error": "failed",
        }
        status = status_map.get(data.get("status", "queued").lower(), "pending")
        progress = (
            5.0 if status == "pending" else
            min(10 + len(events) * 3, 90) if status == "training" else
            100.0 if status == "completed" else 0.0
        )
        logs = [{"message": e.get("message", ""), "timestamp": e.get("created_at", 0)}
                for e in events[-5:]]
        return {
            "external_id": external_id, "status": status,
            "progress": progress, "logs": logs,
            "output_model": data.get("output_name"),
        }

    def cancel_job(self, external_id: str) -> bool:
        try:
            r = requests.post(f"{self.BASE}/fine-tunes/{external_id}/cancel",
                              headers=self.headers, timeout=10)
            return r.status_code == 200
        except Exception:
            return False


# ─── Hugging Face ─────────────────────────────────────────────────────
class HuggingFaceProvider(TrainingProvider):
    name = "huggingface"
    BASE = "https://huggingface.co/api/autotrain"

    def __init__(self, token: str, username: str):
        self.token = token
        self.username = username
        self.headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    def start_job(self, config: Dict) -> Dict:
        project_name = f"nemix-{uuid.uuid4().hex[:8]}"
        resp = requests.post(
            f"{self.BASE}/create_project",
            headers=self.headers,
            json={
                "username": self.username,
                "project_name": project_name,
                "task": "text-classification",
                "config": {
                    "hub-model": config["model"],
                    "num-jobs": 1,
                    "col_map_text": "text",
                    "col_map_label": "label",
                },
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        return {"external_id": str(data.get("id", project_name)), "provider": self.name, "model": config["model"]}

    def get_status(self, external_id: str) -> Dict:
        try:
            resp = requests.get(f"{self.BASE}/project/{external_id}", headers=self.headers, timeout=15)
            if resp.status_code == 404:
                return {"status": "pending", "progress": 10.0, "logs": []}
            resp.raise_for_status()
            data = resp.json()
            s = {"training": "training", "completed": "completed", "failed": "failed"}.get(
                data.get("status", "queued"), "pending")
            return {"external_id": external_id, "status": s,
                    "progress": 100.0 if s == "completed" else 50.0, "logs": []}
        except Exception:
            return {"status": "pending", "progress": 10.0, "logs": []}


# ─── Fallback chain definition ────────────────────────────────────────
def build_fallback_chain(provider_config: Dict) -> List[Dict]:
    """
    Returns an ordered list of (provider, model) attempts.
    Each step is tried in order — if one fails, the next is used.

    Structure: [{ "provider_name", "provider_obj", "model_id", "model_label" }, ...]
    """
    together_key = provider_config.get("together_api_key") or os.getenv("TOGETHER_API_KEY", "")
    hf_token     = provider_config.get("hf_token")        or os.getenv("HF_TOKEN", "")
    hf_username  = provider_config.get("hf_username")     or os.getenv("HF_USERNAME", "")

    chain = []

    if together_key:
        t = TogetherAIProvider(together_key)
        # Together AI model cascade: large → medium → tiny
        chain += [
            {"provider": t, "label": "Together AI",
             "model": "meta-llama/Llama-3-8b",       "model_label": "LLaMA 3 8B"},
            {"provider": t, "label": "Together AI",
             "model": "mistralai/Mistral-7B-v0.1",   "model_label": "Mistral 7B"},
            {"provider": t, "label": "Together AI",
             "model": "togethercomputer/llama-2-7b", "model_label": "LLaMA-2 7B"},
            {"provider": t, "label": "Together AI",
             "model": "gpt2",                        "model_label": "GPT-2 (tiny)"},
        ]

    if hf_token and hf_username:
        h = HuggingFaceProvider(hf_token, hf_username)
        chain += [
            {"provider": h, "label": "Hugging Face",
             "model": "bert-base-uncased",  "model_label": "BERT Base"},
            {"provider": h, "label": "Hugging Face",
             "model": "distilbert-base-uncased", "model_label": "DistilBERT (tiny)"},
        ]

    return chain


# ─── Main entry point ─────────────────────────────────────────────────
def start_training_job(
    job_id: str,
    dataset_id: int,
    model_id: int,
    user_id: int,
    epochs: int = 3,
    provider_name: str = "auto",
    provider_config: Optional[Dict] = None,
):
    thread = threading.Thread(
        target=_run_training_with_fallback,
        args=(job_id, dataset_id, model_id, user_id, epochs, provider_config or {}),
        daemon=True,
    )
    thread.start()


# ─── Core training orchestrator with fallback ─────────────────────────
def _run_training_with_fallback(
    job_id: str,
    dataset_id: int,
    model_id: int,
    user_id: int,
    epochs: int,
    provider_config: Dict,
):
    db = SessionLocal()
    try:
        time.sleep(0.5)

        job = db.query(models.TrainingJob).filter(models.TrainingJob.job_id == job_id).first()
        if not job:
            job = models.TrainingJob(
                job_id=job_id, status="training",
                user_id=user_id, dataset_id=dataset_id,
                model_id=model_id, total_epochs=epochs,
            )
            db.add(job)

        dataset_rec = db.query(models.Dataset).filter(models.Dataset.id == dataset_id).first()
        model_rec   = db.query(models.AIModel).filter(models.AIModel.id == model_id).first()
        model_name  = model_rec.name if model_rec else "Model"
        dataset_name = dataset_rec.name if dataset_rec else "Dataset"

        def log(msg: str):
            current = list(job.logs) if job.logs else []
            current.append({"message": msg, "timestamp": time.time()})
            job.logs = current
            db.commit()

        def set_progress(p: float):
            job.progress = p
            db.commit()

        job.status = "training"
        job.progress = 0.0
        job.logs = [{"message": f"🚀 Training started: {model_name} on '{dataset_name}'",
                     "timestamp": time.time()}]
        db.commit()

        # Build fallback chain
        chain = build_fallback_chain(provider_config)
        if not chain:
            raise ValueError(
                "No API key configured. Add your Together AI or Hugging Face key "
                "in the Provider panel to start training."
            )

        log(f"🔗 Fallback chain ready: {len(chain)} provider/model option(s)")
        log(f"   Will try: {', '.join(f'{c[\"label\"]} / {c[\"model_label\"]}' for c in chain)}")

        # Try each step in the chain
        last_error = None
        for attempt, step in enumerate(chain):
            provider   = step["provider"]
            label      = step["label"]
            model_id_str = step["model"]
            model_lbl  = step["model_label"]

            if attempt > 0:
                log(f"")
                log(f"⚡ FALLBACK #{attempt} — switching to {label} / {model_lbl}")
                log(f"   Reason: {last_error}")

            log(f"🔧 Attempt {attempt + 1}/{len(chain)}: {label} → {model_lbl}")
            set_progress(max(job.progress or 0, 5.0 + attempt * 2))

            try:
                _run_single_attempt(
                    job=job, db=db, log=log, set_progress=set_progress,
                    provider=provider, label=label,
                    model_id_str=model_id_str, model_lbl=model_lbl,
                    dataset_rec=dataset_rec, epochs=epochs,
                )
                # SUCCESS — stop chain
                break

            except Exception as e:
                last_error = _classify_error(e)
                log(f"⚠️  {label} / {model_lbl} failed: {last_error}")

                if attempt < len(chain) - 1:
                    next_step = chain[attempt + 1]
                    log(f"🔄 Auto-switching to: {next_step['label']} / {next_step['model_label']}...")
                    time.sleep(2)
                else:
                    log(f"❌ All providers exhausted. No more fallbacks available.")
                    raise RuntimeError(f"All {len(chain)} provider attempts failed. Last error: {last_error}")

        # Mark complete
        job.status = "completed"
        job.progress = 100.0
        if model_rec:
            model_rec.file_path = f"uploads/models/model_{model_id}"
        log("✅ Training complete!")
        db.commit()

    except Exception as e:
        print(f"Training error (job {job_id}): {e}")
        try:
            db.rollback()
            job = db.query(models.TrainingJob).filter(models.TrainingJob.job_id == job_id).first()
            if job:
                job.status = "failed"
                current = list(job.logs) if job.logs else []
                current.append({"message": f"❌ Failed: {str(e)}", "timestamp": time.time()})
                job.logs = current
                db.commit()
        except Exception as inner:
            print(f"Could not update job status: {inner}")
    finally:
        db.close()


# ─── Single provider attempt ──────────────────────────────────────────
def _run_single_attempt(
    job, db, log: Callable, set_progress: Callable,
    provider: TrainingProvider, label: str,
    model_id_str: str, model_lbl: str,
    dataset_rec, epochs: int,
):
    """
    Runs one provider+model combination.
    Raises an exception if it fails (triggering fallback).
    """
    if isinstance(provider, TogetherAIProvider):
        _run_together(job, db, log, set_progress, provider, model_id_str, model_lbl, dataset_rec, epochs)
    elif isinstance(provider, HuggingFaceProvider):
        _run_huggingface(job, db, log, set_progress, provider, model_id_str, model_lbl, dataset_rec, epochs)
    else:
        raise RuntimeError(f"Unknown provider type: {type(provider)}")


# ─── Together AI execution ────────────────────────────────────────────
def _run_together(job, db, log, set_progress, provider: TogetherAIProvider,
                  model_id_str: str, model_lbl: str, dataset_rec, epochs: int):
    log(f"   📤 Uploading dataset to Together AI...")

    config = {
        "model": model_id_str,
        "n_epochs": epochs,
        "learning_rate": 1e-5,
        "batch_size": 4,
        "suffix": f"nemix-{job.job_id[:8]}",
        "file_path": getattr(dataset_rec, "file_path", None),
    }

    result = provider.start_job(config)
    external_id = result["external_id"]
    log(f"   ✅ Job queued on Together AI: {external_id}")
    log(f"   ⏳ Polling for status every 10s...")

    for i in range(180):  # max 30 min
        time.sleep(10)
        status_data = provider.get_status(external_id)
        status   = status_data["status"]
        progress = status_data.get("progress", 0)
        set_progress(progress)

        for entry in status_data.get("logs", []):
            msg = entry.get("message", "") if isinstance(entry, dict) else str(entry)
            if msg:
                current = list(job.logs)
                current.append({"message": f"   [{label}] {msg}", "timestamp": time.time()})
                job.logs = current
                db.commit()

        if status == "completed":
            output = status_data.get("output_model", "")
            log(f"   ✅ Together AI training complete! Model: {output}")
            return
        elif status == "failed":
            raise RuntimeError(f"Together AI job {external_id} reported failure")

        if i % 6 == 0:
            log(f"   📊 Progress: {progress:.0f}% | Status: {status}")

    raise RuntimeError("Together AI job timed out after 30 minutes")


# ─── Hugging Face execution ───────────────────────────────────────────
def _run_huggingface(job, db, log, set_progress, provider: HuggingFaceProvider,
                     model_id_str: str, model_lbl: str, dataset_rec, epochs: int):
    log(f"   📤 Creating Hugging Face AutoTrain project...")

    config = {"model": model_id_str, "n_epochs": epochs}
    result = provider.start_job(config)
    external_id = result["external_id"]
    log(f"   ✅ HF project created: {external_id}")
    log(f"   ⏳ Polling for status...")

    for i in range(120):  # max 20 min
        time.sleep(10)
        status_data = provider.get_status(external_id)
        status   = status_data.get("status", "pending")
        progress = status_data.get("progress", 0)
        set_progress(progress)

        if status == "completed":
            log(f"   ✅ Hugging Face training complete!")
            return
        elif status == "failed":
            raise RuntimeError(f"Hugging Face project {external_id} failed")

        if i % 6 == 0:
            log(f"   📊 Progress: {progress:.0f}% | Status: {status}")

    raise RuntimeError("Hugging Face job timed out after 20 minutes")


# ─── Error classification ─────────────────────────────────────────────
def _classify_error(e: Exception) -> str:
    """Turn raw exceptions into human-readable fallback reasons."""
    msg = str(e).lower()

    if "402" in msg or "insufficient" in msg or "credit" in msg or "balance" in msg:
        return "Insufficient API credits"
    if "401" in msg or "unauthorized" in msg or "invalid api key" in msg:
        return "Invalid or expired API key"
    if "403" in msg or "forbidden" in msg:
        return "API access denied (check plan)"
    if "429" in msg or "rate limit" in msg or "too many" in msg:
        return "Rate limit reached"
    if "404" in msg or "not found" in msg or "model" in msg:
        return "Model not available on this plan"
    if "timeout" in msg or "timed out" in msg:
        return "Request timed out"
    if "500" in msg or "server error" in msg:
        return "Provider server error"
    if "connection" in msg or "network" in msg:
        return "Network/connection error"

    return str(e)[:120]
