import { useState } from 'react';
import Icon from '../../Icon';
import FilmStockGalleryCard from '../cards/FilmStockGalleryCard';
import { getUniqueFilmStocks } from '../../../utils/statsCalculator';

export default function GalleryTab({ rolls }) {
  const [filterFormat, setFilterFormat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('count'); // 'count', 'name', 'rating'

  const uniqueFilmStocks = getUniqueFilmStocks(rolls);
  
  // Apply filters
  let filteredStocks = uniqueFilmStocks;
  
  if (filterFormat !== 'all') {
    filteredStocks = filteredStocks.filter(stock => stock.format === filterFormat);
  }
  
  if (filterStatus !== 'all') {
    filteredStocks = filteredStocks.filter(stock => 
      stock.rolls.some(roll => roll.status === filterStatus)
    );
  }

  // Apply sorting
  if (sortBy === 'name') {
    filteredStocks.sort((a, b) => a.filmStock.localeCompare(b.filmStock));
  } else if (sortBy === 'rating') {
    filteredStocks.sort((a, b) => (b.roll.stars || 0) - (a.roll.stars || 0));
  }
  // Default is already sorted by count

  // Get unique formats and statuses for filters
  const formats = [...new Set(rolls.map(r => r.film_format))].sort();
  const statuses = ['NEW', 'LOADED', 'EXPOSED', 'DEVELOPED', 'SCANNED'];

  if (rolls.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
        <div className="mb-4 flex justify-center">
          <Icon name="film" size={64} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No film stocks yet</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Start adding film rolls to build your collection gallery
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Sorting */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Format:
            </label>
            <select
              value={filterFormat}
              onChange={(e) => setFilterFormat(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-film-cyan"
            >
              <option value="all">All Formats</option>
              {formats.map(format => (
                <option key={format} value={format}>{format}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status:
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-film-cyan"
            >
              <option value="all">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-film-cyan"
            >
              <option value="count">Most Used</option>
              <option value="name">Name</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredStocks.length} unique film stock{filteredStocks.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Film Stock Grid */}
      {filteredStocks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
          <Icon name="search" size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No matching film stocks
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-4">
          {filteredStocks.map((stock, index) => (
            <FilmStockGalleryCard key={`${stock.filmStock}-${stock.format}-${index}`} stock={stock} />
          ))}
        </div>
      )}
    </div>
  );
}
