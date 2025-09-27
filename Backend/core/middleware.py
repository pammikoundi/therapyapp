from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from core.config import settings
from core.firebase import auth_client


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Allow open endpoints without auth
        if request.url.path.startswith("/open"):  # you can define any public routes
            return await call_next(request)

        # Dev bypass
        if settings.environment == "dev":
            request.state.user = {"uid": "test-user", "email": "test@example.com"}
            return await call_next(request)

        # Prod → Require Firebase ID Token
        auth_header = request.headers.get("authorization")
        if not auth_header:
            return JSONResponse({"detail": "Missing Authorization header"}, status_code=401)

        try:
            scheme, token = auth_header.split(" ")
            if scheme.lower() != "bearer":
                raise ValueError("Invalid auth scheme")

            decoded_token = auth_client.verify_id_token(token)
            request.state.user = decoded_token
            return await call_next(request)

        except Exception:
            return JSONResponse({"detail": "Invalid or expired token"}, status_code=401)
