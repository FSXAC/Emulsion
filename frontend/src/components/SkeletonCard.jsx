const SkeletonCard = ({ variant = 'roll' }) => {
  if (variant === 'roll') {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-2 mb-2 w-[300px] border border-[#D9D9D9] animate-pulse">
        {/* Top Section: Thumbnail + Film Info */}
        <div className="flex gap-2 mb-2">
          {/* Left: Film Thumbnail Skeleton */}
          <div className="flex-shrink-0 w-24 h-28 bg-gray-200 rounded"></div>

          {/* Right: Film Info Block Skeleton */}
          <div className="flex-1 flex flex-col justify-between">
            <div className="flex flex-col gap-2">
              {/* Film Stock Name */}
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              
              {/* Format + Exposures */}
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>

              {/* Tags */}
              <div className="flex gap-2">
                <div className="h-5 bg-gray-200 rounded w-16"></div>
              </div>
            </div>

            {/* Rating Row */}
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>

        {/* Stats Block */}
        <div className="bg-gray-100 rounded-xl px-2 py-2 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (variant === 'chemistry') {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-[#D9D9D9] animate-pulse">
        {/* Top Section */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-5 bg-gray-200 rounded w-32"></div>
              <div className="h-5 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-24 mt-1"></div>
          </div>
          <div className="text-right">
            <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
        </div>

        {/* Stats Block */}
        <div className="bg-gray-100 rounded-xl px-3 py-2 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>

        {/* Actions */}
        <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
          <div className="h-3 bg-gray-200 rounded w-20"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    );
  }

  return null;
};

export default SkeletonCard;
