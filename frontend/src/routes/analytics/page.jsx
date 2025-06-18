import { useState, useEffect, useContext } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, BarChart, Bar } from "recharts";
import { useTheme } from "@/hooks/use-theme";
import { Footer } from "@/layouts/footer";
import { DollarSign, Package, TrendingUp, Users, CreditCard, Calendar, ChevronDown, Filter, AlertCircle } from "lucide-react";
import { AuthContext } from "@/contexts/auth-context";
import { MultiSelect } from '@/components/MultiSelect';

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

// Time period toggle component (Copied from DashboardPage for self-containment)
const TimeToggle = ({ value, onChange, options = ['daily', 'monthly', 'yearly'] }) => {
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

// Utility function to process data based on time period for comparison chart (Copied from DashboardPage)
const processDataByTimePeriod = (data, timePeriod) => {
    if (!data || data.length === 0) return [];

    const groupedData = {};

    data.forEach(item => {
        const salesValue = parseFloat(item.predicted_sales) || 0; // Assuming 'predicted_sales' for historical data too

        const date = new Date(item.date);
        let key;

        if (timePeriod === 'daily') {
            key = date.toISOString().split('T')[0];
        } else if (timePeriod === 'monthly') {
            key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        } else if (timePeriod === 'yearly') {
            key = item.year ? `${item.year}` : `${date.getFullYear()}`;
        }

        if (!groupedData[key]) {
            groupedData[key] = {};
        }

        if (!groupedData[key][item.drug]) {
            groupedData[key][item.drug] = 0;
        }

        groupedData[key][item.drug] += salesValue;
    });

    return Object.keys(groupedData).map(dateKey => {
        const entry = { date: dateKey };
        Object.keys(groupedData[dateKey]).forEach(drug => {
            entry[drug] = groupedData[dateKey][drug];
        });
        return entry;
    }).sort((a, b) => {
        if (timePeriod === 'daily' || timePeriod === 'monthly') {
            return new Date(a.date) - new Date(b.date);
        } else if (timePeriod === 'yearly') {
            return parseInt(a.date) - parseInt(b.date);
        }
        return 0;
    });
};

// New utility function for Seasonal Analysis / Yearly Overlay Chart
const processSeasonalOverlayData = (data, selectedDrug, timePeriod) => {
    if (!data || data.length === 0 || !selectedDrug) return [];

    const filteredData = data.filter(item => item.drug === selectedDrug);
    if (filteredData.length === 0) return [];

    const groupedData = {};
    const years = new Set();

    filteredData.forEach(item => {
        const salesValue = parseFloat(item.predicted_sales) || 0;

        const date = new Date(item.date);
        const year = date.getFullYear();
        years.add(year);

        let periodKey;
        if (timePeriod === 'monthly') {
            periodKey = `${(date.getMonth() + 1).toString().padStart(2, '0')}`; // "01", "02", ...
        } else if (timePeriod === 'daily') {
            periodKey = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`; // "01-01", "01-02", ...
        } else {
            return; // Should not happen with current TimeToggle options
        }

        if (!groupedData[periodKey]) {
            groupedData[periodKey] = { period: periodKey };
        }
        if (!groupedData[periodKey][year]) {
            groupedData[periodKey][year] = 0;
        }
        groupedData[periodKey][year] += salesValue;
    });

    const sortedPeriodKeys = Object.keys(groupedData).sort((a, b) => {
        if (timePeriod === 'monthly') {
            return parseInt(a) - parseInt(b); // Sort months numerically
        } else { // daily
            const [mA, dA] = a.split('-').map(Number);
            const [mB, dB] = b.split('-').map(Number);
            if (mA !== mB) return mA - mB;
            return dA - dB;
        }
    });

    const sortedYears = Array.from(years).sort((a, b) => a - b);

    return sortedPeriodKeys.map(periodKey => {
        const entry = { period: periodKey };
        sortedYears.forEach(year => {
            entry[year] = groupedData[periodKey][year] || 0;
        });
        return entry;
    });
};


// Generate random colors for each drug (Copied from DashboardPage)
const generateColor = (index) => {
    const colors = [
        '#2563eb', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
        '#6366f1', '#14b8a6', '#f97316', '#dc2626'
    ];
    return colors[index % colors.length];
};

const AnalyticsPage = () => {
    const { theme } = useTheme();
    const [historicalDrugData, setHistoricalDrugData] = useState([]);
    const [availableDrugs, setAvailableDrugs] = useState([]);
    const [selectedDrugs, setSelectedDrugs] = useState([]); // For Drug Comparison Chart
    const [timePeriod, setTimePeriod] = useState('monthly'); // For Drug Comparison Chart time aggregation
    const [seasonalDrug, setSeasonalDrug] = useState([]); // For Seasonal Analysis Chart - single drug selection
    const [seasonalTimePeriod, setSeasonalTimePeriod] = useState('monthly'); // For Seasonal Analysis Chart time aggregation (daily/monthly only)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const api = useApi();

    const baseURL = '/api';
    if (api.defaults.baseURL !== baseURL) {
      api.defaults.baseURL = baseURL;
    }

    // Fetch historical drug data from the backend
    // This function will fetch all historical data, filtering happens on frontend
    const fetchHistoricalData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch all historical data at once to allow flexible frontend processing
            // Corrected endpoint: Added '/forecast' to match backend route
            const endpoint = '/forecast/historical/all';
            console.log(`Fetching all historical data from:`, endpoint);

            const response = await api.get(endpoint, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                withCredentials: true
            });

            console.log(`Historical data response:`, response.data);

            if (response.data) {
                setHistoricalDrugData(response.data);

                const drugs = [...new Set(response.data.map(item => item.drug))];
                setAvailableDrugs(drugs);

                // Select first 5 drugs by default for comparison chart
                setSelectedDrugs(drugs.slice(0, 5));
                // Select the first drug for seasonal analysis by default
                if (drugs.length > 0) {
                    setSeasonalDrug([drugs[0]]);
                }
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

    // Initial data fetch for all historical data
    useEffect(() => {
        fetchHistoricalData();
    }, []); // Empty dependency array to fetch only once on component mount

    // Process data for Drug Comparison Chart
    const processedComparisonData = processDataByTimePeriod(
        historicalDrugData.filter(item => selectedDrugs.includes(item.drug)),
        timePeriod
    );

    // Process data for Seasonal Analysis Chart
    const processedSeasonalData = processSeasonalOverlayData(
        historicalDrugData,
        seasonalDrug[0], // Pass the single selected drug
        seasonalTimePeriod
    );

    // Determine years for seasonal chart legend
    const seasonalChartYears = processedSeasonalData.length > 0
        ? Object.keys(processedSeasonalData[0]).filter(key => key !== 'period').sort((a, b) => parseInt(a) - parseInt(b))
        : [];

    return (
        <div className="flex flex-col gap-y-4">
            <h1 className="title">Analytics</h1>

            {/* Keeping existing KPI cards for now as they might be updated later */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <div className="card">
                    <div className="card-header">
                        <div className="w-fit rounded-lg bg-blue-500/20 p-2 text-blue-500 transition-colors dark:bg-blue-600/20 dark:text-blue-600">
                            <Package size={26} />
                        </div>
                        <p className="card-title">Total Products</p>
                    </div>
                    <div className="card-body bg-slate-100 transition-colors dark:bg-slate-950">
                        <p className="text-3xl font-bold text-slate-900 transition-colors dark:text-slate-50">25,154</p>
                        <span className="flex w-fit items-center gap-x-2 rounded-full border border-blue-500 px-2 py-1 font-medium text-blue-500 dark:border-blue-600 dark:text-blue-600">
                            <TrendingUp size={18} />
                            25%
                        </span>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header">
                        <div className="rounded-lg bg-blue-500/20 p-2 text-blue-500 transition-colors dark:bg-blue-600/20 dark:text-blue-600">
                            <DollarSign size={26} />
                        </div>
                        <p className="card-title">Total Paid Orders</p>
                    </div>
                    <div className="card-body bg-slate-100 transition-colors dark:bg-slate-950">
                        <p className="text-3xl font-bold text-slate-900 transition-colors dark:text-slate-50">$16,000</p>
                        <span className="flex w-fit items-center gap-x-2 rounded-full border border-blue-500 px-2 py-1 font-medium text-blue-500 dark:border-blue-600 dark:text-blue-600">
                            <TrendingUp size={18} />
                            12%
                        </span>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header">
                        <div className="rounded-lg bg-blue-500/20 p-2 text-blue-500 transition-colors dark:bg-blue-600/20 dark:text-blue-600">
                            <Users size={26} />
                        </div>
                        <p className="card-title">Total Customers</p>
                    </div>
                    <div className="card-body bg-slate-100 transition-colors dark:bg-slate-950">
                        <p className="text-3xl font-bold text-slate-900 transition-colors dark:text-slate-50">15,400k</p>
                        <span className="flex w-fit items-center gap-x-2 rounded-full border border-blue-500 px-2 py-1 font-medium text-blue-500 dark:border-blue-600 dark:text-blue-600">
                            <TrendingUp size={18} />
                            15%
                        </span>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header">
                        <div className="rounded-lg bg-blue-500/20 p-2 text-blue-500 transition-colors dark:bg-blue-600/20 dark:text-blue-600">
                            <CreditCard size={26} />
                        </div>
                        <p className="card-title">Sales</p>
                    </div>
                    <div className="card-body bg-slate-100 transition-colors dark:bg-slate-950">
                        <p className="text-3xl font-bold text-slate-900 transition-colors dark:text-slate-50">12,340</p>
                        <span className="flex w-fit items-center gap-x-2 rounded-full border border-blue-500 px-2 py-1 font-medium text-blue-500 dark:border-blue-600 dark:text-blue-600">
                            <TrendingUp size={18} />
                            19%
                        </span>
                    </div>
                </div>
            </div>

            {/* Drug Comparison Chart */}
            <div className="card col-span-1 md:col-span-2 lg:col-span-7">
                <div className="card-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <p className="card-title">Drug Comparison</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Compare sales of selected drugs</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <div className="w-full md:w-64">
                            <MultiSelect
                                options={availableDrugs}
                                selectedValues={selectedDrugs}
                                onChange={setSelectedDrugs}
                                placeholder="Select drugs to compare"
                            />
                        </div>
                        <div className="flex gap-2">
                            <TimeToggle
                                value={timePeriod}
                                onChange={setTimePeriod}
                            />
                        </div>
                    </div>
                    </div>

                    <div className="card-body p-0">
                    {loading ? (
                        <div className="flex justify-center items-center h-80">
                            <p>Loading historical data...</p>
                        </div>
                    ) : error ? (
                        <div className="flex justify-center items-center h-80 text-red-500">
                            <p>{error}</p>
                        </div>
                    ) : processedComparisonData.length === 0 ? (
                        <div className="flex justify-center items-center h-80">
                            <p>No historical data available for the selected drugs and time period.</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={400}>
                            {timePeriod === 'yearly' ? (
                                <BarChart
                                    data={processedComparisonData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                                >
                                    <XAxis
                                        dataKey="date"
                                        strokeWidth={0}
                                        stroke={theme === "light" ? "#475569" : "#94a3b8"}
                                        tickFormatter={(value) => value}
                                        tickMargin={6}
                                    />
                                    <YAxis
                                        strokeWidth={0}
                                        stroke={theme === "light" ? "#475569" : "#94a3b8"}
                                        tickFormatter={(value) => (isNaN(value) || value === null) ? '' : value.toLocaleString()}
                                        tickMargin={6}
                                        width={80}
                                    />
                                <Tooltip
                                        formatter={(value) => [
                                            (isNaN(value) || value === null) ? 'N/A' : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                                            'Actual Sales'
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
                                    data={processedComparisonData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
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
                                            }
                                            return value;
                                        }}
                                    tickMargin={6}
                                />
                                <YAxis
                                    strokeWidth={0}
                                    stroke={theme === "light" ? "#475569" : "#94a3b8"}
                                        tickFormatter={(value) => (isNaN(value) || value === null) ? '' : value.toLocaleString()}
                                    tickMargin={6}
                                        width={60}
                                    />
                                    <Tooltip
                                        formatter={(value) => [
                                            (isNaN(value) || value === null) ? 'N/A' : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                                            'Actual Sales'
                                        ]}
                                        labelFormatter={(label) => {
                                            if (timePeriod === 'daily') {
                                                const date = new Date(label);
                                                return `Date: ${date.toLocaleDateString()}`;
                                            } else if (timePeriod === 'monthly') {
                                                return `Month: ${label}`;
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

            {/* Seasonal Analysis / Yearly Overlay Chart */}
            <div className="card col-span-1 md:col-span-2 lg:col-span-7">
                <div className="card-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <p className="card-title">Seasonal Analysis</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Identify seasonal trends across years</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <div className="w-full md:w-64">
                            <MultiSelect
                                options={availableDrugs}
                                selectedValues={seasonalDrug}
                                onChange={setSeasonalDrug}
                                singleSelect={true}
                                placeholder="Select a drug for seasonal analysis"
                            />
                                    </div>
                        <div className="flex gap-2">
                            <TimeToggle
                                value={seasonalTimePeriod}
                                onChange={setSeasonalTimePeriod}
                                options={['monthly', 'daily']} // Seasonal analysis is typically monthly or daily
                            />
                    </div>
                </div>
            </div>

                <div className="card-body p-0">
                    {loading ? (
                        <div className="flex justify-center items-center h-80">
                            <p>Loading seasonal data...</p>
                        </div>
                    ) : error ? (
                        <div className="flex justify-center items-center h-80 text-red-500">
                            <p>{error}</p>
                        </div>
                    ) : processedSeasonalData.length === 0 ? (
                        <div className="flex justify-center items-center h-80">
                            <p>No seasonal data available for the selected drug and time period.</p>
                </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart
                                data={processedSeasonalData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                            >
                                <XAxis
                                    dataKey="period"
                                    strokeWidth={0}
                                    stroke={theme === "light" ? "#475569" : "#94a3b8"}
                                    tickFormatter={(value) => {
                                        if (seasonalTimePeriod === 'monthly') {
                                            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                            return monthNames[parseInt(value) - 1];
                                        }
                                        return value; // "MM-DD" for daily
                                    }}
                                    tickMargin={6}
                                />
                                <YAxis
                                    strokeWidth={0}
                                    stroke={theme === "light" ? "#475569" : "#94a3b8"}
                                    tickFormatter={(value) => (isNaN(value) || value === null) ? '' : value.toLocaleString()}
                                    tickMargin={6}
                                    width={60}
                                />
                                <Tooltip
                                    formatter={(value) => [
                                        (isNaN(value) || value === null) ? 'N/A' : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                                        'Actual Sales'
                                    ]}
                                    labelFormatter={(label) => {
                                        if (seasonalTimePeriod === 'monthly') {
                                            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                                            return `Month: ${monthNames[parseInt(label) - 1]}`;
                                        }
                                        return `Date: ${label}`;
                                    }}
                                />
                                <Legend />

                                {seasonalChartYears.map((year, index) => (
                                    <Line
                                        key={year}
                                        type="monotone"
                                        dataKey={year}
                                        name={year}
                                        stroke={generateColor(index)}
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                    </div>
                </div>

            <Footer />
        </div>
    );
};

export default AnalyticsPage;