"""Chemistry batch database model."""

from datetime import date
from decimal import Decimal
from typing import Optional, List

from sqlalchemy import Date, Integer, Numeric, String, Text, select, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class ChemistryBatch(Base, TimestampMixin):
    """
    Chemistry batch model for tracking developer/fixer batches.
    
    Tracks costs, usage count, and calculates C41 development times.
    rolls_offset allows manual adjustment for simulating stale chemistry.
    """

    __tablename__ = "chemistry_batches"

    # Primary key
    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_uuid
    )

    # Core metadata
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    chemistry_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )  # C41, E6, BW, etc.

    # Lifecycle dates
    date_mixed: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    date_retired: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Costs
    developer_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    fixer_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    other_cost: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, default=Decimal("0.00")
    )

    # Manual adjustment for roll count (e.g., to simulate stale chemistry)
    rolls_offset: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    rolls: Mapped[List["FilmRoll"]] = relationship(
        "FilmRoll", back_populates="chemistry"
    )

    @property
    def batch_cost(self) -> Decimal:
        """
        Calculate total batch cost.
        
        Returns:
            Sum of developer, fixer, and other costs
        """
        return self.developer_cost + self.fixer_cost + self.other_cost

    @property
    def rolls_developed(self) -> int:
        """
        Calculate number of rolls developed with this chemistry.
        
        Includes manual rolls_offset adjustment.
        
        Returns:
            Count of associated rolls plus offset
        """
        # Note: In practice, this needs to be calculated with a query
        # since self.rolls is a lazy-loaded relationship
        return len(self.rolls) + self.rolls_offset

    @property
    def cost_per_roll(self) -> Optional[Decimal]:
        """
        Calculate cost per roll.
        
        Returns:
            Batch cost divided by rolls developed, or None if no rolls (division by zero)
        """
        rolls_count = self.rolls_developed
        if rolls_count == 0:
            return None
        return self.batch_cost / Decimal(rolls_count)

    def calc_c41_dev_time(self) -> Optional[str]:
        """
        Calculate C41 development time based on roll usage.
        
        Formula: 3:30 base + 2% per roll
        Only applicable for C41 chemistry type.
        
        Returns:
            Formatted time string (e.g., "3:30", "3:43"), or None if not C41
        """
        if self.chemistry_type.upper() != "C41":
            return None

        base_seconds = 210  # 3 min 30 sec
        rolls_count = self.rolls_developed
        additional = rolls_count * 0.02 * base_seconds
        total_seconds = base_seconds + additional

        minutes = int(total_seconds // 60)
        seconds = int(total_seconds % 60)
        return f"{minutes}:{seconds:02d}"

    @property
    def development_time_seconds(self) -> Optional[int]:
        """
        Calculate C41 development time in seconds.
        
        Returns:
            Total seconds, or None if not C41
        """
        if self.chemistry_type.upper() != "C41":
            return None

        base_seconds = 210
        rolls_count = self.rolls_developed
        additional = rolls_count * 0.02 * base_seconds
        return int(base_seconds + additional)

    @property
    def development_time_formatted(self) -> Optional[str]:
        """
        Get formatted C41 development time.
        
        Returns:
            Formatted time string, or None if not C41
        """
        return self.calc_c41_dev_time()

    @property
    def is_active(self) -> bool:
        """
        Check if chemistry batch is still active.
        
        Returns:
            True if not retired, False otherwise
        """
        return self.date_retired is None

    def __repr__(self) -> str:
        return f"<ChemistryBatch(id={self.id}, name={self.name}, type={self.chemistry_type}, rolls={self.rolls_developed})>"
