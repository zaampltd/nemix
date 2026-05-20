from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime

    model_config = {
        'from_attributes': True
    }

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Dataset Schemas
class DatasetBase(BaseModel):
    name: str
    description: Optional[str] = None

class DatasetCreate(DatasetBase):
    pass

class Dataset(DatasetBase):
    id: int
    file_path: str
    file_type: Optional[str]
    size_bytes: Optional[int]
    row_count: Optional[int]
    owner_id: int
    created_at: datetime

    model_config = {
        'from_attributes': True
    }

# AI Model Schemas
class AIModelBase(BaseModel):
    name: str
    description: Optional[str] = None
    base_model: Optional[str] = None
    task_type: Optional[str] = None

class AIModelCreate(AIModelBase):
    pass

class AIModel(AIModelBase):
    id: int
    version: str
    file_path: Optional[str]
    owner_id: int
    created_at: datetime
    status: Optional[str] = None

    model_config = {
        'protected_namespaces': (),
        'from_attributes': True
    }

# Training Job Schemas
class TrainingJobBase(BaseModel):
    dataset_id: int
    model_id: int
    total_epochs: int = 5

class TrainingJob(TrainingJobBase):
    id: int
    job_id: str
    status: str
    progress: float
    current_epoch: int
    loss: Optional[float]
    accuracy: Optional[float]
    logs: List[Any]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {
        'protected_namespaces': (),
        'from_attributes': True
    }
