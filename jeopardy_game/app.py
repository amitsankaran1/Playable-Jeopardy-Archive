from flask import Flask, render_template, g, abort, jsonify, request, session
import sqlite3
import logging
from datetime import datetime
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

@app.route('/')
def index():
    """Display today's category."""
    db = get_db()
    today = datetime.now().date()
    
    # Format date for title (e.g., "February 10, 2024")
    formatted_date = today.strftime("%B %d, %Y")
    
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
        SELECT id, value, question, answer
        FROM clues
        WHERE category_id = ?
        ORDER BY CAST(REPLACE(REPLACE(value, '$', ''), ',', '') AS INTEGER)
    """, (category['id'],)).fetchall()
    
    return render_template(
        'game.html',
        category=category,
        clues=clues,
        date=formatted_date,
        title="Daily Double"  # Changed title
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

if __name__ == '__main__':
    app.run(debug=True)