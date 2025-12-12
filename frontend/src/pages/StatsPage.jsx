import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, ScatterChart, Scatter, ZAxis, LineChart, Line, ComposedChart } from 'recharts';
import StatCard from '../components/StatCard';
import Icon from '../components/Icon';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { getRolls } from '../services/rolls';
import { getChemistry } from '../services/chemistry';
import { getFilmStockImage } from '../utils/filmStockImages';
import {
  calculateTotalSpending,
  calculateTotalShots,
  calculateAvgCostPerShot,
  calculateStatusDistribution,
  calculateFormatDistribution,
  calculateTopFilmStocks,
  calculateRatingDistribution,
  calculateAverageRating,
  calculateFilmStockStats,
  calculateCostBreakdown,
  calculateChemistryUsage,
  findMostExpensiveRoll,
  findCheapestPerShot,
  toChartData,
  calculateRollsLoadedPerMonth,
  calculateRollsUnloadedPerMonth,
  calculateDurationDistribution,
  getUniqueFilmStocks,
} from '../utils/statsCalculator';

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [rolls, setRolls] = useState([]);
  const [chemistry, setChemistry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all rolls and chemistry batches
      const [rollsData, chemistryData] = await Promise.all([
        getRolls(),
        getChemistry(),
      ]);

      // Handle different response formats
      const allRolls = Array.isArray(rollsData) ? rollsData : (rollsData.rolls || rollsData.items || []);
      const allChemistry = Array.isArray(chemistryData) ? chemistryData : (chemistryData.batches || chemistryData.items || []);

      setRolls(allRolls);
      setChemistry(allChemistry);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to load statistics data');
    } finally {
      setLoading(false);
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'chart' },
    { id: 'costs', label: 'Costs', icon: 'dollar' },
    { id: 'timeline', label: 'Timeline', icon: 'clock' },
    { id: 'gallery', label: 'Gallery', icon: 'film' },
  ];

  if (loading) {
    return (
      <div className="pb-4 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading statistics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Statistics</h2>
          </div>
        </div>
        <ErrorMessage
          title="Error loading statistics"
          message={error}
          onRetry={fetchData}
        />
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Statistics</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Track your film photography journey and spending
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2 sm:gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`
                flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                ${activeTab === tab.id
                  ? 'border-film-cyan text-film-cyan dark:text-film-cyan'
                  : tab.disabled
                    ? 'border-transparent text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <Icon name={tab.icon} size={16} />
              {tab.label}
              {tab.disabled && <span className="text-xs">(Soon)</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6 animate-fade-in">
        {activeTab === 'overview' && (
          <OverviewTab rolls={rolls} chemistry={chemistry} />
        )}
        {activeTab === 'costs' && (
          <CostsTab rolls={rolls} chemistry={chemistry} />
        )}
        {activeTab === 'timeline' && (
          <TimelineTab rolls={rolls} />
        )}
        {activeTab === 'gallery' && (
          <GalleryTab rolls={rolls} />
        )}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ rolls, chemistry }) {
  // Calculate core metrics
  const totalSpending = calculateTotalSpending(rolls);
  const totalShots = calculateTotalShots(rolls);
  const totalRolls = rolls.length;
  const avgCostPerShot = calculateAvgCostPerShot(totalSpending, totalShots);
  const avgRating = calculateAverageRating(rolls);

  if (rolls.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
        <div className="mb-4 flex justify-center">
          <Icon name="chart" size={64} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No data yet</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Start adding film rolls to see statistics
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Core Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Spending"
          value={`$${totalSpending.toFixed(2)}`}
          icon="dollar"
          color="green"
          subtitle={`Across ${totalRolls} rolls`}
        />
        <StatCard
          title="Total Shots"
          value={totalShots.toLocaleString()}
          icon="camera"
          color="cyan"
          subtitle="Frames exposed"
        />
        <StatCard
          title="Total Rolls"
          value={totalRolls.toLocaleString()}
          icon="film"
          color="purple"
          subtitle="All formats"
        />
        <StatCard
          title="Avg Rating"
          value={avgRating > 0 ? avgRating.toFixed(2) : 'N/A'}
          icon="star"
          color="amber"
          subtitle={avgRating > 0 ? `${avgRating.toFixed(1)} stars` : 'No ratings yet'}
        />
      </div>

      {/* Status & Format Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusDistributionChart rolls={rolls} />
        <FormatDistributionChart rolls={rolls} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopFilmStocksChart rolls={rolls} />
        <RatingDistributionChart rolls={rolls} />
      </div>

      {/* Film Stock Value Analysis */}
      <div className="grid grid-cols-1 gap-6">
        <FilmStockValueChart rolls={rolls} />
      </div>
    </div>
  );
}

// Costs Tab Component
function CostsTab({ rolls, chemistry }) {
  // Calculate cost metrics
  const costBreakdown = calculateCostBreakdown(rolls);
  const chemistryUsage = calculateChemistryUsage(rolls, chemistry);
  const mostExpensiveRoll = findMostExpensiveRoll(rolls);
  const cheapestPerShot = findCheapestPerShot(rolls);

  if (rolls.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
        <div className="mb-4 flex justify-center">
          <Icon name="dollar" size={64} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No cost data yet</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Start tracking costs to see analysis
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cost Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Film Cost"
          value={`$${costBreakdown.filmCost.toFixed(2)}`}
          icon="film"
          color="purple"
          subtitle="Stock purchases"
        />
        <StatCard
          title="Dev Cost"
          value={`$${costBreakdown.devCost.toFixed(2)}`}
          icon="flask"
          color="cyan"
          subtitle="Development"
        />
        <StatCard
          title="Most Expensive"
          value={mostExpensiveRoll ? `$${calculateRollTotalCost(mostExpensiveRoll).toFixed(2)}` : 'N/A'}
          icon="alert"
          color="red"
          subtitle={mostExpensiveRoll ? mostExpensiveRoll.film_stock_name || 'Unknown roll' : 'No data'}
        />
        <StatCard
          title="Lowest $ per shot"
          value={cheapestPerShot ? `$${Number(cheapestPerShot.cost_per_shot).toFixed(3)}` : 'N/A'}
          icon="star"
          color="green"
          subtitle={cheapestPerShot ? cheapestPerShot.film_stock_name || 'Unknown roll' : 'No data'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CostBreakdownChart filmCost={costBreakdown.filmCost} devCost={costBreakdown.devCost} />
        <ChemistryUsageChart chemistryUsage={chemistryUsage} />
      </div>

      {/* Chemistry Batch Details */}
      {chemistryUsage.length > 0 && (
        <ChemistryBatchTable chemistryUsage={chemistryUsage} chemistry={chemistry} />
      )}
    </div>
  );
}

// Timeline Tab Component - Phase 14.5
function TimelineTab({ rolls }) {
  const rollsLoadedPerMonth = calculateRollsLoadedPerMonth(rolls);
  const rollsUnloadedPerMonth = calculateRollsUnloadedPerMonth(rolls);
  const durationDistribution = calculateDurationDistribution(rolls);

  // Calculate summary stats
  const rollsWithDuration = rolls.filter(r => r.duration_days !== null && r.duration_days !== undefined);
  const avgDuration = rollsWithDuration.length > 0
    ? rollsWithDuration.reduce((sum, r) => sum + r.duration_days, 0) / rollsWithDuration.length
    : 0;
  
  const rollsWithLoadDate = rolls.filter(r => r.date_loaded).length;
  const rollsWithUnloadDate = rolls.filter(r => r.date_unloaded).length;

  if (rolls.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
        <div className="mb-4 flex justify-center">
          <Icon name="clock" size={64} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No timeline data yet</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Start tracking load/unload dates to see timeline visualizations
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Rolls Loaded"
          value={rollsWithLoadDate.toString()}
          icon="camera"
          color="cyan"
          subtitle="With load dates"
        />
        <StatCard
          title="Rolls Unloaded"
          value={rollsWithUnloadDate.toString()}
          icon="check"
          color="green"
          subtitle="Completed rolls"
        />
        <StatCard
          title="Avg Duration"
          value={avgDuration > 0 ? Math.round(avgDuration).toString() : 'N/A'}
          icon="clock"
          color="purple"
          subtitle={avgDuration > 0 ? 'days in camera' : 'No data'}
        />
        <StatCard
          title="Currently Loaded"
          value={rolls.filter(r => r.status === 'LOADED').length.toString()}
          icon="film"
          color="amber"
          subtitle="In cameras now"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RollsLoadedTimelineChart data={rollsLoadedPerMonth} />
        <RollsUnloadedTimelineChart data={rollsUnloadedPerMonth} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <DurationDistributionChart data={durationDistribution} />
      </div>
    </div>
  );
}

// Gallery Tab Component - Phase 14.8
function GalleryTab({ rolls }) {
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredStocks.map((stock, index) => (
            <FilmStockGalleryCard key={`${stock.filmStock}-${stock.format}-${index}`} stock={stock} />
          ))}
        </div>
      )}
    </div>
  );
}

// Film Stock Gallery Card Component - Refined with 3D Tilt Effect + Parallax
function FilmStockGalleryCard({ stock }) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Calculate rotation for card (max 15 degrees)
    const rotX = (mouseY / (rect.height / 2)) * -10;
    const rotY = (mouseX / (rect.width / 2)) * 10;
    
    // Calculate subtle translation for thumbnail parallax (max 10px)
    const transX = (mouseX / (rect.width / 2)) * 5;
    const transY = (mouseY / (rect.height / 2)) * 5;
    
    setRotateX(rotX);
    setRotateY(rotY);
    setTranslateX(transX);
    setTranslateY(transY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setTranslateX(0);
    setTranslateY(0);
    setIsHovering(false);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  return (
    <div 
      className="relative perspective-1000"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={{
        perspective: '1000px',
      }}
    >
      <div 
        className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-film-cyan dark:hover:border-film-cyan hover:shadow-xl transition-all duration-300"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: 'preserve-3d',
          transition: isHovering ? 'border-color 0.3s, box-shadow 0.3s' : 'transform 0.3s ease-out, border-color 0.3s, box-shadow 0.3s',
        }}
      >
        {/* Achievement Badge - Top Right Corner */}
        {stock.count >= 10 && (
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-film-cyan text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md flex items-center gap-1">
              <Icon name="star" size={10} className="fill-white" />
              {stock.count >= 20 ? 'MASTER' : 'VET'}
            </div>
          </div>
        )}

        {/* Film Stock Image Container */}
        <div className="aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-900 relative">
          {/* Museum Lighting Effects - Below thumbnail */}
          <div className="absolute inset-0 z-0">
            {/* Subtle vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 dark:to-black/40" />
            
            {/* Museum Reflection Effect */}
            <div 
              className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
          </div>

          {/* Film Stock Image - Above museum effects */}
          <img
            src={getFilmStockImage(stock.filmStock, stock.format)}
            alt={stock.filmStock}
            className="relative z-10 w-full h-full object-cover"
            style={{ 
              transform: `translate(${translateX}px, ${translateY}px)`,
              transition: isHovering ? 'none' : 'transform 0.3s ease-out',
            }}
          />
        </div>

        {/* Info Panel */}
        <div className="relative bg-white dark:bg-gray-800 p-3">
          {/* Accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-film-cyan to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="space-y-2">
            {/* Film Stock Name */}
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-tight line-clamp-2">
              {stock.filmStock}
            </h4>

            {/* Format */}
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {stock.format}
            </div>

            {/* Stats - Always visible but subtle */}
            <div className="flex items-center justify-between pt-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-film-cyan/10 text-film-cyan border border-film-cyan/20">
                <Icon name="film" size={12} />
                {stock.count}
              </div>

              {/* Rating */}
              {stock.roll.stars > 0 && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Icon
                      key={i}
                      name="star"
                      size={12}
                      className={`${
                        i < stock.roll.stars 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Shine Effect on Hover - Keep this! */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 skew-x-12"
            style={{ transform: 'translateZ(40px)' }}
          />
        </div>
      </div>
    </div>
  );
}

// Rolls Loaded Timeline Chart
function RollsLoadedTimelineChart({ data }) {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Rolls Loaded Per Month</h3>
        <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div className="text-center">
            <Icon name="camera" size={48} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No load date data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Rolls Loaded Per Month</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
          <XAxis 
            dataKey="month" 
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            style={{ fontSize: '11px' }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            style={{ fontSize: '12px' }}
            allowDecimals={false}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            wrapperStyle={{ zIndex: 1000 }}
          />
          <Bar dataKey="count" fill="#0891b2" radius={[8, 8, 0, 0]} />
          <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Rolls Unloaded Timeline Chart
function RollsUnloadedTimelineChart({ data }) {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Rolls Unloaded Per Month</h3>
        <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div className="text-center">
            <Icon name="check" size={48} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No unload date data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Rolls Unloaded Per Month</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
          <XAxis 
            dataKey="month" 
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            style={{ fontSize: '11px' }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            style={{ fontSize: '12px' }}
            allowDecimals={false}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            wrapperStyle={{ zIndex: 1000 }}
          />
          <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
          <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Duration Distribution Chart
function DurationDistributionChart({ data }) {
  const hasData = data.some(d => d.count > 0);

  if (!hasData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Duration in Camera Distribution</h3>
        <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div className="text-center">
            <Icon name="clock" size={48} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No duration data</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Track both load and unload dates to see duration analysis
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Duration in Camera Distribution</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        How long do your rolls stay in the camera before being unloaded?
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
          <XAxis 
            dataKey="range" 
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            style={{ fontSize: '12px' }}
            angle={-15}
            textAnchor="end"
            height={70}
          />
          <YAxis 
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            style={{ fontSize: '12px' }}
            allowDecimals={false}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            wrapperStyle={{ zIndex: 1000 }}
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
          />
          <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Status Distribution Chart Component
function StatusDistributionChart({ rolls }) {
  const statusDistribution = calculateStatusDistribution(rolls);
  const chartData = toChartData(statusDistribution, 'status', 'count');

  // Color mapping for each status
  const statusColors = {
    NEW: '#a855f7',      // purple-500
    LOADED: '#0891b2',   // cyan-600
    EXPOSED: '#10b981',  // green-500
    DEVELOPED: '#f59e0b', // amber-500
    SCANNED: '#ef4444',  // red-500
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Status Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="status" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            allowDecimals={false}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            wrapperStyle={{ zIndex: 1000 }}
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={statusColors[entry.status] || '#0891b2'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Format Distribution Chart Component
function FormatDistributionChart({ rolls }) {
  const formatDistribution = calculateFormatDistribution(rolls);
  const chartData = toChartData(formatDistribution, 'format', 'count');

  // Sort by count descending
  chartData.sort((a, b) => b.count - a.count);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Format Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="format" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            allowDecimals={false}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            wrapperStyle={{ zIndex: 1000 }}
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
          />
          <Bar dataKey="count" fill="#0891b2" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Top Film Stocks Chart Component
function TopFilmStocksChart({ rolls }) {
  const topStocks = calculateTopFilmStocks(rolls, 10);
  const chartData = topStocks.map(([stock, count]) => ({ stock, count }));

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Film Stocks</h3>
        <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div className="text-center">
            <Icon name="film" size={48} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No film stock data yet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Film Stocks</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
          <XAxis 
            type="number" 
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            style={{ fontSize: '12px' }}
            allowDecimals={false}
          />
          <YAxis 
            type="category"
            dataKey="stock" 
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            style={{ fontSize: '12px' }}
            width={150}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            wrapperStyle={{ zIndex: 1000 }}
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
          />
          <Bar dataKey="count" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Rating Distribution Chart Component
function RatingDistributionChart({ rolls }) {
  const ratingDistribution = calculateRatingDistribution(rolls);
  const chartData = toChartData(ratingDistribution, 'stars', 'count');
  
  // Check if there are any ratings
  const hasRatings = chartData.some(d => d.count > 0);

  if (!hasRatings) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Rating Distribution</h3>
        <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div className="text-center">
            <Icon name="star" size={48} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No ratings yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Rate your rolls to see distribution</p>
          </div>
        </div>
      </div>
    );
  }

  // Color gradient for ratings (1=red to 5=green)
  const ratingColors = {
    '1': '#ef4444', // red-500
    '2': '#f59e0b', // amber-500
    '3': '#eab308', // yellow-500
    '4': '#84cc16', // lime-500
    '5': '#10b981', // green-500
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Rating Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
          <XAxis 
            dataKey="stars" 
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            style={{ fontSize: '12px' }}
            label={{ value: 'Stars', position: 'insideBottom', offset: -5, style: { fontSize: '12px' } }}
          />
          <YAxis 
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            style={{ fontSize: '12px' }}
            allowDecimals={false}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            wrapperStyle={{ zIndex: 1000 }}
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={ratingColors[entry.stars] || '#0891b2'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Cost Breakdown Pie Chart Component
function CostBreakdownChart({ filmCost, devCost }) {
  const data = [
    { name: 'Film Cost', value: filmCost, color: '#8b5cf6' }, // purple
    { name: 'Dev Cost', value: devCost, color: '#0891b2' },    // cyan
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Cost Breakdown</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-gray-500 dark:text-gray-400">No cost data</p>
        </div>
      </div>
    );
  }

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        style={{ fontSize: '14px', fontWeight: 'bold' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Cost Breakdown</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `$${value.toFixed(2)}`}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            wrapperStyle={{ zIndex: 1000 }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry) => `${value}: $${entry.payload.value.toFixed(2)}`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Chemistry Usage Pie Chart Component
function ChemistryUsageChart({ chemistryUsage }) {
  if (chemistryUsage.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Chemistry Usage</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon name="flask" size={48} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No chemistry data</p>
          </div>
        </div>
      </div>
    );
  }

  // Colors for different chemistry batches
  const COLORS = ['#8b5cf6', '#0891b2', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

  const data = chemistryUsage.map((usage, index) => ({
    name: usage.batchName,
    value: usage.rollCount,
    color: COLORS[index % COLORS.length],
  }));

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        style={{ fontSize: '14px', fontWeight: 'bold' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Chemistry Usage</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `${value} rolls`}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            wrapperStyle={{ zIndex: 1000 }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Helper function to calculate total cost for a roll (matches statsCalculator logic)
function calculateRollTotalCost(roll) {
  if (roll.total_cost) return Number(roll.total_cost);
  const filmCost = roll.not_mine ? 0 : Number(roll.film_cost || 0);
  const devCost = Number(roll.dev_cost || 0);
  return filmCost + devCost;
}

// Film Stock Value Chart - Rating vs Cost per Shot scatter plot
function FilmStockValueChart({ rolls }) {
  const filmStockStats = calculateFilmStockStats(rolls);

  if (filmStockStats.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Film Stock Value Analysis</h3>
        <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div className="text-center">
            <Icon name="chart" size={48} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Not enough data</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Rate your rolls and track costs to see value analysis
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Prepare data for scatter chart (avgRating on Y-axis, avgCostPerShot on X-axis)
  const chartData = filmStockStats.map((stat) => ({
    name: stat.filmStock,
    x: stat.avgCostPerShot,
    y: stat.avgRating,
    z: stat.rollCount, // Size of bubble
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Film Stock Value Analysis</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Compare average rating vs cost per shot. Top-left = best value (high rating, low cost)
      </p>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Cost per Shot"
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            style={{ fontSize: '12px' }}
            label={{ 
              value: 'Avg Cost per Shot ($)', 
              position: 'bottom', 
              offset: 40,
              style: { fontSize: '12px', fill: '#6b7280' }
            }}
            domain={['dataMin - 0.05', 'dataMax + 0.05']}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Rating"
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            style={{ fontSize: '12px' }}
            label={{ 
              value: 'Avg Rating (stars)', 
              angle: -90, 
              position: 'insideLeft',
              style: { fontSize: '12px', fill: '#6b7280' }
            }}
            domain={[0, 5]}
          />
          <ZAxis type="number" dataKey="z" range={[60, 400]} name="Roll Count" />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            wrapperStyle={{ zIndex: 1000 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#0891b2' }}>
                      {data.name}
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>Rating:</strong> {data.y.toFixed(2)} stars
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>Cost per Shot:</strong> ${data.x.toFixed(3)}
                    </div>
                    <div>
                      <strong>Roll Count:</strong> {data.z} rolls
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter 
            data={chartData} 
            fill="#0891b2"
            opacity={0.6}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// Chemistry Batch Table Component
function ChemistryBatchTable({ chemistryUsage, chemistry }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Chemistry Batch Details</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="pb-3 font-semibold text-gray-700 dark:text-gray-300">Batch Name</th>
              <th className="pb-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Rolls Developed</th>
              <th className="pb-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Cost/Roll</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {chemistryUsage.map((usage) => {
              const batch = chemistry.find((c) => c.id === usage.chemistryId);
              const costPerRoll = batch && batch.total_cost && usage.rollCount > 0
                ? batch.total_cost / usage.rollCount
                : null;

              return (
                <tr key={usage.chemistryId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="py-3 text-gray-900 dark:text-gray-100">{usage.batchName}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400 text-right">{usage.rollCount}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400 text-right">
                    {costPerRoll ? `$${costPerRoll.toFixed(2)}` : 'N/A'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
