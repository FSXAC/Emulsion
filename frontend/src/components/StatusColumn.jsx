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
    <div className="flex-1 min-w-[280px]">
      {/* Column Header */}
      <div className="mb-4 px-3 py-2 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <h3 className="font-semibold text-gray-900">{displayName}</h3>
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {rolls.length}
          </span>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`status-column p-3 rounded-lg transition-colors ${
          isOver ? 'bg-film-cyan/10 border-2 border-film-cyan border-dashed' : ''
        }`}
      >
        <SortableContext
          items={rolls.map((roll) => roll.id)}
          strategy={verticalListSortingStrategy}
        >
          {rolls.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <div className="text-4xl mb-2">{icon}</div>
              <div className="text-sm">No rolls here</div>
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
