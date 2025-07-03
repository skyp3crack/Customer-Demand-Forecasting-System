import React from 'react';
import PropTypes from 'prop-types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { processDataByTimePeriod, generateColor } from './analyticsUtils';

const DrugComparisonChart = ({ data, selectedDrugs, timePeriod, title }) => {
    // Process data for the chart
    const chartData = processDataByTimePeriod(data, timePeriod);

    // If no data or no drugs selected, show a message
    if (chartData.length === 0 || selectedDrugs.length === 0) {
        return (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                <p className="text-yellow-800 dark:text-yellow-200">
                    {selectedDrugs.length === 0 ? 'Please select at least one drug to compare' : 'No data available for the selected filters'}
                </p>
            </div>
        );
    }

    return (
        <div className="w-full h-[400px] p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">
                {title || 'Drug Sales Comparison'}
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
                        dataKey="date" 
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
                    />
                    <Legend />
                    {selectedDrugs.map((drug, index) => (
                        <Line
                            key={drug}
                            type="monotone"
                            dataKey={drug}
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

DrugComparisonChart.propTypes = {
    data: PropTypes.array.isRequired,
    selectedDrugs: PropTypes.arrayOf(PropTypes.string).isRequired,
    timePeriod: PropTypes.oneOf(['daily', 'monthly', 'yearly']).isRequired,
    title: PropTypes.string,
};

export default DrugComparisonChart;
