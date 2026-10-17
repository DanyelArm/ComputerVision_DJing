import pytest

from cvdj.gestures import pinch_ratio
from cvdj.protocol import Hand
from tests.factories import make_landmarks


def hand(thumb_tip: tuple[float, float], index_tip: tuple[float, float]) -> Hand:
    return Hand(handedness="Right", score=1.0, landmarks=make_landmarks(thumb_tip, index_tip))


def test_touching_fingertips_give_zero() -> None:
    assert pinch_ratio(hand((0.5, 0.5), (0.5, 0.5)), aspect_ratio=1) == 0.0


def test_gap_is_measured_relative_to_hand_size() -> None:
    # Gap 0.2, hand size 0.2.
    assert pinch_ratio(hand((0.4, 0.5), (0.6, 0.5)), aspect_ratio=1) == 1.0
    # Gap 0.1, hand size 0.2.
    assert pinch_ratio(hand((0.45, 0.5), (0.55, 0.5)), aspect_ratio=1) == 0.5


def test_aspect_ratio_stretches_horizontal_distances() -> None:
    # On a 2:1 frame a horizontal gap of 0.1 widths is 0.2 heights; the hand
    # (vertical, 0.2 heights) is unaffected.
    assert pinch_ratio(hand((0.45, 0.5), (0.55, 0.5)), aspect_ratio=2) == 1.0


def test_degenerate_hand_does_not_divide_by_zero() -> None:
    degenerate = Hand(handedness="Left", score=1.0, landmarks=[(0.5, 0.5, 0.0)] * 21)

    assert pinch_ratio(degenerate, aspect_ratio=1) == pytest.approx(0.0)
