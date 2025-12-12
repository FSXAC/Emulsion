import StatCard from '../../StatCard';
import Icon from '../../Icon';
import RollsLoadedTimelineChart from '../charts/RollsLoadedTimelineChart';
import RollsUnloadedTimelineChart from '../charts/RollsUnloadedTimelineChart';
import DurationDistributionChart from '../charts/DurationDistributionChart';
import {
  calculateRollsLoadedPerMonth,
  calculateRollsUnloadedPerMonth,
  calculateDurationDistribution,
} from '../../../utils/statsCalculator';

export default function TimelineTab({ rolls }) {
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
