"""Unit tests for SearchParser."""

import pytest
from unittest.mock import Mock, MagicMock
from app.api.search import SearchParser, SearchToken


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    db = Mock()
    return db


@pytest.fixture
def parser(mock_db):
    """Create a SearchParser instance."""
    return SearchParser(mock_db)


class TestSearchTokenParsing:
    """Test parsing of search queries into tokens."""
    
    def test_simple_text_search(self, parser):
        """Test simple text search without field specification."""
        tokens = parser.parse("portra")
        
        assert len(tokens) == 1
        assert tokens[0].field is None
        assert tokens[0].operator == 'contains'
        assert tokens[0].value == 'portra'
    
    def test_field_specific_search(self, parser):
        """Test field-specific search syntax."""
        tokens = parser.parse("format:120")
        
        assert len(tokens) == 1
        assert tokens[0].field == 'format'
        assert tokens[0].operator == '='
        assert tokens[0].value == '120'
    
    def test_comparison_operators(self, parser):
        """Test comparison operators."""
        test_cases = [
            ("stars:>=4", "stars", ">=", "4"),
            ("stars:>3", "stars", ">", "3"),
            ("stars:<=5", "stars", "<=", "5"),
            ("stars:<2", "stars", "<", "2"),
            ("stars:=5", "stars", "=", "5"),
        ]
        
        for query, expected_field, expected_op, expected_val in test_cases:
            tokens = parser.parse(query)
            assert len(tokens) == 1
            assert tokens[0].field == expected_field
            assert tokens[0].operator == expected_op
            assert tokens[0].value == expected_val
    
    def test_multiple_filters(self, parser):
        """Test multiple space-separated filters."""
        tokens = parser.parse("format:120 status:loaded")
        
        assert len(tokens) == 2
        assert tokens[0].field == 'format'
        assert tokens[0].value == '120'
        assert tokens[1].field == 'status'
        assert tokens[1].value == 'loaded'
    
    def test_quoted_values(self, parser):
        """Test quoted values with spaces."""
        tokens = parser.parse('stock:"Kodak Portra 400"')
        
        assert len(tokens) == 1
        assert tokens[0].field == 'stock'
        assert tokens[0].value == 'Kodak Portra 400'
    
    def test_mixed_simple_and_field_search(self, parser):
        """Test combination of simple text and field-specific search."""
        tokens = parser.parse("portra format:120")
        
        assert len(tokens) == 2
        assert tokens[0].field is None
        assert tokens[0].value == 'portra'
        assert tokens[1].field == 'format'
        assert tokens[1].value == '120'
    
    def test_empty_query(self, parser):
        """Test empty query returns no tokens."""
        assert parser.parse("") == []
        assert parser.parse("   ") == []
    
    def test_unknown_field(self, parser):
        """Test unknown field is treated as text search."""
        tokens = parser.parse("unknownfield:value")
        
        assert len(tokens) == 1
        # Should fall back to text search
        assert tokens[0].field is None
        assert tokens[0].operator == 'contains'


class TestFieldAliases:
    """Test field name aliases."""
    
    def test_all_field_aliases(self, parser):
        """Test that all field aliases are recognized."""
        field_tests = [
            "format:35mm",
            "stock:portra",
            "status:loaded",
            "order:42",
            "stars:4",
            "mine:false",
            "not_mine:true",
            "push:+1",
            "pull:-1",
            "chemistry:c41",
            "cost:>10",
            "date:2024-12",
        ]
        
        for query in field_tests:
            tokens = parser.parse(query)
            assert len(tokens) == 1
            assert tokens[0].field is not None, f"Failed for query: {query}"


class TestComputedFilters:
    """Test filtering of computed fields."""
    
    def test_status_filter_identified(self, parser):
        """Test that status filter is identified as computed."""
        tokens = parser.parse("status:loaded")
        sql_filters, computed_filters = parser.build_filters(tokens)
        
        assert len(computed_filters) == 1
        assert computed_filters[0][0] == 'status'
        assert computed_filters[0][1] == '='
        assert computed_filters[0][2] == 'loaded'
    
    def test_cost_filter_identified(self, parser):
        """Test that cost filter is identified as computed."""
        tokens = parser.parse("cost:>10")
        sql_filters, computed_filters = parser.build_filters(tokens)
        
        assert len(computed_filters) == 1
        assert computed_filters[0][0] == 'total_cost'
    
    def test_apply_computed_status_filter(self, parser):
        """Test applying status filter to roll list."""
        # Create mock rolls
        roll1 = Mock()
        roll1.status = 'LOADED'
        roll1.total_cost = 10.0
        
        roll2 = Mock()
        roll2.status = 'NEW'
        roll2.total_cost = 8.0
        
        roll3 = Mock()
        roll3.status = 'LOADED'
        roll3.total_cost = 12.0
        
        rolls = [roll1, roll2, roll3]
        computed_filters = [('status', '=', 'LOADED')]
        
        filtered = parser.apply_computed_filters(rolls, computed_filters)
        
        assert len(filtered) == 2
        assert roll1 in filtered
        assert roll3 in filtered
        assert roll2 not in filtered
    
    def test_apply_computed_cost_filter(self, parser):
        """Test applying cost filter to roll list."""
        # Create mock rolls
        roll1 = Mock()
        roll1.status = 'LOADED'
        roll1.total_cost = 10.0
        
        roll2 = Mock()
        roll2.status = 'NEW'
        roll2.total_cost = 15.0
        
        roll3 = Mock()
        roll3.status = 'LOADED'
        roll3.total_cost = 8.0
        
        rolls = [roll1, roll2, roll3]
        computed_filters = [('total_cost', '>', '10')]
        
        filtered = parser.apply_computed_filters(rolls, computed_filters)
        
        assert len(filtered) == 1
        assert roll2 in filtered


class TestValueConversion:
    """Test value type conversion."""
    
    def test_convert_integer(self, parser):
        """Test integer conversion."""
        assert parser._convert_value("42", int) == 42
    
    def test_convert_float(self, parser):
        """Test float conversion."""
        assert parser._convert_value("3.14", float) == 3.14
    
    def test_convert_boolean(self, parser):
        """Test boolean conversion."""
        true_values = ["true", "True", "TRUE", "yes", "1", "t", "y"]
        for val in true_values:
            assert parser._convert_value(val, bool) is True
        
        assert parser._convert_value("false", bool) is False


if __name__ == "__main__":
    # Run tests with: python -m pytest backend/tests/test_search_parser.py -v
    pytest.main([__file__, "-v"])
