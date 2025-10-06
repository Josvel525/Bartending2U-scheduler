"""
FastAPI server implementation for the event pipeline.

This API exposes CRUD endpoints for managing events stored in
a SQLite database. The server uses only built‑in modules
(``sqlite3``) and ``pydantic`` from FastAPI to avoid additional
dependencies. Events are persisted to the ``events.db`` file in
the project root.

Each event record contains the fields necessary to support the
"Create new event" form shown in the user's scheduling app,
including name, date, time, location, package, guest count,
payout, staffing details and notes. An ``id`` is automatically
generated for each event using ``uuid.uuid4``.

Endpoints
---------

* ``GET /events``
  Returns a list of all stored events.
* ``POST /events``
  Creates a new event. Accepts a JSON body with event fields.
* ``PUT /events/{event_id}``
  Updates an existing event by ID. Any missing fields will be
  replaced by ``null`` or default values.
* ``DELETE /events/{event_id}``
  Deletes the specified event.

To run the server locally:

.. code-block:: bash

   uvicorn server:app --reload --port 8000

After starting the server, the API will be available at
``http://127.0.0.1:8000``.
"""

import json
import sqlite3
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


DATABASE = "events.db"


def get_connection() -> sqlite3.Connection:
    """Return a new database connection with row factory set.

    The connection uses ``sqlite3.Row`` so that rows can be
    accessed like dictionaries.
    """
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initialise the SQLite database.

    Creates the ``events`` table if it does not already exist.
    The table schema mirrors the fields accepted by the API.
    """
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                date TEXT,
                start_time TEXT,
                end_time TEXT,
                location TEXT,
                package TEXT,
                guest_count INTEGER,
                payout INTEGER,
                target_staff_count INTEGER,
                assign_employees TEXT,
                client_name TEXT,
                client_phone TEXT,
                status TEXT,
                staffing_status TEXT,
                notes TEXT,
                updated_at TEXT NOT NULL
            )
            """
        )


class EventIn(BaseModel):
    """Schema for incoming event data.

    All fields are optional except the name. Fields that are not
    provided will be stored as ``None`` (NULL in the database).
    """

    name: str = Field(..., description="Event name")
    date: Optional[str] = Field(None, description="Event date (YYYY-MM-DD)")
    start_time: Optional[str] = Field(
        None, description="Start time (HH:MM in 24‑hour format)"
    )
    end_time: Optional[str] = Field(
        None, description="End time (HH:MM in 24‑hour format)"
    )
    location: Optional[str] = Field(None, description="Event location")
    package: Optional[str] = Field(None, description="Service package")
    guest_count: Optional[int] = Field(None, description="Number of guests")
    payout: Optional[int] = Field(None, description="Estimated payout in USD")
    target_staff_count: Optional[int] = Field(
        None, description="Desired number of staff for the event"
    )
    assign_employees: Optional[List[str]] = Field(
        None,
        description=(
            "List of employee identifiers assigned to the event."
            " Stored as a JSON string in the database."
        ),
    )
    client_name: Optional[str] = Field(None, description="Client name")
    client_phone: Optional[str] = Field(None, description="Client phone number")
    status: Optional[str] = Field(
        "Draft",
        description="Status of the event (Draft, Scheduled, Completed, Canceled)",
    )
    staffing_status: Optional[str] = Field(
        None, description="Staffing status (e.g. Fully staffed, Partially staffed)"
    )
    notes: Optional[str] = Field(None, description="Notes and client preferences")


class Event(EventIn):
    """Schema for outgoing event data, includes the ID and update timestamp."""

    id: str
    updated_at: str


app = FastAPI(title="Events API")


@app.on_event("startup")
def on_startup() -> None:
    """Initialize the database on application startup."""
    init_db()


def row_to_event(row: sqlite3.Row) -> Event:
    """Convert a database row to an Event model instance."""
    # Parse assign_employees JSON if present
    assign_employees = None
    if row["assign_employees"]:
        try:
            assign_employees = json.loads(row["assign_employees"])
        except json.JSONDecodeError:
            assign_employees = None
    return Event(
        id=row["id"],
        name=row["name"],
        date=row["date"],
        start_time=row["start_time"],
        end_time=row["end_time"],
        location=row["location"],
        package=row["package"],
        guest_count=row["guest_count"],
        payout=row["payout"],
        target_staff_count=row["target_staff_count"],
        assign_employees=assign_employees,
        client_name=row["client_name"],
        client_phone=row["client_phone"],
        status=row["status"],
        staffing_status=row["staffing_status"],
        notes=row["notes"],
        updated_at=row["updated_at"],
    )


@app.get("/events", response_model=List[Event])
def list_events() -> List[Event]:
    """Return all events sorted by ``updated_at`` descending."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM events ORDER BY datetime(updated_at) DESC"
        ).fetchall()
        return [row_to_event(row) for row in rows]


@app.post("/events", response_model=Event)
def create_event(event: EventIn) -> Event:
    """Create a new event and return the created record.

    Generates a UUID for the new event and records the current
    timestamp as ``updated_at``.
    """
    event_id = str(uuid.uuid4())
    updated_at = datetime.utcnow().isoformat()
    # Serialize assign_employees list to JSON string
    assign_json = (
        json.dumps(event.assign_employees)
        if event.assign_employees is not None
        else None
    )
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO events (
                id, name, date, start_time, end_time, location, package,
                guest_count, payout, target_staff_count, assign_employees,
                client_name, client_phone, status, staffing_status, notes, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                event_id,
                event.name,
                event.date,
                event.start_time,
                event.end_time,
                event.location,
                event.package,
                event.guest_count,
                event.payout,
                event.target_staff_count,
                assign_json,
                event.client_name,
                event.client_phone,
                event.status,
                event.staffing_status,
                event.notes,
                updated_at,
            ),
        )
    return Event(id=event_id, updated_at=updated_at, **event.dict())


@app.put("/events/{event_id}", response_model=Event)
def update_event(event_id: str, event: EventIn) -> Event:
    """Update an existing event.

    If the event does not exist, a 404 error is raised. All fields
    provided in the request body will replace the stored values.
    The ``updated_at`` timestamp is refreshed.
    """
    updated_at = datetime.utcnow().isoformat()
    assign_json = (
        json.dumps(event.assign_employees)
        if event.assign_employees is not None
        else None
    )
    with get_connection() as conn:
        cursor = conn.execute(
            "SELECT COUNT(1) FROM events WHERE id = ?", (event_id,)
        )
        count = cursor.fetchone()[0]
        if count == 0:
            raise HTTPException(status_code=404, detail="Event not found")
        conn.execute(
            """
            UPDATE events SET
                name = ?,
                date = ?,
                start_time = ?,
                end_time = ?,
                location = ?,
                package = ?,
                guest_count = ?,
                payout = ?,
                target_staff_count = ?,
                assign_employees = ?,
                client_name = ?,
                client_phone = ?,
                status = ?,
                staffing_status = ?,
                notes = ?,
                updated_at = ?
            WHERE id = ?
            """,
            (
                event.name,
                event.date,
                event.start_time,
                event.end_time,
                event.location,
                event.package,
                event.guest_count,
                event.payout,
                event.target_staff_count,
                assign_json,
                event.client_name,
                event.client_phone,
                event.status,
                event.staffing_status,
                event.notes,
                updated_at,
                event_id,
            ),
        )
    return Event(id=event_id, updated_at=updated_at, **event.dict())


@app.delete("/events/{event_id}")
def delete_event(event_id: str) -> dict:
    """Delete an event by ID.

    Returns a simple JSON object indicating success. If the event
    does not exist, a 404 error is raised.
    """
    with get_connection() as conn:
        cursor = conn.execute(
            "SELECT COUNT(1) FROM events WHERE id = ?", (event_id,)
        )
        count = cursor.fetchone()[0]
        if count == 0:
            raise HTTPException(status_code=404, detail="Event not found")
        conn.execute("DELETE FROM events WHERE id = ?", (event_id,))
    return {"ok": True}