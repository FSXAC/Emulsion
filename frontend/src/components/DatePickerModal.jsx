import { useState, useEffect } from 'react';
import { useSound } from '../hooks/useSound';

const DatePickerModal = ({ isOpen, onClose, onConfirm, title, defaultDate = null }) => {
  const { playClick } = useSound();
  const [selectedDate, setSelectedDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isOpen && defaultDate) {
      setSelectedDate(defaultDate);
    } else if (isOpen) {
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, defaultDate]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedDate) {
      playClick();
      onConfirm(selectedDate);
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 animate-fadeIn">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Select a date for this roll</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="date-input" className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              id="date-input"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-film-cyan focus:border-film-cyan text-lg"
              required
              autoFocus
            />
          </div>

          {/* Quick date buttons */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Quick select:</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setSelectedDate(yesterday.toISOString().split('T')[0]);
                }}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  setSelectedDate(weekAgo.toISOString().split('T')[0]);
                }}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                1 Week Ago
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 sm:py-3 bg-film-cyan hover:bg-film-cyan/90 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DatePickerModal;
