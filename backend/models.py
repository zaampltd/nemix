from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    datasets = relationship("Dataset", back_populates="owner")
    models = relationship("AIModel", back_populates="owner")
    jobs = relationship("TrainingJob", back_populates="user")

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String)
    file_path = Column(String, nullable=False)
    file_type = Column(String)  # csv, json, etc.
    size_bytes = Column(Integer)
    row_count = Column(Integer)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="datasets")
    jobs = relationship("TrainingJob", back_populates="dataset")

class AIModel(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String)
    base_model = Column(String)  # e.g., 'bert-base-uncased'
    task_type = Column(String)    # e.g., 'text-classification'
    framework = Column(String)   # e.g., 'pytorch'
    version = Column(String, default="1.0.0")
    file_path = Column(String)    # Path to saved weights
    is_public = Column(Boolean, default=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="models")
    jobs = relationship("TrainingJob", back_populates="model")

    @property
    def status(self):
        if not self.jobs:
            return "ready"
        # Sort jobs by ID descending to get the latest one
        sorted_jobs = sorted(self.jobs, key=lambda j: j.id, reverse=True)
        latest_status = sorted_jobs[0].status
        if latest_status == "completed":
            return "ready"
        return latest_status


class TrainingJob(Base):
    __tablename__ = "training_jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, unique=True, index=True) # Celery task ID
    status = Column(String, default="pending")      # pending, training, completed, failed
    progress = Column(Float, default=0.0)
    current_epoch = Column(Integer, default=0)
    total_epochs = Column(Integer)
    loss = Column(Float)
    accuracy = Column(Float)
    logs = Column(JSON, default=[])
    
    user_id = Column(Integer, ForeignKey("users.id"))
    dataset_id = Column(Integer, ForeignKey("datasets.id"))
    model_id = Column(Integer, ForeignKey("models.id"))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="jobs")
    dataset = relationship("Dataset", back_populates="jobs")
    model = relationship("AIModel", back_populates="jobs")
