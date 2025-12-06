import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AddChemistryForm from '../components/AddChemistryForm';
import EditChemistryForm from '../components/EditChemistryForm';
import { getChemistry, createChemistry, updateChemistry, deleteChemistry } from '../services/chemistry';

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

export default function ChemistryPage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addBatchModal, setAddBatchModal] = useState({ isOpen: false });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [duplicateData, setDuplicateData] = useState(null);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-500">Loading chemistry batches...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold mb-2">Error loading chemistry batches</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={fetchBatches} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Chemistry Batches</h2>
          <p className="text-sm text-gray-500">
            Track your film development chemistry and costs
          </p>
        </div>
        <button 
          onClick={() => setAddBatchModal({ isOpen: true })}
          className="btn-primary"
        >
          + Add Chemistry
        </button>
      </div>

      {batches.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-6xl mb-4">🧪</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No chemistry batches yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Add your first chemistry batch to start tracking development costs
          </p>
          <button 
            onClick={() => setAddBatchModal({ isOpen: true })}
            className="btn-primary"
          >
            + Add Chemistry Batch
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className={`bg-white rounded-lg shadow-md border-2 p-4 transition-all hover:shadow-lg ${
                batch.is_active ? 'border-purple-200' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                {/* Batch Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{batch.name}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      batch.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {batch.is_active ? 'Active' : 'Retired'}
                    </span>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                      {batch.chemistry_type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {/* Date Mixed */}
                    <div>
                      <span className="text-gray-500">Mixed:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {formatDate(batch.date_mixed)}
                      </span>
                    </div>

                    {/* Date Retired */}
                    {batch.date_retired && (
                      <div>
                        <span className="text-gray-500">Retired:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {formatDate(batch.date_retired)}
                        </span>
                      </div>
                    )}

                    {/* Rolls Developed */}
                    <div>
                      <span className="text-gray-500">Rolls:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {batch.rolls_developed || 0}
                      </span>
                    </div>

                    {/* Cost per Roll */}
                    <div>
                      <span className="text-gray-500">Cost/Roll:</span>
                      <span className="ml-2 font-medium text-green-700">
                        {formatCost(batch.cost_per_roll)}
                      </span>
                    </div>
                  </div>

                  {/* C41 Development Time */}
                  {batch.chemistry_type === 'C41' && batch.development_time_formatted && (
                    <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded">
                      <span className="text-sm text-gray-700">
                        ⏱️ C41 Development Time: 
                        <span className="ml-2 font-bold text-purple-700">
                          {batch.development_time_formatted}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Notes */}
                  {batch.notes && (
                    <div className="mt-2 text-xs text-gray-600 italic">
                      {batch.notes}
                    </div>
                  )}
                </div>

                {/* Batch Cost */}
                <div className="text-right ml-4">
                  <div className="text-xs text-gray-500 mb-1">Total Cost</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {formatCost(batch.batch_cost)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex flex-col gap-2">
                  {/* Edit button */}
                  <button
                    onClick={() => handleEditBatch(batch)}
                    className="text-sm text-film-cyan hover:text-film-cyan/80 hover:underline text-left transition-colors font-medium"
                  >
                    ✏️ Edit batch
                  </button>
                  
                  {/* Link to view rolls using this batch */}
                  <Link
                    to={`/rolls?chemistry=${batch.id}`}
                    className="text-sm text-film-cyan hover:text-film-cyan/80 hover:underline transition-colors"
                  >
                    View {batch.rolls_developed || 0} {batch.rolls_developed === 1 ? 'roll' : 'rolls'} →
                  </Link>
                  
                  {/* Retire button (only show for active batches) */}
                  {batch.is_active && (
                    <button
                      onClick={() => handleRetireBatch(batch.id, batch.name)}
                      className="text-sm text-gray-600 hover:text-gray-800 hover:underline text-left transition-colors"
                    >
                      Retire batch
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
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
