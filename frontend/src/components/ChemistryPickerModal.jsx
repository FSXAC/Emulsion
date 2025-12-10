import { useState, useEffect } from 'react';
import { getChemistry } from '../services/chemistry';
import Icon from './Icon';

const ChemistryPickerModal = ({ isOpen, onClose, onConfirm, roll }) => {
  const [chemistryBatches, setChemistryBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchChemistry();
    }
  }, [isOpen]);

  const fetchChemistry = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch only active batches
      const data = await getChemistry({ activeOnly: true });
      const batches = Array.isArray(data) ? data : data.rolls || data.batches || [];
      setChemistryBatches(batches);
      
      // Pre-select current chemistry if roll has one
      if (roll?.chemistry_id) {
        setSelectedBatchId(roll.chemistry_id);
      }
    } catch (err) {
      console.error('Failed to fetch chemistry:', err);
      setError(err.message || 'Failed to load chemistry batches');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedBatchId) {
      onConfirm(selectedBatchId);
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatCost = (cost) => {
    if (cost === null || cost === undefined) return 'N/A';
    const numCost = typeof cost === 'string' ? parseFloat(cost) : cost;
    return `$${numCost.toFixed(2)}`;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Select Chemistry Batch</h2>
          <p className="text-sm text-gray-600 mt-1">
            Choose which chemistry batch was used to develop this roll
          </p>
          {roll && (
            <p className="text-sm text-gray-500 mt-2">
              Roll: <span className="font-medium">{roll.film_stock_name}</span>
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="text-center py-8 text-gray-500">
              Loading chemistry batches...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={fetchChemistry}
                className="mt-2 text-sm text-red-700 underline"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && chemistryBatches.length === 0 && (
            <div className="text-center py-8">
              <div className="mb-3 flex justify-center">
                <Icon name="chemistry" size={48} className="text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No active chemistry batches</p>
              <p className="text-sm text-gray-500 mt-2">
                Create a chemistry batch first before developing rolls
              </p>
            </div>
          )}

          {!loading && !error && chemistryBatches.length > 0 && (
            <form onSubmit={handleSubmit} id="chemistry-form">
              <div className="space-y-3">
                {chemistryBatches.map((batch) => (
                  <label
                    key={batch.id}
                    className={`
                      block p-4 border-2 rounded-lg cursor-pointer transition-all
                      ${selectedBatchId === batch.id
                        ? 'border-film-cyan bg-film-cyan/5 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="chemistry"
                      value={batch.id}
                      checked={selectedBatchId === batch.id}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="sr-only"
                    />
                    
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon name="chemistry" size={20} />
                          <h4 className="font-bold text-gray-900">{batch.name}</h4>
                          {selectedBatchId === batch.id && (
                            <span className="text-film-cyan">✓</span>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Type:</span>
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                              {batch.chemistry_type}
                            </span>
                          </div>
                          
                          {batch.date_mixed && (
                            <div>
                              <span className="font-medium">Mixed:</span> {formatDate(batch.date_mixed)}
                            </div>
                          )}
                          
                          {batch.rolls_developed !== null && (
                            <div>
                              <span className="font-medium">Rolls used:</span> {batch.rolls_developed}
                            </div>
                          )}
                          
                          {batch.cost_per_roll !== null && (
                            <div>
                              <span className="font-medium">Cost per roll:</span> {formatCost(batch.cost_per_roll)}
                            </div>
                          )}
                          
                          {batch.development_time_formatted && batch.chemistry_type === 'C41' && (
                            <div className="text-film-red font-medium flex items-center gap-1">
                              <Icon name="clock" size={14} /> Dev time: {batch.development_time_formatted}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="chemistry-form"
              disabled={!selectedBatchId || loading}
              className="flex-1 px-4 py-3 bg-film-cyan hover:bg-film-cyan/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assign Chemistry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChemistryPickerModal;
