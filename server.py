from typing import Optional, List
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import SQLModel, Field as SQLField, Session, create_engine, select

DB_URL = "sqlite:///./leads.db"
engine = create_engine(DB_URL, echo=False)


class Lead(SQLModel, table=True):
    id: str = SQLField(primary_key=True, default_factory=lambda: str(uuid4()))
    leadName: str
    eventType: Optional[str] = None
    idealDate: Optional[str] = None
    estimatedValue: Optional[int] = None
    status: Optional[str] = None
    nextTouchpoint: Optional[str] = None


class LeadIn(BaseModel):
    leadName: str
    eventType: Optional[str] = None
    idealDate: Optional[str] = None
    estimatedValue: Optional[int] = None
    status: Optional[str] = None
    nextTouchpoint: Optional[str] = None


app = FastAPI(title="Leads API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)


@app.get("/leads", response_model=List[Lead])
def list_leads():
    with Session(engine) as session:
        return session.exec(select(Lead).order_by(Lead.id.desc())).all()


@app.post("/leads", response_model=Lead)
def create_lead(payload: LeadIn):
    with Session(engine) as session:
        lead = Lead(**payload.dict())
        session.add(lead)
        session.commit()
        session.refresh(lead)
        return lead


@app.put("/leads/{lead_id}", response_model=Lead)
def update_lead(lead_id: str, payload: LeadIn):
    with Session(engine) as session:
        lead = session.get(Lead, lead_id)
        if not lead:
            raise HTTPException(404, "Lead not found")
        for key, value in payload.dict().items():
            setattr(lead, key, value)
        session.add(lead)
        session.commit()
        session.refresh(lead)
        return lead


@app.delete("/leads/{lead_id}")
def delete_lead(lead_id: str):
    with Session(engine) as session:
        lead = session.get(Lead, lead_id)
        if not lead:
            raise HTTPException(404, "Lead not found")
        session.delete(lead)
        session.commit()
        return {"ok": True}
