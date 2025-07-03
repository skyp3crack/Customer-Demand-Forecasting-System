import React from 'react';
import PropTypes from 'prop-types';
import TimeToggle from './TimeToggle';
import { MultiSelect } from '@/components/MultiSelect';

const DataControls = ({
    availableDrugs = [],
    selectedDrugs = [],
    onDrugsChange,
    timePeriod,
    onTimePeriodChange,
    seasonalDrug = '',
    onSeasonalDrugChange,
    seasonalTimePeriod,
    onSeasonalTimePeriodChange,
    forecastMonths,
    onForecastMonthsChange,
    loading,
}) => { 
    return (
        <div className="space-y-6">
            {/* Drug Comparison Controls */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">
                    Drug Comparison Settings
                </h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Select Drugs to Compare
                            </label>
                            {availableDrugs.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (selectedDrugs.length === availableDrugs.length) {
                                            onDrugsChange([]);
                                        } else {
                                            onDrugsChange([...availableDrugs]);
                                        }
                                    }}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    {selectedDrugs.length === availableDrugs.length ? 'Deselect All' : 'Select All'}
                                </button>
                            )}
                        </div>
                        <MultiSelect
                            options={availableDrugs}
                            selectedValues={selectedDrugs}
                            onChange={onDrugsChange}
                            placeholder="Select drugs..."
                            disabled={loading || availableDrugs.length === 0}
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {selectedDrugs.length} {selectedDrugs.length === 1 ? 'drug' : 'drugs'} selected
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Time Period
                        </label>
                        <TimeToggle 
                            value={timePeriod} 
                            onChange={onTimePeriodChange} 
                            disabled={loading}
                        />
                    </div>
                </div>
            </div>

            {/* Forecast Settings */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">
                    Forecast Comparison Settings
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Forecast Period (Months)
                        </label>
                        <select
                            value={forecastMonths}
                            onChange={(e) => onForecastMonthsChange(Number(e.target.value))}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            disabled={loading}
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                                <option key={num} value={num}>
                                    {num} {num === 1 ? 'Month' : 'Months'}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Select number of months to forecast
                        </p>
                    </div>
                </div>
            </div>

            {/* Seasonal Analysis Controls */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">
                    Seasonal Analysis Settings
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Select Drug for Seasonal Analysis
                        </label>
                        <MultiSelect
                            options={availableDrugs}
                            selectedValues={seasonalDrug ? [seasonalDrug] : []}
                            onChange={(selected) => onSeasonalDrugChange(selected[0] || '')}
                            singleSelect={true}
                            placeholder="Select a drug..."
                            disabled={loading || availableDrugs.length === 0}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Analysis Granularity
                        </label>
                        <TimeToggle 
                            value={seasonalTimePeriod} 
                            onChange={onSeasonalTimePeriodChange}
                            options={['daily', 'monthly']}
                            disabled={loading || !seasonalDrug}
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {seasonalTimePeriod === 'monthly' 
                                ? 'View monthly trends across years' 
                                : 'View daily patterns across years'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

DataControls.propTypes = {
    availableDrugs: PropTypes.arrayOf(PropTypes.string),
    selectedDrugs: PropTypes.arrayOf(PropTypes.string),
    onDrugsChange: PropTypes.func.isRequired,
    timePeriod: PropTypes.oneOf(['daily', 'monthly', 'yearly']).isRequired,
    onTimePeriodChange: PropTypes.func.isRequired,
    seasonalDrug: PropTypes.string,
    onSeasonalDrugChange: PropTypes.func.isRequired,
    seasonalTimePeriod: PropTypes.oneOf(['daily', 'monthly']).isRequired,
    onSeasonalTimePeriodChange: PropTypes.func.isRequired,
    forecastMonths: PropTypes.number.isRequired,
    onForecastMonthsChange: PropTypes.func.isRequired,
    loading: PropTypes.bool,
};

export default DataControls;
