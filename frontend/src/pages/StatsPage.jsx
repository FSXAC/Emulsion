import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { getRolls } from '../services/rolls';
import { getChemistry } from '../services/chemistry';
import OverviewTab from '../components/stats/tabs/OverviewTab';
import CostsTab from '../components/stats/tabs/CostsTab';
import TimelineTab from '../components/stats/tabs/TimelineTab';
import GalleryTab from '../components/stats/tabs/GalleryTab';

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
