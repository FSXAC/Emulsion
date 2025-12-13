#!/usr/bin/env python3
"""
Development Chart API Demo

Demonstrates how to use the development chart API to:
1. Query development times for specific film/developer combinations
2. Add new entries to the chart
3. Search and filter entries
"""

import requests
import json

BASE_URL = "http://localhost:8200/api"


def lookup_dev_time(film_stock, developer, iso_rating, dilution_ratio=None, temperature=None):
    """
    Lookup development time for a specific combination.
    
    Args:
        film_stock: Film stock name (e.g., "Ilford HP5 Plus 400")
        developer: Developer name (e.g., "Ilfosol 3")
        iso_rating: ISO rating (e.g., 400, 800 for push)
        dilution_ratio: Optional dilution (e.g., "1+4", "1+9")
        temperature: Optional temperature in Celsius (e.g., 20.0)
    
    Returns:
        dict: Lookup result with entry or suggestions
    """
    payload = {
        "film_stock": film_stock,
        "developer": developer,
        "iso_rating": iso_rating,
    }
    
    if dilution_ratio:
        payload["dilution_ratio"] = dilution_ratio
    
    if temperature:
        payload["temperature_celsius"] = temperature
    
    response = requests.post(f"{BASE_URL}/dev-chart/lookup", json=payload)
    response.raise_for_status()
    return response.json()


def add_dev_chart_entry(film_stock, developer, iso_rating, dilution_ratio, 
                        temperature, dev_time_seconds, agitation_notes=None, notes=None):
    """
    Add a new development chart entry.
    
    Args:
        film_stock: Film stock name
        developer: Developer name
        iso_rating: ISO rating
        dilution_ratio: Dilution ratio (e.g., "1+4")
        temperature: Temperature in Celsius
        dev_time_seconds: Development time in seconds (or use helper to convert from MM:SS)
        agitation_notes: Optional agitation pattern notes
        notes: Optional additional notes
    
    Returns:
        dict: Created entry
    """
    payload = {
        "film_stock": film_stock,
        "developer": developer,
        "iso_rating": iso_rating,
        "dilution_ratio": dilution_ratio,
        "temperature_celsius": temperature,
        "development_time_seconds": dev_time_seconds,
    }
    
    if agitation_notes:
        payload["agitation_notes"] = agitation_notes
    
    if notes:
        payload["notes"] = notes
    
    response = requests.post(f"{BASE_URL}/dev-chart", json=payload)
    response.raise_for_status()
    return response.json()


def search_by_film_stock(film_stock, limit=10):
    """
    Search for all entries for a specific film stock.
    
    Args:
        film_stock: Film stock name (partial match)
        limit: Maximum number of results
    
    Returns:
        dict: List of entries and total count
    """
    response = requests.get(
        f"{BASE_URL}/dev-chart",
        params={"film_stock": film_stock, "limit": limit}
    )
    response.raise_for_status()
    return response.json()


def time_to_seconds(time_str):
    """
    Convert MM:SS format to seconds.
    
    Args:
        time_str: Time in MM:SS format (e.g., "6:30", "11:00")
    
    Returns:
        int: Time in seconds
    """
    parts = time_str.split(":")
    minutes = int(parts[0])
    seconds = int(parts[1]) if len(parts) > 1 else 0
    return minutes * 60 + seconds


def main():
    print("=" * 60)
    print("Development Chart API Demo")
    print("=" * 60)
    print()
    
    # Example 1: Lookup development time for HP5+ at box speed
    print("Example 1: Lookup HP5+ with Ilfosol 3 at ISO 400")
    print("-" * 60)
    result = lookup_dev_time("Ilford HP5 Plus 400", "Ilfosol 3", 400, "1+4", 20.0)
    if result["found"]:
        entry = result["entry"]
        print(f"✓ Found entry!")
        print(f"  Film: {entry['film_stock']}")
        print(f"  Developer: {entry['developer']}")
        print(f"  ISO: {entry['iso_rating']}")
        print(f"  Dilution: {entry['dilution_ratio']}")
        print(f"  Temperature: {entry['temperature_celsius']}°C")
        print(f"  Development time: {entry['development_time_formatted']}")
        print(f"  Agitation: {entry['agitation_notes']}")
    else:
        print("✗ No exact match found")
    print()
    
    # Example 2: Lookup push processing
    print("Example 2: Lookup HP5+ push +1 (ISO 800)")
    print("-" * 60)
    result = lookup_dev_time("Ilford HP5 Plus 400", "Ilfosol 3", 800)
    if result["found"]:
        entry = result["entry"]
        print(f"✓ Found entry!")
        print(f"  Development time: {entry['development_time_formatted']}")
        print(f"  Notes: {entry['notes']}")
    else:
        print("✗ No exact match found")
        if result["suggestions"]:
            print(f"  Found {len(result['suggestions'])} similar entries")
    print()
    
    # Example 3: Search all Kodak Tri-X entries
    print("Example 3: Search all Kodak Tri-X entries")
    print("-" * 60)
    results = search_by_film_stock("Kodak Tri-X")
    print(f"Found {results['total']} entries:")
    for entry in results["entries"][:5]:  # Show first 5
        print(f"  - {entry['developer']}, ISO {entry['iso_rating']}, {entry['dilution_ratio']}: {entry['development_time_formatted']}")
    print()
    
    # Example 4: Add a new entry (commented out to avoid duplicates)
    print("Example 4: Adding a new entry")
    print("-" * 60)
    print("# To add a new entry, uncomment the following code:")
    print("""
    new_entry = add_dev_chart_entry(
        film_stock="Ilford XP2 Super 400",
        developer="C41",
        iso_rating=400,
        dilution_ratio="standard",
        temperature=38.0,
        dev_time_seconds=time_to_seconds("3:15"),
        agitation_notes="10s every 30s",
        notes="C41 process at standard time"
    )
    print(f"✓ Added entry: {new_entry['id']}")
    """)
    print()
    
    print("=" * 60)
    print("Demo complete! Use the API to manage your dev chart.")
    print("=" * 60)


if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("Error: Cannot connect to API server")
        print("Make sure the server is running: uvicorn app.main:app --port 8200")
    except Exception as e:
        print(f"Error: {e}")
