from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.core.deps import get_current_user
from app.models import User
from app.schemas import UserLogin, Token, UserResponse

router = APIRouter()


@router.post("/token", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Login endpoint - Returns JWT access and refresh tokens.

    Args:
        login_data: Email and password
        db: Database session

    Returns:
        Access token and refresh token

    Raises:
        HTTPException: If credentials are invalid
    """
    # Find user by email
    user = db.query(User).filter(User.email == login_data.email).first()

    # Verify user exists and password is correct
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is active
    if not user.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )

    # Create tokens
    token_data = {
        "user_id": user.id,
        "workspace_id": user.workspace_id,
        "email": user.email
    }

    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )


@router.post("/logout")
async def logout():
    """
    Logout endpoint.
    In JWT-based auth, logout is handled client-side by removing tokens.
    This endpoint can be used for logging or future token blacklisting.
    """
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information.

    Args:
        current_user: Current user from JWT token

    Returns:
        User information
    """
    return current_user
