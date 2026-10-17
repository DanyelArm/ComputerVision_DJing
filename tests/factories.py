"""Builders for test data, shared by several test files."""

from cvdj.gestures import INDEX_TIP, MIDDLE_MCP, THUMB_TIP, WRIST
from cvdj.protocol import LANDMARKS_PER_HAND, Point


def make_landmarks(
    thumb_tip: tuple[float, float] = (0.4, 0.5),
    index_tip: tuple[float, float] = (0.6, 0.5),
) -> list[Point]:
    """21 landmarks with the wrist at (0.5, 0.8) and middle knuckle at (0.5, 0.6),
    i.e. a hand size of 0.2. Only the thumb and index tips vary."""
    landmarks: list[Point] = [(0.5, 0.5, 0.0)] * LANDMARKS_PER_HAND
    overrides = [
        (WRIST, (0.5, 0.8)),
        (MIDDLE_MCP, (0.5, 0.6)),
        (THUMB_TIP, thumb_tip),
        (INDEX_TIP, index_tip),
    ]
    for index, (x, y) in overrides:
        landmarks[index] = (x, y, 0.0)
    return landmarks
