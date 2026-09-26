"""Use Turso for persistent data, with local SQLite for development."""

import os
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parent


def runtime_database(name: str) -> Path:
    return ROOT / "data" / name


def turso_configured() -> bool:
    return bool(os.getenv("TURSO_DATABASE_URL") and os.getenv("TURSO_AUTH_TOKEN"))


def connect_writable_database(path: Path, *, use_turso: bool = True, rows: bool = False):
    if use_turso:
        url = os.getenv("TURSO_DATABASE_URL", "")
        token = os.getenv("TURSO_AUTH_TOKEN", "")
        on_vercel = os.getenv("VERCEL") == "1" or bool(os.getenv("VERCEL_ENV")) or ROOT == Path("/var/task") or Path("/var/task") in ROOT.parents
        if bool(url) != bool(token) or (on_vercel and not url):
            raise RuntimeError("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN on the backend Vercel project.")
        if url:
            import turso_serverless

            db = turso_serverless.connect(url, auth_token=token)
            if rows:
                db.row_factory = turso_serverless.Row
            return db

    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path, timeout=30)
    if rows:
        db.row_factory = sqlite3.Row
    return db
