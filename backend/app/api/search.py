"""Search query parser for film rolls.

Parses search syntax like:
- Simple text: "portra" (searches across multiple fields)
- Field-specific: "format:120 status:loaded"
- Comparisons: "stars:>=4 cost:<10"
- Chemistry: "chemistry:c41" (looks up by name)
"""

import re
from typing import List, Tuple, Optional, Any
from datetime import date
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session

from app.models import FilmRoll, ChemistryBatch


class SearchToken:
    """Represents a parsed search token."""
    
    def __init__(self, field: Optional[str], operator: str, value: str):
        self.field = field  # None for simple text search
        self.operator = operator  # '=', '>', '<', '>=', '<=', 'contains'
        self.value = value
    
    def __repr__(self):
        if self.field:
            return f"SearchToken({self.field} {self.operator} {self.value})"
        return f"SearchToken(text: {self.value})"


class SearchParser:
    """Parse search syntax and build SQLAlchemy filters."""
    
    # Field mappings to database columns
    FIELD_ALIASES = {
        'format': 'film_format',
        'stock': 'film_stock_name',
        'status': 'status',  # Computed field - handle specially
        'order': 'order_id',
        'stars': 'stars',
        'mine': 'not_mine',  # Inverted logic
        'not_mine': 'not_mine',
        'push': 'push_pull_stops',
        'pull': 'push_pull_stops',
        'chemistry': 'chemistry_id',  # Will lookup by name
        'cost': 'total_cost',  # Computed field - handle specially
        'date': 'date_loaded',  # Default to date_loaded, can expand
    }
    
    # Comparison operator pattern
    OPERATOR_PATTERN = r'(>=|<=|>|<|=|:)'
    
    def __init__(self, db: Session):
        self.db = db
        self._chemistry_cache = None  # Cache chemistry lookups
    
    def parse(self, query: str) -> List[SearchToken]:
        """
        Parse search query into tokens.
        
        Examples:
        - "portra" -> [SearchToken(text: "portra")]
        - "format:120" -> [SearchToken(format = 120)]
        - "stars:>=4" -> [SearchToken(stars >= 4)]
        - "format:120 status:loaded" -> [SearchToken(format = 120), SearchToken(status = loaded)]
        """
        if not query or not query.strip():
            return []
        
        tokens = []
        
        # Split by spaces, but respect quoted strings
        parts = self._split_respecting_quotes(query.strip())
        
        for part in parts:
            if ':' in part:
                # Field-specific search
                token = self._parse_field_token(part)
                if token:
                    tokens.append(token)
            else:
                # Simple text search
                tokens.append(SearchToken(None, 'contains', part))
        
        return tokens
    
    def _split_respecting_quotes(self, query: str) -> List[str]:
        """Split query by spaces, but keep quoted strings together."""
        parts = []
        current = []
        in_quotes = False
        
        for char in query:
            if char == '"':
                in_quotes = not in_quotes
            elif char == ' ' and not in_quotes:
                if current:
                    parts.append(''.join(current))
                    current = []
            else:
                current.append(char)
        
        if current:
            parts.append(''.join(current))
        
        return parts
    
    def _parse_field_token(self, part: str) -> Optional[SearchToken]:
        """Parse a field-specific token like 'format:120' or 'stars:>=4'."""
        # Match field:operator:value where operator can be >=, <=, >, <, =, or just :
        # Try to match field:comparision_op:value first (e.g., stars:>=4)
        match = re.match(r'^(\w+):(>=|<=|>|<|=)(.+)$', part)
        
        if match:
            field_name = match.group(1).lower()
            operator = match.group(2)
            value = match.group(3).strip('"')
        else:
            # Try simple field:value pattern (e.g., format:120)
            match = re.match(r'^(\w+):(.+)$', part)
            if not match:
                return None
            
            field_name = match.group(1).lower()
            operator = '='
            value = match.group(2).strip('"')
        
        # Validate field name
        if field_name not in self.FIELD_ALIASES:
            # Unknown field - could raise error or ignore
            # For now, treat as simple text search
            return SearchToken(None, 'contains', part)
        
        return SearchToken(field_name, operator, value)
    
    def build_filters(self, tokens: List[SearchToken]) -> Tuple[List, List[str]]:
        """
        Build SQLAlchemy filter expressions from tokens.
        
        Returns:
            Tuple of (sql_filters, computed_filters)
            - sql_filters: Filters that can be applied to SQL query
            - computed_filters: Filters that need Python evaluation (status, cost)
        """
        sql_filters = []
        computed_filters = []
        
        for token in tokens:
            if token.field is None:
                # Simple text search - OR across multiple fields
                text_filter = self._build_text_search_filter(token.value)
                if text_filter is not None:
                    sql_filters.append(text_filter)
            else:
                # Field-specific search
                field_filter = self._build_field_filter(token)
                
                if field_filter is not None:
                    if isinstance(field_filter, str):
                        # It's a computed filter (returns field name)
                        computed_filters.append((field_filter, token.operator, token.value))
                    else:
                        # It's a SQL filter
                        sql_filters.append(field_filter)
        
        return sql_filters, computed_filters
    
    def _build_text_search_filter(self, text: str) -> Any:
        """Build OR filter for simple text search across multiple fields."""
        search_term = f"%{text}%"
        return or_(
            FilmRoll.film_stock_name.ilike(search_term),
            FilmRoll.order_id.ilike(search_term),
            FilmRoll.notes.ilike(search_term),
        )
    
    def _build_field_filter(self, token: SearchToken) -> Any:
        """Build filter for a specific field."""
        field = token.field
        operator = token.operator
        value = token.value
        
        # Special handling for certain fields
        if field == 'chemistry':
            return self._build_chemistry_filter(operator, value)
        elif field == 'status':
            # Status is computed - return field name for Python filtering
            return 'status'
        elif field == 'cost':
            # Cost is computed - return field name for Python filtering
            return 'total_cost'
        elif field in ['mine', 'not_mine']:
            return self._build_not_mine_filter(operator, value)
        elif field == 'date':
            return self._build_date_filter(operator, value)
        elif field in ['push', 'pull']:
            return self._build_push_pull_filter(field, operator, value)
        else:
            # Standard field filter
            return self._build_standard_filter(field, operator, value)
    
    def _build_standard_filter(self, field: str, operator: str, value: str) -> Any:
        """Build filter for standard database fields."""
        db_field_name = self.FIELD_ALIASES.get(field, field)
        db_field = getattr(FilmRoll, db_field_name, None)
        
        if db_field is None:
            return None
        
        # Handle different operators
        if operator == '=':
            # For string fields, use case-insensitive partial match
            if db_field.type.python_type == str:
                return db_field.ilike(f"%{value}%")
            else:
                # For numeric fields, exact match
                try:
                    typed_value = self._convert_value(value, db_field.type.python_type)
                    return db_field == typed_value
                except (ValueError, TypeError):
                    return None
        elif operator in ['>', '<', '>=', '<=']:
            # Numeric comparisons
            try:
                typed_value = self._convert_value(value, db_field.type.python_type)
                if operator == '>':
                    return db_field > typed_value
                elif operator == '<':
                    return db_field < typed_value
                elif operator == '>=':
                    return db_field >= typed_value
                elif operator == '<=':
                    return db_field <= typed_value
            except (ValueError, TypeError):
                return None
        
        return None
    
    def _build_chemistry_filter(self, operator: str, value: str) -> Any:
        """Build filter for chemistry batch by name lookup."""
        # Query chemistry batches by name
        chemistry_batches = self.db.query(ChemistryBatch).filter(
            ChemistryBatch.name.ilike(f"%{value}%")
        ).all()
        
        if not chemistry_batches:
            # No matching chemistry - return filter that matches nothing
            return FilmRoll.chemistry_id == 'no-match'
        
        # Filter by chemistry IDs
        chemistry_ids = [batch.id for batch in chemistry_batches]
        return FilmRoll.chemistry_id.in_(chemistry_ids)
    
    def _build_not_mine_filter(self, operator: str, value: str) -> Any:
        """Build filter for not_mine field."""
        # Parse boolean value
        bool_value = value.lower() in ['true', 'yes', '1', 't', 'y']
        
        if operator == '=':
            return FilmRoll.not_mine == bool_value
        
        return None
    
    def _build_date_filter(self, operator: str, value: str) -> Any:
        """Build filter for date fields (supports YYYY-MM-DD, YYYY-MM, YYYY)."""
        try:
            # Try to parse date in various formats
            if len(value) == 4:  # YYYY
                # Filter by year
                year = int(value)
                start_date = date(year, 1, 1)
                end_date = date(year, 12, 31)
                return and_(
                    FilmRoll.date_loaded >= start_date,
                    FilmRoll.date_loaded <= end_date
                )
            elif len(value) == 7:  # YYYY-MM
                # Filter by month
                year, month = value.split('-')
                year, month = int(year), int(month)
                start_date = date(year, month, 1)
                # Get last day of month
                if month == 12:
                    end_date = date(year, 12, 31)
                else:
                    end_date = date(year, month + 1, 1)
                    # Subtract one day
                    from datetime import timedelta
                    end_date = end_date - timedelta(days=1)
                
                return and_(
                    FilmRoll.date_loaded >= start_date,
                    FilmRoll.date_loaded <= end_date
                )
            elif len(value) == 10:  # YYYY-MM-DD
                # Exact date match
                parsed_date = date.fromisoformat(value)
                
                if operator == '=':
                    return FilmRoll.date_loaded == parsed_date
                elif operator == '>':
                    return FilmRoll.date_loaded > parsed_date
                elif operator == '<':
                    return FilmRoll.date_loaded < parsed_date
                elif operator == '>=':
                    return FilmRoll.date_loaded >= parsed_date
                elif operator == '<=':
                    return FilmRoll.date_loaded <= parsed_date
        except (ValueError, AttributeError):
            return None
        
        return None
    
    def _build_push_pull_filter(self, field: str, operator: str, value: str) -> Any:
        """Build filter for push/pull stops."""
        try:
            # Convert value to float
            numeric_value = float(value.replace('+', ''))
            
            # For 'pull' field, negate the value
            if field == 'pull':
                numeric_value = -abs(numeric_value)
            
            if operator == '=':
                return FilmRoll.push_pull_stops == numeric_value
            elif operator == '>':
                return FilmRoll.push_pull_stops > numeric_value
            elif operator == '<':
                return FilmRoll.push_pull_stops < numeric_value
            elif operator == '>=':
                return FilmRoll.push_pull_stops >= numeric_value
            elif operator == '<=':
                return FilmRoll.push_pull_stops <= numeric_value
        except ValueError:
            return None
        
        return None
    
    def _convert_value(self, value: str, python_type: type) -> Any:
        """Convert string value to appropriate Python type."""
        if python_type == int:
            return int(value)
        elif python_type == float:
            return float(value)
        elif python_type == bool:
            return value.lower() in ['true', 'yes', '1', 't', 'y']
        else:
            return value
    
    def apply_computed_filters(self, rolls: List[FilmRoll], 
                               computed_filters: List[Tuple[str, str, str]]) -> List[FilmRoll]:
        """
        Apply computed field filters (status, cost) in Python after fetching.
        
        Args:
            rolls: List of film rolls from database
            computed_filters: List of (field_name, operator, value) tuples
        
        Returns:
            Filtered list of rolls
        """
        if not computed_filters:
            return rolls
        
        filtered_rolls = []
        
        for roll in rolls:
            matches = True
            
            for field_name, operator, value in computed_filters:
                if field_name == 'status':
                    # Compare status
                    if not self._compare_values(roll.status, operator, value.upper()):
                        matches = False
                        break
                elif field_name == 'total_cost':
                    # Compare cost
                    if roll.total_cost is None:
                        matches = False
                        break
                    try:
                        cost_value = float(value)
                        if not self._compare_numeric(float(roll.total_cost), operator, cost_value):
                            matches = False
                            break
                    except (ValueError, TypeError):
                        matches = False
                        break
            
            if matches:
                filtered_rolls.append(roll)
        
        return filtered_rolls
    
    def _compare_values(self, actual: Any, operator: str, expected: str) -> bool:
        """Compare values based on operator."""
        if operator == '=':
            return str(actual).upper() == expected.upper()
        # For status, only equality makes sense
        return False
    
    def _compare_numeric(self, actual: float, operator: str, expected: float) -> bool:
        """Compare numeric values based on operator."""
        if operator == '=':
            return abs(actual - expected) < 0.01  # Float comparison tolerance
        elif operator == '>':
            return actual > expected
        elif operator == '<':
            return actual < expected
        elif operator == '>=':
            return actual >= expected
        elif operator == '<=':
            return actual <= expected
        return False
