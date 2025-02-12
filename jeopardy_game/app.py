from flask import Flask, render_template, g, abort, jsonify, request, session
import sqlite3
import logging
from datetime import datetime
import pytz
from pathlib import Path

# Get the directory where the current script resides
BASE_DIR = Path(__file__).parent.resolve()
DATABASE = BASE_DIR / 'jeopardy.db'

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # Change this in production
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

def get_eastern_date():
    """Get the current date in Eastern Time."""
    eastern = pytz.timezone('America/New_York')
    return datetime.now(eastern).date()

@app.route('/')
def index():
    """Display today's category."""
    db = get_db()
    
    # Use Eastern Time for the date
    today = get_eastern_date()
    formatted_date = today.strftime("%B %d, %Y")
    
    # Pass the date string format that matches the share format
    share_date = today.strftime("%-m/%-d/%Y")  # Removes leading zeros
    
    # Get total number of categories for rotation
    total_categories = db.execute("""
        SELECT COUNT(*) as count 
        FROM categories 
        WHERE (round = 'Jeopardy' OR round = 'Double Jeopardy')
        AND id IN (SELECT DISTINCT category_id FROM clues)
    """).fetchone()['count']
    
    if total_categories == 0:
        return "No categories found in database.", 500
        
    # Use today's date to deterministically select a category
    day_number = int(today.strftime('%Y%m%d'))
    category_index = day_number % total_categories
    
    # Get today's category and its clues
    category = db.execute("""
        SELECT c.id, c.name, c.game_id, g.date, g.title
        FROM categories c
        JOIN games g ON c.game_id = g.id
        WHERE (round = 'Jeopardy' OR round = 'Double Jeopardy')
        AND c.id IN (SELECT DISTINCT category_id FROM clues)
        LIMIT 1 OFFSET ?
    """, (category_index,)).fetchone()
    
    if not category:
        abort(404)
    
    clues = db.execute("""
        WITH numbered_clues AS (
            SELECT c.*, cat.round,
                   ROW_NUMBER() OVER (ORDER BY c.id) - 1 as position
            FROM clues c
            JOIN categories cat ON c.category_id = cat.id
            WHERE c.category_id = ?
        )
        SELECT id,
               CASE 
                   WHEN round LIKE '%Double%' THEN 
                       CASE position
                           WHEN 0 THEN '$400'
                           WHEN 1 THEN '$800'
                           WHEN 2 THEN '$1200'
                           WHEN 3 THEN '$1600'
                           WHEN 4 THEN '$2000'
                       END
                   ELSE 
                       CASE position
                           WHEN 0 THEN '$200'
                           WHEN 1 THEN '$400'
                           WHEN 2 THEN '$600'
                           WHEN 3 THEN '$800'
                           WHEN 4 THEN '$1000'
                       END
               END as value,
               question,
               answer,
               is_daily_double
        FROM numbered_clues
        ORDER BY position
    """, (category['id'],)).fetchall()
    
    # Get more details about the original game
    game_details = db.execute("""
        SELECT g.id, g.title, g.date, g.game_number, g.season_id
        FROM games g
        WHERE g.id = ?
    """, (category['game_id'],)).fetchone()
    
    return render_template(
        'game.html',
        category=category,
        clues=clues,
        date=formatted_date,
        share_date=share_date,
        title="Daily Double",
        game_details=game_details  # Pass game details to template
    )

@app.route('/submit_answer', methods=['POST'])
def submit_answer():
    """Handle answer submission."""
    db = get_db()
    data = request.get_json()
    
    clue_id = data.get('clue_id')
    answer = data.get('answer', '').strip().lower()
    
    correct_answer = db.execute(
        "SELECT answer FROM clues WHERE id = ?", 
        (clue_id,)
    ).fetchone()
    
    if not correct_answer:
        return jsonify({'error': 'Invalid clue'}), 400
    
    is_correct = answer == correct_answer['answer'].strip().lower()
    
    return jsonify({
        'correct': is_correct,
        'correct_answer': correct_answer['answer']
    })

@app.route('/get_game')
def get_game():
    """Get today's game data."""
    db = get_db()
    
    # Use Eastern Time for the date
    today = get_eastern_date()
    
    # Get total number of categories for rotation
    total_categories = db.execute("""
        SELECT COUNT(*) as count 
        FROM categories 
        WHERE (round = 'Jeopardy' OR round = 'Double Jeopardy')
        AND id IN (SELECT DISTINCT category_id FROM clues)
    """).fetchone()['count']
    
    if total_categories == 0:
        return jsonify({'error': 'No categories found'}), 500
        
    # Use today's date to deterministically select a category
    day_number = int(today.strftime('%Y%m%d'))
    category_index = day_number % total_categories
    
    # Get today's category and its clues
    category = db.execute("""
        SELECT c.id, c.name, c.game_id, g.date, g.title
        FROM categories c
        JOIN games g ON c.game_id = g.id
        WHERE (round = 'Jeopardy' OR round = 'Double Jeopardy')
        AND c.id IN (SELECT DISTINCT category_id FROM clues)
        LIMIT 1 OFFSET ?
    """, (category_index,)).fetchone()
    
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    
    # Get game details
    game_details = db.execute("""
        SELECT g.id, g.title, g.date, g.game_number, g.season_id
        FROM games g
        WHERE g.id = ?
    """, (category['game_id'],)).fetchone()
    
    return jsonify({
        'category': dict(category),
        'game_details': dict(game_details)
    })

if __name__ == '__main__':
    app.run(debug=True)