from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
import shutil
import uuid
import pandas as pd
import io

import models, schemas, database
from api.auth import get_current_user

router = APIRouter(prefix="/datasets", tags=["datasets"])

UPLOAD_DIR = "uploads/datasets"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=schemas.Dataset)
async def upload_dataset(
    name: str = Form(...),
    description: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".csv", ".json", ".txt"]:
        raise HTTPException(status_code=400, detail="Unsupported file format")

    # Generate unique filename
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Analyze dataset (basic)
    row_count = 0
    try:
        if ext == ".csv":
            df = pd.read_csv(file_path)
            row_count = len(df)
        elif ext == ".json":
            df = pd.read_json(file_path)
            row_count = len(df)
    except Exception as e:
        # If analysis fails, we still save the file but with 0 rows
        print(f"Error analyzing dataset: {e}")

    # Create DB entry
    new_dataset = models.Dataset(
        name=name,
        description=description,
        file_path=file_path,
        file_type=ext.replace(".", ""),
        size_bytes=os.path.getsize(file_path),
        row_count=row_count,
        owner_id=current_user.id
    )
    db.add(new_dataset)
    db.commit()
    db.refresh(new_dataset)
    
    return new_dataset

@router.get("/", response_model=list[schemas.Dataset])
def list_datasets(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Dataset).filter(models.Dataset.owner_id == current_user.id).all()

@router.get("/{dataset_id}", response_model=schemas.Dataset)
def get_dataset(
    dataset_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    dataset = db.query(models.Dataset).filter(
        models.Dataset.id == dataset_id,
        models.Dataset.owner_id == current_user.id
    ).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset

@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    dataset = db.query(models.Dataset).filter(
        models.Dataset.id == dataset_id,
        models.Dataset.owner_id == current_user.id
    ).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Delete file
    if os.path.exists(dataset.file_path):
        os.remove(dataset.file_path)
    
    db.delete(dataset)
    db.commit()
    return {"message": "Dataset deleted successfully"}
