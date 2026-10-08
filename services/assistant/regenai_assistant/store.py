"""Encrypted records, expiring sessions and transactional state transitions."""

import builtins
import hashlib
import json
import secrets
import sqlite3
import time
import uuid
from collections.abc import Iterator
from contextlib import contextmanager
from decimal import Decimal
from typing import Any

from cryptography.fernet import Fernet

from .config import Settings, content


class Conflict(Exception):
    pass


class BudgetExceeded(Exception):
    pass


class Store:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.public_errors = content("ui.json")["errors"]
        self.cipher = Fernet(settings.encryption_key.get_secret_value().encode())
        settings.database_path.parent.mkdir(parents=True, exist_ok=True)
        with self.db() as db:
            db.executescript("""
                PRAGMA journal_mode=WAL;
                CREATE TABLE IF NOT EXISTS records (
                    scope TEXT NOT NULL, kind TEXT NOT NULL, id TEXT NOT NULL,
                    data BLOB NOT NULL, version INTEGER NOT NULL, updated REAL NOT NULL,
                    PRIMARY KEY(scope,kind,id));
                CREATE TABLE IF NOT EXISTS sessions (
                    digest TEXT PRIMARY KEY, scope TEXT NOT NULL, role TEXT NOT NULL,
                    expires REAL NOT NULL, turns INTEGER NOT NULL DEFAULT 0);
                CREATE TABLE IF NOT EXISTS jobs (
                    id TEXT PRIMARY KEY, scope TEXT NOT NULL, kind TEXT NOT NULL,
                    state TEXT NOT NULL, due REAL NOT NULL, attempts INTEGER NOT NULL,
                    lease REAL NOT NULL DEFAULT 0, error TEXT NOT NULL DEFAULT '',
                    interval_seconds INTEGER NOT NULL DEFAULT 0);
                CREATE TABLE IF NOT EXISTS spend (
                    id TEXT PRIMARY KEY, day TEXT NOT NULL, reserved TEXT NOT NULL,
                    actual TEXT, state TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS rates (
                    key TEXT PRIMARY KEY, count INTEGER NOT NULL, until REAL NOT NULL);
                CREATE TABLE IF NOT EXISTS action_locks (
                    order_id TEXT PRIMARY KEY, ticket_id TEXT NOT NULL);
            """)

    @contextmanager
    def db(self) -> Iterator[sqlite3.Connection]:
        db = sqlite3.connect(
            self.settings.database_path, timeout=self.settings.sqlite_timeout_seconds
        )
        db.row_factory = sqlite3.Row
        try:
            with db:
                yield db
        finally:
            db.close()

    def encrypt(self, value: Any) -> bytes:
        return self.cipher.encrypt(json.dumps(value, ensure_ascii=False).encode())

    def decrypt(self, value: bytes) -> Any:
        return json.loads(self.cipher.decrypt(value))

    def get(self, scope: str, kind: str, record_id: str) -> dict | None:
        with self.db() as db:
            row = db.execute(
                "SELECT * FROM records WHERE scope=? AND kind=? AND id=?", (scope, kind, record_id)
            ).fetchone()
        if row is None:
            return None
        data = self.decrypt(row["data"])
        return {**data, "id": record_id, "version": row["version"]}

    def list(self, scope: str, kind: str, limit: int | None = None) -> list[dict]:
        with self.db() as db:
            query = "SELECT * FROM records WHERE scope=? AND kind=? ORDER BY updated DESC"
            args: tuple = (scope, kind)
            if limit is not None:
                query += " LIMIT ?"
                args += (limit,)
            rows = db.execute(query, args).fetchall()
        return [{**self.decrypt(r["data"]), "id": r["id"], "version": r["version"]} for r in rows]

    def put(
        self, scope: str, kind: str, record_id: str, data: dict, expected_version: int | None = None
    ) -> dict:
        with self.db() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute(
                "SELECT version FROM records WHERE scope=? AND kind=? AND id=?",
                (scope, kind, record_id),
            ).fetchone()
            version = row["version"] if row else 0
            if row is None:
                self.record_capacity(db, scope, 1)
            if expected_version is not None and version != expected_version:
                raise Conflict("This record changed; reload it before continuing")
            db.execute(
                "INSERT INTO records VALUES (?,?,?,?,?,?) "
                "ON CONFLICT(scope,kind,id) DO UPDATE SET data=excluded.data, "
                "version=excluded.version, updated=excluded.updated",
                (scope, kind, record_id, self.encrypt(data), version + 1, time.time()),
            )
        return {**data, "id": record_id, "version": version + 1}

    def record_capacity(self, db: sqlite3.Connection, scope: str, additional: int) -> None:
        workspace = db.execute("SELECT COUNT(*) FROM records WHERE scope=?", (scope,)).fetchone()[0]
        total = db.execute("SELECT COUNT(*) FROM records").fetchone()[0]
        if (
            workspace + additional > self.settings.max_records_per_workspace
            or total + additional > self.settings.max_records_total
        ):
            raise BudgetExceeded(
                "Storage allowance reached; export records and request owner review"
            )

    def audit(self, scope: str, event: str, detail: dict) -> dict:
        return self.put(
            scope,
            "audit",
            secrets.token_hex(16),
            {"event": event, "detail": detail, "time": time.time()},
        )

    def claim_action(self, ticket: dict, order: dict | None, rules: dict) -> dict:
        """Bind live approval, policy and order while reserving the order across awaits."""
        with self.db() as db:
            db.execute("BEGIN IMMEDIATE")
            self.record_capacity(db, "merchant", 2)
            for kind, record in (("ticket", ticket), ("rulebook", rules), ("order", order)):
                if record is None:
                    continue
                row = db.execute(
                    "SELECT version FROM records WHERE scope='merchant' AND kind=? AND id=?",
                    (kind, record["id"]),
                ).fetchone()
                if row is None or row["version"] != record["version"]:
                    raise Conflict("Ticket, policy or order changed; review again")
            if order and ticket["recommendation"]["action"] == "refund":
                try:
                    db.execute("INSERT INTO action_locks VALUES (?,?)", (order["id"], ticket["id"]))
                except sqlite3.IntegrityError as exc:
                    raise Conflict(
                        "Another action for this order needs completion or reconciliation"
                    ) from exc
            audit_id = "execution:" + ticket["id"] + ":" + str(ticket["version"])
            for suffix, event in (
                (":approval", "live_action_approved"),
                (":outcome", "live_action_in_progress"),
            ):
                db.execute(
                    "INSERT INTO records VALUES (?,?,?,?,?,?)",
                    (
                        "merchant",
                        "audit",
                        audit_id + suffix,
                        self.encrypt(
                            {
                                "event": event,
                                "detail": {"ticket": ticket["id"], "version": ticket["version"]},
                                "time": time.time(),
                            }
                        ),
                        1,
                        time.time(),
                    ),
                )
            executing = {
                **ticket,
                "state": "executing",
                "execution_key": str(
                    uuid.uuid5(uuid.NAMESPACE_OID, ticket["id"] + ":" + str(ticket["version"]))
                ),
                "execution_audit_id": audit_id + ":outcome",
            }
            db.execute(
                "UPDATE records SET data=?,version=version+1,updated=? "
                "WHERE scope='merchant' AND kind='ticket' AND id=?",
                (self.encrypt(executing), time.time(), ticket["id"]),
            )
        return {**executing, "version": ticket["version"] + 1}

    def release_action(self, ticket_id: str) -> None:
        with self.db() as db:
            db.execute("DELETE FROM action_locks WHERE ticket_id=?", (ticket_id,))

    def session(self, role: str = "demo") -> tuple[str, dict]:
        token = secrets.token_urlsafe(32)
        scope = "merchant" if role == "owner" else secrets.token_hex(16)
        with self.db() as db:
            db.execute("BEGIN IMMEDIATE")
            db.execute("DELETE FROM sessions WHERE expires < ?", (time.time(),))
            if (
                db.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]
                >= self.settings.max_sessions
            ):
                raise BudgetExceeded(self.public_errors["session_capacity"])
            db.execute(
                "INSERT INTO sessions(digest,scope,role,expires) VALUES (?,?,?,?)",
                (
                    hashlib.sha256(token.encode()).hexdigest(),
                    scope,
                    role,
                    time.time() + self.settings.session_seconds,
                ),
            )
        return token, {"scope": scope, "role": role}

    def authenticate(self, token: str) -> dict | None:
        if len(token) > 200:
            return None
        with self.db() as db:
            row = db.execute(
                "SELECT * FROM sessions WHERE digest=? AND expires>?",
                (hashlib.sha256(token.encode()).hexdigest(), time.time()),
            ).fetchone()
        return dict(row) if row else None

    def rate(self, key: str, limit: int, seconds: int) -> None:
        digest = hashlib.sha256(key.encode()).hexdigest()
        with self.db() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute("SELECT * FROM rates WHERE key=?", (digest,)).fetchone()
            active = row and row["until"] > time.time()
            count = row["count"] + 1 if active else 1
            if count > limit:
                raise BudgetExceeded("Rate limit reached; try again later")
            until = row["until"] if active else time.time() + seconds
            db.execute(
                "INSERT INTO rates VALUES (?,?,?) ON CONFLICT(key) DO UPDATE "
                "SET count=excluded.count,until=excluded.until",
                (digest, count, until),
            )
            db.execute("DELETE FROM rates WHERE until < ?", (time.time(),))

    def reserve(self, scope: str, amount: Decimal) -> str:
        today = time.strftime("%Y-%m-%d", time.gmtime())
        with self.db() as db:
            db.execute("BEGIN IMMEDIATE")
            rows = db.execute("SELECT * FROM spend").fetchall()
            total = sum((Decimal(r["actual"] or r["reserved"]) for r in rows), Decimal(0))
            daily = sum(
                (Decimal(r["actual"] or r["reserved"]) for r in rows if r["day"] == today),
                Decimal(0),
            )
            if (
                total + amount > self.settings.total_budget_usd
                or daily + amount > self.settings.daily_budget_usd
            ):
                raise BudgetExceeded(
                    "The assistant's AI budget is reached; owner review is available"
                )
            row = db.execute("SELECT SUM(turns) FROM sessions WHERE scope=?", (scope,)).fetchone()
            if (row[0] or 0) >= self.settings.session_ai_turn_limit and scope != "merchant":
                raise BudgetExceeded(self.public_errors["session_ai_allowance"])
            db.execute("UPDATE sessions SET turns=turns+1 WHERE scope=?", (scope,))
            record_id = secrets.token_hex(16)
            db.execute(
                "INSERT INTO spend VALUES (?,?,?,NULL,'reserved')", (record_id, today, str(amount))
            )
        return record_id

    def settle(self, reservation: str, actual: Decimal | None) -> None:
        # Ambiguous network errors retain the reservation: they may have been billed.
        with self.db() as db:
            db.execute(
                "UPDATE spend SET actual=?,state=? WHERE id=?",
                (
                    str(actual) if actual is not None else None,
                    "settled" if actual is not None else "uncertain",
                    reservation,
                ),
            )

    def budget(self) -> dict:
        today = time.strftime("%Y-%m-%d", time.gmtime())
        with self.db() as db:
            rows = db.execute("SELECT * FROM spend").fetchall()
        return {
            "total": str(sum((Decimal(r["actual"] or r["reserved"]) for r in rows), Decimal(0))),
            "daily": str(
                sum(
                    (Decimal(r["actual"] or r["reserved"]) for r in rows if r["day"] == today),
                    Decimal(0),
                )
            ),
            "daily_cap": str(self.settings.daily_budget_usd),
            "total_cap": str(self.settings.total_budget_usd),
        }

    def enqueue(self, scope: str, kind: str, delay: int, interval_seconds: int = 0) -> str:
        record_id = secrets.token_hex(16)
        with self.db() as db:
            db.execute("BEGIN IMMEDIATE")
            counts = db.execute(
                "SELECT COUNT(*),SUM(CASE WHEN scope=? THEN 1 ELSE 0 END) FROM jobs", (scope,)
            ).fetchone()
            if (
                counts[0] >= self.settings.max_jobs_total
                or (counts[1] or 0) >= self.settings.max_jobs_per_workspace
            ):
                raise BudgetExceeded("Scheduled task allowance reached")
            db.execute(
                "INSERT INTO jobs(id,scope,kind,state,due,attempts,interval_seconds) VALUES "
                "(?,?,?,'pending',?,0,?)",
                (record_id, scope, kind, time.time() + delay, interval_seconds),
            )
        self.audit(scope, "job_scheduled", {"job": record_id, "kind": kind})
        return record_id

    def claim(self) -> dict | None:
        now = time.time()
        with self.db() as db:
            db.execute("BEGIN IMMEDIATE")
            db.execute(
                "UPDATE jobs SET state='failed',lease=0,error='Lease retries exhausted' "
                "WHERE state='running' AND lease<? AND attempts>=?",
                (now, self.settings.worker_max_attempts),
            )
            row = db.execute(
                "SELECT * FROM jobs WHERE (state='pending' AND due<=?) OR "
                "(state='running' AND lease<?) ORDER BY due LIMIT 1",
                (now, now),
            ).fetchone()
            if row is None:
                return None
            db.execute(
                "UPDATE jobs SET state='running',attempts=attempts+1,lease=? WHERE id=?",
                (now + self.settings.worker_lease_seconds, row["id"]),
            )
        return {**dict(row), "attempts": row["attempts"] + 1}

    def finish_job(self, job: dict, error: str | None = None) -> None:
        state = "completed"
        delay = self.settings.worker_retry_seconds
        if not error and job.get("interval_seconds"):
            state = "pending"
            delay = job["interval_seconds"]
        if error:
            state = "failed" if job["attempts"] >= self.settings.worker_max_attempts else "pending"
        with self.db() as db:
            db.execute(
                "UPDATE jobs SET state=?,due=?,lease=0,error=?,attempts=? "
                "WHERE id=? AND state='running' AND attempts=?",
                (
                    state,
                    time.time() + delay,
                    error or "",
                    job["attempts"] if error else 0,
                    job["id"],
                    job["attempts"],
                ),
            )
        try:
            self.audit(job["scope"], "job_" + state, {"job": job["id"], "error": error})
        except BudgetExceeded:
            # Job state is already durable; quota exhaustion must not kill the shared worker.
            with self.db() as db:
                db.execute(
                    "UPDATE jobs SET error=? WHERE id=?",
                    ((error or "") + "; Audit storage allowance reached", job["id"]),
                )

    def cancel_job(self, scope: str, job_id: str) -> None:
        with self.db() as db:
            changed = db.execute(
                "UPDATE jobs SET state='cancelled',lease=0 "
                "WHERE id=? AND scope=? AND state IN ('pending','running')",
                (job_id, scope),
            ).rowcount
            if not changed:
                raise Conflict("Job is absent, finished or belongs to another workspace")
        self.audit(scope, "job_cancelled", {"job": job_id})

    def jobs(self, scope: str) -> builtins.list[dict]:
        with self.db() as db:
            rows = db.execute(
                "SELECT id,kind,state,due,attempts,error,interval_seconds "
                "FROM jobs WHERE scope=? "
                "ORDER BY due DESC",
                (scope,),
            ).fetchall()
        return [dict(r) for r in rows]

    def erase(self, scope: str) -> None:
        with self.db() as db:
            db.execute(
                "DELETE FROM records WHERE scope=? AND kind IN ('message','memory','web_context')",
                (scope,),
            )
        self.audit(scope, "conversation_erased", {})

    def cleanup(self) -> None:
        cutoff = time.time() - self.settings.retention_days * 86400
        with self.db() as db:
            db.execute("DELETE FROM records WHERE updated < ? AND scope != 'merchant'", (cutoff,))
            db.execute("DELETE FROM sessions WHERE expires < ?", (time.time(),))
            db.execute("DELETE FROM jobs WHERE due < ? AND scope != 'merchant'", (cutoff,))
