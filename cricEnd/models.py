from pydantic import BaseModel
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class TeamCreate(BaseModel):
    name: str

class PlayerInput(BaseModel):
  id: int
  name: str
  match_phase_num: int

