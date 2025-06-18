import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Create axios instance with default config
const createApiInstance = () => {
  const instance = axios.create({
    baseURL: 'http://localhost:3000/api',
    withCredentials: true, // This is crucial for sending cookies
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  // Request interceptor to add auth token to requests
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log('Making request to:', config.url);
      return config;
    },
    (error) => {
      console.error('Request error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle token refresh
  instance.interceptors.response.use(
    (response) => {
      console.log('Response received:', response.config.url, response.status);
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      
      // If error is not 401 or we already tried to refresh, reject
      if (error.response?.status !== 401 || originalRequest._retry) {
        console.error('Non-401 error or already retried:', error.response?.status);
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;
      
      try {
        console.log('Attempting to refresh token...');
        const response = await axios.post('http://localhost:3000/api/auth/refresh-token', 
          {},
          {
            withCredentials: true,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.success && response.data.token) {
          console.log('Token refresh successful');
          localStorage.setItem('token', response.data.token);
          originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
          return instance(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }
  );
  
  return instance;
};

// Create and export the API instance
export const api = createApiInstance();

// Create the auth context
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);

  const checkAuth = useCallback(async () => {
    console.log('checkAuth called');
    try {
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token ? 'exists' : 'missing');
      
      if (token) {
        try {
          console.log('Verifying token...');
          const response = await api.get('/auth/verify');
          console.log('Token verification response:', response.data);
          
          if (response.data.success) {
            console.log('Token is valid, user authenticated');
            setUser(response.data.user);
            setAuthenticated(true);
            return true;
          }
        } catch (verifyError) {
          console.error('Token verification failed:', verifyError);
          // Token is invalid, clear it
          localStorage.removeItem('token');
        }
      }
      
      // If we get here, authentication failed
      console.log('Authentication failed, clearing auth state');
      setAuthenticated(false);
      setUser(null);
      return false;
      
    } catch (error) {
      console.error('Error in checkAuth:', error);
      setError(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Attempting login for:', email);
      
      const response = await axios.post('http://localhost:3000/api/auth/login', 
        { email, password },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('Login response:', response);
      
      if (response.data.token) {
        console.log('Login successful, setting token');
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        setAuthenticated(true);
        return true;
      }
      
      console.error('Login failed - no token in response');
      setError('Login failed - no token received');
      return false;
      
    } catch (error) {
      let errorMessage = 'Login failed';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('Login error response:', error.response.data);
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
        
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        errorMessage = 'No response from server';
      } else {
        // Something happened in setting up the request
        console.error('Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      await api.post('/auth/logout', {}, { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setAuthenticated(false);
      window.location.href = '/';
    }
  };

  const signup = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', userData.name);
      formData.append('email', userData.email);
      formData.append('phone', userData.phone || '');
      formData.append('password', userData.password);
      
      if (userData.image) {
        formData.append('image', userData.image);
      }

      console.log('Attempting signup for:', userData.email);
      
      const response = await axios.post('http://localhost:3000/api/auth/signup', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        }
      });
      
      console.log('Signup response:', response);
      
      if (response.data.token) {
        console.log('Signup successful, setting token');
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        setAuthenticated(true);
        return true;
      }
      
      console.error('Signup failed - no token in response');
      setError(response.data?.message || 'Signup failed - please try again');
      return false;
      
    } catch (error) {
      let errorMessage = 'Signup failed';
      
      if (error.response) {
        console.error('Signup error response:', error.response.data);
        errorMessage = error.response.data?.message || errorMessage;
        
        // Handle validation errors
        if (error.response.data?.errors) {
          errorMessage = Object.values(error.response.data.errors)
            .map(err => Array.isArray(err) ? err.join(', ') : err)
            .join('\n');
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        errorMessage = 'No response from server';
      } else {
        console.error('Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    authenticated,
    api,
    login,
    logout,
    signup,
    checkAuth,
    updateUser: (userData) => {
      setUser(prevUser => ({
        ...prevUser,
        ...userData
      }));
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};