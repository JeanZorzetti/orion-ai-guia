from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash
from app.core.deps import get_current_user
from app.models import User, Workspace
from app.schemas import UserCreate, UserResponse
import re

router = APIRouter()


def create_slug(name: str) -> str:
    """Create a URL-friendly slug from a name"""
    slug = name.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user and their workspace.
    This endpoint creates both a user and their initial workspace (multi-tenant).

    Args:
        user_data: User creation data (email, password, full_name)
        db: Database session

    Returns:
        Created user information

    Raises:
        HTTPException: If email already exists
    """
    # Check if user with email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create workspace for the new user
    workspace_name = f"{user_data.full_name}'s Workspace"
    workspace_slug = create_slug(workspace_name)

    # Ensure slug is unique
    base_slug = workspace_slug
    counter = 1
    while db.query(Workspace).filter(Workspace.slug == workspace_slug).first():
        workspace_slug = f"{base_slug}-{counter}"
        counter += 1

    workspace = Workspace(
        name=workspace_name,
        slug=workspace_slug,
        active=True
    )
    db.add(workspace)
    db.flush()  # Get workspace ID without committing

    # Create user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        workspace_id=workspace.id,
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role=user_data.role,
        active=True
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


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


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user by ID (within same workspace - multi-tenant).

    Args:
        user_id: User ID to retrieve
        current_user: Current authenticated user
        db: Database session

    Returns:
        User information

    Raises:
        HTTPException: If user not found or not in same workspace
    """
    user = db.query(User).filter(
        User.id == user_id,
        User.workspace_id == current_user.workspace_id  # Multi-tenant isolation
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user