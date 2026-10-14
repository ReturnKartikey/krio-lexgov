import ipaddress
import socket
from urllib.parse import urlparse

from app.core.config import get_settings
from app.core.logging import logger


def escape_like(val: str) -> str:
    """
    Escape special SQL LIKE / ILIKE wildcards (%, _, \\)
    to prevent wildcard search DoS and unintended pattern expansion.
    """
    if not val:
        return ""
    return val.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


ALLOWED_REGISTRY_DOMAINS = (
    "sebi.gov.in",
    "bseindia.com",
    "nseindia.com",
    "mca.gov.in",
    "ibbi.gov.in",
    "rbi.org.in",
    "egazette.gov.in",
)


def is_safe_registry_url(url: str) -> bool:
    """
    Validate that a URL targets an approved registry domain and does not resolve
    to internal RFC 1918 addresses, loopbacks, link-local, or cloud metadata endpoints.
    Protects against Server-Side Request Forgery (SSRF).
    """
    if not url or not isinstance(url, str):
        return False

    settings = get_settings()

    try:
        parsed = urlparse(url.strip())
        if parsed.scheme.lower() not in ("http", "https"):
            logger.warning(f"SSRF blocked: Invalid URL scheme '{parsed.scheme}' for URL: {url}")
            return False

        hostname = parsed.hostname
        if not hostname:
            return False

        # In testing environment, allow localhost / test server mock URLs
        if settings.ENVIRONMENT == "test" and (
            hostname in ("localhost", "127.0.0.1", "testserver") or hostname.endswith(".test")
        ):
            return True

        # Check domain allowlist
        lower_host = hostname.lower()
        is_allowed_domain = any(
            lower_host == domain or lower_host.endswith("." + domain)
            for domain in ALLOWED_REGISTRY_DOMAINS
        )

        if not is_allowed_domain:
            logger.warning(f"SSRF blocked: Hostname '{hostname}' is not in approved registry domain list.")
            return False

        # Resolve DNS to check for internal / private IP address spaces
        try:
            addr_info = socket.getaddrinfo(hostname, None)
            for item in addr_info:
                ip_str = item[4][0]
                ip = ipaddress.ip_address(ip_str)

                if (
                    ip.is_private
                    or ip.is_loopback
                    or ip.is_link_local
                    or ip.is_reserved
                    or ip.is_multicast
                ):
                    logger.warning(f"SSRF blocked: Hostname '{hostname}' resolved to private/forbidden IP '{ip_str}'")
                    return False
        except socket.gaierror:
            # If DNS resolution fails in test or disconnected environment, permit domain allowlist match
            pass

        return True

    except Exception as e:
        logger.warning(f"SSRF check failed with error: {e} for url: {url}")
        return False
