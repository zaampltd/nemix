from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, JSON, Float, Text
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
    # User's provider API keys & preferences stored as JSON
    settings = Column(JSON, default=dict, nullable=True)

    datasets = relationship("Dataset", back_populates="owner", cascade="all, delete-orphan")
    models = relationship("AIModel", back_populates="owner", cascade="all, delete-orphan")
    jobs = relationship("TrainingJob", back_populates="user", cascade="all, delete-orphan")


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String)
    file_path = Column(String, nullable=False)
    file_type = Column(String)  # csv, json, txt, jsonl
    size_bytes = Column(Integer)
    row_count = Column(Integer)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="datasets")
    jobs = relationship("TrainingJob", back_populates="dataset")


class AIModel(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String)
    base_model = Column(String)   # e.g., 'llama3-8b'
    task_type = Column(String)    # e.g., 'text-classification'
    framework = Column(String)    # e.g., 'pytorch'
    version = Column(String, default="1.0.0")
    file_path = Column(String)    # Path to saved weights
    is_public = Column(Boolean, default=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="models")
    jobs = relationship("TrainingJob", back_populates="model")

    @property
    def status(self):
        if not self.jobs:
            return "ready"
        sorted_jobs = sorted(self.jobs, key=lambda j: j.id, reverse=True)
        latest_status = sorted_jobs[0].status
        if latest_status == "completed":
            return "ready"
        return latest_status


class TrainingJob(Base):
    __tablename__ = "training_jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, unique=True, index=True)
    status = Column(String, default="pending")   # pending | training | completed | failed | cancelled
    progress = Column(Float, default=0.0)
    current_epoch = Column(Integer, default=0)
    total_epochs = Column(Integer, default=5)
    loss = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)
    logs = Column(JSON, default=list)
    provider = Column(String, nullable=True)     # which provider was used

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="SET NULL"), nullable=True)
    model_id = Column(Integer, ForeignKey("models.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="jobs")
    dataset = relationship("Dataset", back_populates="jobs")
    model = relationship("AIModel", back_populates="jobs")
