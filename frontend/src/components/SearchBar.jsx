import { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

/**
 * SearchBar component with syntax support
 * 
 * Features:
 * - Manual search on Enter key or arrow button click
 * - Clear button when text is present
 * - Optional syntax help button
 * - Mobile-friendly with appropriate keyboard
 */
export default function SearchBar({
  value = '',
  onChange,
  onSearch,
  onClear,
  onShowHelp,
  placeholder = 'Search rolls... (e.g., format:120 status:loaded)',
  showSyntaxHelp = true,
}) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef(null);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle input change (only update local state, don't search)
  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    // Update onChange for controlled component behavior, but don't trigger search
    if (onChange) {
      onChange(newValue);
    }
  };

  // Handle search submission
  const handleSearch = () => {
    // Trigger search - use onSearch if provided, otherwise fall back to onChange
    if (onSearch) {
      onSearch(localValue);
    } else if (onChange) {
      onChange(localValue);
    }
  };

  // Handle keyboard events
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      // Clear search on Escape
      handleClear();
      inputRef.current?.blur();
    }
  };

  // Handle clear button
  const handleClear = () => {
    setLocalValue('');
    
    if (onChange) {
      onChange('');
    }
    if (onClear) {
      onClear();
    }
    
    inputRef.current?.focus();
  };

  return (
    <div className="flex items-center gap-2">
      {/* Search input container */}
      <div className="relative flex-1">
        {/* Search icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500">
          <Icon name="search" size={18} />
        </div>

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="
            w-full pl-10 pr-24 py-2.5
            text-sm
            border border-gray-300 dark:border-gray-600 
            rounded-lg 
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-film-orange-600 focus:border-film-orange-600
            transition-colors
          "
          aria-label="Search film rolls"
        />

        {/* Action buttons container - inside search bar */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Search/Submit button */}
          {localValue && (
            <button
              onClick={handleSearch}
              className="
                p-1 rounded-full
                text-film-orange-600 dark:text-film-orange-500
                hover:text-film-orange-600/80 dark:hover:text-film-orange-600/80
                hover:bg-film-orange-600/10 dark:hover:bg-film-orange-600/20
                transition-colors
              "
              aria-label="Search"
              type="button"
              title="Search (Enter)"
            >
              <Icon name="arrowRight" size={16} />
            </button>
          )}

          {/* Clear button */}
          {localValue && (
            <button
              onClick={handleClear}
              className="
                p-1 rounded-full
                text-gray-400 dark:text-gray-500
                hover:text-gray-600 dark:hover:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-700
                transition-colors
              "
              aria-label="Clear search"
              type="button"
              title="Clear (Esc)"
            >
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Help button - matches input height */}
      {showSyntaxHelp && onShowHelp && (
        <button
          onClick={onShowHelp}
          className="
            flex-shrink-0 flex items-center justify-center
            h-[42px] w-[42px]
            rounded-lg
            border border-gray-300 dark:border-gray-600
            text-gray-600 dark:text-gray-400
            hover:bg-gray-100 dark:hover:bg-gray-700
            hover:text-gray-900 dark:hover:text-gray-100
            transition-colors
          "
          aria-label="Show search syntax help"
          type="button"
          title="Search syntax help (Cmd/Ctrl+K)"
        >
          <Icon name="help" size={18} />
        </button>
      )}
    </div>
  );
}
