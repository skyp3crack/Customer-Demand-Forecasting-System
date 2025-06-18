export default function DataTable({ data, uniqueDrugs, showForecast }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Data Table
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {data.length} {data.length === 1 ? 'record' : 'records'} found
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Date
              </th>
              {uniqueDrugs.flatMap(drug => [
                <th 
                  key={`${drug}_actual`} 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {drug} (Actual)
                </th>,
                showForecast && (
                  <th 
                    key={`${drug}_forecast`} 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {drug} (Forecast)
                  </th>
                )
              ].filter(Boolean))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {row.period}
                </td>
                {uniqueDrugs.flatMap(drug => [
                  <td 
                    key={`${drug}_actual`}
                    className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400"
                  >
                    {row[`${drug}_actual`]?.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    }) || '-'}
                  </td>,
                  showForecast && (
                    <td 
                      key={`${drug}_forecast`}
                      className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400"
                    >
                      {row[`${drug}_forecast`]?.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      }) || '-'}
                    </td>
                  )
                ].filter(Boolean))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
