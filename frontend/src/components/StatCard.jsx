import Icon from './Icon';

/**
 * StatCard - Display a single statistic with icon and styling
 * Used for big number cards on statistics page
 */
export default function StatCard({ title, value, icon, color = 'cyan', subtitle }) {
  // Color mapping for different themes
  const colorClasses = {
    cyan: 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
  };

  const colorClass = colorClasses[color] || colorClasses.cyan;

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
