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
      className={`
        bg-white rounded-lg shadow-md hover:shadow-lg
        p-3 mb-2 cursor-grab active:cursor-grabbing
        border border-gray-200 hover:border-film-cyan
        transition-all duration-200 ease-in-out
        touch-friendly
        ${isDragging ? 'opacity-50 shadow-2xl' : ''}
      `}
    >
      {/* Film Stock Name */}
      <div className="font-bold text-gray-900 text-base mb-2 leading-tight">
        {roll.film_stock_name}
      </div>

      {/* Format & Exposures */}
      <div className="text-sm text-gray-600 mb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1">
          <span className="text-gray-400">📸</span>
          {roll.film_format}
        </span>
        <span className="text-gray-400">•</span>
        <span>{roll.expected_exposures} exp</span>
        {roll.actual_exposures && roll.actual_exposures !== roll.expected_exposures && (
          <span className="text-film-amber font-medium">({roll.actual_exposures})</span>
        )}
      </div>

      {/* Order ID */}
      {roll.order_id && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 inline-block mb-3">
          Order #{roll.order_id}
        </div>
      )}

      {/* Not Mine Flag */}
      {roll.not_mine && (
        <div className="inline-flex items-center gap-1 px-2 py-1 mb-3 text-xs bg-film-cyan/10 text-film-cyan border border-film-cyan/30 rounded-full font-medium">
          👥 Friend's roll
        </div>
      )}

      {/* Dates */}
      {(roll.date_loaded || roll.date_unloaded) && (
        <div className="text-sm text-gray-700 mb-3 bg-gray-50 rounded px-3 py-2">
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span className="font-medium">{formatDate(roll.date_loaded)}</span>
            {roll.date_unloaded && (
              <>
                <span className="text-gray-400">→</span>
                <span className="font-medium">{formatDate(roll.date_unloaded)}</span>
              </>
            )}
          </div>
          {roll.duration_days !== null && roll.duration_days !== undefined && (
            <div className="text-xs text-gray-500 mt-1">
              {roll.duration_days} {roll.duration_days === 1 ? 'day' : 'days'} loaded
            </div>
          )}
        </div>
      )}

      {/* Costs */}
      {roll.total_cost !== null && (
        <div className="text-sm mb-3 bg-green-50 border border-green-200 rounded px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">💰 Total</span>
            <span className="font-bold text-green-700">{formatCost(roll.total_cost)}</span>
          </div>
          {roll.cost_per_shot !== null && (
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="text-gray-500">Per shot</span>
              <span className="text-gray-700">{formatCost(roll.cost_per_shot)}</span>
            </div>
          )}
        </div>
      )}

      {/* Chemistry */}
      {roll.chemistry_id && (
        <div className="text-sm text-gray-700 mb-3 bg-purple-50 border border-purple-200 rounded px-3 py-2 inline-flex items-center gap-2">
          <span>🧪</span>
          <span className="text-purple-700 font-medium">Developed</span>
        </div>
      )}

      {/* Push/Pull */}
      {roll.push_pull_stops !== null && roll.push_pull_stops !== 0 && (
        <div className="inline-flex items-center gap-1 px-2 py-1 mb-2 text-xs bg-film-red/10 text-film-red border border-film-red/30 rounded font-bold">
          ⚡ {roll.push_pull_stops > 0 ? '+' : ''}{roll.push_pull_stops} stop
        </div>
      )}

      {/* Rating */}
      {roll.stars && roll.stars > 0 && (
        <div className="text-xl mt-2 pt-2 border-t border-gray-200">
          {renderStars(roll.stars)}
        </div>
      )}

      {/* Notes preview */}
      {roll.notes && (
        <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100 italic line-clamp-2">
          💭 {roll.notes}
        </div>
      )}
    </div>
  );
};

export default FilmRollCard;
