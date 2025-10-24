"""Integration tests for the FastAPI events backend."""

import importlib
from pathlib import Path

import pytest

pytest.importorskip("fastapi")
from simple_testclient import TestClient


def test_event_crud_cycle(tmp_path, monkeypatch):
    """Exercise the full CRUD lifecycle of the events API."""

    db_path = tmp_path / "events.db"
    monkeypatch.setenv("EVENTS_DB_PATH", str(db_path))

    import server as server_module

    server_module = importlib.reload(server_module)

    sample_event = {
        "name": "Launch Party",
        "date": "2025-08-01",
        "start_time": "18:00",
        "end_time": "22:00",
        "location": "Houston Heights",
        "package": "Premium Mixology",
        "guest_count": 150,
        "payout": 4800.0,
        "target_staff_count": 5,
        "assign_employees": ["emp-1", "emp-2"],
        "client_name": "Taylor Morgan",
        "client_phone": "713-555-0199",
        "status": "scheduled",
        "staffing_status": "Fully staffed",
        "notes": "Include seasonal mocktails",
    }

    with TestClient(server_module.app) as client:
        response = client.get("/events")
        assert response.status_code == 200
        assert response.json() == []

        response = client.post("/events", json=sample_event)
        assert response.status_code == 200
        created = response.json()
        assert created["name"] == sample_event["name"]
        assert created["assign_employees"] == sample_event["assign_employees"]
        event_id = created["id"]

        updated_payload = dict(sample_event)
        updated_payload.update({
            "name": "Updated Launch Party",
            "status": "completed",
            "payout": 5100.5,
            "assign_employees": ["emp-1", "emp-3"],
        })

        response = client.put(f"/events/{event_id}", json=updated_payload)
        assert response.status_code == 200
        updated = response.json()
        assert updated["name"] == "Updated Launch Party"
        assert updated["status"] == "completed"
        assert updated["assign_employees"] == ["emp-1", "emp-3"]

    server_module = importlib.reload(server_module)

    with TestClient(server_module.app) as client:
        response = client.get("/events")
        assert response.status_code == 200
        persisted = response.json()
        assert len(persisted) == 1
        assert persisted[0]["id"] == event_id

        response = client.delete(f"/events/{event_id}")
        assert response.status_code == 200
        assert response.json() == {"ok": True}

        response = client.get("/events")
        assert response.status_code == 200
        assert response.json() == []

    assert Path(db_path).exists()
