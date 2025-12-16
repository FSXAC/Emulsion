import { useState, useEffect } from 'react';
import { useSound } from '../hooks/useSound';
import { formatDateForInput } from '../utils/dateUtils';

const DatePickerModal = ({ isOpen, onClose, onConfirm, title, defaultDate = null }) => {
  const { playClick } = useSound();
  const [selectedDate, setSelectedDate] = useState(defaultDate || formatDateForInput(new Date()));

  useEffect(() => {
    if (isOpen && defaultDate) {
      setSelectedDate(defaultDate);
    } else if (isOpen) {
      setSelectedDate(formatDateForInput(new Date()));
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
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 animate-fadeIn border border-gray-200/50 dark:border-gray-700/50">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Select a date for this roll</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="date-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <input
              id="date-input"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 bg-white/60 dark:bg-gray-700/40 backdrop-blur-sm border-0 rounded-3xl text-lg transition-all duration-200 focus:ring-2 focus:bg-white dark:focus:bg-gray-700/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(0,0,0,0.05)] focus:shadow-[inset_0_2px_5px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(0,0,0,0.06)]"
              required
              autoFocus
            />
          </div>

          {/* Quick date buttons */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick select:</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedDate(formatDateForInput(new Date()))}
                className="px-3 py-1.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-medium hover:bg-white dark:hover:bg-gray-600/80 transition-all duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_3px_5px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.2)]"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setSelectedDate(formatDateForInput(yesterday));
                }}
                className="px-3 py-1.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-medium hover:bg-white dark:hover:bg-gray-600/80 transition-all duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_3px_5px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.2)]"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  setSelectedDate(formatDateForInput(weekAgo));
                }}
                className="px-3 py-1.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-medium hover:bg-white dark:hover:bg-gray-600/80 transition-all duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_3px_5px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.2)]"
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
              className="flex-1 px-4 py-2.5 sm:py-2 bg-gray-200/80 hover:bg-gray-300/90 dark:bg-gray-700/60 dark:hover:bg-gray-600/70 backdrop-blur-sm text-gray-800 dark:text-gray-200 rounded-3xl font-medium transition-all duration-200 text-sm sm:text-base shadow-[0_4px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_6px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 sm:py-2 backdrop-blur-sm text-white rounded-3xl font-medium transition-all duration-200 text-sm sm:text-base bg-film-orange-600 hover:bg-film-orange-700 shadow-[0_4px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_6px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.2)]"
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
