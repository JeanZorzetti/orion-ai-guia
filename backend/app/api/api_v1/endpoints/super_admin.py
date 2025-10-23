from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_super_admin
from app.core.security import get_password_hash
from app.models import User, Workspace, Invoice, Product
from app.schemas.super_admin import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
    UserCreateByAdmin,
    UserUpdateByAdmin,
    UserResponseAdmin,
    SystemStats
)

router = APIRouter()


# ==================== STATISTICS ====================

@router.get("/stats", response_model=SystemStats)
def get_system_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_super_admin)
):
    """Get system-wide statistics (Super Admin only)"""

    total_workspaces = db.query(Workspace).count()
    active_workspaces = db.query(Workspace).filter(Workspace.active == True).count()
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.active == True).count()
    total_invoices = db.query(Invoice).count()
    total_products = db.query(Product).count()

    return SystemStats(
        total_workspaces=total_workspaces,
        active_workspaces=active_workspaces,
        total_users=total_users,
        active_users=active_users,
        total_invoices=total_invoices,
        total_products=total_products
    )


# ==================== WORKSPACES ====================

@router.get("/workspaces", response_model=List[WorkspaceResponse])
def list_workspaces(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_super_admin)
):
    """List all workspaces (Super Admin only)"""

    workspaces = db.query(Workspace).offset(skip).limit(limit).all()

    # Add user count to each workspace
    result = []
    for workspace in workspaces:
        user_count = db.query(User).filter(User.workspace_id == workspace.id).count()
        workspace_dict = {
            "id": workspace.id,
            "name": workspace.name,
            "active": workspace.active,
            "created_at": workspace.created_at,
            "updated_at": workspace.updated_at,
            "user_count": user_count
        }
        result.append(WorkspaceResponse(**workspace_dict))

    return result


@router.get("/workspaces/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(
    workspace_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_super_admin)
):
    """Get workspace details (Super Admin only)"""

    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    user_count = db.query(User).filter(User.workspace_id == workspace.id).count()
    workspace_dict = {
        "id": workspace.id,
        "name": workspace.name,
        "active": workspace.active,
        "created_at": workspace.created_at,
        "updated_at": workspace.updated_at,
        "user_count": user_count
    }

    return WorkspaceResponse(**workspace_dict)


@router.post("/workspaces", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(
    workspace: WorkspaceCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_super_admin)
):
    """Create a new workspace (Super Admin only)"""

    db_workspace = Workspace(
        name=workspace.name,
        active=workspace.active
    )

    db.add(db_workspace)
    db.commit()
    db.refresh(db_workspace)

    workspace_dict = {
        "id": db_workspace.id,
        "name": db_workspace.name,
        "active": db_workspace.active,
        "created_at": db_workspace.created_at,
        "updated_at": db_workspace.updated_at,
        "user_count": 0
    }

    return WorkspaceResponse(**workspace_dict)


@router.patch("/workspaces/{workspace_id}", response_model=WorkspaceResponse)
def update_workspace(
    workspace_id: int,
    workspace_update: WorkspaceUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_super_admin)
):
    """Update workspace (Super Admin only)"""

    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    update_data = workspace_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workspace, field, value)

    db.commit()
    db.refresh(workspace)

    user_count = db.query(User).filter(User.workspace_id == workspace.id).count()
    workspace_dict = {
        "id": workspace.id,
        "name": workspace.name,
        "active": workspace.active,
        "created_at": workspace.created_at,
        "updated_at": workspace.updated_at,
        "user_count": user_count
    }

    return WorkspaceResponse(**workspace_dict)


@router.delete("/workspaces/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(
    workspace_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_super_admin)
):
    """Delete workspace (Super Admin only)"""

    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    # Check if workspace has users
    user_count = db.query(User).filter(User.workspace_id == workspace_id).count()
    if user_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete workspace with {user_count} users. Please remove or reassign users first."
        )

    db.delete(workspace)
    db.commit()


# ==================== USERS ====================

@router.get("/users", response_model=List[UserResponseAdmin])
def list_all_users(
    skip: int = 0,
    limit: int = 100,
    workspace_id: int = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_super_admin)
):
    """List all users across all workspaces (Super Admin only)"""

    query = db.query(User)

    if workspace_id:
        query = query.filter(User.workspace_id == workspace_id)

    users = query.offset(skip).limit(limit).all()

    # Add workspace name to each user
    result = []
    for user in users:
        workspace = db.query(Workspace).filter(Workspace.id == user.workspace_id).first()
        user_dict = {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "workspace_id": user.workspace_id,
            "active": user.active,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "workspace_name": workspace.name if workspace else None
        }
        result.append(UserResponseAdmin(**user_dict))

    return result


@router.get("/users/{user_id}", response_model=UserResponseAdmin)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_super_admin)
):
    """Get user details (Super Admin only)"""

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    workspace = db.query(Workspace).filter(Workspace.id == user.workspace_id).first()
    user_dict = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "workspace_id": user.workspace_id,
        "active": user.active,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "workspace_name": workspace.name if workspace else None
    }

    return UserResponseAdmin(**user_dict)


@router.post("/users", response_model=UserResponseAdmin, status_code=status.HTTP_201_CREATED)
def create_user_by_admin(
    user: UserCreateByAdmin,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_super_admin)
):
    """Create a new user (Super Admin only)"""

    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Check if workspace exists
    workspace = db.query(Workspace).filter(Workspace.id == user.workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    # Create user
    db_user = User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=get_password_hash(user.password),
        role=user.role,
        workspace_id=user.workspace_id,
        active=user.active
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    user_dict = {
        "id": db_user.id,
        "email": db_user.email,
        "full_name": db_user.full_name,
        "role": db_user.role,
        "workspace_id": db_user.workspace_id,
        "active": db_user.active,
        "created_at": db_user.created_at,
        "updated_at": db_user.updated_at,
        "workspace_name": workspace.name
    }

    return UserResponseAdmin(**user_dict)


@router.patch("/users/{user_id}", response_model=UserResponseAdmin)
def update_user_by_admin(
    user_id: int,
    user_update: UserUpdateByAdmin,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_super_admin)
):
    """Update user (Super Admin only)"""

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check if email is being changed and already exists
    if user_update.email and user_update.email != user.email:
        existing_user = db.query(User).filter(User.email == user_update.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

    # Check if workspace exists if being changed
    if user_update.workspace_id and user_update.workspace_id != user.workspace_id:
        workspace = db.query(Workspace).filter(Workspace.id == user_update.workspace_id).first()
        if not workspace:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found"
            )

    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    workspace = db.query(Workspace).filter(Workspace.id == user.workspace_id).first()
    user_dict = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "workspace_id": user.workspace_id,
        "active": user.active,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "workspace_name": workspace.name if workspace else None
    }

    return UserResponseAdmin(**user_dict)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_super_admin)
):
    """Delete user (Super Admin only)"""

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent super admin from deleting themselves
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own user account"
        )

    db.delete(user)
    db.commit()
