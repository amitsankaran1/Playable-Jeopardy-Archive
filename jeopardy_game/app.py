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

@app.route('/game/<game_id>')
def game(game_id):
    """Load game data and render the game page."""
    db = get_db()

    # Validate if the game_id exists in the database
    game_exists = db.execute("SELECT 1 FROM games WHERE id = ?", (game_id,)).fetchone()
    if not game_exists:
        abort(404, description="Game not found")

    # Fetch categories
    categories = db.execute("""
        SELECT id AS category_id, name AS category_name, round
        FROM categories
        WHERE game_id = ?
        ORDER BY id
    """, (game_id,)).fetchall()

    grouped_categories = {
        'Jeopardy Round': [],
        'Double Jeopardy Round': [],
        'Final Jeopardy': []
    }

    final_jeopardy_category = None
    final_jeopardy_clue = None

    # Assign categories correctly
    for category in categories:
        round_name = category['round'].strip().lower()
        if round_name == 'final jeopardy':
            final_jeopardy_category = category
        elif 'double jeopardy' in round_name:
            grouped_categories['Double Jeopardy Round'].append(category)
        elif 'jeopardy' in round_name:
            grouped_categories['Jeopardy Round'].append(category)

    # Fetch clues
    clues_by_category = {}
    for category in categories:
        category_id = category['category_id']
        clues = db.execute("""
            SELECT id, value, question, answer, is_daily_double, is_final_jeopardy
            FROM clues
            WHERE category_id = ?
            ORDER BY id
        """, (category_id,)).fetchall()

        # Assign clues correctly
        if final_jeopardy_category and category['category_id'] == final_jeopardy_category['category_id']:
            final_jeopardy_clue = next((clue for clue in clues if clue['is_final_jeopardy']), None)
        else:
            clues_by_category[category_id] = clues

    # Ensure Final Jeopardy appears correctly
    if final_jeopardy_category and final_jeopardy_clue:
        grouped_categories['Final Jeopardy'] = [final_jeopardy_category]
        clues_by_category[final_jeopardy_category['category_id']] = [final_jeopardy_clue]
    
    return render_template(
        'game.html',
        grouped_categories=grouped_categories,
        clues_by_category=clues_by_category
    )

if __name__ == '__main__':
    app.run(debug=True)