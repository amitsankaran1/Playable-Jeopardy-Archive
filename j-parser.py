import os
import sqlite3
from bs4 import BeautifulSoup

# Initialize SQLite database with a specified path
def init_db(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    return conn, cursor

# Insert season data into the database if it doesn't exist
def insert_season_data(season_number, cursor):
    cursor.execute("SELECT id FROM seasons WHERE season_number = ?", (season_number,))
    season_id = cursor.fetchone()
    if season_id is None:
        cursor.execute("INSERT INTO seasons (season_number) VALUES (?)", (season_number,))
        print(f"Inserted season with season_number {season_number} into database.")
    else:
        print(f"Season with season_number {season_number} already exists in the database.")

# Parse single game file
def parse_game_file(file_path, season, conn, cursor):
    print(f"Processing file: {file_path}")
    with open(file_path, "r", encoding="utf-8") as file:
        soup = BeautifulSoup(file, "html.parser")
        
        # Extract game metadata
        game_number = os.path.basename(file_path).split("_")[2].split(".")[0]
        game_id = f"{season}_{game_number}"  # Unique game ID
        title_element = soup.find("title")
        game_title = title_element.text if title_element else "Unknown Title"
        game_date_element = soup.find("div", id="game_title")
        game_date = game_date_element.text.split("-")[-1].strip() if game_date_element else "Unknown Date"
        print(f"Game ID: {game_id}, Title: {game_title}, Date: {game_date}")
        
        # Check if the game already exists
        cursor.execute("SELECT COUNT(*) FROM games WHERE id = ?", (game_id,))
        if cursor.fetchone()[0] > 0:
            print(f"Game {game_id} already exists. Skipping.")
            return
        
        # Insert game data
        cursor.execute("""
            INSERT INTO games (id, date, season_id, title, game_number)
            VALUES (?, ?, ?, ?, ?)
        """, (game_id, game_date, season, game_title, game_number))
        print(f"Inserted game {game_id} into database.")
        
        # Parse contestants
        contestants_section = soup.find("div", id="contestants")
        if contestants_section:
            contestants = contestants_section.find_all("p", class_="contestants")
            for contestant in contestants:
                name = contestant.text.split(",")[0].strip()
                cursor.execute("""
                    INSERT INTO contestants (name, role, game_id)
                    VALUES (?, ?, ?)
                """, (name, "contestant", game_id))
                print(f"Inserted contestant: {name}")
        
        # Parse rounds
        rounds = {"jeopardy_round": "Jeopardy", "double_jeopardy_round": "Double Jeopardy"}
        for round_id, round_name in rounds.items():
            round_div = soup.find("div", id=round_id)
            if not round_div:
                print(f"No data found for {round_name}.")
                continue
            
            # Parse categories
            categories = round_div.find_all("td", class_="category")
            category_ids = []
            for category in categories:
                category_name = category.find("td", class_="category_name").text.strip()
                cursor.execute("""
                    INSERT INTO categories (name, round, game_id)
                    VALUES (?, ?, ?)
                """, (category_name, round_name, game_id))
                category_ids.append(cursor.lastrowid)
                print(f"Inserted category: {category_name}")
            
            # Parse clues and assign them to categories
            clues = round_div.find_all("td", class_="clue")
            for index, clue in enumerate(clues):
                clue_text = clue.find("td", class_="clue_text")
                clue_value = clue.find("td", class_=["clue_value", "clue_value_daily_double"])
                clue_response = clue.find("td", style="display:none;", id=lambda x: x and x.endswith("_r"))
                
                if clue_text and clue_value:
                    question = clue_text.text.strip()
                    # Check if it's a Daily Double
                    is_daily_double = clue_value.get("class") and "clue_value_daily_double" in clue_value["class"]

                    # Handle value extraction
                    if is_daily_double:
                        value = clue_value.text.strip().replace("DD: ", "")
                    else:
                        value = clue_value.text.strip()

                    # Extract correct response
                    answer = (
                        clue_response.find("em", class_="correct_response").text.strip()
                        if clue_response and clue_response.find("em", class_="correct_response")
                        else "Unknown Answer"
                    )

                    # Determine the category based on index
                    category_id = category_ids[index % len(category_ids)]

                    # Insert clue into database with is_daily_double as a boolean
                    cursor.execute("""
                        INSERT INTO clues (category_id, value, question, answer, is_daily_double)
                        VALUES (?, ?, ?, ?, ?)
                    """, (category_id, value, question, answer, int(is_daily_double)))
                    
                    # Debugging information
                    print(f"Inserted clue: {question} (Value: {value}, Daily Double: {is_daily_double}, Answer: {answer})")

        # Parse Final Jeopardy round
        final_jeopardy_div = soup.find("div", id="final_jeopardy_round")
        if final_jeopardy_div:
            final_category = final_jeopardy_div.find("td", class_="category_name").text.strip()
            final_clue = final_jeopardy_div.find("td", class_="clue_text").text.strip()
            final_response = final_jeopardy_div.find("em", class_="correct_response").text.strip() if final_jeopardy_div.find("em", class_="correct_response") else "Unknown Answer"

            # Insert Final Jeopardy category
            cursor.execute("""
                INSERT INTO categories (name, round, game_id)
                VALUES (?, ?, ?)
            """, (final_category, "Final Jeopardy", game_id))
            final_category_id = cursor.lastrowid

            # Insert Final Jeopardy clue with is_final_jeopardy set to 1
            cursor.execute("""
                INSERT INTO clues (category_id, value, question, answer, is_daily_double, is_final_jeopardy)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (final_category_id, None, final_clue, final_response, 0, 1))

            print(f"Inserted Final Jeopardy: {final_clue} (Category: {final_category}, Answer: {final_response})")
        else:
            print("No data found for Final Jeopardy.")


    conn.commit()
    print(f"Completed processing file: {file_path}")

# Process all game files in a folder
def process_folder(folder_path, db_path):
    conn, cursor = init_db(db_path)

    for season_folder in os.listdir(folder_path):
        season_path = os.path.join(folder_path, season_folder)
        if not os.path.isdir(season_path):
            continue

        season_number = season_folder.split("_")[-1]  # Extract season number from folder name

        # Insert the season into the database
        insert_season_data(season_number, cursor)

        for file_name in os.listdir(season_path):
            if file_name.endswith(".html"):
                file_path = os.path.join(season_path, file_name)
                parse_game_file(file_path, season_number, conn, cursor)

    conn.close()


# Main function
if __name__ == "__main__":
    folder_path = '/Users/amitsankaran/Documents/Code Projects/Playable Jeopardy Archive/jeopardy_seasons_full'  # Update this path to your HTML files directory
    db_path = '/Users/amitsankaran/Documents/Code Projects/Playable Jeopardy Archive/jeopardy_game/jeopardy.db' # Update this path to your database file
    process_folder(folder_path, db_path)
