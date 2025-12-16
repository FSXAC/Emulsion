const LoadingSpinner = ({ size = 'md', text = null }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size]} border-gray-300 border-t-film-orange-600 rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      ></div>
      {text && (
        <div className="text-sm text-gray-500">{text}</div>
      )}
    </div>
  );
};

export default LoadingSpinner;
