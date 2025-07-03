import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/contexts/auth-context';

export const useAnalyticsData = (forecastType = 'monthly') => {
    const [historicalDrugData, setHistoricalDrugData] = useState([]);
    const [availableDrugs, setAvailableDrugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAnalyticsData must be used within an AuthProvider');
    }
    const { api } = context;

    // Helper function to handle API errors
    const handleApiError = (error) => {
        console.error('API Error:', error);
        let errorMessage = 'An error occurred while fetching data';
        
        if (error.response) {
            errorMessage = `Error: ${error.response.status} - ${error.response.data?.message || 'An error occurred'}`;
            console.error('Error data:', error.response.data);
            console.error('Error status:', error.response.status);
        } else if (error.request) {
            errorMessage = 'No response from server. Please check your connection.';
            console.error('No response received:', error.request);
        } else {
            errorMessage = `Error: ${error.message}`;
            console.error('Error:', error.message);
        }
        
        setError(errorMessage);
        setLoading(false);
        return errorMessage;
    };

    // Fetch historical drug data from the backend
    const fetchHistoricalData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const endpoint = `/forecast/historical/all?forecast_type=${forecastType}`;
            console.log(`Fetching ${forecastType} forecast data from:`, endpoint);

            const response = await api.get(endpoint);
            
            if (response.data && Array.isArray(response.data)) {
                // Filter data by forecast_type if it exists in the response
                const filteredData = response.data.filter(item => 
                    !item.forecast_type || item.forecast_type === forecastType
                );
                
                setHistoricalDrugData(filteredData);
                
                // Extract unique drug names
                const drugs = [...new Set(filteredData.map(item => item.drug))];
                setAvailableDrugs(drugs);
                
                return drugs; // Return the drugs for immediate use
            } else {
                throw new Error('Invalid data format received from server');
            }
        } catch (error) {
            handleApiError(error);
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Initialize data fetching
    useEffect(() => {
        const baseURL = '/api';
        if (api.defaults.baseURL !== baseURL) {
            api.defaults.baseURL = baseURL;
        }
        
        fetchHistoricalData();
    }, [forecastType]); // Refetch when forecastType changes

    return {
        historicalDrugData,
        availableDrugs,
        loading,
        error,
        refetchData: fetchHistoricalData
    };
};
