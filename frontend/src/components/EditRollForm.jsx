import { useState, useEffect } from 'react';
import AutocompleteInput from './AutocompleteInput';
import { getRolls } from '../services/rolls';
import { getFilmStockImage } from '../utils/filmStockImages';

const EditRollForm = ({ isOpen, onClose, onSubmit, onDelete, onDuplicate, roll, onStatusChange }) => {
  const [formData, setFormData] = useState({
    order_id: '',
    film_stock_name: '',
    film_format: '35mm',
    expected_exposures: 36,
    film_cost: '',
    push_pull_stops: 0,
    not_mine: false,
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [filmStockSuggestions, setFilmStockSuggestions] = useState([]);
  const [orderIdSuggestions, setOrderIdSuggestions] = useState([]);

  // Fetch suggestions when modal opens
  useEffect(() => {
    if (isOpen) {

      // NOTE: nope, too annoying
      // fetchSuggestions();
    }
  }, [isOpen]);

  const fetchSuggestions = async () => {
    try {
      const data = await getRolls({ limit: 1000 });
      const rolls = Array.isArray(data) ? data : data.rolls || [];
      
      // Extract unique film stock names
      const stockNames = [...new Set(rolls.map(r => r.film_stock_name).filter(Boolean))];
      setFilmStockSuggestions(stockNames.sort());
      
      // Extract unique order IDs
      const orderIds = [...new Set(rolls.map(r => r.order_id).filter(Boolean))];
      setOrderIdSuggestions(orderIds.sort());
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    }
  };

  // Populate form when roll changes
  useEffect(() => {
    if (roll && isOpen) {
      setFormData({
        order_id: roll.order_id || '',
        film_stock_name: roll.film_stock_name || '',
        film_format: roll.film_format || '35mm',
        expected_exposures: roll.expected_exposures || 36,
        film_cost: roll.film_cost || '',
        push_pull_stops: roll.push_pull_stops || 0,
        not_mine: roll.not_mine || false,
        notes: roll.notes || '',
      });
    }
  }, [roll, isOpen]);

  if (!isOpen || !roll) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.order_id.trim()) newErrors.order_id = 'Order ID is required';
    if (!formData.film_stock_name.trim()) newErrors.film_stock_name = 'Film stock name is required';
    if (!formData.film_format.trim()) newErrors.film_format = 'Film format is required';
    if (!formData.expected_exposures || formData.expected_exposures < 1) {
      newErrors.expected_exposures = 'Expected exposures must be at least 1';
    }
    if (formData.film_cost === '' || parseFloat(formData.film_cost) < 0) {
      newErrors.film_cost = 'Film cost must be 0 or greater';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Convert string values to proper types
      const submitData = {
        ...formData,
        expected_exposures: parseInt(formData.expected_exposures),
        film_cost: parseFloat(formData.film_cost),
        push_pull_stops: parseFloat(formData.push_pull_stops) || 0,
      };

      await onSubmit(roll.id, submitData);
      handleClose();
    } catch (err) {
      console.error('Form submission error:', err);
      setErrors({ submit: err.message || 'Failed to update roll. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!roll) return;
    
    setIsDeleting(true);
    try {
      await onDelete(roll.id);
      handleClose();
    } catch (err) {
      console.error('Delete error:', err);
      setErrors({ submit: err.message || 'Failed to delete roll. Please try again.' });
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = () => {
    if (!roll || !onDuplicate) return;
    
    // Copy relevant fields for duplication
    const duplicateData = {
      order_id: roll.order_id,
      film_stock_name: roll.film_stock_name,
      film_format: roll.film_format,
      expected_exposures: roll.expected_exposures,
      film_cost: roll.film_cost,
      push_pull_stops: roll.push_pull_stops,
      not_mine: roll.not_mine,
    };
    
    onDuplicate(duplicateData);
    handleClose();
  };

  // Calculate estimated cost per shot
  const calculateCostPerShot = () => {
    const filmCost = parseFloat(formData.film_cost) || 0;
    const exposures = parseInt(formData.expected_exposures) || 1;
    if (filmCost > 0 && exposures > 0) {
      return (filmCost / exposures).toFixed(3);
    }
    return null;
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleStatusChange = (newStatus) => {
    if (onStatusChange) {
      onStatusChange(roll, newStatus);
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white/85 backdrop-blur-sm rounded-lg shadow-xl max-w-3xl w-full m-0 sm:m-4 sm:my-8 min-h-screen sm:min-h-0 flex flex-col max-h-screen sm:max-h-[90vh]">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex items-start gap-4">
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-16 h-24 sm:w-20 sm:h-28 overflow-hidden rounded">
              <img 
                src={getFilmStockImage(roll.film_stock_name, roll.film_format)}
                alt={roll.film_stock_name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Title and Status */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Film Roll</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Update details for this roll</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs sm:text-sm text-gray-500">Status:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {roll.status}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Status Change Buttons - Mobile Only */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-b border-gray-200 bg-gray-50 sm:hidden">
          <p className="text-xs text-gray-600 mb-2">Change Status:</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {roll.status !== 'NEW' && (
              <button
                type="button"
                onClick={() => handleStatusChange('NEW')}
                className="flex-shrink-0 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                🎞️ New
              </button>
            )}
            {roll.status !== 'LOADED' && (
              <button
                type="button"
                onClick={() => handleStatusChange('LOADED')}
                className="flex-shrink-0 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                📷 Loaded
              </button>
            )}
            {roll.status !== 'EXPOSED' && (
              <button
                type="button"
                onClick={() => handleStatusChange('EXPOSED')}
                className="flex-shrink-0 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                ✅ Exposed
              </button>
            )}
            {roll.status !== 'DEVELOPED' && (
              <button
                type="button"
                onClick={() => handleStatusChange('DEVELOPED')}
                className="flex-shrink-0 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                🧪 Developed
              </button>
            )}
            {roll.status !== 'SCANNED' && (
              <button
                type="button"
                onClick={() => handleStatusChange('SCANNED')}
                className="flex-shrink-0 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                ⭐ Scanned
              </button>
            )}
          </div>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {/* Film Stock Name - Full Width */}
          <div className="mb-4">
            <label htmlFor="film_stock_name" className="block text-sm font-medium text-gray-700 mb-1">
              Film Stock *
            </label>
            <AutocompleteInput
              id="film_stock_name"
              name="film_stock_name"
              value={formData.film_stock_name}
              onChange={handleChange}
              suggestions={filmStockSuggestions}
              placeholder="e.g., Kodak Portra 400"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-film-cyan focus:border-film-cyan ${
                errors.film_stock_name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.film_stock_name && <p className="mt-1 text-xs text-red-600">{errors.film_stock_name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Order ID */}
            <div>
              <label htmlFor="order_id" className="block text-sm font-medium text-gray-700 mb-1">
                Order ID *
              </label>
              <AutocompleteInput
                id="order_id"
                name="order_id"
                value={formData.order_id}
                onChange={handleChange}
                suggestions={orderIdSuggestions}
                placeholder="42"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-film-cyan focus:border-film-cyan ${
                  errors.order_id ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.order_id && <p className="mt-1 text-xs text-red-600">{errors.order_id}</p>}
            </div>

            {/* Expected Exposures */}
            <div>
              <label htmlFor="expected_exposures" className="block text-sm font-medium text-gray-700 mb-1">
                Exposures *
              </label>
              <input
                type="number"
                id="expected_exposures"
                name="expected_exposures"
                value={formData.expected_exposures}
                onChange={handleChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-film-cyan focus:border-film-cyan ${
                  errors.expected_exposures ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.expected_exposures && <p className="mt-1 text-xs text-red-600">{errors.expected_exposures}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
            {/* Film Format */}
            <div>
              <label htmlFor="film_format" className="block text-sm font-medium text-gray-700 mb-1">
                Format *
              </label>
              <select
                id="film_format"
                name="film_format"
                value={formData.film_format}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-film-cyan focus:border-film-cyan text-sm"
              >
                <option value="35mm">35mm</option>
                <option value="HF">HF</option>
                <option value="120">120</option>
                <option value="110">110</option>
                <option value="126">126</option>
                <option value="4x5">4x5</option>
                <option value="8x10">8x10</option>
              </select>
            </div>

            {/* Push/Pull Stops */}
            <div>
              <label htmlFor="push_pull_stops" className="block text-sm font-medium text-gray-700 mb-1">
                Push/Pull
              </label>
              <input
                type="number"
                id="push_pull_stops"
                name="push_pull_stops"
                value={formData.push_pull_stops}
                onChange={handleChange}
                step="0.5"
                min="-3"
                max="3"
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-film-cyan focus:border-film-cyan"
              />
            </div>
          </div>

          {/* Film Cost - Full Width */}
          <div className="mt-4">
            <label htmlFor="film_cost" className="block text-sm font-medium text-gray-700 mb-1">
              Film Cost ($) *
            </label>
            <input
              type="number"
              id="film_cost"
              name="film_cost"
              value={formData.film_cost}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-film-cyan focus:border-film-cyan ${
                errors.film_cost ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.film_cost && <p className="mt-1 text-xs text-red-600">{errors.film_cost}</p>}
          </div>

          {/* Not Mine Checkbox */}
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="not_mine"
                checked={formData.not_mine}
                onChange={handleChange}
                className="w-4 h-4 text-film-cyan border-gray-300 rounded focus:ring-film-cyan"
              />
              <span className="ml-2 text-sm text-gray-700">
                👥 This is a friend's roll (exclude film cost from calculations)
              </span>
            </label>
          </div>

          {/* Notes */}
          <div className="mt-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-film-cyan focus:border-film-cyan"
              placeholder="Any additional notes about this roll..."
            />
          </div>

          {/* Cost Preview */}
          {formData.film_cost && formData.expected_exposures && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs sm:text-sm font-medium text-gray-700">Film Cost:</span>
                <span className="text-base sm:text-lg font-bold text-green-700">
                  ${parseFloat(formData.film_cost).toFixed(2)}
                </span>
              </div>
              {calculateCostPerShot() && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">
                    Cost per shot ({formData.expected_exposures} exp):
                  </span>
                  <span className="text-sm font-semibold text-green-600">
                    ${calculateCostPerShot()}/shot
                  </span>
                </div>
              )}
              {formData.not_mine && (
                <p className="text-xs text-gray-500 mt-2 italic">
                  👥 Friend's roll - cost excluded from totals
                </p>
              )}
            </div>
          )}


          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="my-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-gray-700 mb-2">
                Delete this roll? This cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 hover:underline transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1 text-xs text-red-600 hover:text-red-700 font-medium hover:underline transition-colors disabled:opacity-50"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Yes, delete'}
                </button>
              </div>
            </div>
          )}

          {/* Delete Link - De-emphasized */}
          {!showDeleteConfirm && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-red-600 hover:text-red-700 hover:underline transition-colors disabled:opacity-50"
                disabled={isSubmitting || isDeleting}
              >
                Delete this roll
              </button>
            </div>
          )}
        </form>

        {/* Actions - Fixed Footer */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-gray-200 bg-white/50 rounded-b-lg">
          {/* Submit Error */}
          {errors.submit && (
            <div className="text-red-600 text-xs sm:text-sm text-center p-2 bg-red-50 rounded mb-3">
              {errors.submit}
            </div>
          )}

          {/* Save/Cancel Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 sm:py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors text-sm sm:text-base"
              disabled={isSubmitting || isDeleting}
            >
              Cancel
            </button>
            {roll && roll.status === 'NEW' && onDuplicate && (
              <button
                type="button"
                onClick={handleDuplicate}
                className="flex-1 px-4 py-2.5 sm:py-2 bg-film-amber hover:bg-film-amber/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                disabled={isSubmitting || isDeleting}
              >
                📋 Duplicate
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 px-4 py-2.5 sm:py-2 bg-film-cyan hover:bg-film-cyan/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              disabled={isSubmitting || isDeleting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRollForm;
