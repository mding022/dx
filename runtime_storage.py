"""Choose writable locations for runtime SQLite files."""

import os
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent


def runtime_database(name: str) -> Path:
    in_function_bundle = ROOT == Path("/var/task") or Path("/var/task") in ROOT.parents
    if os.getenv("VERCEL") == "1" or os.getenv("VERCEL_ENV") or in_function_bundle:
        return Path(tempfile.gettempdir()) / "dx" / name
    return ROOT / "data" / name
