import { useState, useEffect } from 'react';
import AutocompleteInput from './AutocompleteInput';
import { getRolls } from '../services/rolls';
import Icon from './Icon';
import { useSound } from '../hooks/useSound';

const AddRollForm = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const { playClick } = useSound();
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
  const [filmStockSuggestions, setFilmStockSuggestions] = useState([]);
  const [orderIdSuggestions, setOrderIdSuggestions] = useState([]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  // Populate form with initial data when provided (for duplication)
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        order_id: initialData.order_id || '',
        film_stock_name: initialData.film_stock_name || '',
        film_format: initialData.film_format || '35mm',
        expected_exposures: initialData.expected_exposures || 36,
        film_cost: initialData.film_cost || '',
        push_pull_stops: initialData.push_pull_stops || 0,
        not_mine: initialData.not_mine || false,
        notes: '', // Don't copy notes
      });
    } else if (isOpen && !initialData) {
      // Reset to defaults when opening without initial data
      setFormData({
        order_id: '',
        film_stock_name: '',
        film_format: '35mm',
        expected_exposures: 36,
        film_cost: '',
        push_pull_stops: 0,
        not_mine: false,
        notes: '',
      });
    }
  }, [isOpen, initialData]);

  // Fetch suggestions when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSuggestions();
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

  if (!isOpen) return null;

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
    if (!formData.film_cost || parseFloat(formData.film_cost) < 0) {
      newErrors.film_cost = 'Film cost must be 0 or greater';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    playClick();
    setIsSubmitting(true);
    try {
      // Convert string values to proper types
      const submitData = {
        ...formData,
        expected_exposures: parseInt(formData.expected_exposures),
        film_cost: parseFloat(formData.film_cost),
        push_pull_stops: parseFloat(formData.push_pull_stops) || 0,
      };

      await onSubmit(submitData);
      handleClose();
    } catch (err) {
      console.error('Form submission error:', err);
      setErrors({ submit: err.message || 'Failed to add roll. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      order_id: '',
      film_stock_name: '',
      film_format: '35mm',
      expected_exposures: 36,
      film_cost: '',
      push_pull_stops: 0,
      not_mine: false,
      notes: '',
    });
    setErrors({});
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
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

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full m-0 sm:m-4 sm:my-8 min-h-screen sm:min-h-0 flex flex-col max-h-screen sm:max-h-[90vh]">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900">Add New Film Roll</h2>
          <p className="text-sm text-gray-600 mt-1">Enter details for the new film roll</p>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="e.g., 42"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-film-cyan focus:border-film-cyan ${
                  errors.order_id ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.order_id && <p className="mt-1 text-xs text-red-600">{errors.order_id}</p>}
            </div>

            {/* Film Stock Name */}
            <div>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-film-cyan focus:border-film-cyan"
              >
                <option value="35mm">35mm</option>
                <option value="HF">HF (Half Frame)</option>
                <option value="120">120 (Medium Format)</option>
                <option value="110">110</option>
                <option value="126">126</option>
                <option value="4x5">4x5 (Large Format)</option>
                <option value="8x10">8x10 (Large Format)</option>
              </select>
            </div>

            {/* Expected Exposures */}
            <div>
              <label htmlFor="expected_exposures" className="block text-sm font-medium text-gray-700 mb-1">
                Expected Exposures *
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

            {/* Film Cost */}
            <div>
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

            {/* Push/Pull Stops */}
            <div>
              <label htmlFor="push_pull_stops" className="block text-sm font-medium text-gray-700 mb-1">
                Push/Pull Stops
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-film-cyan focus:border-film-cyan"
              />
              <p className="mt-1 text-xs text-gray-500">e.g., +1, -0.5 (range: -3 to +3)</p>
            </div>
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
              <span className="ml-2 text-sm text-gray-700 flex items-center gap-1">
                <Icon name="users" size={16} /> This is a friend's roll (exclude film cost from calculations)
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
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Film Cost:</span>
                <span className="text-lg font-bold text-green-700">
                  ${parseFloat(formData.film_cost).toFixed(2)}
                </span>
              </div>
              {calculateCostPerShot() && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">
                    Estimated cost per shot ({formData.expected_exposures} exposures):
                  </span>
                  <span className="text-sm font-semibold text-green-600">
                    ${calculateCostPerShot()}/shot
                  </span>
                </div>
              )}
              {formData.not_mine && (
                <p className="text-xs text-gray-500 mt-2 italic flex items-center gap-1">
                  <Icon name="users" size={12} /> This cost will not be included in your totals (friend's roll)
                </p>
              )}
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="text-red-600 text-sm text-center p-2 bg-red-50 rounded">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 sm:py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors text-sm sm:text-base"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 sm:py-2 bg-film-cyan hover:bg-film-cyan/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Roll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRollForm;
