import asyncio
import time
import urllib.robotparser
from urllib.parse import urlparse

import httpx
from fastapi import HTTPException, Request, status

from app.core.config import get_settings
from app.core.logging import logger


class AsyncTokenBucket:
    """Token bucket algorithm for rate limiting async HTTP requests."""

    def __init__(self, rate: float = 1.0, capacity: float = 5.0):
        """
        :param rate: Tokens added per second.
        :param capacity: Maximum burst capacity of tokens.
        """
        self.rate = rate
        self.capacity = capacity
        self.tokens = capacity
        self.last_update = time.monotonic()
        self._lock = asyncio.Lock()

    async def acquire(self, tokens: float = 1.0) -> None:
        async with self._lock:
            while True:
                now = time.monotonic()
                elapsed = now - self.last_update
                self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
                self.last_update = now

                if self.tokens >= tokens:
                    self.tokens -= tokens
                    return

                # Calculate required sleep time
                needed = tokens - self.tokens
                wait_time = needed / self.rate
                await asyncio.sleep(wait_time)


class RobotsTxtValidator:
    """Fetches and caches robots.txt rules per host."""

    def __init__(self, user_agent: str = "OpenGov-Bot/1.0"):
        self.user_agent = user_agent
        self._parsers: dict[str, urllib.robotparser.RobotFileParser] = {}
        self._lock = asyncio.Lock()

    async def can_fetch(self, url: str, client: httpx.AsyncClient | None = None) -> bool:
        parsed = urlparse(url)
        host = f"{parsed.scheme}://{parsed.netloc}"

        async with self._lock:
            if host not in self._parsers:
                robots_url = f"{host}/robots.txt"
                parser = urllib.robotparser.RobotFileParser()
                parser.set_url(robots_url)

                try:
                    should_close = False
                    if client is None:
                        client = httpx.AsyncClient(timeout=10.0)
                        should_close = True

                    response = await client.get(robots_url, headers={"User-Agent": self.user_agent})
                    if response.status_code == 200:
                        parser.parse(response.text.splitlines())
                    else:
                        parser.allow_all = True
                except Exception as e:
                    logger.warning(
                        f"Could not fetch robots.txt for {host}: {e}. Defaulting to allow."
                    )
                    parser.allow_all = True
                finally:
                    if should_close and client:
                        await client.aclose()

                self._parsers[host] = parser

            return self._parsers[host].can_fetch(self.user_agent, url)


rate_limiter = AsyncTokenBucket(rate=1.0, capacity=3.0)
robots_validator = RobotsTxtValidator()


class InboundRateLimiter:
    """In-memory sliding-window request rate limiter per client IP."""

    def __init__(self, default_limit: int = 120, window_seconds: int = 60):
        self.default_limit = default_limit
        self.window_seconds = window_seconds
        self._requests: dict[str, list[float]] = {}
        self._lock = asyncio.Lock()

    async def is_allowed(self, client_ip: str, limit: int | None = None) -> tuple[bool, int]:
        max_req = limit or self.default_limit
        now = time.monotonic()
        cutoff = now - self.window_seconds

        async with self._lock:
            timestamps = self._requests.get(client_ip, [])
            # Prune timestamps older than window
            valid_timestamps = [t for t in timestamps if t > cutoff]

            if len(valid_timestamps) >= max_req:
                oldest = valid_timestamps[0]
                retry_after = max(1, int(self.window_seconds - (now - oldest)))
                self._requests[client_ip] = valid_timestamps
                return False, retry_after

            valid_timestamps.append(now)
            self._requests[client_ip] = valid_timestamps
            return True, 0

    async def cleanup(self) -> None:
        """Periodic cleanup of stale IP entries."""
        now = time.monotonic()
        cutoff = now - self.window_seconds
        async with self._lock:
            stale_keys = [
                ip for ip, timestamps in self._requests.items()
                if not timestamps or timestamps[-1] <= cutoff
            ]
            for ip in stale_keys:
                del self._requests[ip]


inbound_limiter = InboundRateLimiter()


def check_rate_limit(max_per_minute: int = 60):
    """FastAPI dependency for rate-limiting incoming requests."""
    async def dependency(request: Request):
        settings = get_settings()
        if settings.ENVIRONMENT == "test":
            return

        client_ip = "unknown"
        if request and request.client:
            client_ip = request.client.host
        if request and "x-forwarded-for" in request.headers:
            client_ip = request.headers["x-forwarded-for"].split(",")[0].strip()

        allowed, retry_after = await inbound_limiter.is_allowed(client_ip, limit=max_per_minute)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {max_per_minute} requests per minute.",
                headers={"Retry-After": str(retry_after)},
            )

    return dependency

