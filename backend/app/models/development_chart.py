"""Development chart database model for B&W film development timing lookup."""

from decimal import Decimal
from typing import Optional

from sqlalchemy import Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, generate_uuid


class DevelopmentChart(Base, TimestampMixin):
    """
    Development chart lookup table for B&W film development.
    
    Stores timing, dilution, and temperature data for specific combinations of:
    - Film stock (e.g., "Ilford HP5 Plus 400", "Kodak Tri-X 400")
    - Developer (e.g., "Ilfosol 3", "D-76", "HC-110")
    - ISO rating (e.g., 400, 800 for push processing)
    - Dilution ratio (e.g., "1+4", "1+9", "1+14")
    - Temperature in Celsius (e.g., 20, 24)
    
    Development time is stored in seconds for consistency with C41 calculations.
    
    Example entries:
    - Ilford HP5+, Ilfosol 3, ISO 400, 1+4, 20°C → 390 seconds (6:30)
    - Ilford HP5+, Ilfosol 3, ISO 800, 1+4, 20°C → 660 seconds (11:00)
    - Ilford HP5+, Ilfosol 3, ISO 400, 1+9, 20°C → 480 seconds (8:00)
    """

    __tablename__ = "development_chart"

    # Primary key
    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_uuid
    )

    # Film and developer identification
    film_stock: Mapped[str] = mapped_column(
        String(200), nullable=False, index=True,
        comment="Film stock name (e.g., 'Ilford HP5 Plus 400')"
    )
    developer: Mapped[str] = mapped_column(
        String(200), nullable=False, index=True,
        comment="Developer name (e.g., 'Ilfosol 3', 'D-76', 'HC-110')"
    )

    # Development parameters
    iso_rating: Mapped[int] = mapped_column(
        Integer, nullable=False, index=True,
        comment="ISO rating (use pushed/pulled ISO for push/pull processing)"
    )
    dilution_ratio: Mapped[str] = mapped_column(
        String(50), nullable=False,
        comment="Dilution ratio (e.g., '1+4', '1+9', 'stock', '1+31')"
    )
    temperature_celsius: Mapped[Decimal] = mapped_column(
        Numeric(4, 1), nullable=False,
        comment="Development temperature in Celsius (e.g., 20.0, 24.0)"
    )

    # Development timing
    development_time_seconds: Mapped[int] = mapped_column(
        Integer, nullable=False,
        comment="Development time in seconds (e.g., 390 for 6:30)"
    )

    # Additional information
    agitation_notes: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True,
        comment="Agitation pattern notes (e.g., 'First 30s continuous, then 10s every minute')"
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True,
        comment="Additional notes, source references, or experimental observations"
    )

    @property
    def development_time_formatted(self) -> str:
        """
        Format development time as MM:SS.
        
        Returns:
            Formatted time string (e.g., "6:30", "11:00")
        """
        minutes = self.development_time_seconds // 60
        seconds = self.development_time_seconds % 60
        return f"{minutes}:{seconds:02d}"

    def __repr__(self) -> str:
        return (
            f"<DevelopmentChart("
            f"film={self.film_stock}, "
            f"dev={self.developer}, "
            f"iso={self.iso_rating}, "
            f"dilution={self.dilution_ratio}, "
            f"temp={self.temperature_celsius}°C, "
            f"time={self.development_time_formatted}"
            f")>"
        )
