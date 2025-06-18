# utils/weather.py
# Fetch weather forecast from the API
# Extract Perlis forecast
# Save as CSV (optional: in data/weather/perlis_7day.csv)

import requests
import pandas as pd
import json
from datetime import datetime
import time
import os

def classify_weather(summary):
    """Classify weather summary into simpler categories"""
    summary = summary.lower()
    
    if any(word in summary for word in ['ribut', 'petir', 'kilat']):
        return 'Thunderstorm'
    elif any(word in summary for word in ['hujan lebat', 'hujan cats']):
        return 'Heavy Rain'
    elif 'hujan' in summary:
        return 'Rain'
    elif any(word in summary for word in ['cerah', 'panas', 'terang']):
        return 'Clear'
    elif any(word in summary for word in ['berawan', 'mendung']):
        return 'Cloudy'
    elif 'Berjerebu' in summary:
        return 'Hazy'
    else:
        return 'no rain'  # Default category for unclassified conditions

def fetch_and_save_weather(location_id="St001", save_path="dataset/weather/perlis_7day.csv", retries=3, delay=2):
    """
    Fetch weather data with retry mechanism and proper error handling
    
    Args:
        location_id (str): The location ID for the weather forecast
        save_path (str): Path to save the CSV file
        retries (int): Number of retry attempts
        delay (int): Delay between retries in seconds
    
    Returns:
        DataFrame: Weather data or None if failed
    """
    print(f"Fetching weather data for location {location_id}...")
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    
    # Base URL for the API
    url = f"https://api.data.gov.my/weather/forecast?contains={location_id}@location__location_id"
    
    # Add a user agent to avoid being blocked
    headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36',
    }
    
    # Try with retries
    for attempt in range(retries):
        try:
            response = requests.get(url, headers=headers, timeout=10)
            
            # Check for successful response
            if response.status_code == 200:
                weather_data = response.json()
                
                # Debug: Print the structure of the first item to understand the data
                if weather_data and len(weather_data) > 0:
                    print(f"Successfully retrieved {len(weather_data)} weather records")
                else:
                    print("Warning: Empty weather data returned")
                    if attempt < retries - 1:
                        print(f"Retrying in {delay} seconds... (Attempt {attempt+1}/{retries})")
                        time.sleep(delay)
                        continue
                    else:
                        return None
                
                # Process the data
                weather_records = []
                for entry in weather_data:
                    try:
                        # Handle different possible data structures
                        if isinstance(entry, dict):
                            if 'date' in entry and 'min_temp' in entry and 'max_temp' in entry:
                                weather_records.append({
                                    "date": entry.get("date", ""),
                                    "min_temp": entry.get("min_temp", ""),
                                    "max_temp": entry.get("max_temp", ""),
                                    "weather_type": classify_weather(entry.get("summary_forecast", "")),
                                    #"humidity": entry.get("humidity", ""),  #Add more fields if available
                                    "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                                })
                    except Exception as e:
                        print(f"Error processing entry: {e}")
                        continue
                
                if not weather_records:
                    print("No valid weather records found in the response")
                    # Save the raw response for debugging
                    with open("weather_debug.json", "w") as f:
                        json.dump(weather_data, f, indent=2)
                    
                    if attempt < retries - 1:
                        print(f"Retrying in {delay} seconds... (Attempt {attempt+1}/{retries})")
                        time.sleep(delay)
                        continue
                    else:
                        return None
                
                # Create DataFrame
                df = pd.DataFrame(weather_records)
                
                # Convert date column to datetime
                try:
                    df["date"] = pd.to_datetime(df["date"])
                except Exception as e:
                    print(f"Warning: Could not convert dates: {e}")
                
                # Sort by date
                df = df.sort_values(by="date")
                
                # Save to CSV
                df.to_csv(save_path, index=False)
                print(f"[INFO] Weather data saved to {save_path}")
                
                return df
            
            else:
                print(f"API request failed with status code: {response.status_code}")
                print(f"Response content: {response.text[:200]}...")  # Print first 200 chars of response
                
                if attempt < retries - 1:
                    print(f"Retrying in {delay} seconds... (Attempt {attempt+1}/{retries})")
                    time.sleep(delay)
                else:
                    print("All retry attempts failed.")
                    return None
                    
        except requests.exceptions.RequestException as e:
            print(f"Request error: {e}")
            if attempt < retries - 1:
                print(f"Retrying in {delay} seconds... (Attempt {attempt+1}/{retries})")
                time.sleep(delay)
            else:
                print("All retry attempts failed.")
                return None

def get_current_weather(location_id="St001"):
    """Get only the current day's weather"""
    df = fetch_and_save_weather(location_id)
    if df is not None and not df.empty:
        return df.iloc[0]  # Return first row (current day)
    return None

def is_data_fresh(file_path, max_age_hours=3):
    """Check if the weather data is recent enough"""
    try:
        if not os.path.exists(file_path):
            return False
        
        # Get file modification time
        mtime = os.path.getmtime(file_path)
        last_modified = datetime.fromtimestamp(mtime)
        age = datetime.now() - last_modified
        
        # Check if data is older than max_age_hours
        return age.total_seconds() < max_age_hours * 3600
    except Exception as e:
        print(f"Error checking data freshness: {e}")
        return False

def get_weather_data(location_id="St001", save_path="dataset/weather/perlis_7day.csv", force_refresh=False):
    """Get weather data, refreshing only if needed or forced"""
    if force_refresh or not is_data_fresh(save_path):
        return fetch_and_save_weather(location_id, save_path)
    else:
        try:
            print(f"Using cached weather data from {save_path}")
            return pd.read_csv(save_path)
        except Exception as e:
            print(f"Error reading cached data: {e}")
            return fetch_and_save_weather(location_id, save_path)

# Example usage
if __name__ == "__main__":
    weather_df = get_weather_data(force_refresh=True)
    if weather_df is not None:
        print(weather_df.head())
    else:
        print("Failed to retrieve weather data")