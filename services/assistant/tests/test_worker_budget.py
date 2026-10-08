import time
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from regenai_assistant.config import Settings
from regenai_assistant.store import BudgetExceeded, Store
from regenai_assistant.worker import work_once


def test_budget_reservations_survive_restart(settings: Settings) -> None:
    store = Store(settings)
    reservation = store.reserve("merchant", settings.daily_budget_usd)
    restarted = Store(settings)
    with pytest.raises(BudgetExceeded):
        restarted.reserve("merchant", Decimal("0.01"))
    restarted.settle(reservation, Decimal("0.01"))
    assert restarted.budget()["daily"] == "0.01"


def test_ambiguous_api_failure_keeps_reserved_spend(settings: Settings) -> None:
    store = Store(settings)
    reservation = store.reserve("merchant", Decimal("0.02"))
    store.settle(reservation, None)
    assert store.budget()["total"] == "0.02"


async def test_worker_reviews_without_executing_refunds(session: TestClient) -> None:
    store = session.app.state.store
    scope = store.authenticate(session.cookies.get("regenai_assistant_session"))["scope"]
    store.enqueue(scope, "review_pending", 0)
    assert await work_once(store, session.app.state.workflow, session.app.state.integrations)
    assert any(t["state"] == "awaiting_approval" for t in store.list(scope, "ticket"))
    assert all(o["refunded_cents"] == 0 for o in store.list(scope, "order"))


def test_expired_worker_lease_is_reclaimed(settings: Settings) -> None:
    store = Store(settings)
    job_id = store.enqueue("test-workspace", "retention", 0)
    first = store.claim()
    assert first["id"] == job_id
    assert store.claim() is None
    with store.db() as db:
        db.execute("UPDATE jobs SET lease=? WHERE id=?", (time.time() - 1, job_id))
    restarted = Store(settings)
    second = restarted.claim()
    assert second["id"] == job_id
    assert second["attempts"] == 2


def test_failed_jobs_stop_after_bounded_retries(settings: Settings) -> None:
    store = Store(settings)
    job_id = store.enqueue("test-workspace", "sync_inbox", 0)
    for _ in range(settings.worker_max_attempts):
        job = store.claim()
        assert job
        store.finish_job(job, "Connection review required")
        with store.db() as db:
            db.execute("UPDATE jobs SET due=? WHERE id=?", (time.time() - 1, job_id))
    assert store.jobs("test-workspace")[0]["state"] == "failed"
    assert store.claim() is None


def test_recurring_job_is_rescheduled(settings: Settings) -> None:
    store = Store(settings)
    store.enqueue("test-workspace", "retention", 0, 120)
    job = store.claim()
    store.finish_job(job)
    next_job = store.jobs("test-workspace")[0]
    assert next_job["state"] == "pending"
    assert next_job["due"] > time.time() + 100
