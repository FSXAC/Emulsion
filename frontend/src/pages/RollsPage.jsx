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
import DatePickerModal from '../components/DatePickerModal';
import ChemistryPickerModal from '../components/ChemistryPickerModal';
import RatingModal from '../components/RatingModal';
import EditRollForm from '../components/EditRollForm';
import AddRollForm from '../components/AddRollForm';
import { getRolls, createRoll, updateRoll, deleteRoll, loadRoll, unloadRoll, assignChemistry, rateRoll } from '../services/rolls';

// Simple toast notification function
const showToast = (message, type = 'success') => {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium animate-slideIn ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('animate-slideOut');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
};

export default function RollsPage() {
  const [rolls, setRolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeRoll, setActiveRoll] = useState(null);
  
  // Modal states
  const [datePickerModal, setDatePickerModal] = useState({ isOpen: false, roll: null, action: null });
  const [chemistryModal, setChemistryModal] = useState({ isOpen: false, roll: null });
  const [ratingModal, setRatingModal] = useState({ isOpen: false, roll: null });
  const [editRollModal, setEditRollModal] = useState({ isOpen: false, roll: null });
  const [addRollModal, setAddRollModal] = useState({ isOpen: false });

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

    // Validate drop target
    if (!over) return;
    
    // Get the target status - check if it's a column or a card
    let targetStatus;
    if (over.data?.current?.type === 'status-column') {
      targetStatus = over.data.current.status;
    } else if (statusConfig.some(s => s.status === over.id)) {
      targetStatus = over.id;
    } else {
      // Dropped on a card or invalid target - don't do anything
      return;
    }

    const roll = rolls.find((r) => r.id === active.id);
    if (!roll || roll.status === targetStatus) return;

    try {
      let updatedRoll;

      // Determine if this is a forward or backward transition
      const statusOrder = ['NEW', 'LOADED', 'EXPOSED', 'DEVELOPED', 'SCANNED'];
      const currentIndex = statusOrder.indexOf(roll.status);
      const targetIndex = statusOrder.indexOf(targetStatus);
      const isBackward = targetIndex < currentIndex;
      const isForward = targetIndex > currentIndex;

      // Handle backward transitions (reset fields) - can jump to any previous status
      if (isBackward) {
        const fieldsToUpdate = {};
        
        // Reset fields based on target status
        if (targetIndex < statusOrder.indexOf('SCANNED')) {
          fieldsToUpdate.stars = null;
          fieldsToUpdate.actual_exposures = null;
        }
        if (targetIndex < statusOrder.indexOf('DEVELOPED')) {
          fieldsToUpdate.chemistry_id = null;
        }
        if (targetIndex < statusOrder.indexOf('EXPOSED')) {
          fieldsToUpdate.date_unloaded = null;
        }
        if (targetIndex < statusOrder.indexOf('LOADED')) {
          fieldsToUpdate.date_loaded = null;
        }

        // Use updateRoll to clear fields
        const { updateRoll } = await import('../services/rolls');
        updatedRoll = await updateRoll(roll.id, fieldsToUpdate);
      } else if (isForward) {
        // Forward transitions - only allow sequential moves (one step at a time)
        if (targetIndex - currentIndex > 1) {
          showToast('⚠️ Please move rolls one status at a time in the forward direction', 'error');
          return;
        }

        // Handle forward transitions - show modals for user input
        switch (targetStatus) {
          case 'LOADED':
            // Show date picker modal for load date
            setDatePickerModal({ isOpen: true, roll, action: 'load' });
            return;

          case 'EXPOSED':
            // Show date picker modal for unload date
            setDatePickerModal({ isOpen: true, roll, action: 'unload' });
            return;

          case 'DEVELOPED':
            // Show chemistry picker modal
            setChemistryModal({ isOpen: true, roll });
            return;

          case 'SCANNED':
            // Show rating modal
            setRatingModal({ isOpen: true, roll });
            return;

          default:
            return;
        }
      }

      // Update local state with the updated roll
      setRolls((prevRolls) =>
        prevRolls.map((r) => (r.id === updatedRoll.id ? updatedRoll : r))
      );
      
      // Show success message
      const statusMessages = {
        'NEW': '🎞️ Roll reset to NEW',
        'LOADED': '📷 Roll marked as LOADED',
        'EXPOSED': '✅ Roll marked as EXPOSED',
        'DEVELOPED': '🧪 Roll marked as DEVELOPED',
        'SCANNED': '⭐ Roll marked as SCANNED'
      };
      showToast(statusMessages[updatedRoll.status] || 'Roll updated successfully');
    } catch (err) {
      console.error('Failed to update roll status:', err);
      showToast(`Failed to update roll: ${err.message}`, 'error');
      // Optionally refresh to ensure UI is in sync
      fetchRolls();
    }
  };

  // Handle date picker confirmation
  const handleDateConfirm = async (selectedDate) => {
    const { roll, action } = datePickerModal;
    if (!roll || !action) return;

    try {
      let updatedRoll;
      if (action === 'load') {
        updatedRoll = await loadRoll(roll.id, selectedDate);
        showToast(`📷 Roll loaded on ${selectedDate}`);
      } else if (action === 'unload') {
        updatedRoll = await unloadRoll(roll.id, selectedDate);
        showToast(`✅ Roll unloaded on ${selectedDate}`);
      }

      // Update local state
      setRolls((prevRolls) =>
        prevRolls.map((r) => (r.id === updatedRoll.id ? updatedRoll : r))
      );
    } catch (err) {
      console.error('Failed to update date:', err);
      showToast(`Failed to update roll: ${err.message}`, 'error');
    }
  };

  // Handle chemistry picker confirmation
  const handleChemistryConfirm = async (chemistryId) => {
    const { roll } = chemistryModal;
    if (!roll) return;

    try {
      await assignChemistry(roll.id, chemistryId);
      
      // Refresh all rolls to update cost calculations
      // (chemistry cost is amortized across all rolls using that batch)
      await fetchRolls();
      
      showToast('🧪 Chemistry batch assigned successfully');
    } catch (err) {
      console.error('Failed to assign chemistry:', err);
      showToast(`Failed to assign chemistry: ${err.message}`, 'error');
    }
  };

  // Handle rating confirmation
  const handleRatingConfirm = async (stars, actualExposures) => {
    const { roll } = ratingModal;
    if (!roll) return;

    try {
      const updatedRoll = await rateRoll(roll.id, stars, actualExposures);
      
      // Update local state
      setRolls((prevRolls) =>
        prevRolls.map((r) => (r.id === updatedRoll.id ? updatedRoll : r))
      );
      
      showToast(`⭐ Roll rated ${stars} star${stars !== 1 ? 's' : ''}`);
    } catch (err) {
      console.error('Failed to rate roll:', err);
      showToast(`Failed to rate roll: ${err.message}`, 'error');
    }
  };

  // Handle card click to edit roll
  const handleCardClick = (roll) => {
    setEditRollModal({ isOpen: true, roll });
  };

  // Handle edit roll form submission
  const handleEditRoll = async (rollId, formData) => {
    try {
      const updatedRoll = await updateRoll(rollId, formData);
      
      // Update local state
      setRolls((prevRolls) =>
        prevRolls.map((r) => (r.id === updatedRoll.id ? updatedRoll : r))
      );
      
      showToast('✏️ Roll updated successfully');
    } catch (err) {
      console.error('Failed to update roll:', err);
      showToast(`Failed to update roll: ${err.message}`, 'error');
      throw err; // Re-throw to let form handle it
    }
  };

  // Handle delete roll
  const handleDeleteRoll = async (rollId) => {
    try {
      await deleteRoll(rollId);
      
      // Remove from local state
      setRolls((prevRolls) => prevRolls.filter((r) => r.id !== rollId));
      
      showToast('🗑️ Roll deleted successfully');
    } catch (err) {
      console.error('Failed to delete roll:', err);
      showToast(`Failed to delete roll: ${err.message}`, 'error');
      throw err; // Re-throw to let form handle it
    }
  };

  // Handle add roll form submission
  const handleAddRoll = async (formData) => {
    try {
      const newRoll = await createRoll(formData);
      
      // Add to local state
      setRolls((prevRolls) => [...prevRolls, newRoll]);
      
      showToast('🎞️ Roll added successfully');
    } catch (err) {
      console.error('Failed to create roll:', err);
      showToast(`Failed to create roll: ${err.message}`, 'error');
      throw err; // Re-throw to let form handle it
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
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Film Rolls</h2>
          <p className="text-sm text-gray-500">
            Drag rolls between columns to update their status
          </p>
        </div>
        <button 
          onClick={() => setAddRollModal({ isOpen: true })}
          className="btn-primary"
        >
          + Add Roll
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-2">
          {statusConfig.map(({ status, displayName, icon }) => (
            <StatusColumn
              key={status}
              status={status}
              displayName={displayName}
              icon={icon}
              rolls={rollsByStatus[status]}
              onCardClick={handleCardClick}
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

      {/* Modals */}
      <DatePickerModal
        isOpen={datePickerModal.isOpen}
        onClose={() => setDatePickerModal({ isOpen: false, roll: null, action: null })}
        onConfirm={handleDateConfirm}
        title={datePickerModal.action === 'load' ? 'Load Roll' : 'Unload Roll'}
        defaultDate={
          datePickerModal.action === 'load' 
            ? datePickerModal.roll?.date_loaded 
            : datePickerModal.roll?.date_unloaded
        }
      />

      <ChemistryPickerModal
        isOpen={chemistryModal.isOpen}
        onClose={() => setChemistryModal({ isOpen: false, roll: null })}
        onConfirm={handleChemistryConfirm}
        roll={chemistryModal.roll}
      />

      <RatingModal
        isOpen={ratingModal.isOpen}
        onClose={() => setRatingModal({ isOpen: false, roll: null })}
        onConfirm={handleRatingConfirm}
        roll={ratingModal.roll}
      />

      <EditRollForm
        isOpen={editRollModal.isOpen}
        onClose={() => setEditRollModal({ isOpen: false, roll: null })}
        onSubmit={handleEditRoll}
        onDelete={handleDeleteRoll}
        roll={editRollModal.roll}
      />

      <AddRollForm
        isOpen={addRollModal.isOpen}
        onClose={() => setAddRollModal({ isOpen: false })}
        onSubmit={handleAddRoll}
      />
    </div>
  );
}
