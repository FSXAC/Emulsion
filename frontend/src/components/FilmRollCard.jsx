import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getFilmStockImage } from '../utils/filmStockImages';
import Icon from './Icon';

const FilmRollCard = ({ roll, onClick, isMobile = false }) => {
  const [hoveringDates, setHoveringDates] = useState(false);
  const [hoveringCost, setHoveringCost] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: roll.id, disabled: isMobile });

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

    // Calculate on frontend otherwise
    const exposures = roll.actual_exposures || roll.expected_exposures;
    if (!exposures || exposures === 0) return null;

    // Parse costs as numbers, handling string values
    const filmCost = typeof roll.film_cost === 'string' ? parseFloat(roll.film_cost) || 0 : roll.film_cost || 0;
    const devCost = typeof roll.dev_cost === 'string' ? parseFloat(roll.dev_cost) || 0 : roll.dev_cost || 0;

    // For "not mine" rolls, only count dev cost
    const totalCost = roll.not_mine ? devCost : (filmCost + devCost);

    if (totalCost === 0) return null;

    const costPerShot = totalCost / exposures;

    // Safety check for NaN
    if (isNaN(costPerShot)) return null;

    return costPerShot;
  };


  // Render star rating
  // const renderStars = (stars) => {
  //   if (!stars || stars === 0) return null;
  //   return '⭐'.repeat(stars);
  // };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isMobile ? {} : attributes)}
      {...(isMobile ? {} : listeners)}
      onClick={handleClick}
      className={`
        bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md
        p-2 mb-2 ${isMobile ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}
        border border-[#D9D9D9] dark:border-gray-700 hover:border-film-cyan dark:hover:border-film-cyan
        transition-all duration-200 ease-in-out
        ${isDragging ? 'opacity-50 shadow-2xl' : ''}
      `}
    >
      {/* Top Section: Thumbnail + Film Info */}
      <div className="flex gap-2 mb-2">
        {/* Left: Film Thumbnail */}
        <div className="flex-shrink-0 w-20 h-28 p-0 pl-0 overflow-hidden">
          <img
            src={getFilmStockImage(roll.film_stock_name, roll.film_format)}
            alt={roll.film_stock_name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right: Film Info Block */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex flex-col gap-0">
            {/* Film Stock Name */}
            <div className="font-bold text-gray-900 dark:text-gray-100 text-base leading-tight">
              {roll.film_stock_name}
            </div>

            {/* Format + Exposures */}
            <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
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
                  <div className="text-[11px] text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
                    Order #{roll.order_id}
                  </div>
                )}
                {roll.not_mine && (
                  <div className="text-[11px] text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 flex items-center gap-1">
                    <Icon name="users" size={12} /> Friend's
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rating + Push/Pull Row */}
          <div className="flex items-center justify-between">
            {/* Left: Star Rating */}
            {roll.stars > 0 && (
              <div className="flex items-center gap-0.5 text-base">
                {Array.from({ length: 5 }, (_, i) => (
                  <Icon 
                    key={i} 
                    name="star" 
                    size={16}
                    className={`${i < roll.stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                  />
                ))}
              </div>
            )}

            {/* Spacer when no stars to keep push/pull aligned right */}
            {!roll.stars && <div />}

            {/* Right: Push/Pull Tag */}
            {roll.push_pull_stops && Math.abs(roll.push_pull_stops) > 0 && (
              <div className="text-[11px] text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 flex items-center gap-1">
                {roll.push_pull_stops > 0 ? '+' : ''}{roll.push_pull_stops} <Icon name="zap" size={12} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cost + Date Stats Block */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-2 py-2 mb-2">
        {/* Top Row: Dates + Per Shot Cost */}
        {(roll.date_loaded || roll.date_unloaded || calculateCostPerShot() !== null) && (
          <div className="flex items-center justify-between text-sm">
            {/* Dates Section with Hover Effect */}
            {(roll.date_loaded || roll.date_unloaded) ? (
              <div 
                className="relative text-gray-800 dark:text-gray-200 flex-1 min-w-0"
                onMouseEnter={() => setHoveringDates(true)}
                onMouseLeave={() => setHoveringDates(false)}
              >
                {/* Invisible placeholder to maintain height */}
                <div className="invisible whitespace-nowrap">
                  {roll.date_loaded && roll.date_unloaded ? (
                    <>
                      <span className="font-bold">{formatDate(roll.date_loaded)}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-normal mx-1">→</span>
                      <span className="font-bold">{formatDate(roll.date_unloaded)}</span>
                    </>
                  ) : roll.date_loaded ? (
                    <span className="font-bold">{formatDate(roll.date_loaded)}</span>
                  ) : null}
                </div>
                
                {/* Dates View */}
                <div 
                  className={`absolute inset-0 transition-opacity duration-300 whitespace-nowrap ${
                    hoveringDates && roll.duration_days !== null && roll.duration_days !== undefined 
                      ? 'opacity-0' 
                      : 'opacity-100'
                  }`}
                >
                  {roll.date_loaded && roll.date_unloaded ? (
                    <>
                      <span className="font-bold">{formatDate(roll.date_loaded)}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-normal mx-1">→</span>
                      <span className="font-bold">{formatDate(roll.date_unloaded)}</span>
                    </>
                  ) : roll.date_loaded ? (
                    <span className="font-bold">{formatDate(roll.date_loaded)}</span>
                  ) : null}
                </div>
                
                {/* Days Loaded View (shown on hover) */}
                {roll.duration_days !== null && roll.duration_days !== undefined && (
                  <div 
                    className={`absolute inset-0 transition-opacity duration-300 whitespace-nowrap overflow-hidden text-ellipsis ${
                      hoveringDates ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                      {roll.duration_days} {roll.duration_days === 1 ? 'day' : 'days'} loaded
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* Cost Per Shot Section with Hover Effect */}
            {calculateCostPerShot() !== null && (
              <div 
                className="relative font-semibold text-gray-800 dark:text-gray-200 flex-shrink-0 ml-2 flex items-center"
                onMouseEnter={() => setHoveringCost(true)}
                onMouseLeave={() => setHoveringCost(false)}
              >
                {/* Invisible placeholder to maintain height */}
                <div className="invisible whitespace-nowrap">
                  {formatCost(calculateCostPerShot())} <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">per shot</span>
                </div>
                
                {/* Cost Per Shot View */}
                <div 
                  className={`absolute inset-y-0 right-0 flex items-center transition-opacity duration-300 whitespace-nowrap ${
                    hoveringCost && (roll.film_cost !== null || roll.dev_cost !== null) ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  {formatCost(calculateCostPerShot())} <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">per shot</span>
                </div>
                
                {/* Cost Breakdown View (shown on hover) */}
                {(roll.film_cost !== null || roll.dev_cost !== null) && (
                  <div 
                    className={`absolute inset-y-0 right-0 flex items-center transition-opacity duration-300 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 font-normal ${
                      hoveringCost ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {roll.film_cost !== null && `${formatCost(roll.film_cost)} film`}
                    {roll.film_cost !== null && roll.dev_cost !== null && ' + '}
                    {roll.dev_cost !== null && `${formatCost(roll.dev_cost)} dev`}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comments Block */}
      {roll.notes && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-2 py-2 text-xs text-gray-600 dark:text-gray-400 italic leading-relaxed">
          {roll.notes}
        </div>
      )}
    </div>
  );
};

export default FilmRollCard;
