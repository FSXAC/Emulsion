import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import Icon from '../components/Icon';
import ChemistryPickerModal from '../components/ChemistryPickerModal';
import RatingModal from '../components/RatingModal';
import EditRollForm from '../components/EditRollForm';
import AddRollForm from '../components/AddRollForm';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import SearchBar from '../components/SearchBar';
import SearchHelpModal from '../components/SearchHelpModal';
import ActiveFilters from '../components/ActiveFilters';
import { getRolls, createRoll, updateRoll, deleteRoll, loadRoll, unloadRoll, assignChemistry, rateRoll } from '../services/rolls';
import { getChemistryBatch } from '../services/chemistry';

// Simple toast notification function
const showToast = (message, type = 'success') => {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium animate-slideIn ${type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('animate-slideOut');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
};

// Parse search query into active filters (utility function)
const parseSearchQuery = (query) => {
  if (!query.trim()) {
    return [];
  }

  const filters = [];
  const tokens = query.match(/(\w+:(>=|<=|>|<|=)?[^\s]+|\S+)/g) || [];

  tokens.forEach((token) => {
    // Match field:operator:value or field:value patterns
    const fieldMatch = token.match(/^(\w+):(>=|<=|>|<|=)?(.+)$/);
    
    if (fieldMatch) {
      const [, field, operator, value] = fieldMatch;
      filters.push({
        field,
        operator: operator || ':',
        value,
      });
    } else {
      // Plain text search
      filters.push({
        field: null,
        operator: null,
        value: token,
      });
    }
  });

  return filters;
};

export default function RollsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize search from URL params
  const initialSearch = searchParams.get('search') || '';
  const chemistryFilter = searchParams.get('chemistry');

  const [rolls, setRolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeRoll, setActiveRoll] = useState(null);
  const [chemistryBatch, setChemistryBatch] = useState(null);

  // Modal states
  const [datePickerModal, setDatePickerModal] = useState({ isOpen: false, roll: null, action: null });
  const [chemistryModal, setChemistryModal] = useState({ isOpen: false, roll: null });
  const [ratingModal, setRatingModal] = useState({ isOpen: false, roll: null });
  const [editRollModal, setEditRollModal] = useState({ isOpen: false, roll: null });
  const [addRollModal, setAddRollModal] = useState({ isOpen: false, initialData: null });
  const [searchHelpModal, setSearchHelpModal] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState(initialSearch); // Actual search query (triggers API)
  const [searchInputValue, setSearchInputValue] = useState(initialSearch); // Input field value (doesn't trigger API)
  const [activeFilters, setActiveFilters] = useState(parseSearchQuery(initialSearch));

  // Pagination state for NEW and SCANNED columns
  const [visibleCounts, setVisibleCounts] = useState({
    NEW: 4,
    SCANNED: 4,
  });

  // Status configuration
  const statusConfig = [
    { status: 'NEW', displayName: 'New', icon: 'film' },
    { status: 'LOADED', displayName: 'Loaded', icon: 'camera' },
    { status: 'EXPOSED', displayName: 'Exposed', icon: 'checkCircle' },
    { status: 'DEVELOPED', displayName: 'Developed', icon: 'chemistry' },
    { status: 'SCANNED', displayName: 'Scanned', icon: 'star' },
  ];

  // Check if on mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keyboard shortcuts (Cmd/Ctrl+K for search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Focus search input
        document.querySelector('input[aria-label="Search film rolls"]')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Configure drag sensors - disabled on mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch rolls on mount and when search or chemistry filter changes
  useEffect(() => {
    fetchRolls();
    if (chemistryFilter) {
      fetchChemistryBatch();
    } else {
      setChemistryBatch(null);
    }
  }, [searchQuery, chemistryFilter]);

  const fetchChemistryBatch = async () => {
    try {
      const batch = await getChemistryBatch(chemistryFilter);
      setChemistryBatch(batch);
    } catch (err) {
      console.error('Failed to fetch chemistry batch:', err);
    }
  };

  const fetchRolls = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build search query
      let finalSearchQuery = searchQuery;
      
      // Convert legacy chemistry filter to search syntax
      if (chemistryFilter && !searchQuery.includes('chemistry:')) {
        const chemistrySearch = `chemistry:${chemistryFilter}`;
        finalSearchQuery = searchQuery 
          ? `${searchQuery} ${chemistrySearch}`
          : chemistrySearch;
      }
      
      // Call API with search parameter
      const data = await getRolls({ 
        search: finalSearchQuery || null 
      });
      
      // Handle different response formats
      let allRolls = [];
      if (Array.isArray(data)) {
        allRolls = data;
      } else if (data.rolls && Array.isArray(data.rolls)) {
        allRolls = data.rolls;
      } else if (data.items && Array.isArray(data.items)) {
        allRolls = data.items;
      } else {
        console.error('Unexpected API response format:', data);
        allRolls = [];
      }

      setRolls(allRolls);
    } catch (err) {
      console.error('Failed to fetch rolls:', err);
      setError(err.message || 'Failed to load film rolls');
    } finally {
      setLoading(false);
    }
  };

  const clearChemistryFilter = () => {
    // Keep search param if it exists, only remove chemistry
    const params = {};
    if (searchQuery) {
      params.search = searchQuery;
    }
    setSearchParams(params);
  };

  // Handle search input change (only updates input value, doesn't trigger search)
  const handleSearchInputChange = (query) => {
    setSearchInputValue(query);
    // Update active filters for display purposes only
    setActiveFilters(parseSearchQuery(query));
  };

  // Handle search submission (triggers actual search)
  const handleSearchSubmit = (query) => {
    setSearchQuery(query); // This triggers the useEffect and API call
    setSearchInputValue(query); // Keep input in sync
    setActiveFilters(parseSearchQuery(query));
    
    // Update URL params
    const params = {};
    if (query) {
      params.search = query;
    }
    if (chemistryFilter) {
      params.chemistry = chemistryFilter;
    }
    setSearchParams(params);
  };

  // Handle search clear
  const handleSearchClear = () => {
    setSearchQuery(''); // This triggers the useEffect and API call
    setSearchInputValue(''); // Clear input
    setActiveFilters([]);
    
    // Update URL params (keep chemistry if present)
    const params = {};
    if (chemistryFilter) {
      params.chemistry = chemistryFilter;
    }
    setSearchParams(params);
  };

  // Remove individual filter
  const handleRemoveFilter = (index) => {
    const newFilters = activeFilters.filter((_, i) => i !== index);
    setActiveFilters(newFilters);
    
    // Reconstruct search query from remaining filters
    const newQuery = newFilters
      .map((f) => {
        if (f.field) {
          return `${f.field}${f.operator === ':' ? ':' : f.operator}${f.value}`;
        }
        return f.value;
      })
      .join(' ');
    
    setSearchQuery(newQuery); // This triggers the useEffect and API call
    setSearchInputValue(newQuery); // Keep input in sync
    
    // Update URL params
    const params = {};
    if (newQuery) {
      params.search = newQuery;
    }
    if (chemistryFilter) {
      params.chemistry = chemistryFilter;
    }
    setSearchParams(params);
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearchQuery(''); // This triggers the useEffect and API call
    setSearchInputValue(''); // Clear input
    setActiveFilters([]);
    
    // Update URL params (keep chemistry if present)
    const params = {};
    if (chemistryFilter) {
      params.chemistry = chemistryFilter;
    }
    setSearchParams(params);
  };

  // Group rolls by status
  const rollsByStatus = statusConfig.reduce((acc, { status }) => {
    const filteredRolls = rolls.filter((roll) => roll.status === status);

    // Sort SCANNED rolls by most recent unload date
    if (status === 'SCANNED') {
      filteredRolls.sort((a, b) => {
        const dateA = a.date_unloaded ? new Date(a.date_unloaded) : new Date(0);
        const dateB = b.date_unloaded ? new Date(b.date_unloaded) : new Date(0);
        return dateB - dateA; // Most recent first
      });
    }

    acc[status] = filteredRolls;
    return acc;
  }, {});

  // Apply pagination to NEW and SCANNED columns (disabled when searching)
  const getVisibleRolls = (status) => {
    const allRolls = rollsByStatus[status] || [];
    
    // Show all results when searching
    if (searchQuery) {
      return allRolls;
    }
    
    // Otherwise paginate NEW and SCANNED columns
    if (status === 'NEW' || status === 'SCANNED') {
      return allRolls.slice(0, visibleCounts[status]);
    }
    return allRolls;
  };

  const hasMoreRolls = (status) => {
    const allRolls = rollsByStatus[status] || [];
    
    // No "load more" when searching
    if (searchQuery) {
      return false;
    }
    
    return (status === 'NEW' || status === 'SCANNED') && allRolls.length > visibleCounts[status];
  };

  const loadMoreRolls = (status) => {
    setVisibleCounts(prev => ({
      ...prev,
      [status]: prev[status] + 8,
    }));
  };

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
          showToast('Please move rolls one status at a time in the forward direction', 'error');
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
        'NEW': 'Roll reset to NEW',
        'LOADED': 'Roll marked as LOADED',
        'EXPOSED': 'Roll marked as EXPOSED',
        'DEVELOPED': 'Roll marked as DEVELOPED',
        'SCANNED': 'Roll marked as SCANNED'
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
        showToast(`Roll loaded on ${selectedDate}`);
      } else if (action === 'unload') {
        updatedRoll = await unloadRoll(roll.id, selectedDate);
        showToast(`Roll unloaded on ${selectedDate}`);
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

      showToast('Chemistry batch assigned successfully');
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

      showToast(`Roll rated ${stars} star${stars !== 1 ? 's' : ''}`);
    } catch (err) {
      console.error('Failed to rate roll:', err);
      showToast(`Failed to rate roll: ${err.message}`, 'error');
    }
  };

  // Handle card click to edit roll
  const handleCardClick = (roll) => {
    setEditRollModal({ isOpen: true, roll });
  };

  // Handle status change from edit form (mobile)
  const handleStatusChangeFromForm = async (roll, newStatus) => {
    // Create a fake drag event to reuse existing logic
    const fakeEvent = {
      active: { id: roll.id },
      over: {
        id: newStatus,
        data: { current: { type: 'status-column', status: newStatus } }
      }
    };
    await handleDragEnd(fakeEvent);
  };

  // Handle edit roll form submission
  const handleEditRoll = async (rollId, formData) => {
    try {
      const updatedRoll = await updateRoll(rollId, formData);

      // Update local state
      setRolls((prevRolls) =>
        prevRolls.map((r) => (r.id === updatedRoll.id ? updatedRoll : r))
      );

      showToast('Roll updated successfully');
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

      showToast('Roll deleted successfully');
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

      showToast('Roll added successfully');
    } catch (err) {
      console.error('Failed to create roll:', err);
      showToast(`Failed to create roll: ${err.message}`, 'error');
      throw err; // Re-throw to let form handle it
    }
  };

  // Handle duplicate roll (from edit form)
  const handleDuplicateRoll = (duplicateData) => {
    // Close edit modal and open add modal with pre-filled data
    setEditRollModal({ isOpen: false, roll: null });
    // We need to pass the duplicate data to AddRollForm
    // For now, just open AddRollForm and show success message
    setAddRollModal({ isOpen: true, initialData: duplicateData });
    showToast('Opening form to duplicate roll');
  };

  if (loading) {
    return (
      <div className="pb-4 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading your film rolls..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Film Rolls</h2>
          </div>
        </div>
        <ErrorMessage
          title="Error loading film rolls"
          message={error}
          onRetry={fetchRolls}
        />
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Film Rolls</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {isMobile ? 'Tap a roll to view details and change status' : 'Drag rolls between columns to update their status'}
          </p>
        </div>
        <button
          onClick={() => setAddRollModal({ isOpen: true, initialData: null })}
          className="btn-primary whitespace-nowrap touch-friendly"
        >
          + Add Roll
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <SearchBar
            value={searchInputValue}
            onChange={handleSearchInputChange}
            onSearch={handleSearchSubmit}
            onClear={handleSearchClear}
            onShowHelp={() => setSearchHelpModal(true)}
            placeholder="Search rolls... (e.g., format:120 status:loaded)"
          />
          
          {/* Loading indicator overlay */}
          {loading && searchQuery && (
            <div className="absolute right-14 top-1/2 -translate-y-1/2 pointer-events-none">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-film-cyan border-t-transparent"></div>
            </div>
          )}
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mt-3">
            <ActiveFilters
              filters={activeFilters}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleClearAllFilters}
            />
          </div>
        )}
      </div>

      {/* Search Results Banner */}
      {searchQuery && !loading && (
        <div className="mb-4 p-3 bg-film-cyan/10 dark:bg-film-cyan/20 border border-film-cyan/30 dark:border-film-cyan/40 rounded-lg">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-film-cyan dark:text-film-cyan/90 flex items-center gap-1">
              <Icon name="search" size={16} /> Search results:
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
              {rolls.length} roll{rolls.length !== 1 ? 's' : ''} found
            </span>
            {rolls.length > 0 && (
              <span className="text-xs text-gray-600 dark:text-gray-400">
                (showing all matching rolls)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Chemistry Filter Banner */}
      {chemistryFilter && chemistryBatch && !searchQuery && (
        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-purple-900 dark:text-purple-300 flex items-center gap-1">
              <Icon name="chemistry" size={16} /> Filtered by chemistry:
            </span>
            <span className="text-sm text-purple-700 dark:text-purple-400 font-semibold">
              {chemistryBatch.name}
            </span>
            <span className="text-xs text-purple-600 dark:text-purple-500">
              ({rolls.length} roll{rolls.length !== 1 ? 's' : ''})
            </span>
          </div>
          <button
            onClick={clearChemistryFilter}
            className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:underline"
          >
            Clear filter
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Mobile: Stack columns vertically, Desktop: Horizontal scroll */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-3 md:overflow-x-auto pb-2">
          {statusConfig.map(({ status, displayName, icon }) => (
            <StatusColumn
              key={status}
              status={status}
              displayName={displayName}
              icon={icon}
              rolls={getVisibleRolls(status)}
              totalCount={rollsByStatus[status]?.length || 0}
              hasMore={hasMoreRolls(status)}
              onLoadMore={() => loadMoreRolls(status)}
              onCardClick={handleCardClick}
              isMobile={isMobile}
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
        onDuplicate={handleDuplicateRoll}
        onStatusChange={isMobile ? handleStatusChangeFromForm : null}
        roll={editRollModal.roll}
      />

      <AddRollForm
        isOpen={addRollModal.isOpen}
        onClose={() => setAddRollModal({ isOpen: false, initialData: null })}
        onSubmit={handleAddRoll}
        initialData={addRollModal.initialData}
      />

      <SearchHelpModal
        isOpen={searchHelpModal}
        onClose={() => setSearchHelpModal(false)}
      />
    </div>
  );
}
