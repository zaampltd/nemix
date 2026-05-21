from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
import shutil
import uuid
import json

import models, schemas, database
from api.auth import get_current_user

router = APIRouter(prefix="/datasets", tags=["datasets"])

UPLOAD_DIR = "uploads/datasets"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".csv", ".json", ".jsonl", ".txt"}


def _count_rows(file_path: str, ext: str) -> int:
    """Count rows without loading full file into RAM."""
    try:
        if ext == ".csv":
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                return max(0, sum(1 for _ in f) - 1)  # minus header
        elif ext in (".json", ".jsonl"):
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                first = f.read(1)
                if not first:
                    return 0
                if first == "[":
                    # JSON array
                    f.seek(0)
                    data = json.load(f)
                    return len(data) if isinstance(data, list) else 1
                else:
                    # JSONL — count lines
                    f.seek(0)
                    return sum(1 for line in f if line.strip())
        elif ext == ".txt":
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                return sum(1 for line in f if line.strip())
    except Exception as e:
        print(f"[datasets] Row count failed: {e}")
    return 0


@router.post("/", response_model=schemas.Dataset)
async def upload_dataset(
    name: str = Form(...),
    description: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    size_bytes = os.path.getsize(file_path)
    row_count = _count_rows(file_path, ext)

    new_dataset = models.Dataset(
        name=name,
        description=description,
        file_path=file_path,
        file_type=ext.lstrip("."),
        size_bytes=size_bytes,
        row_count=row_count,
        owner_id=current_user.id,
    )
    db.add(new_dataset)
    db.commit()
    db.refresh(new_dataset)
    return new_dataset


@router.get("/", response_model=list[schemas.Dataset])
def list_datasets(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.Dataset)
        .filter(models.Dataset.owner_id == current_user.id)
        .order_by(models.Dataset.created_at.desc())
        .all()
    )


@router.get("/{dataset_id}", response_model=schemas.Dataset)
def get_dataset(
    dataset_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    dataset = db.query(models.Dataset).filter(
        models.Dataset.id == dataset_id,
        models.Dataset.owner_id == current_user.id,
    ).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset


@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    dataset = db.query(models.Dataset).filter(
        models.Dataset.id == dataset_id,
        models.Dataset.owner_id == current_user.id,
    ).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if dataset.file_path and os.path.exists(dataset.file_path):
        try:
            os.remove(dataset.file_path)
        except OSError:
            pass

    db.delete(dataset)
    db.commit()
    return {"ok": True, "message": f"Dataset '{dataset.name}' deleted"}
