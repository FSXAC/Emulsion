import { useState, useEffect } from 'react';
import AutocompleteInput from './AutocompleteInput';
import { getRolls } from '../services/rolls';
import Icon from './Icon';
import { getFilmStockImage } from '../utils/filmStockImages';
import { useSound } from '../hooks/useSound';

const EditRollForm = ({ isOpen, onClose, onSubmit, onDelete, onDuplicate, onSpoolUp, roll, onStatusChange }) => {
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

  const handlePushPullWheel = (e) => {
    e.preventDefault();
    const step = 0.5;
    const min = -3;
    const max = 3;
    const currentValue = parseFloat(formData.push_pull_stops) || 0;
    
    // Determine scroll direction: negative deltaY = scroll up = increment
    const delta = e.deltaY < 0 ? step : -step;
    const newValue = Math.max(min, Math.min(max, currentValue + delta));
    
    // Round to nearest 0.5 to handle floating point precision
    const roundedValue = Math.round(newValue * 2) / 2;
    
    setFormData(prev => ({
      ...prev,
      push_pull_stops: roundedValue
    }));
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

  const handleSpoolUp = () => {
    if (!roll || !onSpoolUp) return;
    onSpoolUp(roll);
    handleClose();
  };

  // Detect if this is a bulk roll (35mm, NEW status, >36 exposures)
  const isBulkRoll = roll &&
                     roll.status === 'NEW' &&
                     (roll.film_format === '35mm' || roll.film_format === '35 mm') &&
                     roll.expected_exposures > 36;

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
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-3xl w-full m-0 sm:m-4 sm:my-8 min-h-screen sm:min-h-0 flex flex-col max-h-screen sm:max-h-[90vh] border border-gray-200/50 dark:border-gray-700/50">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-gray-200/60 dark:border-gray-700/60">
          <div className="flex items-start gap-4">
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-16 h-24 sm:w-20 sm:h-28 overflow-hidden rounded-2xl shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
              <img
                src={getFilmStockImage(roll.film_stock_name, roll.film_format)}
                alt={roll.film_stock_name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title and Status */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Film Roll</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Update details for this roll</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Status:</span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-800 dark:text-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.15)]">
                  {roll.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Change Buttons - Mobile Only */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-b border-gray-200/60 dark:border-gray-700/60 bg-gray-50/60 dark:bg-gray-700/30 backdrop-blur-sm sm:hidden">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Change Status:</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {roll.status !== 'NEW' && (
              <button
                type="button"
                onClick={() => handleStatusChange('NEW')}
                className="flex-shrink-0 px-3 py-1.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-medium hover:bg-white dark:hover:bg-gray-600/80 transition-all duration-200 flex items-center gap-1 shadow-[0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_3px_5px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.2)]"
              >
                <Icon name="film" size={14} /> New
              </button>
            )}
            {roll.status !== 'LOADED' && (
              <button
                type="button"
                onClick={() => handleStatusChange('LOADED')}
                className="flex-shrink-0 px-3 py-1.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-medium hover:bg-white dark:hover:bg-gray-600/80 transition-all duration-200 flex items-center gap-1 shadow-[0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_3px_5px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.2)]"
              >
                <Icon name="camera" size={14} /> Loaded
              </button>
            )}
            {roll.status !== 'EXPOSED' && (
              <button
                type="button"
                onClick={() => handleStatusChange('EXPOSED')}
                className="flex-shrink-0 px-3 py-1.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-medium hover:bg-white dark:hover:bg-gray-600/80 transition-all duration-200 flex items-center gap-1 shadow-[0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_3px_5px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.2)]"
              >
                <Icon name="checkCircle" size={14} /> Exposed
              </button>
            )}
            {roll.status !== 'DEVELOPED' && (
              <button
                type="button"
                onClick={() => handleStatusChange('DEVELOPED')}
                className="flex-shrink-0 px-3 py-1.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-medium hover:bg-white dark:hover:bg-gray-600/80 transition-all duration-200 flex items-center gap-1 shadow-[0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_3px_5px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.2)]"
              >
                <Icon name="chemistry" size={14} /> Developed
              </button>
            )}
            {roll.status !== 'SCANNED' && (
              <button
                type="button"
                onClick={() => handleStatusChange('SCANNED')}
                className="flex-shrink-0 px-3 py-1.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-medium hover:bg-white dark:hover:bg-gray-600/80 transition-all duration-200 flex items-center gap-1 shadow-[0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_3px_5px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.2)]"
              >
                <Icon name="star" size={14} /> Scanned
              </button>
            )}
          </div>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {/* Film Stock Name - Full Width */}
          <div className="mb-4">
            <label htmlFor="film_stock_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Film Stock *
            </label>
            <AutocompleteInput
              id="film_stock_name"
              name="film_stock_name"
              value={formData.film_stock_name}
              onChange={handleChange}
              suggestions={filmStockSuggestions}
              placeholder="e.g., Kodak Portra 400"
              className={`w-full px-3.5 py-2.5 bg-white/60 dark:bg-gray-700/40 backdrop-blur-sm border-0 rounded-3xl transition-all duration-100 focus:ring-2 focus:bg-white dark:focus:bg-gray-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(0,0,0,0.05)] focus:shadow-[inset_0_2px_5px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(0,0,0,0.06)] ${errors.film_stock_name ? 'ring-2 ring-red-400 dark:ring-red-500' : ''
                }`}
            />
            {errors.film_stock_name && <p className="mt-1 text-xs text-red-600">{errors.film_stock_name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Order ID */}
            <div>
              <label htmlFor="order_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Order ID *
              </label>
              <AutocompleteInput
                id="order_id"
                name="order_id"
                value={formData.order_id}
                onChange={handleChange}
                suggestions={orderIdSuggestions}
                placeholder="42"
                className={`w-full px-3.5 py-2.5 bg-white/60 dark:bg-gray-700/40 backdrop-blur-sm border-0 rounded-3xl transition-all duration-200 focus:ring-2 focus:bg-white dark:focus:bg-gray-700/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(0,0,0,0.05)] focus:shadow-[inset_0_2px_5px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(0,0,0,0.06)] ${errors.order_id ? 'ring-2 ring-red-400 dark:ring-red-500' : ''
                  }`}
              />
              {errors.order_id && <p className="mt-1 text-xs text-red-600">{errors.order_id}</p>}
            </div>

            {/* Expected Exposures */}
            <div>
              <label htmlFor="expected_exposures" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Exposures *
              </label>
              <input
                type="number"
                id="expected_exposures"
                name="expected_exposures"
                value={formData.expected_exposures}
                onChange={handleChange}
                min="1"
                className={`w-full px-3.5 py-2.5 bg-white/60 dark:bg-gray-700/40 backdrop-blur-sm border-0 rounded-3xl transition-all duration-200 focus:ring-2 focus:bg-white dark:focus:bg-gray-700/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(0,0,0,0.05)] focus:shadow-[inset_0_2px_5px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(0,0,0,0.06)] ${errors.expected_exposures ? 'ring-2 ring-red-400 dark:ring-red-500' : ''
                  }`}
              />
              {errors.expected_exposures && <p className="mt-1 text-xs text-red-600">{errors.expected_exposures}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
            {/* Film Format */}
            <div>
              <label htmlFor="film_format" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Format *
              </label>
              <select
                id="film_format"
                name="film_format"
                value={formData.film_format}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white/60 dark:bg-gray-700/40 backdrop-blur-sm border-0 rounded-3xl transition-all duration-200 focus:ring-2 focus:bg-white dark:focus:bg-gray-700/60 text-sm appearance-none bg-[length:1.5em] bg-[right_0.5rem_center] bg-no-repeat shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(0,0,0,0.05)] focus:shadow-[inset_0_2px_5px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(0,0,0,0.06)]" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%236b7280\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")'}}
              >
                <option value="35 mm">35 mm</option>
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
              <label htmlFor="push_pull_stops" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Push/Pull
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="range"
                    id="push_pull_stops"
                    name="push_pull_stops"
                    value={formData.push_pull_stops}
                    onChange={handleChange}
                    onWheel={handlePushPullWheel}
                    step="0.5"
                    min="-3"
                    max="3"
                    list="push_pull_marks"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-film-orange-600"
                  />
                  <datalist id="push_pull_marks">
                    <option value="-3" label="-3"></option>
                    <option value="-2.5" label="-2.5"></option>
                    <option value="-2" label="-2"></option>
                    <option value="-1.5" label="-1.5"></option>
                    <option value="-1" label="-1"></option>
                    <option value="-0.5" label="-0.5"></option>
                    <option value="0" label="0"></option>
                    <option value="0.5" label="0.5"></option>
                    <option value="1" label="1"></option>
                    <option value="1.5" label="1.5"></option>
                    <option value="2" label="2"></option>
                    <option value="2.5" label="2.5"></option>
                    <option value="3" label="3"></option>
                  </datalist>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem] text-right">
                  {formData.push_pull_stops > 0 ? '+' : ''}{formData.push_pull_stops}
                </span>
              </div>
            </div>
          </div>

          {/* Film Cost - Full Width */}
          <div className="mt-4">
            <label htmlFor="film_cost" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              className={`w-full px-3.5 py-2.5 bg-white/60 dark:bg-gray-700/40 backdrop-blur-sm border-0 rounded-3xl transition-all duration-200 focus:ring-2 focus:bg-white dark:focus:bg-gray-700/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(0,0,0,0.05)] focus:shadow-[inset_0_2px_5px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(0,0,0,0.06)] ${errors.film_cost ? 'ring-2 ring-red-400 dark:ring-red-500' : ''
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
                className="w-4 h-4 text-film-orange-600 border-0 rounded-lg bg-white/60 dark:bg-gray-700/40 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-offset-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Icon name="users" size={16} /> This is a friend's roll (exclude film cost from calculations)
              </span>
            </label>
          </div>


          {/* Cost Preview */}
          {formData.film_cost && formData.expected_exposures && (
            <div className="mt-4 pt-3 pb-4 px-5 bg-green-50/60 dark:bg-green-900/10 backdrop-blur-sm border-0 rounded-3xl shadow-[0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.15)]">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Film Cost:</span>
                <span className="text-base sm:text-lg font-bold text-green-700 dark:text-green-400">
                  ${parseFloat(formData.film_cost).toFixed(2)}
                </span>
              </div>
              {calculateCostPerShot() && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Cost per shot ({formData.expected_exposures} exp):
                  </span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-500">
                    ${calculateCostPerShot()}&nbsp;/shot
                  </span>
                </div>
              )}
              {formData.not_mine && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                  <Icon name="users" size={12} /> Friend's roll - cost excluded from totals
                </p>
              )}
            </div>
          )}


          {/* Notes */}
          <div className="mt-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full pt-3 pb-4 px-5 bg-white/60 dark:bg-gray-700/40 backdrop-blur-sm border-0 rounded-3xl transition-all duration-200 focus:ring-2 focus:bg-white dark:focus:bg-gray-700/60 resize-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(0,0,0,0.05)] focus:shadow-[inset_0_2px_5px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(0,0,0,0.06)]"
              placeholder="Any additional notes about this roll..."
            />
          </div>


          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="my-3 p-3 bg-red-50/60 dark:bg-red-900/10 backdrop-blur-sm border-0 rounded-3xl shadow-[0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.15)]">
              <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                Delete this roll? This cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:underline transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium hover:underline transition-colors disabled:opacity-50"
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
                className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline transition-colors disabled:opacity-50"
                disabled={isSubmitting || isDeleting}
              >
                Delete this roll
              </button>
            </div>
          )}
        </form>

        {/* Actions - Fixed Footer */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-gray-200/60 dark:border-gray-700/60 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-b-2xl">
          {/* Submit Error */}
          {errors.submit && (
            <div className="text-red-600 dark:text-red-400 text-xs sm:text-sm text-center p-2 bg-red-50/60 dark:bg-red-900/10 backdrop-blur-sm rounded-3xl mb-3 border-0 shadow-[0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.15)]">
              {errors.submit}
            </div>
          )}

          {/* Save/Cancel Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 sm:py-2 bg-gray-200/80 hover:bg-gray-300/90 dark:bg-gray-700/60 dark:hover:bg-gray-600/70 backdrop-blur-sm text-gray-800 dark:text-gray-200 rounded-3xl font-medium transition-all duration-200 text-sm sm:text-base shadow-[0_4px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_6px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.2)] border-0"
              disabled={isSubmitting || isDeleting}
            >
              Cancel
            </button>
            {roll && roll.status === 'NEW' && onDuplicate && (
              <button
                type="button"
                onClick={handleDuplicate}
                className="flex-1 px-4 py-2.5 sm:py-2 bg-film-orange-400/40 hover:bg-film-orange-300/20 backdrop-blur-sm text-white rounded-3xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_4px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_6px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.2)] border-0"
                disabled={isSubmitting || isDeleting}
              >
                <Icon name="copy" size={18} /> Duplicate
              </button>
            )}
            {isBulkRoll && onSpoolUp && (
              <button
                type="button"
                onClick={handleSpoolUp}
                className="flex-1 px-4 py-2.5 sm:py-2 bg-purple-600 hover:bg-purple-700 backdrop-blur-sm text-white rounded-3xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_4px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_6px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.2)] border-0"
                disabled={isSubmitting || isDeleting}
              >
                <Icon name="film" size={18} /> Spool Up
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 px-4 py-2.5 sm:py-2 backdrop-blur-sm text-white rounded-3xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shadow-sm hover:shadow-md bg-film-orange-600 hover:bg-film-orange-400 shadow-[0_4px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_6px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.2)]"
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
