import axios from 'axios';
import { api } from '../contexts/auth-context';

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (e.g., redirect to login)
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API service functions
export const apiService = {
  // User Profile
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      // Create FormData to handle file uploads
      const formData = new FormData();
      
      // Append all profile fields to formData
      Object.keys(profileData).forEach(key => {
        if (profileData[key] !== undefined && profileData[key] !== null) {
          formData.append(key, profileData[key]);
        }
      });

      const response = await api.patch('/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.patch('/users/profile/password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  // Get list of available drugs
  getAvailableDrugs: async () => {
    try {
      const response = await api.get('/drugs/available');
      return response.data;
    } catch (error) {
      console.error('Error fetching available drugs:', error);
      throw error;
    }
  },

  // Search for drugs
  searchDrugs: async (query) => {
    try {
      const response = await api.get(`/api/drugs/search?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching drugs:', error);
      throw error;
    }
  },

  // Get drug performance report data
  getDrugPerformanceReport: async ({ drugIds, timePeriod = 'daily', startDate, endDate }) => {
    try {
      if (!drugIds || !drugIds.length) {
        throw new Error('At least one drug ID is required');
      }
      
      if (!startDate || !endDate) {
        throw new Error('Both startDate and endDate are required');
      }

      const response = await api.post('/reports/drug-performance', {
        drugIds,
        timePeriod,
        startDate,
        endDate
      });
      
      // Transform the response to match the frontend's expected format
      return {
        data: response.data.data || [],
        kpis: response.data.kpis || {},
        meta: response.data.meta || {}
      };
    } catch (error) {
      console.error('Error fetching drug performance report:', error);
      throw error;
    }
  },

  // Export report data
  exportReport: async ({ drugIds, timePeriod = 'daily', startDate, endDate, format = 'csv' }) => {
    try {
      const response = await api.post(
        '/reports/export',
        { drugIds, timePeriod, startDate, endDate, format },
        { responseType: format === 'csv' ? 'blob' : 'json' }
      );

      if (format === 'csv') {
        // Handle CSV download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `drug-performance-report-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      return response.data;
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  },
};

export default apiService;
