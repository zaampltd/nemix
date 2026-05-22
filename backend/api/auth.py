from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import JWTError, jwt

import models, schemas, database
from auth import utils

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(db: Session = Depends(database.get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 1. Handle Local Sandbox Fallback Token
    if token.startswith("local-token-"):
        email = token.replace("local-token-", "")
        # Standardize demo emails
        if email in ["google", "google-id", "google-developer", "github", "token"]:
            email = "developer@nemix.ai"
        
        user = db.query(models.User).filter(models.User.email == email).first()
        if user is None:
            user = models.User(
                email=email,
                hashed_password=utils.get_password_hash("sandbox-password"),
                full_name=email.split("@")[0].capitalize(),
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    # 2. Try Decoding Custom Backend JWT (HS256)
    try:
        payload = jwt.decode(token, utils.SECRET_KEY, algorithms=[utils.ALGORITHM])
        email: str = payload.get("sub")
        if email is not None:
            user = db.query(models.User).filter(models.User.email == email).first()
            if user:
                return user
    except JWTError:
        pass

    # 3. Try Decoding Firebase ID Token (RS256) via unverified claims
    try:
        claims = jwt.get_unverified_claims(token)
        if claims and claims.get("iss", "").startswith("https://securetoken.google.com/"):
            email = claims.get("email")
            if email:
                user = db.query(models.User).filter(models.User.email == email).first()
                if user is None:
                    # Auto-provision Firebase user
                    user = models.User(
                        email=email,
                        hashed_password=utils.get_password_hash("firebase-sso-provisioned"),
                        full_name=claims.get("name", email.split("@")[0].capitalize()),
                        is_active=True
                    )
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                return user
    except Exception as e:
        print(f"Error checking Firebase token: {e}")
        pass

    raise credentials_exception

@router.post("/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = utils.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(db: Session = Depends(database.get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = utils.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user
