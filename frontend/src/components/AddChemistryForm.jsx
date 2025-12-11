import { useState, useEffect } from 'react';

const AddChemistryForm = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    chemistry_type: 'C41',
    date_mixed: new Date().toISOString().split('T')[0], // Today's date
    developer_cost: '',
    fixer_cost: '',
    other_cost: '',
    rolls_offset: 0,
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when initialData changes (for duplication)
  useEffect(() => {
    if (initialData && isOpen) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        date_mixed: new Date().toISOString().split('T')[0], // Always use today for new batch
      }));
    } else if (isOpen) {
      // Reset to defaults when opening without initialData
      setFormData({
        name: '',
        chemistry_type: 'C41',
        date_mixed: new Date().toISOString().split('T')[0],
        developer_cost: '',
        fixer_cost: '',
        other_cost: '',
        rolls_offset: 0,
        notes: '',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Chemistry batch name is required';
    if (!formData.chemistry_type.trim()) newErrors.chemistry_type = 'Chemistry type is required';
    
    // Cost validation - at least one cost must be provided
    const devCost = parseFloat(formData.developer_cost) || 0;
    const fixCost = parseFloat(formData.fixer_cost) || 0;
    const otherCost = parseFloat(formData.other_cost) || 0;
    const totalCost = devCost + fixCost + otherCost;
    
    if (totalCost <= 0) {
      newErrors.developer_cost = 'At least one cost must be greater than 0';
    }

    // Ensure costs are non-negative if provided
    if (formData.developer_cost !== '' && parseFloat(formData.developer_cost) < 0) {
      newErrors.developer_cost = 'Cost cannot be negative';
    }
    if (formData.fixer_cost !== '' && parseFloat(formData.fixer_cost) < 0) {
      newErrors.fixer_cost = 'Cost cannot be negative';
    }
    if (formData.other_cost !== '' && parseFloat(formData.other_cost) < 0) {
      newErrors.other_cost = 'Cost cannot be negative';
    }

    // Rolls offset validation
    if (formData.rolls_offset < 0) {
      newErrors.rolls_offset = 'Rolls offset cannot be negative';
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
        name: formData.name.trim(),
        chemistry_type: formData.chemistry_type,
        date_mixed: formData.date_mixed || null,
        developer_cost: formData.developer_cost ? parseFloat(formData.developer_cost) : 0,
        fixer_cost: formData.fixer_cost ? parseFloat(formData.fixer_cost) : 0,
        other_cost: formData.other_cost ? parseFloat(formData.other_cost) : 0,
        rolls_offset: parseInt(formData.rolls_offset) || 0,
        notes: formData.notes.trim() || null,
      };

      await onSubmit(submitData);
      handleClose();
    } catch (err) {
      console.error('Form submission error:', err);
      setErrors({ submit: err.message || 'Failed to add chemistry batch. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      chemistry_type: 'C41',
      date_mixed: new Date().toISOString().split('T')[0],
      developer_cost: '',
      fixer_cost: '',
      other_cost: '',
      rolls_offset: 0,
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

  // Calculate total cost for preview
  const calculateTotalCost = () => {
    const devCost = parseFloat(formData.developer_cost) || 0;
    const fixCost = parseFloat(formData.fixer_cost) || 0;
    const otherCost = parseFloat(formData.other_cost) || 0;
    return devCost + fixCost + otherCost;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full m-0 sm:m-4 sm:my-8 min-h-screen sm:min-h-0 flex flex-col max-h-screen sm:max-h-[90vh]">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Add Chemistry Batch</h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Create a new chemistry batch for developing</p>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Batch Name */}
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Batch Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-film-cyan focus:border-film-cyan ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., C41 Batch #42"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Chemistry Type */}
            <div>
              <label htmlFor="chemistry_type" className="block text-sm font-medium text-gray-700 mb-1">
                Chemistry Type *
              </label>
              <select
                id="chemistry_type"
                name="chemistry_type"
                value={formData.chemistry_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-film-cyan focus:border-film-cyan"
              >
                <option value="C41">C-41 (Color Negative)</option>
                <option value="E6">E-6 (Color Positive/Slide)</option>
                <option value="BW">Black & White</option>
                <option value="ECN2">ECN-2 (Motion Picture)</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Date Mixed */}
            <div>
              <label htmlFor="date_mixed" className="block text-sm font-medium text-gray-700 mb-1">
                Date Mixed
              </label>
              <input
                type="date"
                id="date_mixed"
                name="date_mixed"
                value={formData.date_mixed}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-film-cyan focus:border-film-cyan ${
                  errors.date_mixed ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date_mixed && <p className="mt-1 text-xs text-red-600">{errors.date_mixed}</p>}
            </div>

            {/* Developer Cost */}
            <div>
              <label htmlFor="developer_cost" className="block text-sm font-medium text-gray-700 mb-1">
                Developer Cost ($)
              </label>
              <input
                type="number"
                id="developer_cost"
                name="developer_cost"
                value={formData.developer_cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-film-cyan focus:border-film-cyan ${
                  errors.developer_cost ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.developer_cost && <p className="mt-1 text-xs text-red-600">{errors.developer_cost}</p>}
            </div>

            {/* Fixer Cost */}
            <div>
              <label htmlFor="fixer_cost" className="block text-sm font-medium text-gray-700 mb-1">
                Fixer Cost ($)
              </label>
              <input
                type="number"
                id="fixer_cost"
                name="fixer_cost"
                value={formData.fixer_cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-film-cyan focus:border-film-cyan ${
                  errors.fixer_cost ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.fixer_cost && <p className="mt-1 text-xs text-red-600">{errors.fixer_cost}</p>}
            </div>

            {/* Other Cost */}
            <div>
              <label htmlFor="other_cost" className="block text-sm font-medium text-gray-700 mb-1">
                Other Cost ($)
              </label>
              <input
                type="number"
                id="other_cost"
                name="other_cost"
                value={formData.other_cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-film-cyan focus:border-film-cyan ${
                  errors.other_cost ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              <p className="mt-1 text-xs text-gray-500">Stabilizer, pre-wash, etc.</p>
              {errors.other_cost && <p className="mt-1 text-xs text-red-600">{errors.other_cost}</p>}
            </div>

            {/* Rolls Offset */}
            <div>
              <label htmlFor="rolls_offset" className="block text-sm font-medium text-gray-700 mb-1">
                Rolls Offset
              </label>
              <input
                type="number"
                id="rolls_offset"
                name="rolls_offset"
                value={formData.rolls_offset}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-film-cyan focus:border-film-cyan ${
                  errors.rolls_offset ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <p className="mt-1 text-xs text-gray-500">Pre-developed test rolls (for cost calculation)</p>
              {errors.rolls_offset && <p className="mt-1 text-xs text-red-600">{errors.rolls_offset}</p>}
            </div>
          </div>

          {/* Total Cost Preview */}
          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Chemistry Cost:</span>
              <span className="text-lg font-bold text-purple-700">${calculateTotalCost().toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This cost will be amortized across all rolls developed with this batch
            </p>
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
              placeholder="Any notes about this batch (brand, dilution, shelf life, etc.)"
            />
          </div>

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
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-film-cyan hover:bg-film-cyan/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddChemistryForm;
