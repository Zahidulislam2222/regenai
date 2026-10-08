"""Validated public requests and policy records."""

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Rulebook(StrictModel):
    store_name: str = Field(min_length=1, max_length=100)
    voice: str = Field(min_length=1, max_length=2000)
    refund_window_days: int = Field(ge=0, le=365)
    max_refund_cents: int = Field(ge=0, le=1000000)
    refund_reasons: list[Literal["damaged", "wrong_item", "not_received", "changed_mind"]]
    handoff_terms: list[Annotated[str, Field(min_length=1, max_length=200)]] = Field(max_length=50)
    confidence_threshold: float = Field(ge=0, le=1)
    policies: str = Field(min_length=1, max_length=6000)


class ChatRequest(StrictModel):
    message: str = Field(min_length=1, max_length=4000)
    image: str | None = Field(default=None, max_length=1400000)


class LoginRequest(StrictModel):
    password: str = Field(min_length=1, max_length=200)


class MemoryRequest(StrictModel):
    text: str = Field(max_length=4000)


class TicketInput(StrictModel):
    subject: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=6000)
    customer: str = Field(min_length=1, max_length=254)
    order_number: str = Field(pattern=r"^[0-9]{1,12}$")
    reason: Literal["damaged", "wrong_item", "not_received", "changed_mind", "other"]
    channel: Literal["demo", "gmail", "gorgias", "zendesk", "helpscout", "front", "zoho"]
    language: str = Field(min_length=1, max_length=50)
    external_id: str = Field(default="", max_length=200)


class DecisionRequest(StrictModel):
    decision: Literal["approve", "reject"]
    version: int = Field(ge=1)


class Recommendation(StrictModel):
    action: Literal["refund", "reply", "handoff"]
    amount_cents: int = Field(ge=0)
    reason: str = Field(min_length=1, max_length=2000)
    reply: str = Field(min_length=1, max_length=6000)
    confidence: float = Field(ge=0, le=1)


class ExamplesRequest(StrictModel):
    examples: str = Field(min_length=10, max_length=12000)


class WebRequest(StrictModel):
    url: str = Field(min_length=1, max_length=2000)


class ScheduleRequest(StrictModel):
    kind: Literal["review_pending", "sync_inbox", "connection_check", "retention"]
    delay_seconds: int = Field(ge=0, le=604800)
    interval_seconds: int = Field(default=0, ge=0, le=604800)


class SetupEntry(StrictModel):
    step: str = Field(min_length=1, max_length=100)
    note: str = Field(min_length=1, max_length=2000)
