// Utility functions for processing analytics data

// Process data based on time period for comparison chart
export const processDataByTimePeriod = (data, timePeriod) => {
    if (!data || data.length === 0) return [];

    const groupedData = {};

    data.forEach(item => {
        const salesValue = parseFloat(item.predicted_sales) || 0;
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

// Process data for seasonal analysis / yearly overlay chart
export const processSeasonalOverlayData = (data, selectedDrug, timePeriod) => {
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
            periodKey = `${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        } else if (timePeriod === 'daily') {
            periodKey = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        } else {
            return;
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
            return parseInt(a) - parseInt(b);
        } else {
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

// Generate random colors for each drug
export const generateColor = (index) => {
    const colors = [
        '#2563eb', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
        '#6366f1', '#14b8a6', '#f97316', '#dc2626'
    ];
    return colors[index % colors.length];
};
