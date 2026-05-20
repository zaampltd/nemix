from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

import models, schemas, database
from api.auth import get_current_user
from worker import train_model_task

router = APIRouter(prefix="/training", tags=["training"])

@router.post("/jobs", response_model=schemas.TrainingJob)
def create_training_job(
    job_data: schemas.TrainingJobBase,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify dataset exists and belongs to user
    dataset = db.query(models.Dataset).filter(
        models.Dataset.id == job_data.dataset_id,
        models.Dataset.owner_id == current_user.id
    ).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Verify model exists and belongs to user
    model = db.query(models.AIModel).filter(
        models.AIModel.id == job_data.model_id,
        models.AIModel.owner_id == current_user.id
    ).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    job_id = str(uuid.uuid4())
    # Create job entry
    new_job = models.TrainingJob(
        job_id=job_id,
        status="pending",
        user_id=current_user.id,
        dataset_id=job_data.dataset_id,
        model_id=job_data.model_id,
        total_epochs=job_data.total_epochs
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    # Trigger background task with the generated job_id to prevent database race conditions
    train_model_task.apply_async(
        kwargs={
            "dataset_id": job_data.dataset_id,
            "model_id": job_data.model_id,
            "user_id": current_user.id,
            "epochs": job_data.total_epochs
        },
        task_id=job_id
    )
    
    return new_job

@router.get("/jobs", response_model=List[schemas.TrainingJob])
def list_training_jobs(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.TrainingJob).filter(models.TrainingJob.user_id == current_user.id).order_by(models.TrainingJob.created_at.desc()).all()

@router.get("/jobs/{job_id}", response_model=schemas.TrainingJob)
def get_training_job(
    job_id: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    job = db.query(models.TrainingJob).filter(
        models.TrainingJob.job_id == job_id,
        models.TrainingJob.user_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Training job not found")
    return job
