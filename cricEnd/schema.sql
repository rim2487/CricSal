DROP TABLE IF EXISTS ball_by_ball;
DROP TABLE IF EXISTS batsmen;

CREATE TABLE IF NOT EXISTS batsmen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    total_runs integer
);

CREATE TABLE IF NOT EXISTS ball_by_ball (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ball FLOAT NOT NULL,
    game TEXT NOT NULL,
    bowler TEXT NOT NULL,
    batsman_id INTEGER NOT NULL,
    runs INTEGER,
    total TEXT,
    wicket BOOLEAN,
    dismissal_type TEXT,
    extras TEXT,
    FOREIGN KEY (batsman_id) REFERENCES batsmen(id)
);