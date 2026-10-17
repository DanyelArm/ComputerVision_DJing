"""The WebSocket message format shared with the browser.

Mirrors frontend/src/protocol.ts — keep the two in sync. Every incoming message
is validated here, so the rest of the backend can trust its input.
"""

from typing import Annotated, Literal

from pydantic import BaseModel, Field, TypeAdapter

Handedness = Literal["Left", "Right"]

# One landmark: x and y are 0..1 fractions of the frame width/height, z is relative depth.
Point = tuple[float, float, float]

LANDMARKS_PER_HAND = 21
MAX_HANDS = 2  # matches numHands in frontend/src/handTracker.ts


class Hand(BaseModel):
    handedness: Handedness
    score: float = Field(ge=0, le=1)
    landmarks: list[Point] = Field(min_length=LANDMARKS_PER_HAND, max_length=LANDMARKS_PER_HAND)


# --- Browser -> server --------------------------------------------------------


class PingMessage(BaseModel):
    type: Literal["ping"]
    sent_at: float


class HandsMessage(BaseModel):
    type: Literal["hands"]
    timestamp: float
    aspect_ratio: float = Field(gt=0)  # frame width / height
    hands: list[Hand] = Field(max_length=MAX_HANDS)


# The "type" field tells pydantic which model to validate against.
ClientMessage = Annotated[PingMessage | HandsMessage, Field(discriminator="type")]
client_message_adapter: TypeAdapter[ClientMessage] = TypeAdapter(ClientMessage)


# --- Server -> browser --------------------------------------------------------


class PongMessage(BaseModel):
    type: Literal["pong"] = "pong"
    sent_at: float


class HandFeatures(BaseModel):
    handedness: Handedness
    pinch: float  # thumb-to-index distance relative to hand size: ~0 pinched, ~1+ open


class HandFeaturesMessage(BaseModel):
    type: Literal["hand_features"] = "hand_features"
    timestamp: float
    hands: list[HandFeatures]


class ErrorMessage(BaseModel):
    type: Literal["error"] = "error"
    detail: str


ServerMessage = PongMessage | HandFeaturesMessage | ErrorMessage
