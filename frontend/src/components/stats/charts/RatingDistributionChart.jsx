import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Icon from '../../Icon';
import { calculateRatingDistribution, toChartData } from '../../../utils/statsCalculator';

export default function RatingDistributionChart({ rolls }) {
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
