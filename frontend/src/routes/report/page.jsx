import { useState, useEffect, useMemo, useContext } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { ThemeProviderContext } from '../../contexts/theme-context';
import { Footer } from '../../layouts/footer';
import ChartActual from '../../components/report/ChartActual';
import ChartForecast from '../../components/report/ChartForecast';
import DataTable from '../../components/report/DataTable';
import FiltersPanel from '../../components/report/FiltersPanel';
import ShareReportButton from '../../components/report/ShareReportButton';
import useToast from '../../hooks/useToast';

export default function ReportPage() {
  const { api, user } = useAuth();
  const { theme } = useContext(ThemeProviderContext);
  const toast = useToast();
  const [availableDrugs, setAvailableDrugs] = useState([]);
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [reportData, setReportData] = useState({ actual: [], forecast: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForecast, setShowForecast] = useState(false);
  const [dateRanges, setDateRanges] = useState({
    actual: {
      start: '2014-01-01',
      end: '2014-02-01',
    },
    forecast: {
      start: new Date().toISOString().split('T')[0],
      end: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    },
  });

  // Fetch available drugs on component mount
  useEffect(() => {
    const fetchAvailableDrugs = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/drugs/available');
        setAvailableDrugs(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch drugs:', err);
        setError('Failed to load available drugs. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableDrugs();
  }, [api]);

  // Fetch report data when filters change
  useEffect(() => {
    const fetchReportData = async () => {
      if (selectedDrugs.length === 0) {
        setReportData({ actual: [], forecast: [] });
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await api.get('/drugs/combined-report', {
          params: {
            drugIds: selectedDrugs,
            actualStart: dateRanges.actual.start,
            actualEnd: dateRanges.actual.end,
            forecastStart: showForecast ? dateRanges.forecast.start : undefined,
            forecastEnd: showForecast ? dateRanges.forecast.end : undefined
          },
        });
        
        setReportData(response.data.data || { actual: [], forecast: [] });
      } catch (err) {
        console.error('Failed to fetch report data:', err);
        setError('Failed to load report data. Please try again.');
        setReportData({ actual: [], forecast: [] });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [selectedDrugs, dateRanges, showForecast, api]);

  // Transform data for chart and table
  const transformedData = useMemo(() => {
    const dataMap = new Map();
    
    // Process actual data - filter by actual date range
    reportData.actual
      .filter(item => {
        try {
          const itemDate = new Date(item.date);
          const startDate = new Date(dateRanges.actual.start);
          const endDate = new Date(dateRanges.actual.end);
          return itemDate >= startDate && itemDate <= endDate;
        } catch (e) {
          console.error('Error filtering actual data:', e);
          return false;
        }
      })
      .forEach(item => {
        if (!dataMap.has(item.date)) {
          dataMap.set(item.date, { period: item.date });
        }
        dataMap.get(item.date)[`${item.drug}_actual`] = item.value;
      });
    
    // Process forecast data if enabled - filter by forecast date range
    if (showForecast) {
      reportData.forecast
        .filter(item => {
          try {
            const itemDate = new Date(item.date);
            const startDate = new Date(dateRanges.forecast.start);
            const endDate = new Date(dateRanges.forecast.end);
            return itemDate >= startDate && itemDate <= endDate;
          } catch (e) {
            console.error('Error filtering forecast data:', e);
            return false;
          }
        })
        .forEach(item => {
          if (!dataMap.has(item.date)) {
            dataMap.set(item.date, { period: item.date });
          }
          dataMap.get(item.date)[`${item.drug}_forecast`] = item.value;
        });
    }
    
    return Array.from(dataMap.values()).sort((a, b) => 
      new Date(a.period) - new Date(b.period)
    );
  }, [reportData, showForecast, dateRanges]);

  // Get unique drugs from the data
  const uniqueDrugs = useMemo(() => {
    const drugs = new Set();
    reportData.actual.concat(reportData.forecast).forEach(item => {
      if (item.drug) drugs.add(item.drug);
    });
    return Array.from(drugs);
  }, [reportData]);

  // Generate a report title based on selected drugs and date range
  const reportTitle = useMemo(() => {
    const drugNames = selectedDrugs.length > 0 
      ? selectedDrugs.join(', ')
      : 'All Drugs';
    const startDate = new Date(dateRanges.actual.start).toLocaleDateString();
    const endDate = new Date(dateRanges.forecast.end).toLocaleDateString();
    return `Demand Forecast Report - ${drugNames} (${startDate} to ${endDate})`;
  }, [selectedDrugs, dateRanges]);

  // Handle drug selection change
  const handleDrugSelect = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedDrugs(selectedOptions);
  };

  // Handle date range change
  const handleDateRangeChange = (range, type) => {
    setDateRanges(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        ...range
      }
    }));
  };

  // Toggle forecast visibility
  const toggleForecast = () => {
    setShowForecast(!showForecast);
  };

  // Handle export
  const handleExport = async (format) => {
    if (selectedDrugs.length === 0) {
      const errorMsg = 'Please select at least one drug to export';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      setIsLoading(true);
      const params = {
        drugIds: selectedDrugs.join(','),
        actualStart: dateRanges.actual.start,
        actualEnd: dateRanges.actual.end,
        format: format
      };

      // Add forecast date range if forecast is enabled
      if (showForecast) {
        params.forecastStart = dateRanges.forecast.start;
        params.forecastEnd = dateRanges.forecast.end;
      }

      const response = await api.get('/drugs/export-report', {
        params,
        responseType: 'blob'
      });

      // Create a filename with date range
      const startDate = new Date(dateRanges.actual.start).toISOString().split('T')[0];
      const endDate = showForecast 
        ? new Date(dateRanges.forecast.end).toISOString().split('T')[0]
        : new Date(dateRanges.actual.end).toISOString().split('T')[0];
      
      const filename = `drug_report_${startDate}_to_${endDate}.${format}`;

      // Create and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      const successMsg = `Report exported successfully as ${filename}`;
      toast.success(successMsg);
    } catch (err) {
      console.error('Export failed:', err);
      const errorMsg = err.response?.data?.message || 'Failed to export report. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'dark' : ''}`}>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Demand Forecast Report</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              View and analyze demand forecast data
            </p>
          </div>
          <div className="flex space-x-3">
            <ShareReportButton reportTitle={reportTitle} />
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        <FiltersPanel
          availableDrugs={availableDrugs}
          selectedDrugs={selectedDrugs}
          handleDrugSelect={handleDrugSelect}
          dateRanges={dateRanges}
          handleDateRangeChange={handleDateRangeChange}
          showForecast={showForecast}
          toggleForecast={toggleForecast}
          handleExport={handleExport}
          isLoading={isLoading}
        />

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {selectedDrugs.length > 0 ? (
                <>
                  <ChartActual 
                    data={transformedData} 
                    uniqueDrugs={uniqueDrugs} 
                    theme={theme} 
                  />
                  
                  {showForecast && (
                    <ChartForecast 
                      data={transformedData} 
                      uniqueDrugs={uniqueDrugs} 
                      theme={theme} 
                    />
                  )}
                  
                  <DataTable 
                    data={transformedData} 
                    uniqueDrugs={uniqueDrugs} 
                    showForecast={showForecast} 
                  />
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    Select one or more drugs to view the report
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
