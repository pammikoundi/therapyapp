"""
Authentication Module

This module provides authentication functionality for the therapy app API.
It handles Firebase ID token verification and provides development bypasses
for easier testing and development.

Features:
- Firebase ID token validation
- Development mode authentication bypass
- FastAPI dependency injection for protected endpoints
- User context extraction from JWT tokens

Usage:
    from fastapi import Depends
    from core.auth import get_current_user
    
    @router.post("/protected-endpoint")
    async def protected_route(user=Depends(get_current_user)):
        user_id = user["uid"]
        # ... endpoint logic
"""

from fastapi import Header, HTTPException, Depends
from core.config import settings
from core.firebase import auth_client
from typing import Dict, Any
import logging

# Configure logging for authentication operations
logger = logging.getLogger(__name__)


async def get_current_user(authorization: str = Header(None)) -> Dict[str, Any]:
    """
    FastAPI dependency for user authentication and authorization.
    
    This function serves as a dependency for protected endpoints, providing
    user context by validating Firebase ID tokens or bypassing authentication
    in development mode.
    
    Args:
        authorization (str, optional): Authorization header containing Bearer token
        
    Returns:
        Dict[str, Any]: User information containing uid, email, and other claims
        
    Raises:
        HTTPException: 401 if authentication fails or token is invalid
        
    Environment Behavior:
        - Development (ENVIRONMENT=dev): Returns mock user data
        - Production: Validates Firebase ID token
    """
    
    # Development mode: bypass authentication with mock user
    if settings.is_development():
        logger.debug("Development mode: bypassing authentication")
        return {
            "uid": "dev-user-123", 
            "email": "dev@therapyapp.com", 
            "name": "Development User",
            "env": "development"
        }

    # Production mode: require valid Authorization header
    if not authorization:
        logger.warning("Missing Authorization header in production request")
        raise HTTPException(
            status_code=401, 
            detail="Missing Authorization header. Please include Bearer token."
        )

    try:
        # Parse Authorization header (format: "Bearer <token>")
        scheme, token = authorization.split(" ", 1)
        
        if scheme.lower() != "bearer":
            logger.warning(f"Invalid authentication scheme: {scheme}")
            raise ValueError("Invalid authentication scheme. Use Bearer token.")
        
        # Verify Firebase ID token and extract user claims
        decoded_token = auth_client.verify_id_token(token)
        
        logger.info(f"User authenticated successfully: {decoded_token.get('uid')}")
        return decoded_token
        
    except ValueError as e:
        logger.error(f"Token validation error: {e}")
        raise HTTPException(
            status_code=401, 
            detail=f"Authentication failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected authentication error: {e}")
        raise HTTPException(
            status_code=401, 
            detail="Invalid or expired token. Please re-authenticate."
        )


def require_user_role(required_role: str):
    """
    Create a dependency that requires a specific user role.
    
    Args:
        required_role (str): The role required to access the endpoint
        
    Returns:
        Callable: FastAPI dependency function
        
    Usage:
        @router.post("/admin-only")
        async def admin_endpoint(user=Depends(require_user_role("admin"))):
            # Only users with 'admin' role can access this
    """
    async def role_checker(user: Dict[str, Any] = Depends(get_current_user)):
        user_roles = user.get("roles", [])
        if required_role not in user_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required role: {required_role}"
            )
        return user
    
    return role_checker
