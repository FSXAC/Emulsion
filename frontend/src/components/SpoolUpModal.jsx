import { useState, useEffect } from 'react';
import Icon from './Icon';
import { useSound } from '../hooks/useSound';

const SpoolUpModal = ({ isOpen, onClose, onConfirm, bulkRoll }) => {
  const { playClick } = useSound();
  const [exposures, setExposures] = useState(36);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && bulkRoll) {
      setExposures(36);
      setErrors({});
    }
  }, [isOpen, bulkRoll]);

  if (!isOpen || !bulkRoll) return null;

  const validate = () => {
    const newErrors = {};

    if (!exposures || exposures < 12) {
      newErrors.exposures = 'Minimum 12 exposures required';
    } else if (exposures > 40) {
      newErrors.exposures = 'Maximum 40 exposures allowed';
    } else if (exposures > bulkRoll.expected_exposures) {
      newErrors.exposures = `Cannot exceed bulk roll (${bulkRoll.expected_exposures} exposures)`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setExposures(value);
    // Clear error when user starts typing
    if (errors.exposures) {
      setErrors({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    playClick();
    setIsSubmitting(true);
    try {
      await onConfirm(exposures);
      handleClose();
    } catch (err) {
      console.error('Spool up error:', err);
      setErrors({ submit: err.message || 'Failed to spool up roll. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    setExposures(36);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Calculate costs
  const totalExposures = bulkRoll.expected_exposures;
  const remainingExposures = totalExposures - exposures;
  const costPerExposure = parseFloat(bulkRoll.film_cost) / totalExposures;
  const newRollCost = (costPerExposure * exposures).toFixed(2);
  const remainingCost = (costPerExposure * remainingExposures).toFixed(2);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full border border-gray-200/50 dark:border-gray-700/50">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200/60 dark:border-gray-700/60">
          <div className="flex items-center gap-3">
            <Icon name="film" size={24} className="text-film-orange-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Spool Up Roll</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Split exposures from bulk roll
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          {/* Bulk Roll Info */}
          <div className="mb-4 p-3 bg-gray-50/60 dark:bg-gray-700/30 backdrop-blur-sm rounded-3xl border-0 shadow-[0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.15)]">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {bulkRoll.film_stock_name}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Order: {bulkRoll.order_id}</span>
              <span>{totalExposures} exposures</span>
              <span>${parseFloat(bulkRoll.film_cost).toFixed(2)}</span>
            </div>
          </div>

          {/* Exposures Input */}
          <div className="mb-4">
            <label htmlFor="exposures" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              How many exposures to spool up? *
            </label>
            <input
              type="number"
              id="exposures"
              name="exposures"
              value={exposures}
              onChange={handleChange}
              min="12"
              max="40"
              className={`w-full px-4 py-3 text-lg bg-white/60 dark:bg-gray-700/40 backdrop-blur-sm border-0 rounded-3xl text-center font-semibold transition-all duration-200 focus:ring-2 focus:bg-white dark:focus:bg-gray-700/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(0,0,0,0.05)] focus:shadow-[inset_0_2px_5px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(0,0,0,0.06)] ${
                errors.exposures ? 'ring-2 ring-red-400 dark:ring-red-500' : ''
              }`}
              placeholder="36"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
              Between 12 and 40 exposures
            </p>
            {errors.exposures && (
              <p className="mt-2 text-sm text-red-600 text-center">{errors.exposures}</p>
            )}
          </div>

          {/* Cost Preview */}
          {exposures > 0 && exposures <= totalExposures && (
            <div className="mb-4 space-y-3">
              {/* New Roll Preview */}
              <div className="p-3 bg-green-50/60 dark:bg-green-900/10 backdrop-blur-sm border-0 rounded-3xl shadow-[0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.15)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Icon name="plus" size={16} className="text-green-600 dark:text-green-400" />
                    New Spooled Roll
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>{exposures} exposures</span>
                  <span className="text-lg font-bold text-green-700 dark:text-green-400">
                    ${newRollCost}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ${(parseFloat(newRollCost) / exposures).toFixed(3)}/shot
                </p>
              </div>

              {/* Remaining Bulk Preview */}
              <div className="p-3 bg-blue-50/60 dark:bg-blue-900/10 backdrop-blur-sm border-0 rounded-3xl shadow-[0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.15)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Icon name="film" size={16} className="text-blue-600 dark:text-blue-400" />
                    Remaining Bulk
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>{remainingExposures} exposures</span>
                  <span className="text-lg font-bold text-blue-700 dark:text-blue-400">
                    ${remainingCost}
                  </span>
                </div>
                {remainingExposures > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ${(parseFloat(remainingCost) / remainingExposures).toFixed(3)}/shot
                  </p>
                )}
              </div>

              {/* Total Verification */}
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Total: ${(parseFloat(newRollCost) + parseFloat(remainingCost)).toFixed(2)} = ${parseFloat(bulkRoll.film_cost).toFixed(2)} ✓
              </div>
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="text-red-600 dark:text-red-400 text-sm text-center p-2 bg-red-50/60 dark:bg-red-900/10 backdrop-blur-sm rounded-3xl mb-3 border-0 shadow-[0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.15)]">
              {errors.submit}
            </div>
          )}
        </form>

        {/* Actions */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200/60 dark:border-gray-700/60 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-b-2xl">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 sm:py-2 bg-gray-200/80 hover:bg-gray-300/90 dark:bg-gray-700/60 dark:hover:bg-gray-600/70 backdrop-blur-sm text-gray-800 dark:text-gray-200 rounded-3xl font-medium transition-all duration-200 shadow-[0_4px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_6px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.2)]"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 px-4 py-2.5 sm:py-2 bg-film-orange-600 hover:bg-film-orange-700 backdrop-blur-sm text-white rounded-3xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_4px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_6px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.2)]"
              disabled={isSubmitting || Object.keys(errors).length > 0}
            >
              <Icon name="film" size={18} />
              {isSubmitting ? 'Spooling...' : 'Spool Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpoolUpModal;
