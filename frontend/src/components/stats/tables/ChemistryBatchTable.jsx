export default function ChemistryBatchTable({ chemistryUsage, chemistry }) {
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
