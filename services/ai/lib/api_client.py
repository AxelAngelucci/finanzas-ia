import os
import httpx
from typing import Any

API_URL = os.environ.get("API_URL", "http://localhost:3001/v1")
SERVICE_TOKEN = os.environ.get("INTERNAL_SERVICE_TOKEN", "")

_client: httpx.AsyncClient | None = None


def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(base_url=API_URL, timeout=15.0)
    return _client


def _headers(user_id: str) -> dict:
    return {
        "X-Service-Token": SERVICE_TOKEN,
        "X-User-Id": user_id,
        "Content-Type": "application/json",
    }


async def api_get(path: str, user_id: str, params: dict | None = None) -> Any:
    r = await get_client().get(path, headers=_headers(user_id), params=params)
    r.raise_for_status()
    return r.json()


async def api_post(path: str, user_id: str, body: dict) -> Any:
    r = await get_client().post(path, headers=_headers(user_id), json=body)
    r.raise_for_status()
    return r.json()


async def api_put(path: str, user_id: str, body: dict) -> Any:
    r = await get_client().put(path, headers=_headers(user_id), json=body)
    r.raise_for_status()
    return r.json()


async def api_delete(path: str, user_id: str) -> Any:
    r = await get_client().delete(path, headers=_headers(user_id))
    r.raise_for_status()
    return r.json()
