from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Boolean, Float, Enum, TIMESTAMP
from sqlalchemy.orm import declarative_base, relationship
import enum
import datetime

Base = declarative_base()

class UserRole(enum.Enum):
    user = "user"
    admin = "admin"

class Admin(Base):
    __tablename__ = 'admin'
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False)
    password = Column(String(200), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.datetime.utcnow)

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False)
    password = Column(String(200), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.user, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.datetime.utcnow)

class Batsman(Base):
    __tablename__ = 'batsmen'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    total_runs = Column(Integer, default=0)
    ball_by_ball_entries = relationship("BallByBall", back_populates="batsman")

class BallByBall(Base):
    __tablename__ = 'ball_by_ball'
    id = Column(Integer, primary_key=True, autoincrement=True)
    ball = Column(Float, nullable=False)
    game = Column(String(100), nullable=False)
    bowler = Column(String(100), nullable=False)
    batsman_id = Column(Integer, ForeignKey('batsmen.id'), nullable=False)
    batsman = relationship("Batsman", back_populates="ball_by_ball_entries")
    runs = Column(Integer)
    total = Column(String(20))
    wicket = Column(Boolean)
    dismissal_type = Column(String(50))
    extras = Column(String(50))

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    team1_id = Column(Integer, ForeignKey("teams.id"))
    team2_id = Column(Integer, ForeignKey("teams.id"))
    result = Column(String, index=True)
    status = Column(String, default="pending")
    start_time = Column(TIMESTAMP)
    end_time = Column(TIMESTAMP)

    team1 = relationship("Team", back_populates="matches_team1")
    team2 = relationship("Team", back_populates="matches_team2")

class MatchPlayer(Base):
    __tablename__ = "match_players"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"))
    player_id = Column(Integer, ForeignKey("users.id"))
    team_id = Column(Integer, ForeignKey("teams.id"))

    match = relationship("Match", back_populates="match_players")
    player = relationship("User", back_populates="match_players")
    team = relationship("Team", back_populates="match_players")

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    matches_team1 = relationship("Match", back_populates="team1")
    matches_team2 = relationship("Match", back_populates="team2")
    match_players = relationship("MatchPlayer", back_populates="team")

User.match_players = relationship("MatchPlayer", back_populates="player")
Team.match_players = relationship("MatchPlayer", back_populates="team")
Match.match_players = relationship("MatchPlayer", back_populates="match")

class CreateUserRequest(BaseModel):
    username: str
    password: str

class TeamCreate(BaseModel):
    name: str
