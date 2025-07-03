import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import { useState } from 'react';

export default function DataTable({ data, uniqueDrugs, showForecast }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No data available</h3>
          <p className="text-gray-500 dark:text-gray-400">There are no records to display at this time.</p>
        </div>
      </div>
    );
  }

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) {
      return <ChevronUpIcon className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUpIcon className="w-4 h-4 text-blue-500" />
      : <ChevronDownIcon className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Data Overview
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Comprehensive view of drug data and forecasts
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {data.length} {data.length === 1 ? 'record' : 'records'}
              </span>
            </div>
            {showForecast && (
              <div className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Forecast Enabled
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50">
              <th 
                scope="col" 
                className="group px-6 py-4 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors"
                onClick={() => handleSort('period')}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </span>
                  <SortIcon column="period" />
                </div>
              </th>
              {uniqueDrugs.flatMap(drug => [
                <th 
                  key={`${drug}_actual`} 
                  className="group px-6 py-4 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors"
                  onClick={() => handleSort(`${drug}_actual`)}
                >
                  <div className="flex items-center justify-end space-x-2">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        {drug}
                      </div>
                      <div className="text-xs text-black dark:text-white font-medium">
                        Actual
                      </div>
                    </div>
                    <SortIcon column={`${drug}_actual`} />
                  </div>
                </th>,
                showForecast && (
                  <th 
                    key={`${drug}_forecast`} 
                    className="group px-6 py-4 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors"
                    onClick={() => handleSort(`${drug}_forecast`)}
                  >
                    <div className="flex items-center justify-end space-x-2">
                      <div className="text-right">
                        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          {drug}
                        </div>
                        <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">
                          Forecast
                        </div>
                      </div>
                      <SortIcon column={`${drug}_forecast`} />
                    </div>
                  </th>
                )
              ].filter(Boolean))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {sortedData.map((row, i) => (
              <tr 
                key={i} 
                className={`hover:bg-blue-50/50 dark:hover:bg-gray-700/30 transition-colors duration-150 ${row.isForecast ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${row.isForecast ? 'bg-red-800' : 'bg-blue-800'}`}></div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {row.period}
                    </span>
                  </div>
                </td>
                {uniqueDrugs.flatMap(drug => [
                  <td 
                    key={`${drug}_actual`}
                    className="px-6 py-4 whitespace-nowrap text-right"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {row[`${drug}_actual`]?.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      }) || (
                        <span className="text-gray-400 dark:text-gray-500 italic">No data</span>
                      )}
                    </span>
                  </td>,
                  showForecast && (
                    <td 
                      key={`${drug}_forecast`}
                      className="px-6 py-4 whitespace-nowrap text-right"
                    >
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {row[`${drug}_forecast`]?.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        }) || (
                          <span className="text-gray-400 dark:text-gray-500 italic">No forecast</span>
                        )}
                      </span>
                    </td>
                  )
                ].filter(Boolean))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-black dark:bg-white rounded-full"></div>
              <span>Actual values</span>
            </div>
            {showForecast && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Forecasted values</span>
              </div>
            )}
          </div>
          <div>
            Click column headers to sort data
          </div>
        </div>
      </div>
    </div>
  );
}