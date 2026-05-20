import uuid
import database
import models
from worker import train_model_task

def run():
    db = next(database.get_db())

    user_id = 2
    model_id = 9 # bert-tiny-sentiment
    dataset_id = 273 # fagu-alpaca-main (json)
    total_epochs = 1

    print(f"Looking up Model {model_id} and Dataset {dataset_id} for User {user_id}...")
    model = db.query(models.AIModel).filter(models.AIModel.id == model_id, models.AIModel.owner_id == user_id).first()
    dataset = db.query(models.Dataset).filter(models.Dataset.id == dataset_id, models.Dataset.owner_id == user_id).first()

    if not model:
        print(f"Error: Model {model_id} not found for User {user_id}")
        return
    if not dataset:
        print(f"Error: Dataset {dataset_id} not found for User {user_id}")
        return

    job_id = str(uuid.uuid4())
    new_job = models.TrainingJob(
        job_id=job_id,
        status="pending",
        user_id=user_id,
        dataset_id=dataset_id,
        model_id=model_id,
        total_epochs=total_epochs
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    print(f"Successfully registered training job in database: ID={new_job.id}, Job ID={job_id}")

    # Trigger background task with Celery
    train_model_task.apply_async(
        kwargs={
            "dataset_id": dataset_id,
            "model_id": model_id,
            "user_id": user_id,
            "epochs": total_epochs
        },
        task_id=job_id
    )
    print("Dispatched training job to Celery worker successfully!")

if __name__ == "__main__":
    run()
