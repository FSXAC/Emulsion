import { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

/**
 * SearchBar component with syntax support and debouncing
 * 
 * Features:
 * - Debounced search input (300ms delay)
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
  debounceMs = 700,
}) {
  const [localValue, setLocalValue] = useState(value);
  const debounceTimerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle input change with debouncing
  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      if (onChange) {
        onChange(newValue);
      }
      if (onSearch) {
        onSearch(newValue);
      }
    }, debounceMs);
  };

  // Handle immediate search (e.g., on Enter key)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      // Clear debounce timer and search immediately
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      if (onChange) {
        onChange(localValue);
      }
      if (onSearch) {
        onSearch(localValue);
      }
    } else if (e.key === 'Escape') {
      // Clear search on Escape
      handleClear();
      inputRef.current?.blur();
    }
  };

  // Handle clear button
  const handleClear = () => {
    setLocalValue('');
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    if (onChange) {
      onChange('');
    }
    if (onClear) {
      onClear();
    }
    
    inputRef.current?.focus();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

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
            w-full pl-10 pr-10 py-2.5
            text-sm
            border border-gray-300 dark:border-gray-600 
            rounded-lg 
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-film-cyan focus:border-film-cyan
            transition-colors
          "
          aria-label="Search film rolls"
        />

        {/* Clear button - inside search bar */}
        {localValue && (
          <button
            onClick={handleClear}
            className="
              absolute right-2 top-1/2 -translate-y-1/2
              p-1 rounded-full
              text-gray-400 dark:text-gray-500
              hover:text-gray-600 dark:hover:text-gray-300
              hover:bg-gray-100 dark:hover:bg-gray-700
              transition-colors
            "
            aria-label="Clear search"
            type="button"
          >
            <Icon name="x" size={16} />
          </button>
        )}
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
