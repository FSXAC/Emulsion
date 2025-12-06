import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import FilmRollCard from './FilmRollCard';

const StatusColumn = ({ status, rolls, displayName, icon }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div className="flex-1 min-w-[300px]">
      {/* Column Header */}
      <div className="mb-4 px-4 py-3 bg-gradient-to-r from-gray-50 to-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <h3 className="font-bold text-gray-900 text-lg">{displayName}</h3>
          </div>
          <span className="text-sm font-semibold text-white bg-gray-700 px-3 py-1 rounded-full min-w-[2rem] text-center">
            {rolls.length}
          </span>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`
          min-h-[500px] p-4 rounded-xl transition-all duration-200
          ${isOver 
            ? 'bg-film-cyan/20 border-2 border-film-cyan border-dashed shadow-lg scale-[1.02]' 
            : 'bg-gray-50 border-2 border-gray-200 border-dashed'
          }
        `}
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
