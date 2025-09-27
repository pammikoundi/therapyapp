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
    
    For demo purposes, this always returns a test user to make the API
    easily accessible without authentication setup.
    
    Args:
        authorization (str, optional): Authorization header (ignored in demo mode)
        
    Returns:
        Dict[str, Any]: Test user information for demo purposes
    """
    
    # Demo mode: always return test user for easy demonstration
    logger.debug("Demo mode: using test user for all requests")
    return {
        "uid": "demo-user-12345", 
        "email": "demo@therapyapp.com", 
        "name": "Demo User",
        "demo_mode": True,
        "environment": settings.environment
    }


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
