import StatCard from '../../StatCard';
import Icon from '../../Icon';
import StatusDistributionChart from '../charts/StatusDistributionChart';
import FormatDistributionChart from '../charts/FormatDistributionChart';
import TopFilmStocksChart from '../charts/TopFilmStocksChart';
import RatingDistributionChart from '../charts/RatingDistributionChart';
import FilmStockValueChart from '../charts/FilmStockValueChart';
import {
  calculateTotalSpending,
  calculateTotalShots,
  calculateAvgCostPerShot,
  calculateAverageRating,
} from '../../../utils/statsCalculator';

export default function OverviewTab({ rolls, chemistry }) {
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
