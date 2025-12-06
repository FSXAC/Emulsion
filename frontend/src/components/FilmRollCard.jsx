import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const FilmRollCard = ({ roll, onClick }) => {
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

  const handleClick = (e) => {
    // Only trigger onClick if not currently dragging
    if (!isDragging && onClick) {
      onClick(roll);
    }
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

  // Calculate cost per shot if not provided by backend
  const calculateCostPerShot = () => {
    // Use backend value if available
    if (roll.cost_per_shot !== null && roll.cost_per_shot !== undefined) {
      return roll.cost_per_shot;
    }
    
    // Calculate on frontend
    const exposures = roll.actual_exposures || roll.expected_exposures;
    if (!exposures || exposures === 0) return null;
    
    const filmCost = roll.film_cost || 0;
    const devCost = roll.dev_cost || 0;
    
    // For "not mine" rolls, only count dev cost
    const totalCost = roll.not_mine ? devCost : (filmCost + devCost);
    
    if (totalCost === 0) return null;
    
    return totalCost / exposures;
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
      onClick={handleClick}
      className={`
        bg-white rounded-2xl shadow-sm hover:shadow-md
        p-2 mb-2 cursor-grab active:cursor-grabbing
        border border-[#D9D9D9] hover:border-film-cyan
        transition-all duration-200 ease-in-out
        w-[300px]
        ${isDragging ? 'opacity-50 shadow-2xl' : ''}
      `}
    >
      {/* Top Section: Thumbnail + Film Info */}
      <div className="flex gap-2 mb-2">
        {/* Left: Film Thumbnail Placeholder */}
        <div className="flex-shrink-0 w-24 h-28 bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
          {roll.film_format === '35mm' ? '📷' : '🎞️'}
        </div>

        {/* Right: Film Info Block */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex flex-col gap-0">
            {/* Film Stock Name */}
            <div className="font-bold text-gray-900 text-base leading-tight">
              {roll.film_stock_name}
            </div>

            {/* Format + Exposures */}
            <div className="text-xs text-gray-600 flex items-center gap-1.5">
            <span>{roll.film_format}</span>
            <span className="text-gray-400">•</span>
            <span>{roll.expected_exposures} exp</span>
            {roll.actual_exposures && roll.actual_exposures !== roll.expected_exposures && (
              <span className={`font-bold ${roll.actual_exposures >= roll.expected_exposures ? 'text-green-600' : 'text-orange-600'}`}>
              ({roll.actual_exposures})
              </span>
            )}
            </div>

            {/* Order Tag & Not Mine Flag Row */}
            {(roll.order_id || roll.not_mine) && (
              <div className="flex items-center gap-2 flex-wrap mt-1">
                {roll.order_id && (
                  <div className="text-[11px] text-gray-700 bg-gray-100 rounded px-2 py-1">
                    Order #{roll.order_id}
                  </div>
                )}
                {roll.not_mine && (
                  <div className="text-[11px] text-gray-700 bg-gray-100 rounded px-2 py-1">
                    👥 Friend's
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rating + Push/Pull Row */}
          <div className="flex items-center justify-between">
            {/* Left: Star Rating */}
            <div className="flex items-center gap-0.5 text-base">
              {roll.stars > 0 ? (
                <>
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className='text-gray-800'>
                      {i < roll.stars ? '★' : '•'}
                    </span>
                  ))}
                </>
              ) : (
                <span className="text-gray-400 text-xs">Unrated</span>
              )}
            </div>

            {/* Right: Push/Pull Tag */}
            {roll.push_pull_stops && Math.abs(roll.push_pull_stops) > 0 && (
              <div className="text-[11px] text-gray-700 bg-gray-100 rounded px-2 py-1">
                {roll.push_pull_stops > 0 ? '+' : ''}{roll.push_pull_stops} ⚡
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cost + Date Stats Block */}
      <div className="bg-gray-50 rounded-xl px-2 py-2 mb-2 space-y-2">
        {/* Top Row: Dates + Per Shot Cost */}
        {(roll.date_loaded || roll.date_unloaded || calculateCostPerShot() !== null) && (
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-800">
              {roll.date_loaded && roll.date_unloaded ? (
                <>
                  <span className="font-bold">{formatDate(roll.date_loaded)}</span>
                  <span className="text-xs text-gray-500 font-normal mx-1">→</span>
                  <span className="font-bold">{formatDate(roll.date_unloaded)}</span>
                </>
              ) : roll.date_loaded ? (
                <span className="font-bold">{formatDate(roll.date_loaded)}</span>
              ) : (
                <span className="text-gray-400">No dates</span>
              )}
            </div>
            {calculateCostPerShot() !== null && (
              <div className="font-semibold text-gray-800">
                {formatCost(calculateCostPerShot())} <span className="text-xs text-gray-500 font-normal">per shot</span>
              </div>
            )}
          </div>
        )}

        {/* Second Row: Days Loaded + Cost Breakdown */}
        {(roll.duration_days !== null || roll.film_cost !== null || roll.dev_cost !== null) && (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>
              {roll.duration_days !== null && roll.duration_days !== undefined ? (
                <>
                  {roll.duration_days} {roll.duration_days === 1 ? 'day' : 'days'} loaded
                </>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </div>
            {(roll.film_cost !== null || roll.dev_cost !== null) && (
              <div>
                {roll.film_cost !== null && `${formatCost(roll.film_cost)} film`}
                {roll.film_cost !== null && roll.dev_cost !== null && ' + '}
                {roll.dev_cost !== null && `${formatCost(roll.dev_cost)} dev`}
              </div>
            )}
          </div>
        )}

        {/* Show total cost if dates/breakdown aren't present */}
        {roll.total_cost !== null && calculateCostPerShot() === null && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total</span>
            <span className="font-bold text-gray-800">{formatCost(roll.total_cost)}</span>
          </div>
        )}
      </div>

      {/* Comments Block */}
      {roll.notes && (
        <div className="bg-gray-50 rounded-xl px-2 py-2 text-xs text-gray-600 italic leading-relaxed">
          {roll.notes}
        </div>
      )}
    </div>
  );
};

export default FilmRollCard;
