"""Tests for development chart API endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from decimal import Decimal

from app.main import app
from app.core.database import get_db
from app.models.base import Base
from app.models import DevelopmentChart


# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_dev_chart.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Override dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(scope="function", autouse=True)
def setup_database():
    """Create tables before each test and drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_entry():
    """Create a sample development chart entry for testing."""
    return {
        "film_stock": "Ilford HP5 Plus 400",
        "developer": "Ilfosol 3",
        "iso_rating": 400,
        "dilution_ratio": "1+4",
        "temperature_celsius": 20.0,
        "development_time_seconds": 390,  # 6:30
        "agitation_notes": "First 30s continuous, then 10s every minute",
        "notes": "From Ilford datasheet"
    }


def test_create_dev_chart_entry(sample_entry):
    """Test creating a new development chart entry."""
    response = client.post("/api/dev-chart", json=sample_entry)
    assert response.status_code == 201
    
    data = response.json()
    assert data["film_stock"] == sample_entry["film_stock"]
    assert data["developer"] == sample_entry["developer"]
    assert data["iso_rating"] == sample_entry["iso_rating"]
    assert data["dilution_ratio"] == sample_entry["dilution_ratio"]
    assert float(data["temperature_celsius"]) == sample_entry["temperature_celsius"]
    assert data["development_time_seconds"] == sample_entry["development_time_seconds"]
    assert data["development_time_formatted"] == "6:30"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_create_duplicate_entry(sample_entry):
    """Test that creating a duplicate entry fails."""
    # Create first entry
    response = client.post("/api/dev-chart", json=sample_entry)
    assert response.status_code == 201
    
    # Try to create duplicate
    response = client.post("/api/dev-chart", json=sample_entry)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_list_dev_chart_entries(sample_entry):
    """Test listing development chart entries."""
    # Create multiple entries
    client.post("/api/dev-chart", json=sample_entry)
    
    # Create another with different ISO (push)
    push_entry = sample_entry.copy()
    push_entry["iso_rating"] = 800
    push_entry["development_time_seconds"] = 660  # 11:00
    client.post("/api/dev-chart", json=push_entry)
    
    # List all entries
    response = client.get("/api/dev-chart")
    assert response.status_code == 200
    
    data = response.json()
    assert "entries" in data
    assert "total" in data
    assert data["total"] == 2
    assert len(data["entries"]) == 2


def test_filter_by_film_stock(sample_entry):
    """Test filtering entries by film stock."""
    # Create entries for different films
    client.post("/api/dev-chart", json=sample_entry)
    
    kodak_entry = sample_entry.copy()
    kodak_entry["film_stock"] = "Kodak Tri-X 400"
    client.post("/api/dev-chart", json=kodak_entry)
    
    # Filter for Ilford
    response = client.get("/api/dev-chart", params={"film_stock": "Ilford"})
    assert response.status_code == 200
    
    data = response.json()
    assert data["total"] == 1
    assert "Ilford" in data["entries"][0]["film_stock"]


def test_filter_by_developer(sample_entry):
    """Test filtering entries by developer."""
    # Create entries with different developers
    client.post("/api/dev-chart", json=sample_entry)
    
    d76_entry = sample_entry.copy()
    d76_entry["developer"] = "D-76"
    d76_entry["dilution_ratio"] = "1+1"
    d76_entry["development_time_seconds"] = 480
    client.post("/api/dev-chart", json=d76_entry)
    
    # Filter for D-76
    response = client.get("/api/dev-chart", params={"developer": "D-76"})
    assert response.status_code == 200
    
    data = response.json()
    assert data["total"] == 1
    assert data["entries"][0]["developer"] == "D-76"


def test_filter_by_iso_rating(sample_entry):
    """Test filtering entries by ISO rating."""
    # Create entries with different ISOs
    client.post("/api/dev-chart", json=sample_entry)
    
    push_entry = sample_entry.copy()
    push_entry["iso_rating"] = 800
    push_entry["development_time_seconds"] = 660
    client.post("/api/dev-chart", json=push_entry)
    
    # Filter for ISO 800
    response = client.get("/api/dev-chart", params={"iso_rating": 800})
    assert response.status_code == 200
    
    data = response.json()
    assert data["total"] == 1
    assert data["entries"][0]["iso_rating"] == 800


def test_get_single_entry(sample_entry):
    """Test getting a single entry by ID."""
    # Create entry
    create_response = client.post("/api/dev-chart", json=sample_entry)
    entry_id = create_response.json()["id"]
    
    # Get entry
    response = client.get(f"/api/dev-chart/{entry_id}")
    assert response.status_code == 200
    
    data = response.json()
    assert data["id"] == entry_id
    assert data["film_stock"] == sample_entry["film_stock"]


def test_get_nonexistent_entry():
    """Test getting a nonexistent entry returns 404."""
    response = client.get("/api/dev-chart/nonexistent-id")
    assert response.status_code == 404


def test_update_entry(sample_entry):
    """Test updating an existing entry."""
    # Create entry
    create_response = client.post("/api/dev-chart", json=sample_entry)
    entry_id = create_response.json()["id"]
    
    # Update development time
    update_data = {
        "development_time_seconds": 420,  # 7:00
        "notes": "Updated timing based on experiment"
    }
    response = client.put(f"/api/dev-chart/{entry_id}", json=update_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["development_time_seconds"] == 420
    assert data["development_time_formatted"] == "7:00"
    assert data["notes"] == "Updated timing based on experiment"
    # Other fields should remain unchanged
    assert data["film_stock"] == sample_entry["film_stock"]
    assert data["developer"] == sample_entry["developer"]


def test_delete_entry(sample_entry):
    """Test deleting an entry."""
    # Create entry
    create_response = client.post("/api/dev-chart", json=sample_entry)
    entry_id = create_response.json()["id"]
    
    # Delete entry
    response = client.delete(f"/api/dev-chart/{entry_id}")
    assert response.status_code == 204
    
    # Verify it's gone
    get_response = client.get(f"/api/dev-chart/{entry_id}")
    assert get_response.status_code == 404


def test_lookup_exact_match(sample_entry):
    """Test lookup with exact match."""
    # Create entry
    client.post("/api/dev-chart", json=sample_entry)
    
    # Lookup with all parameters
    lookup_query = {
        "film_stock": "Ilford HP5 Plus 400",
        "developer": "Ilfosol 3",
        "iso_rating": 400,
        "dilution_ratio": "1+4",
        "temperature_celsius": 20.0
    }
    response = client.post("/api/dev-chart/lookup", json=lookup_query)
    assert response.status_code == 200
    
    data = response.json()
    assert data["found"] is True
    assert data["entry"] is not None
    assert data["entry"]["development_time_seconds"] == 390
    assert data["entry"]["development_time_formatted"] == "6:30"


def test_lookup_without_dilution_temp(sample_entry):
    """Test lookup without specifying dilution and temperature."""
    # Create entry
    client.post("/api/dev-chart", json=sample_entry)
    
    # Lookup with only required fields
    lookup_query = {
        "film_stock": "Ilford HP5 Plus 400",
        "developer": "Ilfosol 3",
        "iso_rating": 400
    }
    response = client.post("/api/dev-chart/lookup", json=lookup_query)
    assert response.status_code == 200
    
    data = response.json()
    assert data["found"] is True
    assert data["entry"] is not None


def test_lookup_no_match_with_suggestions(sample_entry):
    """Test lookup with no exact match returns suggestions."""
    # Create entry for HP5 at ISO 400
    client.post("/api/dev-chart", json=sample_entry)
    
    # Lookup for same film/dev but different ISO
    lookup_query = {
        "film_stock": "Ilford HP5 Plus 400",
        "developer": "Ilfosol 3",
        "iso_rating": 800  # Different ISO
    }
    response = client.post("/api/dev-chart/lookup", json=lookup_query)
    assert response.status_code == 200
    
    data = response.json()
    assert data["found"] is False
    assert data["entry"] is None
    assert data["suggestions"] is not None
    assert len(data["suggestions"]) > 0
    # Suggestions should be for same film/dev
    for suggestion in data["suggestions"]:
        assert suggestion["film_stock"] == "Ilford HP5 Plus 400"
        assert suggestion["developer"] == "Ilfosol 3"


def test_lookup_no_match_no_suggestions():
    """Test lookup with no matches at all."""
    lookup_query = {
        "film_stock": "Nonexistent Film",
        "developer": "Nonexistent Developer",
        "iso_rating": 400
    }
    response = client.post("/api/dev-chart/lookup", json=lookup_query)
    assert response.status_code == 200
    
    data = response.json()
    assert data["found"] is False
    assert data["entry"] is None
    assert data["suggestions"] is None


def test_autocomplete_films(sample_entry):
    """Test film stock autocomplete."""
    # Create entries
    client.post("/api/dev-chart", json=sample_entry)
    
    kodak_entry = sample_entry.copy()
    kodak_entry["film_stock"] = "Kodak Tri-X 400"
    client.post("/api/dev-chart", json=kodak_entry)
    
    # Autocomplete for "Ilford"
    response = client.get("/api/dev-chart/autocomplete/films", params={"q": "Ilford"})
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert "Ilford" in data[0]


def test_autocomplete_developers(sample_entry):
    """Test developer autocomplete."""
    # Create entries with different developers
    client.post("/api/dev-chart", json=sample_entry)
    
    d76_entry = sample_entry.copy()
    d76_entry["developer"] = "D-76"
    d76_entry["dilution_ratio"] = "1+1"
    client.post("/api/dev-chart", json=d76_entry)
    
    # Autocomplete for "D"
    response = client.get("/api/dev-chart/autocomplete/developers", params={"q": "D"})
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    assert "D-76" in data


def test_development_time_formatting():
    """Test that development times are formatted correctly."""
    test_cases = [
        (390, "6:30"),   # 6 minutes 30 seconds
        (660, "11:00"),  # 11 minutes
        (480, "8:00"),   # 8 minutes
        (45, "0:45"),    # 45 seconds
        (3600, "60:00"), # 1 hour
    ]
    
    for seconds, expected_format in test_cases:
        entry = {
            "film_stock": "Test Film",
            "developer": "Test Developer",
            "iso_rating": 400,
            "dilution_ratio": "1+4",
            "temperature_celsius": 20.0,
            "development_time_seconds": seconds
        }
        response = client.post("/api/dev-chart", json=entry)
        assert response.status_code == 201
        
        data = response.json()
        assert data["development_time_formatted"] == expected_format
        
        # Clean up
        client.delete(f"/api/dev-chart/{data['id']}")


def test_pagination(sample_entry):
    """Test pagination of dev chart entries."""
    # Create 15 entries
    for i in range(15):
        entry = sample_entry.copy()
        entry["film_stock"] = f"Film {i}"
        client.post("/api/dev-chart", json=entry)
    
    # Get first page (10 items)
    response = client.get("/api/dev-chart", params={"skip": 0, "limit": 10})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 15
    assert len(data["entries"]) == 10
    
    # Get second page (5 items)
    response = client.get("/api/dev-chart", params={"skip": 10, "limit": 10})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 15
    assert len(data["entries"]) == 5
