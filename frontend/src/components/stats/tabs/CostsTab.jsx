import StatCard from '../../StatCard';
import Icon from '../../Icon';
import CostBreakdownChart from '../charts/CostBreakdownChart';
import ChemistryUsageChart from '../charts/ChemistryUsageChart';
import ChemistryBatchTable from '../tables/ChemistryBatchTable';
import {
  calculateCostBreakdown,
  calculateChemistryUsage,
  findMostExpensiveRoll,
  findCheapestPerShot,
} from '../../../utils/statsCalculator';

export default function CostsTab({ rolls, chemistry }) {
  // Calculate cost metrics
  const costBreakdown = calculateCostBreakdown(rolls);
  const chemistryUsage = calculateChemistryUsage(rolls, chemistry);
  const mostExpensiveRoll = findMostExpensiveRoll(rolls);
  const cheapestPerShot = findCheapestPerShot(rolls);

  // Helper function to calculate total cost for a roll (matches statsCalculator logic)
  const calculateRollTotalCost = (roll) => {
    if (roll.total_cost) return Number(roll.total_cost);
    const filmCost = roll.not_mine ? 0 : Number(roll.film_cost || 0);
    const devCost = Number(roll.dev_cost || 0);
    return filmCost + devCost;
  };

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
