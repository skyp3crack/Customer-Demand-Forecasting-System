import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, BarChart3, Calendar, Eye, EyeOff } from 'lucide-react';

export default function ChartActual({ data, uniqueDrugs, theme }) {
  const [hiddenDrugs, setHiddenDrugs] = useState(new Set());
  const [hoverDrug, setHoverDrug] = useState(null);

  // Filter to only show actual data
  const chartData = useMemo(() => 
    data.map(item => {
      const newItem = { period: item.period };
      Object.keys(item).forEach(key => {
        if (key.endsWith('_actual')) {
          newItem[key] = item[key];
        }
      });
      return newItem;
    }).filter(item => {
      // Only include items that have at least one data point
      return Object.keys(item).length > 1;
    })
  , [data]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (chartData.length === 0) return null;
    
    const stats = {};
    uniqueDrugs.forEach(drug => {
      const values = chartData
        .map(item => item[`${drug}_actual`])
        .filter(val => val != null);
      
      if (values.length > 0) {
        const total = values.reduce((sum, val) => sum + val, 0);
        const avg = total / values.length;
        const trend = values.length > 1 ? 
          ((values[values.length - 1] - values[0]) / values[0] * 100) : 0;
        
        stats[drug] = { total, avg, trend, count: values.length };
      }
    });
    
    return stats;
  }, [chartData, uniqueDrugs]);

  const toggleDrugVisibility = (drug) => {
    const newHidden = new Set(hiddenDrugs);
    if (newHidden.has(drug)) {
      newHidden.delete(drug);
    } else {
      newHidden.add(drug);
    }
    setHiddenDrugs(newHidden);
  };

  const getColorForDrug = (drug, index) => {
    const hue = (index * 137.508) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`
          ${theme === 'dark' ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'} 
          backdrop-blur-sm border rounded-xl shadow-xl p-4 min-w-48
        `}>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            <Calendar className="w-4 h-4 text-blue-500" />
            <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
          </div>
          <div className="space-y-2">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {entry.name.replace('_actual', '').replace(' (Actual)', '')}
                  </span>
                </div>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">
                  {entry.value?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className={`
        ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-white'} 
        backdrop-blur-sm rounded-2xl shadow-lg border 
        ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} 
        p-8 mb-6 transition-all duration-300
      `}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Actual Sales Performance
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <BarChart3 className="w-16 h-16 mb-4 opacity-40" />
          <p className="text-lg font-medium mb-2">No Data Available</p>
          <p className="text-sm text-center max-w-md">
            No actual sales data found for the selected date range. 
            Try adjusting your filters or date selection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-white'} 
      backdrop-blur-sm rounded-2xl shadow-lg border 
      ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} 
      p-8 mb-6 transition-all duration-300 hover:shadow-xl
    `}>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Actual Sales Performance
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Historical sales data across {uniqueDrugs.length} products
            </p>
          </div>
        </div>
        
        {summaryStats && (
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="font-mono font-bold text-lg text-blue-600 dark:text-blue-400">
                {Object.values(summaryStats).reduce((sum, stat) => sum + stat.total, 0).toLocaleString()}
              </div>
              <div className="text-gray-500 dark:text-gray-400">Total Sales</div>
            </div>
            <div className="text-center">
              <div className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400">
                {chartData.length}
              </div>
              <div className="text-gray-500 dark:text-gray-400">Data Points</div>
            </div>
          </div>
        )}
      </div>

      {/* Legend with Toggle Controls */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-3">
          {uniqueDrugs.map((drug, index) => {
            const isHidden = hiddenDrugs.has(drug);
            const color = getColorForDrug(drug, index);
            const stats = summaryStats?.[drug];
            
            return (
              <button
                key={drug}
                onClick={() => toggleDrugVisibility(drug)}
                onMouseEnter={() => setHoverDrug(drug)}
                onMouseLeave={() => setHoverDrug(null)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200
                  ${isHidden 
                    ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-50' 
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md'
                  }
                  ${hoverDrug === drug ? 'scale-105 shadow-lg' : ''}
                `}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                    style={{ backgroundColor: isHidden ? '#d1d5db' : color }}
                  />
                  {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm text-gray-900 dark:text-white">
                    {drug}
                  </div>
                  {stats && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Avg: {Math.round(stats.avg).toLocaleString()}
                      {stats.trend !== 0 && (
                        <span className={`ml-1 ${stats.trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {stats.trend > 0 ? '↗' : '↘'} {Math.abs(stats.trend).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-96 p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="2 4" 
              stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} 
              strokeOpacity={0.5}
            />
            
            <XAxis 
              dataKey="period" 
              stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
              tick={{ 
                fill: theme === 'dark' ? '#9ca3af' : '#6b7280',
                fontSize: 12,
                fontWeight: 500
              }}
              tickLine={{ stroke: theme === 'dark' ? '#4b5563' : '#d1d5db' }}
              axisLine={{ stroke: theme === 'dark' ? '#4b5563' : '#d1d5db' }}
            />
            
            <YAxis 
              stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
              tick={{ 
                fill: theme === 'dark' ? '#9ca3af' : '#6b7280',
                fontSize: 12,
                fontWeight: 500
              }}
              tickLine={{ stroke: theme === 'dark' ? '#4b5563' : '#d1d5db' }}
              axisLine={{ stroke: theme === 'dark' ? '#4b5563' : '#d1d5db' }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {uniqueDrugs.map((drug, index) => {
              const isHidden = hiddenDrugs.has(drug);
              const isHovered = hoverDrug === drug;
              const color = getColorForDrug(drug, index);
              
              return (
                <Line
                  key={`${drug}_actual`}
                  type="monotone"
                  dataKey={`${drug}_actual`}
                  name={`${drug} (Actual)`}
                  stroke={color}
                  strokeWidth={isHovered ? 4 : isHidden ? 0 : 3}
                  strokeOpacity={isHidden ? 0 : 1}
                  dot={{ 
                    r: isHovered ? 6 : 4, 
                    fill: color,
                    stroke: '#ffffff',
                    strokeWidth: 2,
                    filter: isHovered ? 'url(#glow)' : 'none'
                  }}
                  activeDot={{ 
                    r: 8, 
                    fill: color,
                    stroke: '#ffffff',
                    strokeWidth: 3,
                    filter: 'url(#glow)'
                  }}
                  connectNulls={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}