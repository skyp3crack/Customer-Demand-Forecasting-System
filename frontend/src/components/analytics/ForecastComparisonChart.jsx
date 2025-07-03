import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { generateColor } from './analyticsUtils';

const ForecastComparisonChart = ({ data, selectedDrugs, loading, error, forecastMonths = 3, timePeriod = 'monthly' }) => {
  // Process data for the bar chart
  const chartData = useMemo(() => {
    if (!data || !selectedDrugs.length) return [];
    
    // Group data by drug and period
    const forecastByDrug = {};
    
    // Get period names based on forecast type
    const getPeriodName = (date, index) => {
      const d = new Date(date);
      
      switch(timePeriod) {
        case 'daily':
          return d.toLocaleDateString();
        case 'monthly':
          return d.toLocaleString('default', { month: 'long', year: 'numeric' });
        case 'yearly':
          return d.getFullYear().toString();
        default:
          return `Period ${index + 1}`;
      }
    };
    
    // Group data by period
    const periods = {};
    
    data.forEach(item => {
      if (selectedDrugs.includes(item.drug)) {
        const date = new Date(item.date);
        const periodKey = timePeriod === 'yearly' 
          ? date.getFullYear() 
          : timePeriod === 'monthly'
            ? `${date.getFullYear()}-${date.getMonth()}`
            : item.date; // For daily, use full date
            
        if (!periods[periodKey]) {
          periods[periodKey] = {
            name: getPeriodName(item.date, Object.keys(periods).length),
            date: item.date,
            ...selectedDrugs.reduce((acc, drug) => ({ ...acc, [drug]: 0 }), {})
          };
        }
        
        periods[periodKey][item.drug] += parseFloat(item.predicted_sales) || 0;
      }
    });
    
    // Convert to array and sort by date
    return Object.values(periods)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, forecastMonths);
  }, [data, selectedDrugs, forecastMonths, timePeriod]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
        <p className="text-red-700 dark:text-red-300">Error loading forecast data: {error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!selectedDrugs.length) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
        <p className="text-yellow-700 dark:text-yellow-300">Please select drugs to compare</p>
      </div>
    );
  }

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
            itemStyle={{ color: '#1e293b' }}
            labelStyle={{ color: '#475569', fontWeight: 600 }}
          />
          <Legend />
          {selectedDrugs.map((drug, index) => (
            <Bar 
              key={drug} 
              dataKey={drug} 
              fill={generateColor(index)}
              name={drug}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

ForecastComparisonChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    drug: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    predicted_sales: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]).isRequired,
  })),
  selectedDrugs: PropTypes.arrayOf(PropTypes.string).isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  forecastMonths: PropTypes.number,
  timePeriod: PropTypes.string,
};

ForecastComparisonChart.defaultProps = {
  forecastMonths: 3,
  timePeriod: 'monthly',
};

export default ForecastComparisonChart;
