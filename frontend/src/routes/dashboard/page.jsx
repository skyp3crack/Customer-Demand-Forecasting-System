import { useState, useEffect, useContext } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, BarChart, Bar } from "recharts";
import { useTheme } from "@/hooks/use-theme";
import { overviewData } from "@/constants";
import { Footer } from "@/layouts/footer";
import { Calendar, ChevronDown, Filter, Package, TrendingUp, AlertCircle } from "lucide-react";
import { AuthContext } from "@/contexts/auth-context";

// Use the authenticated API instance from the auth context
const useApi = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useApi must be used within an AuthProvider');
  }
  return context.api;
};

// Helper function to handle API errors
const handleApiError = (error, setError) => {
  console.error('API Error:', error);
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('Error data:', error.response.data);
    console.error('Error status:', error.response.status);
    console.error('Error headers:', error.response.headers);
    setError(`Error: ${error.response.status} - ${error.response.data?.message || 'An error occurred'}`);
  } else if (error.request) {
    // The request was made but no response was received
    console.error('No response received:', error.request);
    setError('No response from server. Please check your connection.');
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Error:', error.message);
    setError(`Error: ${error.message}`);
  }
};

// Custom MultiSelect component for drug selection
const MultiSelect = ({ options, selectedValues, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (value) => {
        if (selectedValues.includes(value)) {
            onChange(selectedValues.filter(item => item !== value));
        } else {
            onChange([...selectedValues, value]);
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="flex items-center justify-between w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
            >
                <span>{selectedValues.length ? `${selectedValues.length} drugs selected` : 'Select drugs'}</span>
                <ChevronDown size={16} />
            </button>
            
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
                    {options.map(option => (
                        <div 
                            key={option} 
                            className="flex items-center px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                            onClick={() => toggleOption(option)}
                        >
                            <input 
                                type="checkbox" 
                                checked={selectedValues.includes(option)} 
                                onChange={() => {}} 
                                className="mr-2"
                            />
                            <span>{option}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Time period toggle component
const TimeToggle = ({ value, onChange }) => {
    const options = ['daily', 'monthly', 'yearly'];
    
    return (
        <div className="flex border rounded-md overflow-hidden">
            {options.map(option => (
                <button
                    key={option}
                    className={`px-3 py-2 text-sm ${value === option ? 'bg-blue-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                    onClick={() => onChange(option)}
                >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
            ))}
        </div>
    );
};

// Utility function to process data based on time period
const processDataByTimePeriod = (data, timePeriod) => {
    if (!data || data.length === 0) return [];
    
    const groupedData = {};
    
    data.forEach(item => {
        // Ensure predicted_sales is a number, default to 0 if invalid
        const salesValue = parseFloat(item.predicted_sales);
        if (isNaN(salesValue)) {
            console.warn(`Invalid predicted_sales value: ${item.predicted_sales}. Defaulting to 0.`);
            return; // Skip this item if sales is invalid
        }

        const date = new Date(item.date);
        let key;
        
        if (timePeriod === 'daily') {
            // Ensure date is in YYYY-MM-DD format for consistent keys
            key = date.toISOString().split('T')[0]; 
        } else if (timePeriod === 'monthly') {
            key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        } else if (timePeriod === 'yearly') {
            // For yearly, if item.year exists, use it, otherwise derive from date
            key = item.year ? `${item.year}` : `${date.getFullYear()}`;
        }
        
        if (!groupedData[key]) {
            groupedData[key] = {};
        }
        
        if (!groupedData[key][item.drug]) {
            groupedData[key][item.drug] = 0;
        }
        
        // Sum up sales for the given drug and time key
        groupedData[key][item.drug] += salesValue;
    });
    
    // Convert to array format for Recharts
    return Object.keys(groupedData).map(dateKey => {
        const entry = { date: dateKey }; // Keep 'date' as the dataKey for XAxis
        Object.keys(groupedData[dateKey]).forEach(drug => {
            entry[drug] = groupedData[dateKey][drug];
        });
        return entry;
    }).sort((a, b) => {
        // Sort by date key
        if (timePeriod === 'daily' || timePeriod === 'monthly') {
            return new Date(a.date) - new Date(b.date);
        } else if (timePeriod === 'yearly') {
            return parseInt(a.date) - parseInt(b.date);
        }
        return 0;
    });
};

// Generate random colors for each drug
const generateColor = (index) => {
    const colors = [
        '#2563eb', '#10b981', '#f59e0b', '#ef4444', 
        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
        '#6366f1', '#14b8a6', '#f97316', '#dc2626'
    ];
    return colors[index % colors.length];
};

// Add this helper function at the top level
const calculateKPIs = (data, timePeriod) => {
    if (!data || data.length === 0) return {
        totalPredictedSales: 0,
        topDrugs: [],
        trendIndicator: 0,
        upcomingPeak: { date: null, sales: 0 }  // Provide default structure
    };

    // Calculate total predicted sales for the next period
    const totalPredictedSales = data.reduce((sum, item) => {
        const sales = parseFloat(item.predicted_sales);
        return sum + sales;
    }, 0);

    // Calculate top 3 drugs by predicted sales
    const drugTotals = {};
    data.forEach(item => {
        const sales = parseFloat(item.predicted_sales);
        drugTotals[item.drug] = (drugTotals[item.drug] || 0) + sales;
    });
    
    const topDrugs = Object.entries(drugTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([drug, total]) => ({ drug, total }));

    // Calculate trend (comparing current period with previous)
    // This is a simplified version - you might want to adjust based on your needs
    const currentPeriodTotal = totalPredictedSales;
    const previousPeriodTotal = data.length > 1 ? 
        data.slice(0, -1).reduce((sum, item) => sum + (parseFloat(item.predicted_sales) || 0), 0) : 0;
    
    const trendIndicator = previousPeriodTotal === 0 ? 0 : 
        ((currentPeriodTotal - previousPeriodTotal) / previousPeriodTotal) * 100;

    // Find upcoming peak in sales - add null check
    const upcomingPeak = data.reduce((peak, item) => {
        if (!item || !item.date) return peak; // Skip invalid items
        const sales = parseFloat(item.predicted_sales);
        return sales > (peak.sales || 0) ? { date: item.date, sales } : peak;
    }, { date: null, sales: 0 }); // Provide default structure

    return {
        totalPredictedSales,
        topDrugs,
        trendIndicator,
        upcomingPeak
    };
};

const DashboardPage = () => {
    const { theme } = useTheme();
    const [drugData, setDrugData] = useState([]);
    const [availableDrugs, setAvailableDrugs] = useState([]);
    const [selectedDrugs, setSelectedDrugs] = useState([]);
    const [timePeriod, setTimePeriod] = useState('monthly');
    const [forecastType, setForecastType] = useState('monthly');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Add new states for date range filtering
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30); // Default to last 30 days
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    
    // Get the authenticated API instance from the auth context
    const api = useApi();
    
    // Set the base URL for the API if not already set
    const baseURL = '/api'; // Use relative URL to leverage Vite proxy
    if (api.defaults.baseURL !== baseURL) {
      api.defaults.baseURL = baseURL;
    }

    // Fetch drug data from the backend
    const fetchDrugData = async (type = 'monthly', start = null, end = null) => {
        setLoading(true);
        setError(null);
        
        try {
            let endpoint;
            let params = {};
            if (type === 'monthly') {
                endpoint = '/forecast/monthly';
            } else if (type === 'yearly') {
                endpoint = '/forecast/yearly';
            } else if (type === 'daily') {
                endpoint = '/forecast/daily';
                if (start && end) {
                    params.startDate = start;
                    params.endDate = end;
                }
            } else {
                throw new Error('Unsupported forecast type selected');
            }

            console.log(`Fetching ${type} data from:`, endpoint, params);
            
            const response = await api.get(endpoint, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                withCredentials: true,
                params: params // Pass parameters for daily filter
            });
            
            console.log(`${type} data response:`, response.data);
            
            if (response.data) {
                setDrugData(response.data);
                
                const drugs = [...new Set(response.data.map(item => item.drug))];
                setAvailableDrugs(drugs);
                
                setSelectedDrugs([...drugs]); // Select all drugs by default
                setError(null);
            } else {
                throw new Error('No data received from server');
            }
        } catch (err) {
            handleApiError(err, setError);
        } finally {
            setLoading(false);
        }
    };
    
    // Initial data fetch and update timePeriod for chart aggregation
    useEffect(() => {
        // Call fetchDrugData with startDate and endDate when forecastType is daily
        if (forecastType === 'daily') {
            fetchDrugData(forecastType, startDate, endDate);
        } else {
            fetchDrugData(forecastType);
        }
        // Set the chart's X-axis aggregation type based on the fetched forecastType
        setTimePeriod(forecastType);
    }, [forecastType, startDate, endDate]); // Add startDate and endDate to dependencies
    
    // Process data based on selected time period and drugs
    const processedData = processDataByTimePeriod(
        drugData.filter(item => selectedDrugs.includes(item.drug)),
        timePeriod // This timePeriod is used for chart's X-axis aggregation
    );

    // Calculate KPIs whenever drugData changes
    const kpis = calculateKPIs(drugData, timePeriod);

    return (
        <div className="flex flex-col gap-y-4">
            <h1 className="title">Dashboard</h1>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Predicted Sales KPI */}
                <div className="card">
                    <div className="card-header">
                        <div className="w-fit rounded-lg bg-blue-500/20 p-2 text-blue-500 transition-colors dark:bg-blue-600/20 dark:text-blue-600">
                            <Package size={26} />
                        </div>
                        <p className="card-title">Total Predicted Sales</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Next {timePeriod === 'daily' ? '30 days' : timePeriod === 'monthly' ? '3 months' : 'year'}
                        </p>
                    </div>
                    <div className="card-body bg-slate-100 transition-colors dark:bg-slate-950">
                        <p className="text-3xl font-bold text-slate-900 transition-colors dark:text-slate-50">
                            {kpis.totalPredictedSales.toLocaleString()}
                        </p>
                        <span className={`flex w-fit items-center gap-x-2 rounded-full border px-2 py-1 font-medium ${
                            kpis.trendIndicator >= 0 
                                ? 'border-green-500 text-green-500 dark:border-green-600 dark:text-green-600'
                                : 'border-red-500 text-red-500 dark:border-red-600 dark:text-red-600'
                        }`}>
                            <TrendingUp size={18} className={kpis.trendIndicator < 0 ? 'rotate-180' : ''} />
                            {Math.abs(kpis.trendIndicator).toFixed(1)}%
                        </span>
                    </div>
                </div>

                {/* Top Performing Drug KPI */}
                <div className="card">
                    <div className="card-header">
                        <div className="w-fit rounded-lg bg-green-500/20 p-2 text-green-500 transition-colors dark:bg-green-600/20 dark:text-green-600">
                            <TrendingUp size={26} />
                        </div>
                        <p className="card-title">Top Performing Drug</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Highest predicted sales
                        </p>
                    </div>
                    <div className="card-body bg-slate-100 transition-colors dark:bg-slate-950">
                        {kpis.topDrugs.length > 0 ? (
                            <>
                                <p className="text-xl font-bold text-slate-900 transition-colors dark:text-slate-50">
                                    {kpis.topDrugs[0].drug}
                                </p>
                                <p className="text-lg text-slate-600 dark:text-slate-400">
                                    {kpis.topDrugs[0].total.toLocaleString()} units
                                </p>
                            </>
                        ) : (
                            <p className="text-slate-600 dark:text-slate-400">No data available</p>
                        )}
                    </div>
                </div>

                {/* Upcoming Peak KPI */}
                <div className="card">
                    <div className="card-header">
                        <div className="w-fit rounded-lg bg-yellow-500/20 p-2 text-yellow-500 transition-colors dark:bg-yellow-600/20 dark:text-yellow-600">
                            <Calendar size={26} />
                        </div>
                        <p className="card-title">Upcoming Peak</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Highest predicted sales period
                        </p>
                    </div>
                    <div className="card-body bg-slate-100 transition-colors dark:bg-slate-950">
                        {kpis.upcomingPeak && kpis.upcomingPeak.date ? (
                            <>
                                <p className="text-xl font-bold text-slate-900 transition-colors dark:text-slate-50">
                                    {new Date(kpis.upcomingPeak.date).toLocaleDateString()}
                                </p>
                                <p className="text-lg text-slate-600 dark:text-slate-400">
                                    {kpis.upcomingPeak.sales.toLocaleString()} units
                                </p>
                            </>
                        ) : (
                            <p className="text-slate-600 dark:text-slate-400">No peak data available</p>
                        )}
                    </div>
                </div>

                {/* Second & Third Top Drugs KPI */}
                <div className="card">
                    <div className="card-header">
                        <div className="w-fit rounded-lg bg-purple-500/20 p-2 text-purple-500 transition-colors dark:bg-purple-600/20 dark:text-purple-600">
                            <AlertCircle size={26} />
                        </div>
                        <p className="card-title">Other Top Performers</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Second & third highest
                        </p>
                    </div>
                    <div className="card-body bg-slate-100 transition-colors dark:bg-slate-950">
                        {kpis.topDrugs.length > 1 ? (
                            <div className="space-y-2">
                                {kpis.topDrugs.slice(1).map((drug, index) => (
                                    <div key={drug.drug} className="flex justify-between items-center">
                                        <p className="text-slate-900 dark:text-slate-50">{drug.drug}</p>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            {drug.total.toLocaleString()} units
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-600 dark:text-slate-400">No additional data available</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Drug Sales Forecast Chart */}
            <div className="card col-span-1 md:col-span-2 lg:col-span-7">
                <div className="card-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <p className="card-title">Drug Sales Forecast</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Predicted sales for selected drugs</p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <div className="w-full md:w-64">
                            <MultiSelect 
                                options={availableDrugs} 
                                selectedValues={selectedDrugs} 
                                onChange={setSelectedDrugs} 
                            />
                        </div>
                        <div className="flex gap-2">
                            {/* Date range inputs for daily view */}
                            {forecastType === 'daily' && (
                                <>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="px-3 py-1 rounded-md text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                                    />
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="px-3 py-1 rounded-md text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                                    />
                                </>
                            )}
                            <button
                                onClick={() => setForecastType('daily')}
                                className={`px-3 py-1 rounded-md text-sm ${
                                    forecastType === 'daily'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                                }`}
                            >
                                Daily
                            </button>
                            <button
                                onClick={() => setForecastType('monthly')}
                                className={`px-3 py-1 rounded-md text-sm ${
                                    forecastType === 'monthly'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                                }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setForecastType('yearly')}
                                className={`px-3 py-1 rounded-md text-sm ${
                                    forecastType === 'yearly'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                                }`}
                            >
                                Yearly
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="card-body p-0">
                    {loading ? (
                        <div className="flex justify-center items-center h-80">
                            <p>Loading drug data...</p>
                        </div>
                    ) : error ? (
                        <div className="flex justify-center items-center h-80 text-red-500">
                            <p>{error}</p>
                        </div>
                    ) : processedData.length === 0 ? (
                        <div className="flex justify-center items-center h-80">
                            <p>No data available for the selected drugs and time period.</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={400}>
                            {forecastType === 'yearly' ? (
                                <BarChart
                                    data={processedData}
                                    margin={{
                                        top: 20,
                                        right: 30,
                                        left: 20,
                                        bottom: 10,
                                    }}
                                >
                                    <XAxis 
                                        dataKey="date" 
                                        strokeWidth={0}
                                        stroke={theme === "light" ? "#475569" : "#94a3b8"}
                                        tickFormatter={(value) => value} // Value is already the year
                                        tickMargin={6}
                                    />
                                    <YAxis 
                                        strokeWidth={0}
                                        stroke={theme === "light" ? "#475569" : "#94a3b8"}
                                        tickFormatter={(value) => (isNaN(value) || value === null) ? '' : value.toLocaleString()} 
                                        tickMargin={6}
                                        width={forecastType === 'yearly' ? 80 : 60}
                                    />
                                    <Tooltip 
                                        formatter={(value, name) => [
                                            (isNaN(value) || value === null) ? 'N/A' : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
                                            `Predicted Sales (${name})`
                                        ]}
                                        labelFormatter={(label) => `Year: ${label}`}
                                    />
                                    <Legend />
                                    {selectedDrugs.map((drug, index) => (
                                        <Bar
                                            key={drug}
                                            dataKey={drug}
                                            name={drug}
                                            fill={generateColor(index)}
                                        />
                                    ))}
                                </BarChart>
                            ) : (
                                <LineChart
                                    data={processedData}
                                    margin={{
                                        top: 20,
                                        right: 30,
                                        left: 20,
                                        bottom: 10,
                                    }}
                                >
                                    <XAxis 
                                        dataKey="date" 
                                        strokeWidth={0}
                                        stroke={theme === "light" ? "#475569" : "#94a3b8"}
                                        tickFormatter={(value) => {
                                            if (timePeriod === 'daily') {
                                                const date = new Date(value);
                                                return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
                                            } else if (timePeriod === 'monthly') {
                                                return value; // YYYY-MM format
                                            } else if (timePeriod === 'yearly') {
                                                return value; // YYYY format
                                            }
                                            return value;
                                        }}
                                        tickMargin={6}
                                    />
                                    <YAxis 
                                        strokeWidth={0}
                                        stroke={theme === "light" ? "#475569" : "#94a3b8"}
                                        // This line already doesn't add a dollar sign, it just formats the number
                                        tickFormatter={(value) => (isNaN(value) || value === null) ? '' : value.toLocaleString()} 
                                        tickMargin={6}
                                        width={forecastType === 'yearly' ? 80 : 60}
                                    />
                                    <Tooltip 
                                        // Remove the dollar sign from here
                                        formatter={(value, name) => [
                                            (isNaN(value) || value === null) ? 'N/A' : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
                                            `Predicted Sales (${name})`
                                        ]}
                                        labelFormatter={(label) => {
                                            if (timePeriod === 'daily') {
                                                const date = new Date(label);
                                                return `Date: ${date.toLocaleDateString()}`;
                                            } else if (timePeriod === 'monthly') {
                                                return `Month: ${label}`;
                                            } else if (timePeriod === 'yearly') {
                                                return `Year: ${label}`;
                                            }
                                            return `Date: ${label}`;
                                        }}
                                    />
                                    <Legend />
                                    
                                    {selectedDrugs.map((drug, index) => (
                                        <Line
                                            key={drug}
                                            type="monotone"
                                            dataKey={drug}
                                            name={drug}
                                            stroke={generateColor(index)}
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    ))}
                                </LineChart>
                            )}
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
            
            
            
            <Footer />
        </div>
    );
};

export default DashboardPage;