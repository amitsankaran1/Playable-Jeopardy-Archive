import os
import requests
from bs4 import BeautifulSoup
import time

# Function to fetch a URL with retries and timeout
def fetch_with_retries(url, max_retries=5, timeout=10, backoff_factor=2):
    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=timeout)
            response.raise_for_status()  # Raise an HTTPError for bad responses (4xx and 5xx)
            return response
        except requests.exceptions.RequestException as e:
            print(f"Attempt {attempt + 1} failed for {url}: {e}")
            if attempt < max_retries - 1:
                time.sleep(backoff_factor ** attempt)  # Exponential backoff
            else:
                print(f"Max retries exceeded for {url}")
                return None

def fetch_season_games(season_url, output_dir):
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # Fetch the season page
    response = fetch_with_retries(season_url)
    if response is None:
        print(f"Failed to fetch season page: {season_url}")
        return

    soup = BeautifulSoup(response.text, 'html.parser')

    # Find all game links on the season page
    game_links = soup.find_all("a", href=True)
    game_urls = [
        f"https://j-archive.com/{link['href']}"
        for link in game_links
        if link['href'].startswith("showgame.php?game_id=")
    ]

    print(f"Found {len(game_urls)} games in {season_url}.")

    # Sort game URLs in descending order
    game_urls = sorted(game_urls, key=lambda url: int(url.split("game_id=")[-1]), reverse=True)

    # Download each game HTML
    for game_url in game_urls:
        game_response = fetch_with_retries(game_url)
        time.sleep(2)  # Prevent overloading the server
        if game_response is None:
            print(f"Skipping game at {game_url} due to repeated failures.")
            continue

        # Extract the Show # from the game's <title>
        soup = BeautifulSoup(game_response.text, 'html.parser')
        title_tag = soup.find("title")
        if title_tag and "#" in title_tag.get_text():
            title_text = title_tag.get_text()
            show_number = title_text.split("#")[1].split(",")[0].strip()
            file_name = f"jeopardy_game_{show_number}.html"
            output_path = os.path.join(output_dir, file_name)

            # Save the HTML to a file
            with open(output_path, "w", encoding="utf-8") as file:
                file.write(game_response.text)

            print(f"Saved game {show_number} to {output_path}.")
        else:
            print(f"Error: Could not extract Show # for game at {game_url}. Skipping...")

def fetch_all_seasons(base_url, output_base_dir):
    # Fetch the main seasons list page
    response = fetch_with_retries(base_url)
    if response is None:
        print(f"Failed to fetch the seasons list page: {base_url}")
        return

    soup = BeautifulSoup(response.text, 'html.parser')

    # Find all season links
    season_links = soup.find_all("a", href=True)
    season_urls = [
        f"https://j-archive.com/{link['href']}"
        for link in season_links
        if link['href'].startswith("showseason.php?season=")
    ]

    print(f"Found {len(season_urls)} seasons.")

    # Download games for each season
    for season_url in season_urls:
        # Extract season number from the URL
        season_number = season_url.split("season=")[-1]
        season_dir = os.path.join(output_base_dir, f"season_{season_number}")

        print(f"Processing Season {season_number}...")
        fetch_season_games(season_url, season_dir)

# Example usage
base_seasons_url = "https://j-archive.com/listseasons.php"  # URL for the seasons list
output_base_directory = "./jeopardy_seasons"  # Base directory to save all seasons
fetch_all_seasons(base_seasons_url, output_base_directory)
