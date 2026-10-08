"""Durable background execution: claim, lease, recover, retry and audit."""

import asyncio
import time

import httpx

from .ai import ProviderUnavailable
from .integrations import ConnectionError, Integrations
from .store import BudgetExceeded, Conflict, Store
from .workflow import Workflow


async def execute_job(
    job: dict, store: Store, workflow: Workflow, integrations: Integrations
) -> None:
    if job["kind"] == "retention":
        store.cleanup()
    elif job["kind"] == "review_pending":
        for ticket in store.list(job["scope"], "ticket"):
            if ticket["state"] == "new":
                if not ticket["synthetic"]:
                    await integrations.lookup_order(ticket)
                await workflow.recommend(job["scope"], ticket["id"], use_ai=False)
    elif job["kind"] == "connection_check":
        if job["scope"] != "merchant":
            raise ValueError("Connection checks require an owner workspace")
        for connection in store.list("merchant", "connection"):
            await integrations.check(connection["id"])
    elif job["kind"] == "sync_inbox":
        if job["scope"] != "merchant":
            raise ValueError("Inbox sync requires an owner workspace")
        await integrations.sync_gmail()
    else:
        raise ValueError("Unknown background task")


async def work_once(store: Store, workflow: Workflow, integrations: Integrations) -> bool:
    job = store.claim()
    if not job:
        return False
    try:
        await execute_job(job, store, workflow, integrations)
        store.finish_job(job)
    except (
        ConnectionError,
        ProviderUnavailable,
        BudgetExceeded,
        Conflict,
        ValueError,
        KeyError,
        httpx.HTTPError,
    ):
        # Do not store exception text: provider exceptions may contain private URLs/payloads.
        store.finish_job(job, "Task needs connection or input review")
    store.put("system", "health", "worker", {"heartbeat": time.time()})
    return True


async def worker_loop(store: Store, workflow: Workflow, integrations: Integrations) -> None:
    while True:
        store.put("system", "health", "worker", {"heartbeat": time.time()})
        await work_once(store, workflow, integrations)
        await asyncio.sleep(store.settings.worker_poll_seconds)
