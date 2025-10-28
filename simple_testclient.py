"""Minimal synchronous test client for FastAPI apps without httpx dependency."""

from __future__ import annotations

import asyncio
import json
from contextlib import AsyncExitStack
from dataclasses import dataclass
from types import TracebackType
from typing import Any, Dict, Iterable, Mapping, MutableMapping, Optional
from urllib.parse import urlencode, urljoin, urlsplit

ASGI_SCOPE = Dict[str, Any]


@dataclass
class Response:
    """Simplified HTTP response wrapper used by tests."""

    status_code: int
    headers: Mapping[str, str]
    content: bytes

    @property
    def text(self) -> str:
        return self.content.decode("utf-8")

    def json(self) -> Any:
        if not self.content:
            return None
        return json.loads(self.text)


class TestClient:
    """Synchronous test client that exercises an ASGI app without httpx."""

    __test__ = False  # Prevent pytest from collecting this class as a test.

    def __init__(self, app: Any, base_url: str = "http://testserver") -> None:
        self.app = app
        self.base_url = base_url
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._stack: Optional[AsyncExitStack] = None
        self._previous_loop: Optional[asyncio.AbstractEventLoop] = None

    def __enter__(self) -> "TestClient":
        if self._loop is not None:
            return self

        try:
            self._previous_loop = asyncio.get_running_loop()
        except RuntimeError:
            self._previous_loop = None

        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)
        self._loop.run_until_complete(self._startup())
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        if self._loop is None:
            return
        try:
            self._loop.run_until_complete(self._shutdown())
        finally:
            self._loop.close()
            self._loop = None
            asyncio.set_event_loop(self._previous_loop)
            self._previous_loop = None

    async def _startup(self) -> None:
        self._stack = AsyncExitStack()
        lifespan_factory = getattr(self.app.router, "lifespan_context", None)
        if lifespan_factory is not None:
            lifespan = lifespan_factory(self.app)
            await self._stack.enter_async_context(lifespan)

    async def _shutdown(self) -> None:
        if self._stack is not None:
            await self._stack.aclose()
            self._stack = None

    def request(
        self,
        method: str,
        url: str,
        *,
        params: Mapping[str, Any] | Iterable[tuple[str, Any]] | None = None,
        json: Any | None = None,
        headers: Mapping[str, str] | None = None,
    ) -> Response:
        if self._loop is None:
            raise RuntimeError("TestClient must be used as a context manager")

        return self._loop.run_until_complete(
            self._make_request(method, url, params=params, json=json, headers=headers)
        )

    def get(self, url: str, **kwargs: Any) -> Response:
        return self.request("GET", url, **kwargs)

    def post(self, url: str, **kwargs: Any) -> Response:
        return self.request("POST", url, **kwargs)

    def put(self, url: str, **kwargs: Any) -> Response:
        return self.request("PUT", url, **kwargs)

    def delete(self, url: str, **kwargs: Any) -> Response:
        return self.request("DELETE", url, **kwargs)

    def close(self) -> None:
        self.__exit__(None, None, None)

    async def _make_request(
        self,
        method: str,
        url: str,
        *,
        params: Mapping[str, Any] | Iterable[tuple[str, Any]] | None,
        json: Any | None,
        headers: Mapping[str, str] | None,
    ) -> Response:
        if not url.startswith("http://") and not url.startswith("https://"):
            target = urljoin(self.base_url, url)
        else:
            target = url
        parsed = urlsplit(target)

        query_components: list[tuple[str, str]] = []
        if parsed.query:
            for fragment in parsed.query.split("&"):
                if fragment:
                    if "=" in fragment:
                        k, v = fragment.split("=", 1)
                        query_components.append((k, v))
                    else:
                        query_components.append((fragment, ""))
        if params:
            if isinstance(params, Mapping):
                params = list(params.items())
            query_components.extend((str(k), str(v)) for k, v in params)
        if query_components:
            query_string = urlencode(query_components)
        else:
            query_string = parsed.query

        body_bytes = b""
        header_items: list[tuple[bytes, bytes]] = []
        if headers:
            header_items.extend((k.lower().encode("latin-1"), v.encode("latin-1")) for k, v in headers.items())
        if json is not None:
            body_bytes = json_dumps(json)
            header_items.append((b"content-type", b"application/json"))

        header_items.append((b"host", (parsed.netloc or "testserver").encode("latin-1")))

        scope: ASGI_SCOPE = {
            "type": "http",
            "asgi": {"version": "3.0", "spec_version": "2.1"},
            "http_version": "1.1",
            "method": method.upper(),
            "scheme": parsed.scheme or "http",
            "path": parsed.path or "/",
            "raw_path": (parsed.path or "/").encode("latin-1"),
            "query_string": query_string.encode("latin-1"),
            "root_path": "",
            "headers": header_items,
            "client": ("testclient", 50000),
            "server": (parsed.hostname or "testserver", parsed.port or 80),
            "state": {},
        }

        body_sent = False
        messages: list[MutableMapping[str, Any]] = []

        async def receive() -> MutableMapping[str, Any]:
            nonlocal body_sent
            if not body_sent:
                body_sent = True
                return {"type": "http.request", "body": body_bytes, "more_body": False}
            return {"type": "http.disconnect"}

        async def send(message: MutableMapping[str, Any]) -> None:
            messages.append(message)

        await self.app(scope, receive, send)

        status_code = 500
        response_headers: list[tuple[bytes, bytes]] = []
        response_body = b""

        for message in messages:
            if message["type"] == "http.response.start":
                status_code = message["status"]
                response_headers = list(message.get("headers", []))
            elif message["type"] == "http.response.body":
                response_body += message.get("body", b"")
        header_map = {k.decode("latin-1"): v.decode("latin-1") for k, v in response_headers}

        return Response(status_code=status_code, headers=header_map, content=response_body)


def json_dumps(value: Any) -> bytes:
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
