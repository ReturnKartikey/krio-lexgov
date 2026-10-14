from fastapi import HTTPException, Query, Security, status
from fastapi.security import APIKeyHeader

from app.core.config import get_settings

admin_key_header = APIKeyHeader(name="X-Admin-Key", auto_error=False)


async def verify_admin_key(
    header_key: str | None = Security(admin_key_header),
    admin_key: str | None = Query(None, description="Admin secret key fallback"),
) -> bool:
    """
    Verify administrative access key for critical mutation / sync endpoints.
    Allows testing bypass when ENVIRONMENT == 'test' if no key is provided,
    but enforces 401 if an invalid key is explicitly supplied.
    """
    settings = get_settings()
    provided = header_key or admin_key

    if settings.ENVIRONMENT == "test":
        if provided is not None and provided != settings.ADMIN_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid administrative API key",
            )
        return True

    if not provided or provided != settings.ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing administrative API key",
        )
    return True
