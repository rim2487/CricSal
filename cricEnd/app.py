from datetime import datetime, timezone
from http.client import HTTPException

import mysql.connector
import uvicorn
from fastapi import Depends
from fastapi import FastAPI
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

from auth import create_access_token
from models import BallByBall, Batsman, TeamCreate
from security import get_current_user

SECRET_KEY = "acvI!867"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

app = FastAPI()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DATABASE_URL = "mysql+mysqlconnector://root:123456@localhost/cricSal"

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()  # Start a new session
    try:
        yield db  # Yield session to FastAPI
    finally:
        db.close()

@app.get('/test-db')
def test_db():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='123456',
            database='cricsal'
        )
        connection.close()
        return {"message": "Connected to database successfully!"}
    except Exception as e:
        return {"error": str(e)}, 500

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route to add a new batsman
@app.post('/api/batsmen')
def create_batsman(data: dict, db: Session = Depends(get_db)):
    name = data.get('name')
    total_runs = data.get('total_runs')

    if not name or not total_runs:
        return {"error": "Name and total_runs are required!"}, 400

    try:
        batsman = Batsman(name=name, total_runs=total_runs)
        db.add(batsman)
        db.commit()
        db.refresh(batsman)
        return {"message": "Batsman created", "id": batsman.id, "name": batsman.name}, 201
    except SQLAlchemyError as e:
        db.rollback()
        return {"error": str(e)}, 500


# Route to get all batsmen
@app.get('/api/batsmen')
def get_batsmen(db: Session = Depends(get_db)):
    try:
        batsmen = db.query(Batsman).all()
        batsman_list = [{'id': b.id, 'name': b.name, 'total_runs': b.total_runs} for b in batsmen]
        return batsman_list, 200
    except SQLAlchemyError as e:
        return {"error": str(e)}, 500


# Route to add a new ball-by-ball commentary
@app.post('/api/ball_by_ball')
def add_ball_commentary(data: dict, db: Session = Depends(get_db)):
    ball = data.get('ball')
    game = data.get('game')
    bowler = data.get('bowler')
    batsman_id = data.get('batsman_id')
    runs = data.get('runs')
    total = data.get('total')
    wicket = data.get('wicket')
    dismissal_type = data.get('dismissal_type')
    extras = data.get('extras')

    try:
        commentary = BallByBall(
            ball=ball, game=game, bowler=bowler, batsman_id=batsman_id,
            runs=runs, total=total, wicket=wicket, dismissal_type=dismissal_type, extras=extras
        )
        db.add(commentary)
        db.commit()
        return {"message": "Ball commentary added"}, 201
    except SQLAlchemyError as e:
        db.rollback()
        return {"error": str(e)}, 500


# Route to get ball-by-ball commentary
@app.get('/api/ball_by_ball')
def get_ball_commentary(db: Session = Depends(get_db)):
    try:
        commentary_list = db.query(BallByBall).all()
        commentary_data = [{
            'id': c.id, 'ball': c.ball, 'game': c.game, 'bowler': c.bowler,
            'batsman_id': c.batsman_id, 'runs': c.runs, 'total': c.total,
            'wicket': c.wicket, 'dismissal_type': c.dismissal_type, 'extras': c.extras
        } for c in commentary_list]
        return commentary_data, 200
    except SQLAlchemyError as e:
        return {"error": str(e)}, 500

@app.post("/login")
async def login(request: Request):
    data = await request.json()
    username = data.get("username")
    password = data.get("password")
    role = data.get("role")

    if not username or not password or not role:
        return JSONResponse(status_code=400, content={"error": "Missing fields"})

    table = "admin" if role == "admin" else "users"

    with engine.connect() as conn:
        result = conn.execute(text(f"SELECT * FROM {table} WHERE username = :username"),
                              {"username": username}).fetchone()

    if not result or result[2] != password:
        return JSONResponse(status_code=401, content={"error": "Invalid credentials"})

    access_token = create_access_token(data={"sub": username, "role": role})
    return {"access_token": access_token, "token_type": "bearer"}

from starlette.responses import JSONResponse
from sqlalchemy import text

@app.post("/admin/create-user")
async def create_user(request: Request):
    data = await request.json()
    username = data.get("username")
    password = data.get("password")
    role = data.get("role")

    if not username or not password or not role:
        return JSONResponse(status_code=400, content={"error": "Missing fields"})

    if role == "admin":
        table = "admin"
    elif role == "user":
        table = "users"
    else:
        return JSONResponse(status_code=401, content={"error": "Invalid role"})

    # Check if the username already exists
    with engine.connect() as conn:
        existing_user = conn.execute(
            text(f"SELECT * FROM {table} WHERE username = :username"),
            {"username": username}
        ).fetchone()

    if existing_user:
        return JSONResponse(status_code=400, content={"error": "Username already exists"})

    with engine.connect() as conn:
        if table == "admin":
            conn.execute(
                text(f"INSERT INTO admin (username, password) VALUES (:username, :password)"),
                {"username": username, "password": password}
            )
        else:
            conn.execute(
                text(f"INSERT INTO users (username, password) VALUES (:username, :password)"),
                {"username": username, "password": password}
            )
        conn.commit()

    return JSONResponse(status_code=201, content={"message": "User created successfully"})


@app.post("/admin/create-match")
async def create_match(request: Request):
    data = await request.json()
    team1_id = data.get("team1_id")
    team2_id = data.get("team2_id")
    status = data.get("status")
    start_time = datetime.now(timezone.utc)

    with engine.connect() as conn:
        trans = conn.begin()
        try:
            conn.execute(
                text("""
                       INSERT INTO matches (team1_id, team2_id, start_time, status)
                       VALUES (:team1_id, :team2_id, :start_time, :status)
                   """),
                {
                    "team1_id": team1_id,
                    "team2_id": team2_id,
                    "start_time": start_time,
                    "status": status
                }
            )
            trans.commit()
        except Exception as e:
            trans.rollback()
            raise e

    return {"message": "Match created successfully"}


@app.post("/admin/add-players-to-match")
async def add_players_to_match(request: Request):
    data = await request.json()
    match_id = data.get("match_id")
    player_ids = data.get("player_ids")  # List of player IDs
    team_id = data.get("team_id")  # Team that the player belongs to

    if not match_id or not player_ids or not team_id:
        return JSONResponse(status_code=400, content={"error": "Missing fields"})

    # Add players to the match
    with engine.connect() as conn:
        for player_id in player_ids:
            conn.execute(
                text(
                    "INSERT INTO match_players (match_id, player_id, team_id) VALUES (:match_id, :player_id, :team_id)"),
                {"match_id": match_id, "player_id": player_id, "team_id": team_id}
            )

    return {"message": "Players added to match successfully"}


@app.post("/admin/create-team")
async def create_team(team: TeamCreate):
    try:
        query = text("INSERT INTO teams(name) VALUES (:name)")

        with engine.connect() as connection:
            trans = connection.begin()
            connection.execute(query, {"name": team.name})
            trans.commit()

        return {"message": "Team created successfully"}
    except Exception as e:
        print(f"Error creating team: {e}")
        raise HTTPException()


# create a new player
@app.post("/admin/create-player")
async def create_player(request: Request):
    data = await request.json()
    name = data.get("name")
    role = data.get("role")
    created_at = datetime.utcnow()

    if not name or not role:
        raise HTTPException()

    with engine.connect() as conn:
        trans = conn.begin()
        try:
            conn.execute(
                text("INSERT INTO players (name, role, created_at) VALUES (:name, :role, :created_at)"),
                {"name": name, "role": role, "created_at": created_at}
            )
            trans.commit()
        except Exception as e:
            trans.rollback()
            raise HTTPException()

    return {"message": "Player created successfully"}

# fetch all the players from the DB
@app.get("/admin/players")
async def get_players():
    try:
        query = text("SELECT id, name, role, created_at FROM players")
        with engine.connect() as conn:
            result = conn.execute(query).fetchall()

        players = [{"id": row[0], "name": row[1], "role": row[2], "created_at": row[3]} for row in result]

        return {"players": players}
    except Exception as e:
        raise HTTPException()

@app.post("/admin/assign-player")
async def assign_player(request: Request):
    data = await request.json()
    player_id = data.get("player_id")
    team_id = data.get("team_id")

    if not player_id or not team_id:
        raise HTTPException()

    try:
        query = text("UPDATE players SET team_id = :team_id WHERE id = :player_id")
        with engine.connect() as conn:
            trans = conn.begin()
            conn.execute(query, {"team_id": team_id, "player_id": player_id})
            trans.commit()

        return {"message": "Player assigned to team successfully"}
    except Exception as e:
        raise HTTPException()

@app.get("/admin/unassigned-players")
async def get_unassigned_players():
    try:
        with engine.connect() as conn:
            trans = conn.begin()
            result = conn.execute(
                text("SELECT id, name FROM players WHERE team_id IS NULL")
            ).fetchall()
            trans.commit()

        players = [{"id": row[0], "name": row[1]} for row in result]
        return {"players": players}
    except Exception:
        raise HTTPException()


@app.get("/admin/teams")
async def get_teams():
    try:
        with engine.connect() as conn:
            trans = conn.begin()
            result = conn.execute(
                text("SELECT id, name FROM teams")
            ).fetchall()
            trans.commit()

        teams = [{"id": row[0], "name": row[1]} for row in result]
        return {"teams": teams}
    except Exception:
        raise HTTPException()

@app.get("/admin/matches")
async def get_matches():
    try:
        with engine.connect() as conn:
            trans = conn.begin()
            result = conn.execute(
                text("""
                    SELECT id, team1_id, team2_id, status, last_updated
                    FROM matches
                    ORDER BY last_updated DESC
                """)
            ).fetchall()
            trans.commit()

        matches = [
            {
                "id": row[0],
                "team1_id": row[1],
                "team2_id": row[2],
                "status": row[3],
                "last_updated": row[4]
            }
            for row in result
        ]
        return {"matches": matches}
    except Exception as e:
        raise HTTPException()

@app.get("/protected")
async def protected_route(current_user=Depends(get_current_user)):
    return {"message": f"Hello {current_user['sub']}! You are a {current_user['role']}."}

def start_app():
    print("App starting up!")


def stop_app():
    print("App shutting down!")


start_app()
if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=5000)
