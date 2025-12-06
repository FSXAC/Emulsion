import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import FilmRollCard from './FilmRollCard';

const StatusColumn = ({ status, rolls, displayName, icon }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: 'status-column',
      status: status,
    },
  });

  return (
    <div className="flex-1 min-w-[300px] flex flex-col">
      {/* Column Header - DROP ZONE */}
      <div 
        ref={setNodeRef}
        className={`
          mb-4 px-6 py-4 rounded-lg shadow-md border-2 transition-all duration-200 cursor-pointer
          min-h-[80px] flex flex-col justify-center
          ${isOver 
            ? 'bg-film-cyan border-film-cyan shadow-2xl ring-4 ring-film-cyan/30' 
            : 'bg-gradient-to-r from-gray-100 to-gray-50 border-gray-300 hover:border-gray-400 hover:shadow-lg'
          }
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <div>
              <h3 className={`font-bold text-lg ${isOver ? 'text-white' : 'text-gray-900'}`}>
                {displayName}
              </h3>
              <p className={`text-xs ${isOver ? 'text-white/90' : 'text-gray-500'}`}>
                {isOver ? '✓ Drop here to move roll' : 'Drop zone'}
              </p>
            </div>
          </div>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full min-w-[2rem] text-center ${
            isOver ? 'bg-white text-film-cyan' : 'text-white bg-gray-700'
          }`}>
            {rolls.length}
          </span>
        </div>
      </div>

      {/* Cards Area (NOT a drop zone) */}
      <div
        className="flex-1 min-h-[500px] p-4 rounded-xl bg-white border border-gray-200"
      >
        <SortableContext
          items={rolls.map((roll) => roll.id)}
          strategy={verticalListSortingStrategy}
        >
          {rolls.length === 0 ? (
            <div className="text-center text-gray-400 py-16">
              <div className="text-6xl mb-3 opacity-30">{icon}</div>
              <div className="text-sm font-medium">No rolls here</div>
              <div className="text-xs mt-1">Drag rolls to this column</div>
            </div>
          ) : (
            rolls.map((roll) => <FilmRollCard key={roll.id} roll={roll} />)
          )}
        </SortableContext>
      </div>
    </div>
  );
};

export default StatusColumn;
