import json
from typing import Any

import pytest

from cvdj.handlers import handle_message
from cvdj.protocol import ErrorMessage, HandFeaturesMessage, PongMessage
from tests.factories import make_landmarks


def hands_message(**overrides: Any) -> str:
    message: dict[str, Any] = {
        "type": "hands",
        "timestamp": 1000,
        "aspect_ratio": 1,
        "hands": [{"handedness": "Left", "score": 0.95, "landmarks": make_landmarks()}],
    }
    message.update(overrides)
    return json.dumps(message)


def test_ping_gets_pong_with_same_timestamp() -> None:
    assert handle_message('{"type": "ping", "sent_at": 42}') == PongMessage(sent_at=42)


def test_hands_message_gets_pinch_per_hand() -> None:
    reply = handle_message(hands_message())

    assert isinstance(reply, HandFeaturesMessage)
    assert reply.timestamp == 1000
    assert [(h.handedness, h.pinch) for h in reply.hands] == [("Left", 1.0)]


def test_no_hands_gives_empty_features() -> None:
    reply = handle_message(hands_message(hands=[]))

    assert reply == HandFeaturesMessage(timestamp=1000, hands=[])


@pytest.mark.parametrize(
    ("raw", "expected_location"),
    [
        ("not json", ""),
        ('{"type": "dance"}', ""),
        ('{"type": "ping"}', "ping.sent_at"),
        (hands_message(aspect_ratio=0), "hands.aspect_ratio"),
        (
            hands_message(hands=[{"handedness": "Left", "score": 1, "landmarks": [[0, 0, 0]]}]),
            "hands.hands.0.landmarks",
        ),
        (
            hands_message(hands=[{"handedness": "Middle", "score": 1, "landmarks": []}]),
            "hands.hands.0.handedness",
        ),
    ],
    ids=["not-json", "unknown-type", "missing-field", "bad-aspect", "few-landmarks", "bad-hand"],
)
def test_invalid_messages_get_an_error_naming_the_problem(raw: str, expected_location: str) -> None:
    reply = handle_message(raw)

    assert isinstance(reply, ErrorMessage)
    assert f"'{expected_location}'" in reply.detail
