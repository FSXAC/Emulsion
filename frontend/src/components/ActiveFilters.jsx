import Icon from './Icon';

/**
 * ActiveFilters component
 * 
 * Displays active search filters as removable pill badges
 */
export default function ActiveFilters({
  filters = [],
  onRemoveFilter,
  onClearAll,
}) {
  if (!filters || filters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
        Active filters:
      </span>
      
      {filters.map((filter, index) => (
        <div
          key={index}
          className="
            inline-flex items-center gap-1.5 
            px-2.5 py-1 
            bg-film-orange-600/10 dark:bg-film-orange-600/20
            border border-film-orange-600/30 dark:border-film-orange-600/40
            text-film-orange-600 dark:text-film-orange-500
            rounded-full 
            text-xs font-medium
            group
            hover:bg-film-orange-600/20 dark:hover:bg-film-orange-600/30
            transition-colors
          "
        >
          {/* Filter label */}
          <span className="max-w-[200px] truncate">
            {filter.field ? (
              <>
                <span className="font-semibold">{filter.field}</span>
                <span className="opacity-70">{filter.operator || ':'}</span>
                <span>{filter.value}</span>
              </>
            ) : (
              <span>{filter.value}</span>
            )}
          </span>
          
          {/* Remove button */}
          {onRemoveFilter && (
            <button
              onClick={() => onRemoveFilter(index)}
              className="
                p-0.5 rounded-full
                hover:bg-film-orange-600/30 dark:hover:bg-film-orange-600/40
                transition-colors
              "
              aria-label={`Remove filter: ${filter.field ? `${filter.field}:${filter.value}` : filter.value}`}
              type="button"
            >
              <Icon name="x" size={12} />
            </button>
          )}
        </div>
      ))}
      
      {/* Clear all button */}
      {onClearAll && filters.length > 1 && (
        <button
          onClick={onClearAll}
          className="
            text-xs text-gray-500 dark:text-gray-400
            hover:text-gray-700 dark:hover:text-gray-300
            hover:underline
            transition-colors
          "
          type="button"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
