from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

class User(BaseModel):
    id: int
    email: str
    name: str
    role: str
    active: bool

class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    role: str = "user"

@router.get("/", response_model=List[User])
async def get_users():
    # TODO: Implement actual database query
    return [
        User(id=1, email="admin@orion.com", name="Admin User", role="admin", active=True),
        User(id=2, email="user@orion.com", name="Regular User", role="user", active=True),
    ]

@router.post("/", response_model=User)
async def create_user(user_data: UserCreate):
    # TODO: Implement actual user creation
    return User(
        id=3,
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        active=True
    )

@router.get("/{user_id}", response_model=User)
async def get_user(user_id: int):
    # TODO: Implement actual database query
    return User(
        id=user_id,
        email="user@orion.com",
        name="User Name",
        role="user",
        active=True
    )