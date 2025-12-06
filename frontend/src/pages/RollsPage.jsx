import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import StatusColumn from '../components/StatusColumn';
import FilmRollCard from '../components/FilmRollCard';
import { getRolls, loadRoll, unloadRoll, assignChemistry, rateRoll } from '../services/rolls';

export default function RollsPage() {
  const [rolls, setRolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeRoll, setActiveRoll] = useState(null);

  // Status configuration
  const statusConfig = [
    { status: 'NEW', displayName: 'New', icon: '🎞️' },
    { status: 'LOADED', displayName: 'Loaded', icon: '📷' },
    { status: 'EXPOSED', displayName: 'Exposed', icon: '✅' },
    { status: 'DEVELOPED', displayName: 'Developed', icon: '🧪' },
    { status: 'SCANNED', displayName: 'Scanned', icon: '⭐' },
  ];

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms press before drag on touch
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch rolls on mount
  useEffect(() => {
    fetchRolls();
  }, []);

  const fetchRolls = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRolls();
      // Handle different response formats
      if (Array.isArray(data)) {
        setRolls(data);
      } else if (data.rolls && Array.isArray(data.rolls)) {
        setRolls(data.rolls);
      } else if (data.items && Array.isArray(data.items)) {
        setRolls(data.items);
      } else {
        console.error('Unexpected API response format:', data);
        setRolls([]);
      }
    } catch (err) {
      console.error('Failed to fetch rolls:', err);
      setError(err.message || 'Failed to load film rolls');
    } finally {
      setLoading(false);
    }
  };

  // Group rolls by status
  const rollsByStatus = statusConfig.reduce((acc, { status }) => {
    acc[status] = rolls.filter((roll) => roll.status === status);
    return acc;
  }, {});

  // Handle drag start
  const handleDragStart = (event) => {
    const { active } = event;
    const roll = rolls.find((r) => r.id === active.id);
    setActiveRoll(roll);
  };

  // Handle drag end
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveRoll(null);

    if (!over || active.id === over.id) return;

    const roll = rolls.find((r) => r.id === active.id);
    const targetStatus = over.id;

    if (!roll || roll.status === targetStatus) return;

    try {
      let updatedRoll;

      // Trigger appropriate API call based on target status
      switch (targetStatus) {
        case 'LOADED':
          // Set date_loaded to today
          updatedRoll = await loadRoll(roll.id, new Date().toISOString().split('T')[0]);
          break;

        case 'EXPOSED':
          // Set date_unloaded to today
          updatedRoll = await unloadRoll(roll.id, new Date().toISOString().split('T')[0]);
          break;

        case 'DEVELOPED':
          // TODO: Show chemistry picker modal
          // For now, we'll skip this transition (requires chemistry_id)
          console.log('Chemistry assignment requires modal - not implemented yet');
          return;

        case 'SCANNED':
          // TODO: Show rating modal
          // For now, set default 3 stars
          updatedRoll = await rateRoll(roll.id, 3);
          break;

        default:
          return;
      }

      // Update local state with the updated roll
      setRolls((prevRolls) =>
        prevRolls.map((r) => (r.id === updatedRoll.id ? updatedRoll : r))
      );
    } catch (err) {
      console.error('Failed to update roll status:', err);
      alert(`Failed to update roll: ${err.message}`);
      // Optionally refresh to ensure UI is in sync
      fetchRolls();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-500">Loading rolls...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold mb-2">Error loading rolls</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={fetchRolls} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Film Rolls</h2>
          <p className="text-gray-600 mt-1">
            Drag rolls between columns to update their status
          </p>
        </div>
        <button className="btn-primary">+ Add Roll</button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-6 px-2">
          {statusConfig.map(({ status, displayName, icon }) => (
            <StatusColumn
              key={status}
              status={status}
              displayName={displayName}
              icon={icon}
              rolls={rollsByStatus[status]}
            />
          ))}
        </div>

        <DragOverlay>
          {activeRoll ? (
            <div className="opacity-90 rotate-2 scale-105 shadow-2xl">
              <FilmRollCard roll={activeRoll} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
