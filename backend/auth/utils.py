from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import os

# Monkey-patch bcrypt to fix passlib 1.7.4 compatibility with bcrypt 4.0+
try:
    import bcrypt
    original_hashpw = bcrypt.hashpw
    def patched_hashpw(password, salt):
        if isinstance(password, bytes) and len(password) > 72:
            password = password[:72]
        return original_hashpw(password, salt)
    bcrypt.hashpw = patched_hashpw

    original_checkpw = bcrypt.checkpw
    def patched_checkpw(password, hashed_password):
        if isinstance(password, bytes) and len(password) > 72:
            password = password[:72]
        return original_checkpw(password, hashed_password)
    bcrypt.checkpw = patched_checkpw
except ImportError:
    pass

from passlib.context import CryptContext


# Secret key to sign JWT tokens
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-me")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "525600"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
