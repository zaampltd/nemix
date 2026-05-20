from celery import Celery
import os
import time
import torch
from transformers import (
    AutoModelForSequenceClassification, 
    AutoTokenizer, 
    Trainer, 
    TrainingArguments,
    DataCollatorWithPadding
)
from datasets import load_dataset
from database import SessionLocal
import models

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

celery_app = Celery(
    "worker",
    broker=REDIS_URL,
    backend=REDIS_URL
)

@celery_app.task(bind=True)
def train_model_task(self, dataset_id: int, model_id: int, user_id: int, epochs: int = 1):
    """
    Real background task to fine-tune a model using Hugging Face.
    """
    db = SessionLocal()
    job = db.query(models.TrainingJob).filter(models.TrainingJob.job_id == self.request.id).first()
    
    if not job:
        job = models.TrainingJob(
            job_id=self.request.id,
            status="training",
            user_id=user_id,
            dataset_id=dataset_id,
            model_id=model_id,
            total_epochs=epochs
        )
        db.add(job)
        db.commit()
        db.refresh(job)

    try:
        dataset_record = db.query(models.Dataset).filter(models.Dataset.id == dataset_id).first()
        model_record = db.query(models.AIModel).filter(models.AIModel.id == model_id).first()

        job.status = "training"
        job.logs = [{"message": "Initializing Real Training Pipeline...", "timestamp": time.time()}]
        db.commit()

        # 1. Load Tokenizer and Model (Using GPT-2 as a lightweight example)
        base_model_name = model_record.base_model or "gpt2"
        job.logs = list(job.logs) + [{"message": f"Loading base model: {base_model_name}", "timestamp": time.time()}]
        db.commit()

        tokenizer = AutoTokenizer.from_pretrained(base_model_name)
        if tokenizer.pad_token is None:
            if tokenizer.eos_token is not None:
                tokenizer.pad_token = tokenizer.eos_token
            else:
                tokenizer.add_special_tokens({'pad_token': '[PAD]'})
        
        model = AutoModelForSequenceClassification.from_pretrained(base_model_name, num_labels=2)
        if model.config.pad_token_id is None:
            model.config.pad_token_id = tokenizer.pad_token_id

        # 2. Load and Preprocess Dataset
        job.logs = list(job.logs) + [{"message": "Loading and tokenizing dataset...", "timestamp": time.time()}]
        db.commit()
        
        # In a real app, we'd load the local file. For this demo, we'll use a tiny sample or the user's CSV.
        if dataset_record.file_path == "all_datasets":
             # Query all other datasets belonging to this user
             other_datasets = db.query(models.Dataset).filter(
                 models.Dataset.owner_id == user_id,
                 models.Dataset.file_path != "all_datasets"
             ).all()
             
             import os
             csv_files = []
             for d in other_datasets:
                 if d.file_path.endswith('.csv') and os.path.exists(d.file_path):
                     csv_files.append(d.file_path)
             
             if csv_files:
                 job.logs = list(job.logs) + [{"message": f"Dynamically merging {len(csv_files)} individual CSV datasets for training...", "timestamp": time.time()}]
                 db.commit()
                 raw_datasets = load_dataset('csv', data_files=csv_files)
             else:
                 job.logs = list(job.logs) + [{"message": "No individual CSV datasets found for merging. Falling back to sample dataset.", "timestamp": time.time()}]
                 db.commit()
                 raw_datasets = load_dataset("imdb", split="train[:100]")
        elif dataset_record.file_path.endswith('.csv'):
             raw_datasets = load_dataset('csv', data_files=dataset_record.file_path)
        else:
             # Fallback to dummy data if file is missing or unsupported
             raw_datasets = load_dataset("imdb", split="train[:100]") # Tiny subset for speed

        def tokenize_function(examples):
            return tokenizer(examples["text"], padding="max_length", max_length=512, truncation=True)

        tokenized_datasets = raw_datasets.map(tokenize_function, batched=True)

        # 3. Define Training Arguments
        output_dir = f"./models/output_{job.job_id}"
        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=epochs,
            per_device_train_batch_size=4,
            save_steps=100,
            save_total_limit=2,
            logging_steps=10,
            report_to="none"
        )

        # 4. Initialize Trainer
        if isinstance(tokenized_datasets, dict) or hasattr(tokenized_datasets, "keys"):
            train_dataset = tokenized_datasets["train"] if "train" in tokenized_datasets else tokenized_datasets[list(tokenized_datasets.keys())[0]]
        else:
            train_dataset = tokenized_datasets

        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            data_collator=DataCollatorWithPadding(tokenizer=tokenizer),
        )

        # 5. Execute Training
        job.logs = list(job.logs) + [{"message": "Starting Fine-tuning...", "timestamp": time.time()}]
        db.commit()
        
        trainer.train()

        # 6. Save Final Model
        final_model_path = f"uploads/models/model_{model_id}"
        os.makedirs(final_model_path, exist_ok=True)
        trainer.save_model(final_model_path)
        tokenizer.save_pretrained(final_model_path)

        job.status = "completed"
        job.progress = 100.0
        job.logs = list(job.logs) + [{"message": "Training Completed Successfully!", "timestamp": time.time()}]
        
        # Update model record with saved path
        model_record.file_path = final_model_path
        db.commit()
        
    except Exception as e:
        job.status = "failed"
        current_logs = list(job.logs) if job.logs else []
        current_logs.append({"error": str(e), "timestamp": time.time()})
        job.logs = current_logs
        db.commit()
        raise e
    finally:
        db.close()

    return {"status": "completed", "job_id": self.request.id}
