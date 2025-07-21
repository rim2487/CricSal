import json
from http.client import HTTPException
import json
from typing import List

import joblib
import lightgbm as lgb
import mysql.connector
import pandas as pd
import uvicorn
from fastapi import Depends
from fastapi import FastAPI
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from starlette.responses import JSONResponse

from auth import create_access_token
from models import TeamCreate, PlayerInput
from security import get_current_user

SECRET_KEY = "acvI!867"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

app = FastAPI()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DATABASE_URL = "mysql+mysqlconnector://root:123456@localhost/cricSal"

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

predictorModel = lgb.Booster(model_file="data/batsman_performance_model.txt")

with open("data/scaler.save", "rb") as f:
    scalerFile = joblib.load(f)

Base = declarative_base()

Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()  # Start a new session
    try:
        yield db  # Yield session to FastAPI
    finally:
        db.close()


phase_map = {'Powerplay': 0, 'Middle': 1, 'Death': 2}


class PredictionInput(BaseModel):
    player_id: int
    match_phase_num: int


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


# login
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


# create a login user
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


# suggest a batsman
@app.post("/predict-batsman")
def predict_batsman(input_data: PredictionInput):
    input_df = pd.DataFrame([{
        "strike_rate": input_data.strike_rate,
        "average": input_data.average,
        "dismissals": input_data.dismissals,
        "match_phase_num": input_data.match_phase_num
    }])

    input_df[['strike_rate', 'average', 'dismissals', 'match_phase_num']] = scalerFile.transform(
        input_df[['strike_rate', 'average', 'dismissals', 'match_phase_num']]
    )

    # Predict probability
    probability = predictorModel.predict(input_df)[0]

    # Phase-specific thresholds
    phase_thresholds = {
        0: 0.45,
        1: 0.5,
        2: 0.6
    }
    threshold = phase_thresholds.get(input_data.match_phase_num, 0.5)

    will_perform = int(probability >= threshold)

    return {
        "probability": round(probability, 3),
        "threshold": threshold,
        "will_perform": will_perform
    }


# create a match
@app.post("/admin/create-match")
async def create_match(request: Request):
    data = await request.json()
    team_a = data.get("teamA")
    team_b = data.get("teamB")
    team_a_players = data.get("teamAPlayers", [])
    team_b_players = data.get("teamBPlayers", [])
    toss_winner = data.get("tossWinner")
    toss_decision = data.get("tossDecision")
    overs = data.get("overs", 20)
    first_batsman = data.get("firstBatsman")
    second_batsman = data.get("secondBatsman")
    team_a_score = data.get("teamAScore", 0)
    team_b_score = data.get("teamBScore", 0)
    result = data.get("result", "")
    phases = data.get("phases")
    created_at = datetime.now(timezone.utc)
    updated_at = created_at

    if not team_a or not team_b:
        raise HTTPException(status_code=400, detail="Team A and Team B are required")

    team_a_players_json = json.dumps(team_a_players)
    team_b_players_json = json.dumps(team_b_players)
    phases_json = json.dumps(phases) if phases else None

    with engine.connect() as conn:
        trans = conn.begin()
        try:
            conn.execute(
                text("""
                  INSERT INTO matches (
                      team_a, team_b,
                      team_a_players, team_b_players,
                      toss_winner, toss_decision,
                      overs, first_batsman, second_batsman,
                      status, teamA_score, teamB_score, result,
                      created_at, updated_at, phases
                  ) VALUES (
                      :team_a, :team_b,
                      :team_a_players, :team_b_players,
                      :toss_winner, :toss_decision,
                      :overs, :first_batsman, :second_batsman,
                      :status, :team_a_score, :team_b_score, :result,
                      :created_at, :updated_at, :phases
                  )
              """),
                {
                    "team_a": team_a,
                    "team_b": team_b,
                    "team_a_players": team_a_players_json,
                    "team_b_players": team_b_players_json,
                    "toss_winner": toss_winner,
                    "toss_decision": toss_decision,
                    "overs": overs,
                    "first_batsman": first_batsman,
                    "second_batsman": second_batsman,
                    "status": "created",
                    "team_a_score": team_a_score,
                    "team_b_score": team_b_score,
                    "result": result,
                    "created_at": created_at,
                    "updated_at": updated_at,
                    "phases": phases_json
                }
            )
            trans.commit()
        except Exception as e:
            trans.rollback()
            print("Error:", e)
            raise HTTPException(status_code=500, detail="Failed to create match")

    return {"message": "Match created successfully"}


# end match
@app.put("/admin/match/end-match/{match_id}")
async def end_match(match_id: int, request: Request):
    data = await request.json()
    result = data.get("result")
    team_a_score = data.get("teamAScore")
    team_b_score = data.get("teamBScore")
    updated_at = datetime.now(timezone.utc)

    if result is None or team_a_score is None or team_b_score is None:
        raise HTTPException(status_code=400, detail="Missing result or scores")

    with engine.connect() as conn:
        trans = conn.begin()
        try:
            update_stmt = text("""
                UPDATE matches
                SET status = 'completed',
                    result = :result,
                    teamA_score = :team_a_score,
                    teamB_score = :team_b_score,
                    updated_at = :updated_at
                WHERE id = :match_id
            """)
            conn.execute(update_stmt, {
                "result": result,
                "team_a_score": team_a_score,
                "team_b_score": team_b_score,
                "updated_at": updated_at,
                "match_id": match_id
            })
            trans.commit()
        except Exception as e:
            trans.rollback()
            print("Error:", e)
            raise HTTPException(status_code=500, detail="Failed to end match")

    return {"message": "Match ended and updated successfully"}


# suggest a set of batsmen
@app.post("/admin/predict-batsman-batch")
async def predict_batsman_batch(players_input: List[PlayerInput]):
    phase_thresholds = {0: 0.45, 1: 0.5, 2: 0.6}

    try:
        with engine.connect() as conn:
            rows_for_prediction = []

            for player in players_input:
                phase = player.match_phase_num

                # Determine the phase-specific columns
                prefix = ["powerplay", "middle", "death"][phase]
                sr_col = f"{prefix}_strike_rate"
                avg_col = f"{prefix}_average"
                dis_col = f"{prefix}_dismissals"

                # Build SQL query dynamically
                sql = text(f"""
                    SELECT id, name, {sr_col} AS strike_rate, {avg_col} AS average, {dis_col} AS dismissals
                    FROM players
                    WHERE id = :player_id
                """)

                result = conn.execute(sql, {"player_id": player.id}).mappings().fetchone()

                if not result:
                    raise HTTPException(status_code=404, detail=f"Player with ID {player.id} not found")

                rows_for_prediction.append({
                    "id": result["id"],
                    "name": player.name,
                    "strike_rate": result["strike_rate"] or 0.0,
                    "average": result["average"] or 0.0,
                    "dismissals": result["dismissals"] or 0,
                    "match_phase_num": phase
                })

            # Convert to DataFrame
            df = pd.DataFrame(rows_for_prediction)
            features = df[['strike_rate', 'average', 'dismissals', 'match_phase_num']]
            scaled = scalerFile.transform(features)
            probs = predictorModel.predict(scaled)

            # Build response
            response = []
            for i, row in df.iterrows():
                threshold = phase_thresholds.get(row["match_phase_num"], 0.5)
                response.append({
                    "id": row["id"],
                    "name": row["name"],
                    "probability": round(probs[i], 3),
                    "threshold": threshold,
                    "will_perform": int(probs[i] >= threshold)
                })

            return response

    except Exception as e:
        print("Prediction error:", e)
        raise HTTPException(status_code=500, detail="Prediction failed")


# delete a match
@app.delete("/admin/matches/{match_id}", status_code=204)
async def delete_match(match_id: int):
    try:
        with engine.connect() as conn:
            trans = conn.begin()

            # Check if the match exists
            result = conn.execute(text("SELECT id FROM matches WHERE id = :id"), {"id": match_id}).fetchone()
            if not result:
                trans.rollback()
                raise HTTPException(status_code=404, detail="Match not found")

            # Delete the match
            conn.execute(text("DELETE FROM matches WHERE id = :id"), {"id": match_id})

            trans.commit()
        return None  # 204 No Content
    except Exception as e:
        print("Error deleting match:", e)
        raise HTTPException(status_code=500, detail="Failed to delete match")


# create a team
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


# Create a new player
@app.post("/admin/player/create")
async def create_player(request: Request):
    data = await request.json()
    name = data.get("name")
    created_at = datetime.utcnow()

    if not name:
        raise HTTPException()

    with engine.connect() as conn:
        trans = conn.begin()
        try:
            conn.execute(
                text("""
                    INSERT INTO players (
                        name, created_at,
                        powerplay_runs, powerplay_dismissals, powerplay_strike_rate, powerplay_average, powerplay_balls_faced,
                        middle_runs, middle_dismissals, middle_strike_rate, middle_average, middle_balls_faced,
                        death_runs, death_dismissals, death_strike_rate, death_average, death_balls_faced
                    ) VALUES (
                        :name, :created_at,
                        :powerplay_runs, :powerplay_dismissals, :powerplay_strike_rate, :powerplay_average, :powerplay_balls_faced,
                        :middle_runs, :middle_dismissals, :middle_strike_rate, :middle_average, :middle_balls_faced,
                        :death_runs, :death_dismissals, :death_strike_rate, :death_average, :death_balls_faced
                    )
                """),
                {
                    "name": name,
                    "created_at": created_at,
                    "powerplay_runs": data.get("powerplayRuns", 0),
                    "powerplay_dismissals": data.get("powerplayDismissals", 0),
                    "powerplay_strike_rate": data.get("powerplayStrikeRate", 0),
                    "powerplay_average": data.get("powerplayAverage", 0),
                    "powerplay_balls_faced": data.get("powerplayBallsFaced", 0),

                    "middle_runs": data.get("middleRuns", 0),
                    "middle_dismissals": data.get("middleDismissals", 0),
                    "middle_strike_rate": data.get("middleStrikeRate", 0),
                    "middle_average": data.get("middleAverage", 0),
                    "middle_balls_faced": data.get("middleBallsFaced", 0),

                    "death_runs": data.get("deathRuns", 0),
                    "death_dismissals": data.get("deathDismissals", 0),
                    "death_strike_rate": data.get("deathStrikeRate", 0),
                    "death_average": data.get("deathAverage", 0),
                    "death_balls_faced": data.get("deathBallsFaced", 0),
                }
            )
            trans.commit()
        except Exception as e:
            trans.rollback()
            raise HTTPException()

    return {"message": "Player created successfully"}


# update player
@app.put("/admin/player/update")
async def update_players(request: Request):
    players_data = await request.json()

    if not isinstance(players_data, list):
        raise HTTPException(status_code=400, detail="Expected a list of players.")

    with engine.connect() as conn:
        trans = conn.begin()
        try:
            for player in players_data:
                conn.execute(
                    text("""
                      UPDATE players SET
                          powerplay_runs = :powerplay_runs,
                          powerplay_dismissals = :powerplay_dismissals,
                          powerplay_strike_rate = :powerplay_strike_rate,
                          powerplay_average = :powerplay_average,
                          powerplay_balls_faced = :powerplay_balls_faced,

                          middle_runs = :middle_runs,
                          middle_dismissals = :middle_dismissals,
                          middle_strike_rate = :middle_strike_rate,
                          middle_average = :middle_average,
                          middle_balls_faced = :middle_balls_faced,

                          death_runs = :death_runs,
                          death_dismissals = :death_dismissals,
                          death_strike_rate = :death_strike_rate,
                          death_average = :death_average,
                          death_balls_faced = :death_balls_faced,

                          updated_at = :updated_at
                      WHERE id = :id
                  """),
                    {
                        "id": player["id"],
                        "powerplay_runs": player.get("powerplayRuns", 0),
                        "powerplay_dismissals": player.get("powerplayDismissals", 0),
                        "powerplay_strike_rate": player.get("powerplayStrikeRate", 0),
                        "powerplay_average": player.get("powerplayAverage", 0),
                        "powerplay_balls_faced": player.get("powerplayBallsFaced", 0),

                        "middle_runs": player.get("middleRuns", 0),
                        "middle_dismissals": player.get("middleDismissals", 0),
                        "middle_strike_rate": player.get("middleStrikeRate", 0),
                        "middle_average": player.get("middleAverage", 0),
                        "middle_balls_faced": player.get("middleBallsFaced", 0),

                        "death_runs": player.get("deathRuns", 0),
                        "death_dismissals": player.get("deathDismissals", 0),
                        "death_strike_rate": player.get("deathStrikeRate", 0),
                        "death_average": player.get("deathAverage", 0),
                        "death_balls_faced": player.get("deathBallsFaced", 0),

                        "updated_at": datetime.utcnow()
                    }
                )
            trans.commit()
        except Exception as e:
            trans.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to update players: {str(e)}")

    return {"message": "Players updated successfully"}


@app.get("/admin/players")
async def get_players():
    try:
        query = text("""
            SELECT
                id, name, created_at, updated_at,
                powerplay_runs, powerplay_dismissals, powerplay_strike_rate, powerplay_average, powerplay_balls_faced,
                middle_runs, middle_dismissals, middle_strike_rate, middle_average, middle_balls_faced,
                death_runs, death_dismissals, death_strike_rate, death_average, death_balls_faced
            FROM players
        """)

        with engine.connect() as conn:
            result = conn.execute(query).fetchall()

        players = []
        for row in result:
            players.append({
                "id": row[0],
                "name": row[1],
                "created_at": row[2],
                "updated_at": row[3],
                "powerplay": {
                    "runs": row[4],
                    "dismissals": row[5],
                    "strike_rate": row[6],
                    "average": row[7],
                    "balls_faced": row[8]
                },
                "middle": {
                    "runs": row[9],
                    "dismissals": row[10],
                    "strike_rate": row[11],
                    "average": row[12],
                    "balls_faced": row[13]
                },
                "death": {
                    "runs": row[14],
                    "dismissals": row[15],
                    "strike_rate": row[16],
                    "average": row[17],
                    "balls_faced": row[18]
                }
            })

        return {"players": players}

    except Exception as e:
        raise HTTPException()


@app.get("/admin/player")
async def get_player(player_id: int):
    try:
        query = text("""
            SELECT
                id, name, created_at, updated_at,
                powerplay_runs, powerplay_dismissals, powerplay_strike_rate, powerplay_average, powerplay_balls_faced,
                middle_runs, middle_dismissals, middle_strike_rate, middle_average, middle_balls_faced,
                death_runs, death_dismissals, death_strike_rate, death_average, death_balls_faced
            FROM players
            WHERE id = :player_id
        """)

        with engine.connect() as conn:
            result = conn.execute(query, {"player_id": player_id}).fetchone()

        if result is None:
            raise HTTPException(status_code=404, detail="Player not found")

        return {
            "id": result[0],
            "name": result[1],
            "created_at": result[2],
            "updated_at": result[3],
            "powerplay": {
                "runs": result[4],
                "dismissals": result[5],
                "strike_rate": result[6],
                "average": result[7],
                "balls_faced": result[8]
            },
            "middle": {
                "runs": result[9],
                "dismissals": result[10],
                "strike_rate": result[11],
                "average": result[12],
                "balls_faced": result[13]
            },
            "death": {
                "runs": result[14],
                "dismissals": result[15],
                "strike_rate": result[16],
                "average": result[17],
                "balls_faced": result[18]
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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


from fastapi import HTTPException
from sqlalchemy import text
from datetime import datetime, timezone


@app.get("/admin/matches")
async def get_matches():
    try:
        with engine.connect() as conn:
            trans = conn.begin()

            teams_result = conn.execute(text("SELECT id, name FROM teams")).fetchall()
            team_dict = {row[0]: row[1] for row in teams_result}

            players_result = conn.execute(text("SELECT id, name FROM players")).fetchall()
            player_dict = {row[0]: row[1] for row in players_result}

            match_result = conn.execute(
                text("""
          SELECT
            id, team_a, team_b,
            team_a_players, team_b_players,
            toss_winner, toss_decision,
            overs, first_batsman, second_batsman,
            status, teamA_score, teamB_score, result,
            created_at, updated_at, phases
          FROM matches
          ORDER BY updated_at DESC
        """)
            ).fetchall()
            trans.commit()

        matches = []
        for row in match_result:
            team_a_id = row[1]
            team_b_id = row[2]
            toss_winner_id = row[5]
            team_a_players_ids = json.loads(row[3]) if row[3] else []
            team_b_players_ids = json.loads(row[4]) if row[4] else []
            phases_data = json.loads(row[16]) if row[16] else {}

            matches.append({
                "id": row[0],
                "teamA": team_dict.get(team_a_id, f"Team {team_a_id}"),
                "teamB": team_dict.get(team_b_id, f"Team {team_b_id}"),
                "teamAPlayers": [player_dict.get(pid, f"Player {pid}") for pid in team_a_players_ids],
                "teamBPlayers": [player_dict.get(pid, f"Player {pid}") for pid in team_b_players_ids],
                "tossWinner": team_dict.get(toss_winner_id, f"Team {toss_winner_id}"),
                "tossDecision": row[6],
                "overs": row[7],
                "firstBatsman": player_dict.get(row[8], f"Player {row[8]}") if row[8] else None,
                "secondBatsman": player_dict.get(row[9], f"Player {row[9]}") if row[9] else None,
                "status": row[10],
                "teamAScore": row[11],
                "teamBScore": row[12],
                "result": row[13],
                "createdAt": row[14],
                "updatedAt": row[15],
                "phases": {
                    "powerplay": phases_data.get("powerplay"),
                    "middle": phases_data.get("middle"),
                    "death": phases_data.get("death")
                } if phases_data else None
            })

        return {"matches": matches}

    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail="Failed to retrieve matches")


# get match by ID
@app.get("/admin/match/{match_id}")
async def get_match_by_id(match_id: int):
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT
                        m.id, m.team_a, m.team_b,
                        m.team_a_players, m.team_b_players,
                        m.toss_winner, m.toss_decision,
                        m.overs, m.first_batsman, m.second_batsman,
                        m.status, m.teamA_score, m.teamB_score, m.result,
                        m.created_at, m.updated_at,
                        m.phases,
                        ta.name AS team_a_name,
                        tb.name AS team_b_name
                    FROM matches m
                    JOIN teams ta ON m.team_a = ta.id
                    JOIN teams tb ON m.team_b = tb.id
                    WHERE m.id = :match_id
                """),
                {"match_id": match_id}
            ).mappings().fetchone()

            if not result:
                raise HTTPException(status_code=404, detail="Match not found")

            import json
            team_a_players_ids = json.loads(result["team_a_players"] or "[]")
            team_b_players_ids = json.loads(result["team_b_players"] or "[]")

            phases = None
            if result["phases"]:
                try:
                    phases = json.loads(result["phases"])
                except Exception as e:
                    print(f"Failed to parse phases JSON for match {match_id}: {e}")
                    phases = None

            all_player_ids = team_a_players_ids + team_b_players_ids
            if not all_player_ids:
                all_player_ids = [-1]

            placeholders = [f":id{i}" for i in range(len(all_player_ids))]
            in_clause = ", ".join(placeholders)
            params = {f"id{i}": pid for i, pid in enumerate(all_player_ids)}

            query = text(f"SELECT id, name FROM players WHERE id IN ({in_clause})")
            players_result = conn.execute(query, params).mappings().fetchall()

            player_map = {
                player["id"]: {"id": player["id"], "name": player["name"]}
                for player in players_result
            }

            return {
                "id": result["id"],
                "teamA": result["team_a"],
                "teamAName": result["team_a_name"],
                "teamB": result["team_b"],
                "teamBName": result["team_b_name"],
                "teamAPlayers": team_a_players_ids,
                "teamBPlayers": team_b_players_ids,
                "teamAPlayersDetailed": [player_map.get(pid, {"id": pid, "name": "Unknown"}) for pid in
                                         team_a_players_ids],
                "teamBPlayersDetailed": [player_map.get(pid, {"id": pid, "name": "Unknown"}) for pid in
                                         team_b_players_ids],
                "tossWinner": result["toss_winner"],
                "tossDecision": result["toss_decision"],
                "overs": result["overs"],
                "firstBatsman": result["first_batsman"],
                "secondBatsman": result["second_batsman"],
                "status": result["status"],
                "teamAScore": result["teamA_score"],
                "teamBScore": result["teamB_score"],
                "result": result["result"],
                "createdAt": result["created_at"],
                "updatedAt": result["updated_at"],
                "phases": phases
            }

    except Exception as e:
        import traceback
        print("Error fetching match by ID:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to fetch match")


# update match status
@app.put("/admin/match/{match_id}/status")
async def update_match_status(match_id: int, request: Request):
    data = await request.json()
    new_status = data.get("status")

    if new_status not in ("created", "ongoing", "completed"):
        raise HTTPException(status_code=400, detail="Invalid status value")

    updated_at = datetime.now(timezone.utc)

    with engine.connect() as conn:
        trans = conn.begin()
        try:
            conn.execute(
                text("""
                    UPDATE matches
                    SET status = :status, updated_at = :updated_at
                    WHERE id = :match_id
                """),
                {"status": new_status, "match_id": match_id, "updated_at": updated_at}
            )
            trans.commit()
        except Exception as e:
            trans.rollback()
            print("Failed to update match status:", e)
            raise HTTPException(status_code=500, detail="Failed to update status")

    return {"message": "Match status updated", "status": new_status}


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
