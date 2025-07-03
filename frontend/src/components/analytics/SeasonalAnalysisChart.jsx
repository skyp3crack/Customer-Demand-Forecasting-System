import React from 'react';
import PropTypes from 'prop-types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { processSeasonalOverlayData, generateColor } from './analyticsUtils';

const SeasonalAnalysisChart = ({ data, selectedDrug, timePeriod, title }) => {
    // Process data for the seasonal analysis chart
    const chartData = processSeasonalOverlayData(data, selectedDrug, timePeriod);

    // Extract years from the data for the legend
    const years = chartData.length > 0 
        ? Object.keys(chartData[0]).filter(key => key !== 'period')
        : [];

    // If no data or no drug selected, show a message
    if (chartData.length === 0 || !selectedDrug) {
        return (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                <p className="text-yellow-800 dark:text-yellow-200">
                    {!selectedDrug ? 'Please select a drug to analyze' : 'No seasonal data available for the selected drug'}
                </p>
            </div>
        );
    }

    return (
        <div className="w-full h-[400px] p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">
                {title || `Seasonal Analysis: ${selectedDrug}`}
            </h3>
            <ResponsiveContainer width="100%" height="90%">
                <LineChart
                    data={chartData}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                        dataKey="period"
                        label={{
                            value: timePeriod === 'monthly' ? 'Month' : 'Day',
                            position: 'insideBottomRight',
                            offset: -5,
                            fill: '#64748b',
                        }}
                        tick={{ fill: '#64748b' }}
                        tickLine={{ stroke: '#cbd5e1' }}
                        dy={10}
                    />
                    <YAxis 
                        tick={{ fill: '#64748b' }}
                        tickLine={{ stroke: '#cbd5e1' }}
                        width={80}
                    />
                    <Tooltip 
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.375rem',
                            color: '#1e293b',
                        }}
                        formatter={(value, name) => [value, `Sales (${name})`]}
                        labelFormatter={(label) => {
                            if (timePeriod === 'monthly') {
                                const monthNames = [
                                    'January', 'February', 'March', 'April', 'May', 'June',
                                    'July', 'August', 'September', 'October', 'November', 'December'
                                ];
                                return monthNames[parseInt(label) - 1] || label;
                            }
                            return label;
                        }}
                    />
                    <Legend />
                    {years.map((year, index) => (
                        <Line
                            key={year}
                            type="monotone"
                            dataKey={year}
                            name={`${year}`}
                            stroke={generateColor(index)}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

SeasonalAnalysisChart.propTypes = {
    data: PropTypes.array.isRequired,
    selectedDrug: PropTypes.string,
    timePeriod: PropTypes.oneOf(['daily', 'monthly']).isRequired,
    title: PropTypes.string,
};

export default SeasonalAnalysisChart;
