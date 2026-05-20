from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os
import random

import models, database
from api.auth import get_current_user

router = APIRouter(prefix="/inference", tags=["inference"])

class ChatRequest(BaseModel):
    model_id: int
    message: str

# In-memory cache for loaded models to avoid reloading on every request
model_cache = {}

@router.post("/chat")
async def chat_inference(
    request: ChatRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    model_record = db.query(models.AIModel).filter(
        models.AIModel.id == request.model_id,
        models.AIModel.owner_id == current_user.id
    ).first()
    
    if not model_record or not model_record.file_path:
        # Fallback to base model if no fine-tuned weights exist
        model_path = model_record.base_model if model_record else "gpt2"
    else:
        model_path = model_record.file_path

    # Try importing heavy ML packages inside the function to prevent startup crashes when missing
    try:
        from transformers import AutoModelForSequenceClassification, AutoTokenizer
        import torch
        HAS_ML = True
    except ImportError:
        HAS_ML = False

    if not HAS_ML:
        # Graceful fallback: simulated sentiment analysis response when ML libraries are not installed (e.g. Render Free Tier)
        message_lower = request.message.lower()
        
        # Simple sentiment heuristics
        positive_words = ["good", "great", "excellent", "happy", "love", "amazing", "wonderful", "cool", "nice", "success"]
        negative_words = ["bad", "sad", "angry", "hate", "terrible", "worst", "broken", "fail", "error", "issue", "bug"]
        
        pos_count = sum(1 for w in positive_words if w in message_lower)
        neg_count = sum(1 for w in negative_words if w in message_lower)
        
        if pos_count > neg_count:
            prediction = 1
            confidence = random.uniform(0.75, 0.98)
        elif neg_count > pos_count:
            prediction = 0
            confidence = random.uniform(0.75, 0.98)
        else:
            prediction = random.choice([0, 1])
            confidence = random.uniform(0.51, 0.74)
            
        labels = ["Negative", "Positive"]
        response_text = f"[Cloud Inference Engine] Analysed sentiment: {labels[prediction]} (Confidence: {confidence:.2%})"
        
        return {
            "response": response_text,
            "model": model_path,
            "prediction": prediction,
            "simulated": True
        }

    try:
        # Load model and tokenizer (cached)
        if model_path not in model_cache:
            tokenizer = AutoTokenizer.from_pretrained(model_path)
            if tokenizer.pad_token is None:
                tokenizer.pad_token = tokenizer.eos_token
            model = AutoModelForSequenceClassification.from_pretrained(model_path)
            if model.config.pad_token_id is None:
                model.config.pad_token_id = tokenizer.pad_token_id
            model_cache[model_path] = (model, tokenizer)
        else:
            model, tokenizer = model_cache[model_path]

        # Basic inference (Sentiment Classification example)
        inputs = tokenizer(request.message, return_tensors="pt", padding=True, truncation=True)
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            prediction = torch.argmax(logits, dim=-1).item()

        # Map prediction to human-readable label
        labels = ["Negative", "Positive"] # Simplified for GPT-2 classification demo
        response_text = f"My analysis suggests this message is: {labels[prediction]}"

        return {
            "response": response_text,
            "model": model_path,
            "prediction": prediction
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")
