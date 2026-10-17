"""Turning raw hand landmarks into meaningful measurements."""

import math

from cvdj.protocol import Hand

# MediaPipe landmark indices: https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker
WRIST = 0
THUMB_TIP = 4
INDEX_TIP = 8
MIDDLE_MCP = 9  # knuckle at the base of the middle finger

_MIN_HAND_SIZE = 1e-6


def _point_2d(hand: Hand, index: int, aspect_ratio: float) -> tuple[float, float]:
    # x is a fraction of the frame width and y of its height; scaling x by the
    # aspect ratio puts both in the same unit (frame heights), so distances
    # don't depend on which way the hand is turned.
    x, y, _z = hand.landmarks[index]
    return (x * aspect_ratio, y)


def pinch_ratio(hand: Hand, aspect_ratio: float) -> float:
    """Thumb-tip to index-tip distance divided by the hand's size.

    Dividing by hand size (wrist to middle knuckle) makes the value the same
    whether the hand is close to the camera or far away.
    """
    gap = math.dist(
        _point_2d(hand, THUMB_TIP, aspect_ratio),
        _point_2d(hand, INDEX_TIP, aspect_ratio),
    )
    hand_size = math.dist(
        _point_2d(hand, WRIST, aspect_ratio),
        _point_2d(hand, MIDDLE_MCP, aspect_ratio),
    )
    return round(gap / max(hand_size, _MIN_HAND_SIZE), 3)
