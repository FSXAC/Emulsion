import { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import Icon from '../components/Icon';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { getRolls } from '../services/rolls';
import { getChemistry } from '../services/chemistry';
import {
  calculateTotalSpending,
  calculateTotalShots,
  calculateAvgCostPerShot,
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
    { id: 'gallery', label: 'Gallery', icon: 'film', disabled: true }, // Future feature
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
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <OverviewTab rolls={rolls} chemistry={chemistry} />
        )}
        {activeTab === 'costs' && (
          <CostsTab rolls={rolls} chemistry={chemistry} />
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
          title="Avg Cost/Shot"
          value={totalShots > 0 ? `$${avgCostPerShot.toFixed(2)}` : 'N/A'}
          icon="star"
          color="amber"
          subtitle="Film + development"
        />
      </div>

      {/* Charts - Placeholders for Phase 14.3 and 14.4 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPlaceholder title="Status Distribution" />
        <ChartPlaceholder title="Format Distribution" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPlaceholder title="Top Film Stocks" />
        <ChartPlaceholder title="Rating Distribution" />
      </div>
    </div>
  );
}

// Costs Tab Component (Placeholder for Phase 14.6)
function CostsTab({ rolls, chemistry }) {
  return (
    <div className="space-y-6">
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
        <Icon name="dollar" size={48} className="mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Cost Analysis Coming Soon
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Detailed cost breakdowns and chemistry usage will be available here
        </p>
      </div>
    </div>
  );
}

// Gallery Tab Component (Placeholder for Phase 14.8)
function GalleryTab({ rolls }) {
  return (
    <div className="space-y-6">
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
        <Icon name="film" size={48} className="mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Gallery Coming Soon
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Browse your film canister collection here
        </p>
      </div>
    </div>
  );
}

// Chart Placeholder Component
function ChartPlaceholder({ title }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
        <div className="text-center">
          <Icon name="chart" size={48} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Chart coming soon</p>
        </div>
      </div>
    </div>
  );
}
