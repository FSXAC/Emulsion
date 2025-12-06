import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const FilmRollCard = ({ roll }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: roll.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Format cost helper
  const formatCost = (cost) => {
    if (cost === null || cost === undefined) return 'N/A';
    const numCost = typeof cost === 'string' ? parseFloat(cost) : cost;
    return `$${numCost.toFixed(2)}`;
  };

  // Render star rating
  const renderStars = (stars) => {
    if (!stars || stars === 0) return null;
    return '⭐'.repeat(stars);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="film-card touch-friendly mb-3"
    >
      {/* Film Stock Name */}
      <div className="font-semibold text-gray-900 mb-1">
        {roll.film_stock_name}
      </div>

      {/* Format & Exposures */}
      <div className="text-sm text-gray-600 mb-2">
        {roll.film_format} • {roll.expected_exposures} exp
        {roll.actual_exposures && roll.actual_exposures !== roll.expected_exposures && (
          <span className="text-film-amber"> ({roll.actual_exposures} actual)</span>
        )}
      </div>

      {/* Order ID */}
      {roll.order_id && (
        <div className="text-xs text-gray-500 mb-2">
          Order #{roll.order_id}
        </div>
      )}

      {/* Not Mine Flag */}
      {roll.not_mine && (
        <div className="inline-block px-2 py-1 mb-2 text-xs bg-film-cyan text-white rounded">
          👥 Friend's roll
        </div>
      )}

      {/* Dates */}
      {(roll.date_loaded || roll.date_unloaded) && (
        <div className="text-sm text-gray-700 mb-2">
          📅 {formatDate(roll.date_loaded)}
          {roll.date_unloaded && ` → ${formatDate(roll.date_unloaded)}`}
          {roll.duration_days !== null && roll.duration_days !== undefined && (
            <span className="text-xs text-gray-500"> ({roll.duration_days}d)</span>
          )}
        </div>
      )}

      {/* Costs */}
      {roll.total_cost !== null && (
        <div className="text-sm text-gray-700 mb-2">
          💰 {formatCost(roll.total_cost)}
          {roll.cost_per_shot !== null && (
            <span className="text-gray-600"> • {formatCost(roll.cost_per_shot)}/shot</span>
          )}
        </div>
      )}

      {/* Chemistry */}
      {roll.chemistry_id && (
        <div className="text-sm text-gray-700 mb-2">
          🧪 Chemistry batch
        </div>
      )}

      {/* Push/Pull */}
      {roll.push_pull_stops !== null && roll.push_pull_stops !== 0 && (
        <div className="text-xs text-film-red font-semibold">
          {roll.push_pull_stops > 0 ? '+' : ''}{roll.push_pull_stops} stop
        </div>
      )}

      {/* Rating */}
      {roll.stars && roll.stars > 0 && (
        <div className="text-lg mt-2">
          {renderStars(roll.stars)}
        </div>
      )}

      {/* Notes preview */}
      {roll.notes && (
        <div className="text-xs text-gray-500 mt-2 italic truncate">
          {roll.notes}
        </div>
      )}
    </div>
  );
};

export default FilmRollCard;
