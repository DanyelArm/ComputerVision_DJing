"""Runtime configuration, read from environment variables.

Keeping config in the environment (not in code) lets the same build run
locally, in Docker and in CI with different settings.
"""

import os
from dataclasses import dataclass
from typing import Self


@dataclass(frozen=True)
class Settings:
    host: str = "127.0.0.1"
    port: int = 8000
    log_level: str = "info"

    @classmethod
    def from_env(cls) -> Self:
        return cls(
            host=os.environ.get("CVDJ_HOST", cls.host),
            port=int(os.environ.get("CVDJ_PORT", cls.port)),
            log_level=os.environ.get("CVDJ_LOG_LEVEL", cls.log_level),
        )
