import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Create axios instance with default config
const createApiInstance = () => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
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
        const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/refresh-token`, 
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
  const [message, setMessage] = useState('');
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

  // Forgot password method
  const forgotPassword = async (email) => {
    try {
      setError(null);
      setMessage('');
      
      const response = await api.post('/auth/forgot-password', {
        email,
        redirect_url: `${window.location.origin}/reset-password`
      });
      
      setMessage('If an account exists with this email, you will receive a password reset link.');
      return { success: true };
    } catch (error) {
      console.error('Forgot password error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send reset email. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Reset password method
  const resetPassword = async (token, newPassword) => {
    try {
      setError(null);
      setMessage('');
      
      const response = await api.post('/auth/reset-password', {
        token,
        password: newPassword
      });
      
      setMessage('Your password has been reset successfully!');
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to reset password. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        setAuthenticated(true);
        const userResponse = await api.get('/users/me');
        if (userResponse.data.user) {
          setUser(userResponse.data.user);
        } else if (userResponse.data) {
          setUser(userResponse.data);
        }
        return { success: true };
      }
      return { success: false, error: response.data.message || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      // Handle the case where a Google OAuth user tries to log in with email/password
      if (error.response?.data?.error === 'password_required') {
        return { 
          success: false, 
          error: error.response.data.message || 'Password required',
          requiresPasswordSetup: true,
          email: error.response.data.email
        };
      }
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Clear local storage first
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      // Call the backend logout endpoint
      await api.post('/auth/logout');
      
      // Clear user state
      setUser(null);
      setAuthenticated(false);
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clear local state
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setAuthenticated(false);
      window.location.href = '/login';
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
      
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/signup`, formData, {
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
    message,
    authenticated,
    api, // Add the api instance to the context
    setUser,
    setError,
    setMessage,
    setAuthenticated,
    login,
    logout,
    signup,
    forgotPassword,
    resetPassword,
    checkAuth,
    updateUser: (userData) => {
      setUser(prevUser => {
        if (!prevUser) return userData;
        return {
          ...prevUser,
          ...userData,
          // Ensure we don't lose any existing fields
          name: userData.name !== undefined ? userData.name : prevUser.name,
          email: userData.email !== undefined ? userData.email : prevUser.email,
          phone: userData.phone !== undefined ? userData.phone : prevUser.phone,
          image: userData.image !== undefined ? userData.image : prevUser.image,
          // Add any other user fields that need to be preserved
        };
      });
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