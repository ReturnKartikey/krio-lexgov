import asyncio
import time
import urllib.robotparser
from typing import Optional, Dict
from urllib.parse import urlparse
import httpx
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
        self._parsers: Dict[str, urllib.robotparser.RobotFileParser] = {}
        self._lock = asyncio.Lock()

    async def can_fetch(self, url: str, client: Optional[httpx.AsyncClient] = None) -> bool:
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
                    logger.warning(f"Could not fetch robots.txt for {host}: {e}. Defaulting to allow.")
                    parser.allow_all = True
                finally:
                    if should_close and client:
                        await client.aclose()

                self._parsers[host] = parser

            return self._parsers[host].can_fetch(self.user_agent, url)


rate_limiter = AsyncTokenBucket(rate=1.0, capacity=3.0)
robots_validator = RobotsTxtValidator()
