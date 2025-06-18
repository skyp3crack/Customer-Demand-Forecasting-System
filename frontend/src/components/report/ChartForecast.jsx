import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, Calendar, Eye, EyeOff, Target, AlertTriangle, Zap } from 'lucide-react';

export default function ChartForecast({ data, uniqueDrugs, theme }) {
  const [hiddenDrugs, setHiddenDrugs] = useState(new Set());
  const [hoverDrug, setHoverDrug] = useState(null);
  const [confidenceView, setConfidenceView] = useState(true);

  // Filter to only show forecast data
  const chartData = useMemo(() => 
    data.map(item => {
      const newItem = { period: item.period };
      Object.keys(item).forEach(key => {
        if (key.endsWith('_forecast')) {
          newItem[key] = item[key];
        }
      });
      return newItem;
    }).filter(item => {
      // Only include items that have at least one data point
      return Object.keys(item).length > 1;
    })
  , [data]);

  // Calculate forecast insights
  const forecastInsights = useMemo(() => {
    if (chartData.length === 0) return null;
    
    const insights = {};
    uniqueDrugs.forEach(drug => {
      const values = chartData
        .map(item => item[`${drug}_forecast`])
        .filter(val => val != null);
      
      if (values.length > 0) {
        const total = values.reduce((sum, val) => sum + val, 0);
        const avg = total / values.length;
        const growth = values.length > 1 ? 
          ((values[values.length - 1] - values[0]) / values[0] * 100) : 0;
        const volatility = values.length > 1 ? 
          Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length) / avg * 100 : 0;
        
        insights[drug] = { 
          total, 
          avg, 
          growth, 
          volatility, 
          count: values.length,
          peak: Math.max(...values),
          trough: Math.min(...values)
        };
      }
    });
    
    return insights;
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

  const getConfidenceLevel = (volatility) => {
    if (volatility < 10) return { level: 'High', color: 'text-emerald-500', icon: Target };
    if (volatility < 25) return { level: 'Medium', color: 'text-yellow-500', icon: Activity };
    return { level: 'Low', color: 'text-red-500', icon: AlertTriangle };
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`
          ${theme === 'dark' ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'} 
          backdrop-blur-sm border rounded-xl shadow-xl p-4 min-w-52
        `}>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            <Calendar className="w-4 h-4 text-purple-500" />
            <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
            <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full">
              Forecast
            </span>
          </div>
          <div className="space-y-2">
            {payload.map((entry, index) => {
              const drugName = entry.name.replace('_forecast', '').replace(' (Forecast)', '');
              const insights = forecastInsights?.[drugName];
              
              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full border border-white/50" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {drugName}
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-gray-900 dark:text-white">
                      {entry.value?.toLocaleString()}
                    </span>
                  </div>
                  {insights && confidenceView && (
                    <div className="flex items-center gap-2 text-xs pl-5">
                      <span className="text-gray-500 dark:text-gray-400">Confidence:</span>
                      <span className={getConfidenceLevel(insights.volatility).color}>
                        {getConfidenceLevel(insights.volatility).level}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
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
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Forecasted Sales Performance
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <Target className="w-16 h-16 mb-4 opacity-40" />
          <p className="text-lg font-medium mb-2">No Forecast Data</p>
          <p className="text-sm text-center max-w-md">
            No forecast data available for the selected date range. 
            Predictions will appear here once the forecasting model generates results.
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
      p-8 mb-6 transition-all duration-300 hover:shadow-xl relative overflow-hidden
    `}>
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-transparent to-pink-500 animate-pulse" />
      </div>

      {/* Header Section */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Forecasted Sales Performance
              <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Predictive analytics across {uniqueDrugs.length} products
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Confidence Toggle */}
          <button
            onClick={() => setConfidenceView(!confidenceView)}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${confidenceView 
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }
            `}
          >
            {confidenceView ? 'Hide' : 'Show'} Confidence
          </button>

          {/* Summary Stats */}
          {forecastInsights && (
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <div className="font-mono font-bold text-lg text-purple-600 dark:text-purple-400">
                  {Object.values(forecastInsights).reduce((sum, stat) => sum + stat.total, 0).toLocaleString()}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Projected Sales</div>
              </div>
              <div className="text-center">
                <div className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400">
                  {chartData.length}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Periods</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Legend with Forecast Insights */}
      <div className="mb-6 relative z-10">
        <div className="flex flex-wrap gap-3">
          {uniqueDrugs.map((drug, index) => {
            const isHidden = hiddenDrugs.has(drug);
            const color = getColorForDrug(drug, index);
            const insights = forecastInsights?.[drug];
            const confidence = insights ? getConfidenceLevel(insights.volatility) : null;
            
            return (
              <button
                key={drug}
                onClick={() => toggleDrugVisibility(drug)}
                onMouseEnter={() => setHoverDrug(drug)}
                onMouseLeave={() => setHoverDrug(null)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 min-w-48
                  ${isHidden 
                    ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-50' 
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md'
                  }
                  ${hoverDrug === drug ? 'scale-105 shadow-lg ring-2 ring-purple-200 dark:ring-purple-800' : ''}
                `}
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                      style={{ backgroundColor: isHidden ? '#d1d5db' : color }}
                    />
                    <div 
                      className="absolute inset-0 w-4 h-4 rounded-full border-2 border-dashed animate-spin" 
                      style={{ borderColor: isHidden ? '#d1d5db' : color, borderTopColor: 'transparent' }}
                    />
                  </div>
                  {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </div>
                
                <div className="text-left flex-1">
                  <div className="font-medium text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    {drug}
                    {confidence && (
                      <confidence.icon className={`w-3 h-3 ${confidence.color}`} />
                    )}
                  </div>
                  {insights && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <div>
                        Avg: {Math.round(insights.avg).toLocaleString()}
                        {insights.growth !== 0 && (
                          <span className={`ml-2 ${insights.growth > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {insights.growth > 0 ? '↗' : '↘'} {Math.abs(insights.growth).toFixed(1)}%
                          </span>
                        )}
                      </div>
                      {confidenceView && confidence && (
                        <div className={`${confidence.color} font-medium`}>
                          {confidence.level} Confidence
                        </div>
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
      <div className="h-96 p-4 bg-gradient-to-br from-gray-50/50 to-purple-50/30 dark:from-gray-800/50 dark:to-purple-900/20 rounded-xl relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              <filter id="forecastGlow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <linearGradient id="forecastGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(147, 51, 234, 0.1)" />
                <stop offset="50%" stopColor="rgba(147, 51, 234, 0.05)" />
                <stop offset="100%" stopColor="rgba(219, 39, 119, 0.1)" />
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="2 4" 
              stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} 
              strokeOpacity={0.3}
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
              const insights = forecastInsights?.[drug];
              const confidence = insights ? getConfidenceLevel(insights.volatility) : null;
              
              return (
                <Line
                  key={`${drug}_forecast`}
                  type="monotone"
                  dataKey={`${drug}_forecast`}
                  name={`${drug} (Forecast)`}
                  stroke={color}
                  strokeWidth={isHovered ? 4 : isHidden ? 0 : 3}
                  strokeOpacity={isHidden ? 0 : confidence?.level === 'Low' ? 0.6 : 0.9}
                  strokeDasharray={confidence?.level === 'Low' ? "8 4" : "5 3"}
                  dot={{ 
                    r: isHovered ? 6 : 4, 
                    fill: color,
                    stroke: '#ffffff',
                    strokeWidth: 2,
                    fillOpacity: confidence?.level === 'Low' ? 0.6 : 1,
                    filter: isHovered ? 'url(#forecastGlow)' : 'none'
                  }}
                  activeDot={{ 
                    r: 8, 
                    fill: color,
                    stroke: '#ffffff',
                    strokeWidth: 3,
                    filter: 'url(#forecastGlow)',
                    fillOpacity: 1
                  }}
                  connectNulls={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast Disclaimer */}
      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg relative z-10">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Forecast Disclaimer:</strong> These predictions are based on historical data and statistical models. 
            Actual results may vary due to market conditions, external factors, and model limitations.
          </div>
        </div>
      </div>
    </div>
  );
}