import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { Footer } from '@/layouts/footer';
import { AlertCircle } from 'lucide-react';
import { 
  DrugComparisonChart, 
  SeasonalAnalysisChart, 
  DataControls, 
  TimeToggle,
  ForecastComparisonChart,
  useAnalyticsData 
} from '@/components/analytics';

const AnalyticsPage = () => {
  const { theme } = useTheme();
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [timePeriod, setTimePeriod] = useState('monthly');
  const [seasonalDrug, setSeasonalDrug] = useState('');
  const [seasonalTimePeriod, setSeasonalTimePeriod] = useState('monthly');
  const [forecastMonths, setForecastMonths] = useState(3); // Default to 3 months
  
  const {
    historicalDrugData,
    availableDrugs = [], // Ensure availableDrugs is always an array
    loading,
    error,
    refetchData
  } = useAnalyticsData(timePeriod); // Pass timePeriod to useAnalyticsData

  // Set default selected drugs once available
  useEffect(() => {
    if (availableDrugs.length > 0 && selectedDrugs.length === 0) {
      // Select all drugs by default
      setSelectedDrugs([...availableDrugs]);
      
      // Set the first drug as the default for seasonal analysis
      if (availableDrugs.length > 0 && !seasonalDrug) {
        setSeasonalDrug(availableDrugs[0]);
      }
    }
  }, [availableDrugs]);

  // Handle drug selection change for comparison
  const handleDrugsChange = (selected) => {
    setSelectedDrugs(selected);
  };

  // Handle time period change for comparison chart
  const handleTimePeriodChange = (period) => {
    setTimePeriod(period);
  };

  // Handle seasonal drug change
  const handleSeasonalDrugChange = (drug) => {
    setSeasonalDrug(drug);
  };

  // Handle seasonal time period change
  const handleSeasonalTimePeriodChange = (period) => {
    setSeasonalTimePeriod(period);
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Analyze drug sales trends and seasonal patterns
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-3" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar with controls */}
          <div className="lg:col-span-1">
            <DataControls
              availableDrugs={availableDrugs}
              selectedDrugs={selectedDrugs}
              onDrugsChange={handleDrugsChange}
              timePeriod={timePeriod}
              onTimePeriodChange={handleTimePeriodChange}
              seasonalDrug={seasonalDrug}
              onSeasonalDrugChange={handleSeasonalDrugChange}
              seasonalTimePeriod={seasonalTimePeriod}
              onSeasonalTimePeriodChange={handleSeasonalTimePeriodChange}
              loading={loading}
              forecastMonths={forecastMonths}
              onForecastMonthsChange={setForecastMonths}
            />
          </div>

          {/* Main content area with charts */}
          <div className="lg:col-span-3 space-y-6">
            {/* Drug Comparison Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Drug Sales Comparison
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Compare sales trends across different drugs over time
                </p>
              </div>
              <div className="p-4">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <DrugComparisonChart
                    data={historicalDrugData}
                    selectedDrugs={selectedDrugs}
                    timePeriod={timePeriod}
                  />
                )}
              </div>
            </div>

            {/* Seasonal Analysis Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Seasonal Analysis
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Analyze seasonal patterns and year-over-year trends
                </p>
              </div>
              <div className="p-4">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <SeasonalAnalysisChart
                    data={historicalDrugData}
                    selectedDrug={seasonalDrug}
                    timePeriod={seasonalTimePeriod}
                  />
                )}
              </div>
            </div>

            {/* Forecast Comparison Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Forecast Comparison
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Compare forecasted sales for selected drugs over the next {forecastMonths} months
                </p>
              </div>
              <div className="p-4">
                <ForecastComparisonChart 
                  data={historicalDrugData}
                  selectedDrugs={selectedDrugs}
                  loading={loading}
                  error={error}
                  forecastMonths={forecastMonths}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AnalyticsPage;