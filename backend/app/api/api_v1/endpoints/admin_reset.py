"""
Endpoint temporário para resetar senha do admin
REMOVER EM PRODUÇÃO!
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.core.database import get_db
from app.models.user import User
from app.models.workspace import Workspace

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/reset-admin-password")
def reset_admin_password(db: Session = Depends(get_db)):
    """
    ENDPOINT TEMPORÁRIO - REMOVER EM PRODUÇÃO!
    Reseta a senha do usuário admin@orion.com para 'admin123'
    """
    try:
        # Procurar workspace
        workspace = db.query(Workspace).filter(Workspace.name == "Orion Admin").first()

        if not workspace:
            workspace = Workspace(
                name="Orion Admin",
                slug="orion-admin"
            )
            db.add(workspace)
            db.commit()
            db.refresh(workspace)

        # Procurar usuário admin
        admin_user = db.query(User).filter(User.email == "admin@orion.com").first()

        new_password = "admin123"
        hashed_password = pwd_context.hash(new_password)

        if not admin_user:
            # Criar usuário
            admin_user = User(
                email="admin@orion.com",
                full_name="Admin Orion",
                hashed_password=hashed_password,
                workspace_id=workspace.id,
                role="super_admin",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            action = "created"
        else:
            # Resetar senha
            admin_user.hashed_password = hashed_password
            admin_user.role = "super_admin"
            admin_user.is_active = True
            db.commit()
            action = "password_reset"

        # Testar o hash
        verify_result = pwd_context.verify(new_password, hashed_password)

        return {
            "success": True,
            "action": action,
            "user_id": admin_user.id,
            "email": admin_user.email,
            "role": admin_user.role,
            "workspace_id": admin_user.workspace_id,
            "hash_preview": hashed_password[:50],
            "hash_verified": verify_result,
            "message": f"Admin user {action}. Email: admin@orion.com, Password: admin123"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test-login")
def test_login_endpoint(email: str, password: str, db: Session = Depends(get_db)):
    """
    ENDPOINT TEMPORÁRIO - REMOVER EM PRODUÇÃO!
    Testa login de um usuário
    """
    try:
        user = db.query(User).filter(User.email == email).first()

        if not user:
            return {
                "success": False,
                "message": "User not found",
                "email": email
            }

        password_correct = pwd_context.verify(password, user.hashed_password)

        return {
            "success": password_correct,
            "user_found": True,
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "workspace_id": user.workspace_id,
            "password_correct": password_correct,
            "hash_preview": user.hashed_password[:50]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
