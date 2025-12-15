import Icon from './Icon';

/**
 * StatCard - Display a single statistic with icon and styling
 * Used for big number cards on statistics page
 */
export default function StatCard({ title, value, icon, color = 'medium', subtitle }) {
  // Color mapping using film-orange variations for different emphasis levels
  const colorClasses = {
    light: 'bg-film-orange-50 border-film-orange-100 text-film-orange-700',
    medium: 'bg-film-orange-100 border-film-orange-200 text-film-orange-800',
    strong: 'bg-film-orange-200 border-film-orange-300 text-film-orange-900',
  };

  const colorClass = colorClasses[color] || colorClasses.medium;

  return (
    <div className={`rounded-xl border p-4 sm:p-6 ${colorClass} transition-all duration-200 hover:shadow-md`}>
      {/* Icon and Title */}
      <div className="flex items-center gap-2 mb-2">
        <Icon name={icon} size={20} className="opacity-70" />
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </h3>
      </div>

      {/* Main Value */}
      <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        {value}
      </div>

      {/* Subtitle (optional) */}
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}
