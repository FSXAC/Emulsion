import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Icon from '../../Icon';
import { calculateFilmStockStats } from '../../../utils/statsCalculator';

export default function FilmStockValueChart({ rolls }) {
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
