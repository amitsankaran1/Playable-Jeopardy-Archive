import os
import requests
from bs4 import BeautifulSoup
import time  # Added this import to resolve the error

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

# Function to fetch the seasons and count games
def count_games_per_season(base_url, output_file):
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

    # Create or overwrite the output file
    with open(output_file, "w", encoding="utf-8") as file:
        file.write("Season\tNumber of Games\n")
        file.write("-" * 30 + "\n")

    # Fetch each season and count games
    for season_url in season_urls:
        # Extract season number
        season_number = season_url.split("season=")[-1]

        # Fetch season page
        response = fetch_with_retries(season_url)
        if response is None:
            print(f"Failed to fetch season page: {season_url}")
            continue

        soup = BeautifulSoup(response.text, 'html.parser')

        # Count the number of games in the season
        game_links = soup.find_all("a", href=True)
        game_count = len([
            link for link in game_links if link['href'].startswith("showgame.php?game_id=")
        ])

        print(f"Season {season_number} has {game_count} games.")

        # Append the season and game count to the output file
        with open(output_file, "a", encoding="utf-8") as file:
            file.write(f"{season_number}\t{game_count}\n")

# Example usage
base_seasons_url = "https://j-archive.com/listseasons.php"  # URL for the seasons list
output_txt_file = "season_game_counts.txt"  # Output file to save the counts
count_games_per_season(base_seasons_url, output_txt_file)

print(f"Season and game counts saved to {output_txt_file}.")
