from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import SessionLocal
from app.models.owner import Owner
from app.utils.auth import verify_password, create_access_token, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
import logging

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def setup_default_user():
    """Create default admin user if not exists"""
    db = SessionLocal()
    try:
        user = db.query(Owner).filter(Owner.username == "admin").first()
        if not user:
            logger.info("Creating default admin user...")
            # Default: admin / admin (Change in production!)
            hashed = get_password_hash("admin")
            new_user = Owner(username="admin", hashed_password=hashed)
            db.add(new_user)
            db.commit()
            print("✅ Default user 'admin' created with password 'admin'")
        else:
            print("✅ Default user 'admin' already exists")
    except Exception as e:
        logger.error(f"Error setting up default user: {e}")
    finally:
        db.close()


@router.post("/login")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(Owner).filter(Owner.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/bypass")
def dev_bypass_login(db: Session = Depends(get_db)):
    """
    DEV ONLY: Login as admin without password
    """
    user = db.query(Owner).filter(Owner.username == "admin").first()
    if not user:
         raise HTTPException(status_code=404, detail="Default admin user not found")
         
    access_token_expires = timedelta(days=30) # Long expiry for dev
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
