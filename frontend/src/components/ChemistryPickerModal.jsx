import { useState, useEffect } from 'react';
import { getChemistry } from '../services/chemistry';
import { formatDateForDisplay } from '../utils/dateUtils';
import Icon from './Icon';
import { useSound } from '../hooks/useSound';

const ChemistryPickerModal = ({ isOpen, onClose, onConfirm, roll }) => {
  const { playClick } = useSound();
  const [chemistryBatches, setChemistryBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

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
      playClick();
      onConfirm(selectedBatchId);
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatCost = (cost) => {
    if (cost === null || cost === undefined) return 'N/A';
    const numCost = typeof cost === 'string' ? parseFloat(cost) : cost;
    return `$${numCost.toFixed(2)}`;
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full m-0 sm:m-4 sm:my-8 min-h-screen sm:min-h-0 flex flex-col max-h-screen sm:max-h-[90vh] border border-gray-200/50 dark:border-gray-700/50">
        {/* Header */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-gray-200/60 dark:border-gray-700/60">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Select Chemistry Batch</h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Choose which chemistry batch was used to develop this roll
          </p>
          {roll && (
            <p className="text-sm text-gray-500 mt-2">
              Roll: <span className="font-medium">{roll.film_stock_name}</span>
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
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
                        block p-4 border-0 rounded-3xl cursor-pointer transition-all duration-200
                        ${selectedBatchId === batch.id
                          ? 'bg-film-orange-500 dark:bg-film-orange-700 backdrop-blur-sm shadow-[0_4px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)]'
                          : 'bg-gray-100 dark:bg-gray-700/60  backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(0,0,0,0.05)]'
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
                          <h4 className="font-bold text-gray-900 dark:text-gray-100">{batch.name}</h4>
                          {selectedBatchId === batch.id && (
                            <span className="text-white">✓</span>
                          )}
                        </div>
                        
                        <div className={`text-sm space-y-1 ${selectedBatchId === batch.id ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Type:</span>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm
                            shadow-[0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.15)]
                            ${selectedBatchId === batch.id ? 'bg-film-orange-300 dark:bg-film-orange-400/100 text-white' : 'bg-purple-50/40 dark:bg-purple-800/20 text-purple-700 dark:text-purple-300'}`}>
                              {batch.chemistry_type}
                            </span>
                          </div>
                          
                          {batch.date_mixed && (
                            <div>
                              <span className="font-medium">Mixed:</span> {formatDateForDisplay(batch.date_mixed, { month: 'short', day: 'numeric', year: 'numeric' })}
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
                            <div className="dark:text-film-orange-100 font-medium flex items-center gap-1">
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
        <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-gray-200/60 dark:border-gray-700/60 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-b-2xl">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 sm:py-2 bg-gray-200/80 hover:bg-gray-300/90 dark:bg-gray-700/60 dark:hover:bg-gray-600/70 backdrop-blur-sm text-gray-800 dark:text-gray-200 rounded-3xl font-medium transition-all duration-200 text-sm sm:text-base shadow-[0_4px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_6px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.2)] border-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="chemistry-form"
              disabled={!selectedBatchId || loading}
              className="flex-1 px-4 py-2.5 sm:py-2 bg-film-orange-600 hover:bg-film-orange-600/90 backdrop-blur-sm text-white rounded-3xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shadow-[0_4px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_6px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.2)] border-0"
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
