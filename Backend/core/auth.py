from fastapi import Header, HTTPException
from core.config import settings
from core.firebase import auth_client

async def get_current_user(authorization: str = Header(None)):
    """
    Middleware-like auth dependency.
    If ENVIRONMENT=dev, bypass auth and return a fake user.
    If ENVIRONMENT=prod, enforce Firebase token validation.
    """
    if settings.environment == "dev":
        return {"uid": "test-user", "email": "test@example.com", "env": "dev-bypass"}

    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    try:
        scheme, token = authorization.split(" ")
        if scheme.lower() != "bearer":
            raise ValueError("Invalid token scheme")
        decoded_token = auth_client.verify_id_token(token)
        return decoded_token
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
