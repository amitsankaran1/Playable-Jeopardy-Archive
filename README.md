# Daily Double - A Daily Jeopardy! Category Game

Daily Double is a web-based game that presents players with a new Jeopardy! category each day. Players can test their knowledge by answering five clues from real Jeopardy! games, track their score, and share their results.

## How It Works

- Each day features a different category from past Jeopardy! games
- Players are presented with 5 clues of increasing value ($200-$1000)
- Click on a clue to reveal the question
- After viewing the question, players can:
  - Reveal the answer and mark if they got it right or wrong
  - Skip the question to see the answer without scoring
- Correct answers add the clue's value to your score
- Incorrect answers subtract the clue's value
- After completing all clues, players can share their results with others

## Features

- Mobile-responsive design
- Score tracking
- Daily rotation of categories
- Share results with emoji grid (similar to Wordle)
- Original game information displayed
- Clean, Jeopardy!-inspired UI

## Technical Details

Built with:
- Flask (Python web framework)
- SQLite database
- HTML/CSS/JavaScript
- Responsive design for all screen sizes
- Eastern Time zone support for consistent daily categories

## Requirements

- Python 3.x
- Flask
- SQLite3
- Additional requirements listed in requirements.txt

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Run the Flask application:
   ```
   python app.py
   ```

## Database

The game uses a SQLite database (jeopardy.db) containing:
- Categories from real Jeopardy! games
- Clues with questions and answers
- Game metadata (season, episode, air date)

## Contributing

Feel free to submit issues and pull requests for:
- Bug fixes
- UI improvements
- Feature additions
- Database updates

## License

This project is intended for recreational use only. Jeopardy! is a registered trademark of Jeopardy Productions, Inc. 