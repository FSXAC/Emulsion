"""Film roll database model."""

from datetime import date
from decimal import Decimal
from typing import Optional

from sqlalchemy import Boolean, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class FilmRoll(Base, TimestampMixin):
    """
    Film roll model tracking lifecycle from purchase to scanning.
    
    Status is derived from field presence:
    - NEW: no dates, no chemistry, no stars
    - LOADED: has date_loaded, no date_unloaded
    - EXPOSED: has date_unloaded, no chemistry_id
    - DEVELOPED: has chemistry_id, no stars
    - SCANNED: has stars rating
    """

    __tablename__ = "film_rolls"

    # Primary key
    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_uuid
    )

    # Core metadata
    order_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    film_stock_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    film_format: Mapped[str] = mapped_column(String(50), nullable=False)
    expected_exposures: Mapped[int] = mapped_column(Integer, nullable=False)
    actual_exposures: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Lifecycle dates
    date_loaded: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    date_unloaded: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Processing details
    push_pull_stops: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(3, 1), nullable=True
    )
    chemistry_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("chemistry_batches.id"), nullable=True, index=True
    )

    # Rating and cost
    stars: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    film_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # Flags and notes
    not_mine: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    chemistry: Mapped[Optional["ChemistryBatch"]] = relationship(
        "ChemistryBatch", back_populates="rolls"
    )

    @property
    def status(self) -> str:
        """
        Derive status from field presence (flexible, not enforced).
        
        Returns:
            Status string: NEW, LOADED, EXPOSED, DEVELOPED, or SCANNED
        """
        if self.stars is not None:
            return "SCANNED"
        if self.chemistry_id is not None:
            return "DEVELOPED"
        if self.date_unloaded is not None:
            return "EXPOSED"
        if self.date_loaded is not None:
            return "LOADED"
        return "NEW"

    @property
    def dev_cost(self) -> Optional[Decimal]:
        """
        Calculate development cost from chemistry batch.
        
        Returns:
            Cost per roll from chemistry batch, or None if no chemistry or division by zero
        """
        if self.chemistry is None:
            return None
        return self.chemistry.cost_per_roll

    @property
    def total_cost(self) -> Optional[Decimal]:
        """
        Calculate total cost (film + development).
        
        For "not mine" rolls, only includes dev_cost (user doesn't pay for friend's film).
        
        Returns:
            Total cost, or None if dev_cost is None
        """
        if self.dev_cost is None:
            return None
        
        if self.not_mine:
            # For friend's rolls, only count chemistry cost
            return self.dev_cost
        
        return self.film_cost + self.dev_cost

    @property
    def cost_per_shot(self) -> Optional[Decimal]:
        """
        Calculate cost per exposure.
        
        Returns:
            Cost per shot, or None if total_cost is None or actual_exposures is 0/None
        """
        if self.total_cost is None or not self.actual_exposures:
            return None
        return self.total_cost / Decimal(self.actual_exposures)

    @property
    def duration_days(self) -> Optional[int]:
        """
        Calculate days the roll was loaded in camera.
        
        Returns:
            Number of days between date_loaded and date_unloaded, or None if either is missing
        """
        if self.date_loaded is None or self.date_unloaded is None:
            return None
        return (self.date_unloaded - self.date_loaded).days

    def __repr__(self) -> str:
        return f"<FilmRoll(id={self.id}, film_stock={self.film_stock_name}, status={self.status})>"
