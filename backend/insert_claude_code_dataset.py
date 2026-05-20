import os
import glob
from database import SessionLocal
import models

def insert():
    db = SessionLocal()
    try:
        # Scan for generated files
        pattern = "/app/uploads/datasets/claude_code_dataset_*.csv"
        files = glob.glob(pattern)
        if not files:
            print("No generated Claude Code dataset files found in container at /app/uploads/datasets/")
            return
            
        # Get the latest file
        latest_file = max(files, key=os.path.getmtime)
        filename = os.path.basename(latest_file)
        size_bytes = os.path.getsize(latest_file)
        
        # Estimate row count
        with open(latest_file, "r", encoding="utf-8", errors="ignore") as f:
            row_count = sum(1 for _ in f) - 1 # headers
            
        print(f"Found generated dataset: {filename} with {row_count} rows, size {size_bytes} bytes")
        
        # Register for users
        users = db.query(models.User).all()
        print(f"Found {len(users)} users in database.")
        
        for user in users:
            # Check if already registered for this user
            existing = db.query(models.Dataset).filter(
                models.Dataset.owner_id == user.id,
                models.Dataset.name == "Claude-Code-Engine-Dataset"
            ).first()
            
            if existing:
                print(f"Dataset already exists for user {user.email} (ID: {user.id}). Updating file path...")
                existing.file_path = f"uploads/datasets/{filename}"
                existing.size_bytes = size_bytes
                existing.row_count = row_count
            else:
                print(f"Creating new dataset entry for user {user.email} (ID: {user.id})...")
                ds = models.Dataset(
                    name="Claude-Code-Engine-Dataset",
                    description="High-fidelity training dataset compiled directly from codeaashu/claude-code.git, featuring core prompt strategies, TypeScript components, tool systems, and interactive Ink terminals.",
                    file_path=f"uploads/datasets/{filename}",
                    file_type="csv",
                    size_bytes=size_bytes,
                    row_count=row_count,
                    owner_id=user.id
                )
                db.add(ds)
        db.commit()
        print("Successfully registered/updated dataset in PostgreSQL database for all users!")
    except Exception as e:
        db.rollback()
        print(f"Error registering dataset: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    insert()
