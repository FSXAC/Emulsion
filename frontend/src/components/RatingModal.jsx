import { useState, useEffect } from 'react';
import Icon from './Icon';
import { useSound } from '../hooks/useSound';

const RatingModal = ({ isOpen, onClose, onConfirm, roll }) => {
  const { playClick } = useSound();
  const [stars, setStars] = useState(3);
  const [actualExposures, setActualExposures] = useState('');
  const [hoveredStar, setHoveredStar] = useState(null);

  useEffect(() => {
    if (isOpen && roll) {
      setStars(roll.stars || 3);
      setActualExposures(roll.actual_exposures?.toString() || '');
    }
  }, [isOpen, roll]);

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
    const exposures = actualExposures ? parseInt(actualExposures) : null;
    
    // Validate actual exposures if provided
    if (exposures !== null && (isNaN(exposures) || exposures < 1)) {
      alert('Please enter a valid number of exposures (1 or more)');
      return;
    }
    
    playClick();
    onConfirm(stars, exposures);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderStarButton = (starNumber) => {
    const isFilled = (hoveredStar !== null ? hoveredStar : stars) >= starNumber;
    
    return (
      <button
        key={starNumber}
        type="button"
        onClick={() => setStars(starNumber)}
        onMouseEnter={() => setHoveredStar(starNumber)}
        onMouseLeave={() => setHoveredStar(null)}
        className="text-5xl transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-film-orange-600 rounded"
        aria-label={`${starNumber} star${starNumber !== 1 ? 's' : ''}`}
      >
        <Icon 
          name="star" 
          size={48}
          className={`${isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 animate-fadeIn border border-gray-200/50 dark:border-gray-700/50">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Rate This Roll</h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            How did this roll turn out?
          </p>
          {roll && (
            <p className="text-sm text-gray-500 mt-2">
              Roll: <span className="font-medium">{roll.film_stock_name}</span>
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Rating
            </label>
            <div className="flex justify-center gap-2 py-4">
              {[1, 2, 3, 4, 5].map(renderStarButton)}
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">
              {stars} star{stars !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Rating Guide */}
          <div className="mb-6 bg-gray-50/60 dark:bg-gray-700/30 backdrop-blur-sm rounded-3xl p-4 border-0 shadow-[0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.15)]">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Rating Guide:</p>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div><span className="font-semibold">1 star:</span> Major issues, mostly unusable</div>
              <div><span className="font-semibold">2 stars:</span> Below average, some good shots</div>
              <div><span className="font-semibold">3 stars:</span> Good, solid results</div>
              <div><span className="font-semibold">4 stars:</span> Great roll, very happy</div>
              <div><span className="font-semibold">5 stars:</span> Exceptional, favorite shots</div>
            </div>
          </div>

          {/* Actual Exposures */}
          <div className="mb-6">
            <label htmlFor="actual-exposures" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Actual Exposures (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              How many frames were actually usable after scanning?
            </p>
            <input
              id="actual-exposures"
              type="number"
              min="1"
              max="999"
              value={actualExposures}
              onChange={(e) => setActualExposures(e.target.value)}
              placeholder={roll?.expected_exposures ? `Expected: ${roll.expected_exposures}` : 'e.g., 36'}
              className="w-full px-4 py-3 bg-white/60 dark:bg-gray-700/40 backdrop-blur-sm border-0 rounded-3xl transition-all duration-200 focus:ring-2 focus:bg-white dark:focus:bg-gray-700/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(0,0,0,0.05)] focus:shadow-[inset_0_2px_5px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(0,0,0,0.06)]"
            />
            {roll?.expected_exposures && actualExposures && (
              <p className="text-xs text-gray-500 mt-2">
                {parseInt(actualExposures) === roll.expected_exposures ? (
                  <span className="text-green-600">✓ Matches expected exposures</span>
                ) : parseInt(actualExposures) < roll.expected_exposures ? (
                  <span className="text-amber-600 flex items-center gap-1">
                    <Icon name="warning" size={12} /> {roll.expected_exposures - parseInt(actualExposures)} fewer than expected
                  </span>
                ) : (
                  <span className="text-blue-600">
                    + {parseInt(actualExposures) - roll.expected_exposures} more than expected
                  </span>
                )}
              </p>
            )}
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
              Save Rating
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;
