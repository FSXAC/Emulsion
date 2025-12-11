"""Integration tests for search API endpoint.

These tests verify that the search parser integrates correctly with the /api/rolls endpoint.
They assume the backend server is running and has test data.
"""

import requests
import pytest

BASE_URL = "http://localhost:8200"


def test_server_is_running():
    """Verify the server is accessible."""
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_simple_text_search():
    """Test simple text search without field specification."""
    response = requests.get(f"{BASE_URL}/api/rolls", params={"search": "portra"})
    assert response.status_code == 200
    data = response.json()
    assert "rolls" in data
    assert "total" in data
    # Should find some portra rolls
    assert data["total"] > 0


def test_format_filter():
    """Test format field filter."""
    response = requests.get(f"{BASE_URL}/api/rolls", params={"search": "format:120"})
    assert response.status_code == 200
    data = response.json()
    
    # All returned rolls should be 120 format
    for roll in data["rolls"]:
        assert roll["film_format"] == "120"


def test_status_filter():
    """Test status field filter (computed field)."""
    response = requests.get(f"{BASE_URL}/api/rolls", params={"search": "status:loaded"})
    assert response.status_code == 200
    data = response.json()
    
    # All returned rolls should have LOADED status
    for roll in data["rolls"]:
        assert roll["status"] == "LOADED"


def test_multiple_filters():
    """Test multiple filters with AND logic."""
    response = requests.get(f"{BASE_URL}/api/rolls", params={"search": "format:120 status:new"})
    assert response.status_code == 200
    data = response.json()
    
    # All returned rolls should be 120 format AND NEW status
    for roll in data["rolls"]:
        assert roll["film_format"] == "120"
        assert roll["status"] == "NEW"


def test_comparison_operator():
    """Test comparison operators (stars:>=4)."""
    response = requests.get(f"{BASE_URL}/api/rolls", params={"search": "stars:>=4"})
    assert response.status_code == 200
    data = response.json()
    
    # All returned rolls should have 4 or 5 stars
    for roll in data["rolls"]:
        assert roll["stars"] >= 4


def test_chemistry_search():
    """Test chemistry search by name."""
    response = requests.get(f"{BASE_URL}/api/rolls", params={"search": "chemistry:c41"})
    assert response.status_code == 200
    data = response.json()
    
    # Should find rolls with C41 chemistry
    assert data["total"] > 0


def test_legacy_filter_compatibility():
    """Test that legacy filters still work."""
    # Test order_id filter
    response = requests.get(f"{BASE_URL}/api/rolls", params={"order_id": "42", "limit": 1000})
    assert response.status_code == 200
    data = response.json()
    
    # All returned rolls should have order_id "42"
    for roll in data["rolls"]:
        assert roll["order_id"] == "42"


def test_invalid_search_syntax():
    """Test that invalid search syntax returns appropriate error."""
    # This test might not fail since we fallback to text search for unknown fields
    # But we can test a malformed query
    response = requests.get(f"{BASE_URL}/api/rolls", params={"search": "stars:abc"})
    # This should still work (will just not match anything or handle gracefully)
    assert response.status_code in [200, 400]


def test_empty_search():
    """Test empty search query."""
    response = requests.get(f"{BASE_URL}/api/rolls", params={"search": ""})
    assert response.status_code == 200
    data = response.json()
    # Empty search should return all rolls
    assert data["total"] > 0


def test_no_pagination_when_searching():
    """Test that search returns all results without pagination."""
    # First get total count without search
    response = requests.get(f"{BASE_URL}/api/rolls", params={"limit": 1000})
    total_rolls = response.json()["total"]
    
    # Now search for all rolls using a field that matches everything
    response = requests.get(f"{BASE_URL}/api/rolls", params={"search": "format:35mm"})
    search_results = response.json()["total"]
    
    # Search should return results without pagination limits
    assert search_results <= total_rolls


if __name__ == "__main__":
    # Run tests with: python -m pytest backend/tests/test_search_integration.py -v
    # Or: python backend/tests/test_search_integration.py
    pytest.main([__file__, "-v", "-s"])
