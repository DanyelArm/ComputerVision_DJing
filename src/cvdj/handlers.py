"""What the server does with each incoming WebSocket message.

Kept separate from the WebSocket plumbing in app.py so it can be tested as a
plain function: text in, reply out.
"""

from typing import assert_never

from pydantic import ValidationError

from cvdj.gestures import pinch_ratio
from cvdj.protocol import (
    ErrorMessage,
    HandFeatures,
    HandFeaturesMessage,
    HandsMessage,
    PingMessage,
    PongMessage,
    ServerMessage,
    client_message_adapter,
)


def handle_message(raw: str) -> ServerMessage:
    try:
        message = client_message_adapter.validate_json(raw)
    except ValidationError as error:
        first = error.errors()[0]
        location = ".".join(str(part) for part in first["loc"])
        return ErrorMessage(detail=f"Invalid message at '{location}': {first['msg']}")

    match message:
        case PingMessage():
            return PongMessage(sent_at=message.sent_at)
        case HandsMessage():
            return HandFeaturesMessage(
                timestamp=message.timestamp,
                hands=[
                    HandFeatures(
                        handedness=hand.handedness,
                        pinch=pinch_ratio(hand, message.aspect_ratio),
                    )
                    for hand in message.hands
                ],
            )
        case _:
            # mypy proves this is unreachable; adding a new message type to
            # ClientMessage without handling it above becomes a type error.
            assert_never(message)
