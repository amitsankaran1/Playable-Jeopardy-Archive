from flask import Flask, render_template, g, abort
import sqlite3
import logging
from pathlib import Path

# Get the directory where the current script resides
BASE_DIR = Path(__file__).parent.resolve()

# Construct the path to the database file relative to this directory
DATABASE = BASE_DIR / 'jeopardy.db'

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'

# Setup logging for debugging
logging.basicConfig(level=logging.DEBUG)

def get_db():
    """Connect to the database and set up row factory for dict-like access."""
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    """Close the database connection on app teardown."""
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

@app.route('/')
def seasons():
    """Display a list of all seasons."""
    db = get_db()
    seasons = db.execute("""
        SELECT DISTINCT season_id
        FROM games
        ORDER BY season_id DESC
    """).fetchall()
    return render_template('seasons.html', seasons=seasons)

@app.route('/season/<season_id>')
def season_games(season_id):
    """Display all games for a specific season, ordered by game_number."""
    db = get_db()
    games = db.execute("""
        SELECT id, title, date, game_number
        FROM games
        WHERE season_id = ?
        ORDER BY game_number DESC
    """, (season_id,)).fetchall()
    return render_template('season.html', season_id=season_id, games=games)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)