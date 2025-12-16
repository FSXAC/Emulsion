import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import FilmRollCard from './FilmRollCard';
import Icon from './Icon';

const StatusColumn = ({ status, rolls, totalCount, hasMore, onLoadMore, displayName, icon, onCardClick, isMobile = false }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: 'status-column',
      status: status,
    },
  });

  return (
    <div className="flex-1 min-w-full md:min-w-[280px] flex flex-col">
      {/* Column Header - DROP ZONE */}
      <div 
        ref={setNodeRef}
        className={`
          mb-2 px-4 py-3 rounded-2xl shadow-md border-2 transition-all duration-200 cursor-pointer
          min-h-[68px] flex flex-col justify-center touch-friendly
          ${isOver 
            ? 'bg-film-orange-600 border-film-orange-600 shadow-2xl ring-4 ring-film-orange-600/30'
            : 'bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-lg'
          }`}>
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-lg ${
                isOver ? 'bg-white/20 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm'
              }`}>
                <Icon name={icon} size={18} />
              </span>
              <h3 className={`font-bold uppercase tracking-wider text-sm ${
                isOver ? 'text-white' : 'text-gray-700 dark:text-gray-200'
              }`}>
                {displayName}
              </h3>
            </div>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full min-w-[2rem] text-center ${
              isOver ? 'bg-white text-film-orange-600' : 'text-white bg-gray-700 dark:bg-gray-600'
            }`}>
            {totalCount}
          </span>
        </div>
      </div>

      {/* Cards Area (NOT a drop zone) */}
      <div
        className="flex-1 min-h-[200px] md:min-h-[400px] p-2 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <SortableContext
          items={rolls.map((roll) => roll.id)}
          strategy={verticalListSortingStrategy}
        >
          {rolls.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 py-16">
              <div className="mb-3 opacity-30 flex justify-center">
                <Icon name={icon} size={64} />
              </div>
              <div className="text-sm font-medium">No rolls here</div>
              <div className="text-xs mt-1">Drag rolls to this column</div>
            </div>
          ) : (
            <>
              {rolls.map((roll) => <FilmRollCard key={roll.id} roll={roll} onClick={onCardClick} isMobile={isMobile} />)}
              
              {hasMore && (
                <button
                  onClick={onLoadMore}
                  className="mt-3 w-full py-2 px-4 bg-film-orange-600 hover:bg-film-orange-700 dark:bg-film-orange-600/90 dark:hover:bg-film-orange-600/80 text-white font-medium rounded-lg transition-colors duration-200 text-sm"
                >
                  Load More ({totalCount - rolls.length} more)
                </button>
              )}
            </>
          )}
        </SortableContext>
      </div>
    </div>
  );
};

export default StatusColumn;
