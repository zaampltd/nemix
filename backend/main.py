from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

import models, database
from api import auth, datasets, training, models_api, inference, payments

# Create database tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="AI SaaS Platform API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(datasets.router)
app.include_router(training.router)
app.include_router(models_api.router)
app.include_router(inference.router)
app.include_router(payments.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the AI SaaS Platform API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
