from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas, database
from api.auth import get_current_user

router = APIRouter(prefix="/models", tags=["models"])

@router.post("/", response_model=schemas.AIModel)
def create_model(
    model_data: schemas.AIModelCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_model = models.AIModel(
        name=model_data.name,
        description=model_data.description,
        base_model=model_data.base_model,
        task_type=model_data.task_type,
        owner_id=current_user.id
    )
    db.add(new_model)
    db.commit()
    db.refresh(new_model)
    return new_model

@router.get("/", response_model=List[schemas.AIModel])
def list_models(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.AIModel).filter(models.AIModel.owner_id == current_user.id).all()

@router.get("/{model_id}", response_model=schemas.AIModel)
def get_model(
    model_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    model = db.query(models.AIModel).filter(
        models.AIModel.id == model_id,
        models.AIModel.owner_id == current_user.id
    ).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model
