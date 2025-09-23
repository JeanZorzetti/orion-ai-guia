from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest):
    # TODO: Implement actual authentication logic
    if login_data.email == "admin@orion.com" and login_data.password == "admin123":
        return TokenResponse(access_token="fake-jwt-token-here")

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password"
    )

@router.post("/logout")
async def logout():
    return {"message": "Successfully logged out"}

@router.get("/me")
async def get_current_user():
    # TODO: Implement JWT token validation
    return {
        "id": 1,
        "email": "admin@orion.com",
        "name": "Admin User",
        "role": "admin"
    }