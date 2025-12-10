const ErrorMessage = ({ title, message, onRetry }) => {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 max-w-md mx-auto">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-2xl">⚠️</div>
        <div className="flex-1">
          <h3 className="text-red-800 dark:text-red-300 font-semibold mb-2">{title}</h3>
          <p className="text-red-600 dark:text-red-400 text-sm mb-4">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="btn-primary text-sm"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
