import { Download, Filter, Calendar, Package, TrendingUp, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function FiltersPanel({
  availableDrugs,
  selectedDrugs,
  handleDrugSelect,
  dateRanges,
  handleDateRangeChange,
  showForecast,
  toggleForecast,
  handleExport,
  isLoading
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDrugDropdown, setShowDrugDropdown] = useState(false);

  const quickRanges = [
    { label: 'Last 7 days', days: 6 },
    { label: 'Last 30 days', days: 29 },
    { label: 'Last 6 months', days: 179 },
    { label: 'This year', days: 364 },
  ];

  const getDateRange = (days) => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days);
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  };

  const handleQuickRangeSelect = (days) => {
    const range = getDateRange(days);
    handleDateRangeChange(range, 'actual');
  };

  const handleDrugToggle = (drug) => {
    const newSelection = selectedDrugs.includes(drug)
      ? selectedDrugs.filter(d => d !== drug)
      : [...selectedDrugs, drug];
    
    // Simulate the event structure expected by the parent
    const mockEvent = {
      target: {
        value: newSelection,
        selectedOptions: newSelection.map(d => ({ value: d }))
      }
    };
    handleDrugSelect(mockEvent);
  };

  const handleExportClick = (format) => {
    handleExport(format);
    setShowExportMenu(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Report Filters
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure your analysis parameters
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Forecast Toggle */}
          <button
            type="button"
            onClick={toggleForecast}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              showForecast
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
                : 'bg-gray-100 border border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            {showForecast ? 'Hide Forecast' : 'Show Forecast'}
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
              <ChevronDown className="h-4 w-4 ml-2" />
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20 border border-gray-200 dark:border-gray-700">
                <div className="py-2">
                  <button
                    onClick={() => handleExportClick('csv')}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Export as CSV
                  </button>
                  <button
                    onClick={() => handleExportClick('json')}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Export as JSON
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters Grid */}
      <div className="space-y-6">
        {/* Drug Selection */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center mb-4">
            <Package className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
            <label className="text-sm font-semibold text-gray-900 dark:text-white">
              Drug Selection
            </label>
          </div>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDrugDropdown(!showDrugDropdown)}
              disabled={isLoading}
              className="w-full flex items-center justify-between px-4 py-3 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all duration-200"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {selectedDrugs.length === 0 
                  ? 'Select drugs...' 
                  : `${selectedDrugs.length} drug${selectedDrugs.length !== 1 ? 's' : ''} selected`
                }
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showDrugDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDrugDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                <div className="p-2">
                  {availableDrugs.map((drug) => (
                    <label
                      key={drug}
                      className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer transition-colors duration-150"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDrugs.includes(drug)}
                        onChange={() => handleDrugToggle(drug)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                        {drug}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected Drugs Tags */}
          {selectedDrugs.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedDrugs.map((drug) => (
                <span
                  key={drug}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                >
                  {drug}
                  <button
                    type="button"
                    onClick={() => handleDrugToggle(drug)}
                    className="ml-2 h-3 w-3 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Date Ranges */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Actual Date Range */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center mb-4">
              <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
              <label className="text-sm font-semibold text-gray-900 dark:text-white">
                Actual Date Range
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={dateRanges.actual.start}
                  onChange={(e) => handleDateRangeChange({ start: e.target.value }, 'actual')}
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white transition-colors duration-200"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={dateRanges.actual.end}
                  onChange={(e) => handleDateRangeChange({ end: e.target.value }, 'actual')}
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white transition-colors duration-200"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Historical Data Range</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                The actual data represents historical sales records from January 2014 to December 2019.
              </p>
            </div>
          </div>

          {/* Forecast Date Range */}
          {showForecast && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center mb-4">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                <label className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Forecast Date Range
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                    From
                  </label>
                  <input
                    type="date"
                    value={dateRanges.forecast.start}
                    onChange={(e) => handleDateRangeChange({ start: e.target.value }, 'forecast')}
                    className="block w-full rounded-lg border-blue-300 dark:border-blue-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white transition-colors duration-200"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                    To
                  </label>
                  <input
                    type="date"
                    value={dateRanges.forecast.end}
                    onChange={(e) => handleDateRangeChange({ end: e.target.value }, 'forecast')}
                    className="block w-full rounded-lg border-blue-300 dark:border-blue-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white transition-colors duration-200"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}