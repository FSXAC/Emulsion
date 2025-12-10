import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AddChemistryForm from '../components/AddChemistryForm';
import EditChemistryForm from '../components/EditChemistryForm';
import SkeletonCard from '../components/SkeletonCard';
import ErrorMessage from '../components/ErrorMessage';
import { getChemistry, createChemistry, updateChemistry, deleteChemistry } from '../services/chemistry';

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

export default function ChemistryPage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addBatchModal, setAddBatchModal] = useState({ isOpen: false });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [duplicateData, setDuplicateData] = useState(null);

  // Pagination state
  const [visibleCounts, setVisibleCounts] = useState({
    active: 4,
    retired: 4,
  });

  // Fetch chemistry batches on mount
  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getChemistry();
      // Handle different response formats
      if (Array.isArray(data)) {
        setBatches(data);
      } else if (data.batches && Array.isArray(data.batches)) {
        setBatches(data.batches);
      } else if (data.items && Array.isArray(data.items)) {
        setBatches(data.items);
      } else {
        console.error('Unexpected API response format:', data);
        setBatches([]);
      }
    } catch (err) {
      console.error('Failed to fetch chemistry batches:', err);
      setError(err.message || 'Failed to load chemistry batches');
    } finally {
      setLoading(false);
    }
  };

  // Handle add chemistry form submission
  const handleAddChemistry = async (formData) => {
    try {
      const newBatch = await createChemistry(formData);

      // Add to local state
      setBatches((prevBatches) => [newBatch, ...prevBatches]);

      showToast('🧪 Chemistry batch created successfully');
      setDuplicateData(null); // Clear duplicate data after success
    } catch (err) {
      console.error('Failed to create chemistry batch:', err);
      showToast(`Failed to create batch: ${err.message}`, 'error');
      throw err; // Re-throw to let form handle it
    }
  };

  // Handle edit batch
  const handleEditBatch = (batch) => {
    setSelectedBatch(batch);
    setIsEditModalOpen(true);
  };

  // Handle update batch
  const handleUpdateBatch = async (batchId, updatedData) => {
    try {
      const updatedBatch = await updateChemistry(batchId, updatedData);
      setBatches((prevBatches) =>
        prevBatches.map((b) => (b.id === updatedBatch.id ? updatedBatch : b))
      );
      showToast('✅ Chemistry batch updated');
    } catch (err) {
      console.error('Failed to update batch:', err);
      showToast(`Failed to update batch: ${err.message}`, 'error');
      throw err;
    }
  };

  // Handle delete batch
  const handleDeleteBatch = async (batchId) => {
    try {
      await deleteChemistry(batchId);
      setBatches((prevBatches) => prevBatches.filter((b) => b.id !== batchId));
      showToast('🗑️ Chemistry batch deleted');
    } catch (err) {
      console.error('Failed to delete batch:', err);
      // Check if error is due to rolls using this batch
      if (err.response?.status === 400) {
        showToast('❌ Cannot delete: rolls are using this batch', 'error');
      } else {
        showToast(`Failed to delete batch: ${err.message}`, 'error');
      }
      throw err;
    }
  };

  // Handle duplicate batch
  const handleDuplicateBatch = (duplicateData) => {
    // Close edit modal
    setIsEditModalOpen(false);
    setSelectedBatch(null);

    // Open add modal with duplicate data
    setDuplicateData(duplicateData);
    setAddBatchModal({ isOpen: true });
  };

  // Handle retire chemistry batch
  const handleRetireBatch = async (batchId, batchName) => {
    if (!confirm(`Retire chemistry batch "${batchName}"? This will mark it as inactive.`)) {
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const updatedBatch = await updateChemistry(batchId, { date_retired: today });

      // Update local state
      setBatches((prevBatches) =>
        prevBatches.map((b) => (b.id === updatedBatch.id ? updatedBatch : b))
      );

      showToast('🔒 Chemistry batch retired');
    } catch (err) {
      console.error('Failed to retire batch:', err);
      showToast(`Failed to retire batch: ${err.message}`, 'error');
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Format cost helper
  const formatCost = (cost) => {
    if (cost === null || cost === undefined) return 'N/A';
    const numCost = typeof cost === 'string' ? parseFloat(cost) : cost;
    return `$${numCost.toFixed(2)}`;
  };

  // Separate batches into active and retired
  const activeBatches = batches.filter(batch => batch.is_active);
  const retiredBatches = batches.filter(batch => !batch.is_active);

  // Apply pagination
  const visibleActiveBatches = activeBatches.slice(0, visibleCounts.active);
  const visibleRetiredBatches = retiredBatches.slice(0, visibleCounts.retired);

  const hasMoreActive = activeBatches.length > visibleCounts.active;
  const hasMoreRetired = retiredBatches.length > visibleCounts.retired;

  const loadMoreActive = () => {
    setVisibleCounts(prev => ({
      ...prev,
      active: prev.active + 8,
    }));
  };

  const loadMoreRetired = () => {
    setVisibleCounts(prev => ({
      ...prev,
      retired: prev.retired + 8,
    }));
  };

  if (loading) {
    return (
      <div className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Chemistry Batches</h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Loading your chemistry batches...
            </p>
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Active</h3>
            </div>
            <div className="grid gap-3">
              <SkeletonCard variant="chemistry" />
              <SkeletonCard variant="chemistry" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Chemistry Batches</h2>
          </div>
        </div>
        <ErrorMessage
          title="Error loading chemistry batches"
          message={error}
          onRetry={fetchBatches}
        />
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Chemistry Batches</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Track your film development chemistry and costs
          </p>
        </div>
        <button
          onClick={() => setAddBatchModal({ isOpen: true })}
          className="btn-primary whitespace-nowrap touch-friendly"
        >
          + Add Chemistry
        </button>
      </div>

      {batches.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <div className="text-5xl sm:text-6xl mb-4">🧪</div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No chemistry batches yet</h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4 px-4">
            Add your first chemistry batch to start tracking development costs
          </p>
          <button
            onClick={() => setAddBatchModal({ isOpen: true })}
            className="btn-primary touch-friendly"
          >
            + Add Chemistry Batch
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Batches Section */}
          {activeBatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Active</h3>
                <span className="text-sm text-gray-500">({activeBatches.length})</span>
              </div>
              <div className="grid gap-3">
                {visibleActiveBatches.map((batch) => (
                  <div
                    key={batch.id}
                    onClick={() => handleEditBatch(batch)}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md p-4 transition-all duration-200 border border-[#D9D9D9] dark:border-gray-700 hover:border-film-cyan dark:hover:border-film-cyan cursor-pointer"
                  >
                    {/* Top Section: Name, Type & Cost */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{batch.name}</h3>
                          <span className="text-[11px] text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
                            {batch.chemistry_type}
                          </span>
                        </div>

                        {/* Date Mixed */}
                        {batch.date_mixed && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Mixed {formatDate(batch.date_mixed)}
                          </div>
                        )}
                      </div>

                      {/* Batch Cost */}
                      <div className="text-right">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Total</div>
                        <div className="text-xl font-bold text-purple-700 dark:text-purple-400">
                          {formatCost(batch.batch_cost)}
                        </div>
                      </div>
                    </div>

                    {/* Stats Block */}
                    <div className="bg-gray-50 rounded-xl px-3 py-2 space-y-2">
                      {/* Rolls + Cost per Roll */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {batch.rolls_developed || 0} {batch.rolls_developed === 1 ? 'roll' : 'rolls'}
                        </span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {formatCost(batch.cost_per_roll)} <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">per roll</span>
                        </span>
                      </div>

                      {/* C41 Development Time */}
                      {batch.chemistry_type === 'C41' && batch.development_time_formatted && (
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>⏱️ Dev Time</span>
                          <span className="font-bold text-purple-700">
                            {batch.development_time_formatted}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {batch.notes && (
                      <div className="mt-3 bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-600 italic leading-relaxed">
                        {batch.notes}
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <Link
                        to={`/rolls?chemistry=${batch.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-film-cyan dark:text-film-cyan/90 hover:text-film-cyan/80 dark:hover:text-film-cyan/70 hover:underline transition-colors"
                      >
                        View rolls →
                      </Link>
                      {batch.is_active && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRetireBatch(batch.id, batch.name);
                          }}
                          className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 hover:underline transition-colors"
                        >
                          Retire
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button for Active */}
              {hasMoreActive && (
                <button
                  onClick={loadMoreActive}
                  className="w-full mt-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
                >
                  Load more active batches ({activeBatches.length - visibleCounts.active} remaining)
                </button>
              )}
            </div>
          )}

          {/* Retired Batches Section */}
          {retiredBatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Retired</h3>
                <span className="text-sm text-gray-500">({retiredBatches.length})</span>
              </div>
              <div className="grid gap-3">
                {visibleRetiredBatches.map((batch) => (
                  <div
                    key={batch.id}
                    onClick={() => handleEditBatch(batch)}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md p-4 transition-all duration-200 border border-gray-200 dark:border-gray-700 cursor-pointer opacity-70 hover:opacity-100"
                  >
                    {/* Top Section: Name, Type & Cost */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{batch.name}</h3>
                          <span className="text-[11px] text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
                            {batch.chemistry_type}
                          </span>
                        </div>

                        {/* Dates */}
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {batch.date_mixed && `Mixed ${formatDate(batch.date_mixed)}`}
                          {batch.date_mixed && batch.date_retired && ' • '}
                          {batch.date_retired && `Retired ${formatDate(batch.date_retired)}`}
                        </div>
                      </div>

                      {/* Batch Cost */}
                      <div className="text-right">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Total</div>
                        <div className="text-xl font-bold text-gray-600 dark:text-gray-400">
                          {formatCost(batch.batch_cost)}
                        </div>
                      </div>
                    </div>

                    {/* Stats Block */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2 space-y-2">
                      {/* Rolls + Cost per Roll */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {batch.rolls_developed || 0} {batch.rolls_developed === 1 ? 'roll' : 'rolls'}
                        </span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {formatCost(batch.cost_per_roll)} <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">per roll</span>
                        </span>
                      </div>

                      {/* C41 Development Time */}
                      {batch.chemistry_type === 'C41' && batch.development_time_formatted && (
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>⏱️ Dev Time</span>
                          <span className="font-bold text-purple-700 dark:text-purple-400">
                            {batch.development_time_formatted}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {batch.notes && (
                      <div className="mt-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2 text-xs text-gray-600 dark:text-gray-400 italic leading-relaxed">
                        {batch.notes}
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <Link
                        to={`/rolls?chemistry=${batch.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-film-cyan hover:text-film-cyan/80 hover:underline transition-colors"
                      >
                        View rolls →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button for Retired */}
              {hasMoreRetired && (
                <button
                  onClick={loadMoreRetired}
                  className="w-full mt-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
                >
                  Load more retired batches ({retiredBatches.length - visibleCounts.retired} remaining)
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Chemistry Modal */}
      <AddChemistryForm
        isOpen={addBatchModal.isOpen}
        onClose={() => {
          setAddBatchModal({ isOpen: false });
          setDuplicateData(null);
        }}
        onSubmit={handleAddChemistry}
        initialData={duplicateData}
      />

      {/* Edit Chemistry Modal */}
      <EditChemistryForm
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedBatch(null);
        }}
        onSubmit={handleUpdateBatch}
        onDelete={handleDeleteBatch}
        onDuplicate={handleDuplicateBatch}
        batch={selectedBatch}
      />
    </div>
  );
}
