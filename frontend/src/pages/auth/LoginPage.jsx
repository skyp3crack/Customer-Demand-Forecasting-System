import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import axios from 'axios';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Check for password_required error in URL
  useEffect(() => {
    const error = searchParams.get('error');
    const email = searchParams.get('email');
    
    if (error === 'password_required' && email) {
      setShowSetPassword(true);
      setFormData(prev => ({ ...prev, email }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await login(formData.email, formData.password);
      
      if (result && result.success) {
        console.log('Login successful, navigating to dashboard...');
        navigate('/dashboard', { replace: true });
      } else if (result?.error === 'password_required') {
        setShowSetPassword(true);
      } else {
        setError(result?.error || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials and try again.');
      
      if (err.response?.data?.error === 'password_required') {
        setShowSetPassword(true);
      }
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/set-password`,
        {
          email: formData.email,
          newPassword: passwordData.newPassword
        }
      );
      
      if (response.data.success) {
        // Try to log in with the new password
        const result = await login(formData.email, passwordData.newPassword);
        if (result && result.success) {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err) {
      console.error('Set password error:', err);
      setError(err.response?.data?.message || 'Failed to set password. Please try again.');
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  if (showSetPassword) {
    return (
      <div className="flex min-h-screen bg-white">
        <div className="flex flex-col justify-center px-6 py-8 w-full md:w-1/2 max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Set Your Password</h1>
            <p className="text-gray-600 text-sm">Please set a password for {formData.email}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSetPassword} className="space-y-5">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-900 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={handleClickShowPassword}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-900 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                placeholder="Confirm your new password"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Set Password & Continue
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setShowSetPassword(false)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Section - Enhanced Login Form */}
      <div className="flex flex-col justify-center px-6 py-8 w-full md:w-1/2 max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600 text-sm">Sign in to access your forecasting dashboard</p>
        </div>

        {/* Social Login */}
        <div className="space-y-3 mb-6">
          <button 
            type="button"
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
            onClick={() => {
              // Handle Google login
              window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/google?prompt=select_account`;            }}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium text-gray-700">Continue with Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">or</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm placeholder-gray-400"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm placeholder-gray-400"
              />
              <button
                type="button"
                onClick={handleClickShowPassword}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 transform hover:scale-[1.02]"
          >
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/signup" className="text-blue-600 hover:text-blue-700 font-semibold">
            Create Account
          </a>
        </p>
      </div>

      {/* Right Section - Animated Demand Forecasting Visualization */}
      <div className="hidden md:block w-1/2 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <AnimatedVisualization />
      </div>
    </div>
  );
};

const AnimatedVisualization = () => {
  const [dataPoints, setDataPoints] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(prev => prev + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Generate flowing data points
    const points = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 10 + 5,
      speed: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3,
    }));
    setDataPoints(points);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" className="text-white" />
        </svg>
      </div>

      {/* Floating Data Points */}
      {dataPoints.map((point) => (
        <div
          key={point.id}
          className="absolute rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse"
          style={{
            left: `${(point.x + Math.sin(currentTime * 0.01 + point.id) * 10) % 100}%`,
            top: `${(point.y + Math.cos(currentTime * 0.01 + point.id) * 10) % 100}%`,
            width: `${point.size}px`,
            height: `${point.size}px`,
            opacity: point.opacity,
            transform: `scale(${1 + Math.sin(currentTime * 0.02 + point.id) * 0.3})`,
          }}
        />
      ))}

      {/* Central Dashboard Preview */}
      <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">Demand Intelligence</h3>
          <p className="text-blue-200 text-sm">Real-time forecasting & analytics</p>
        </div>

        {/* Mini Charts */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">+24%</div>
            <div className="text-xs text-blue-200">Growth</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <BarChart3 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">89%</div>
            <div className="text-xs text-blue-200">Accuracy</div>
          </div>
        </div>

        {/* Animated Chart Lines */}
        <div className="bg-white/5 rounded-lg p-4 mb-4">
          <svg className="w-full h-16" viewBox="0 0 300 60">
            <path
              d={`M 0 30 Q 75 ${20 + Math.sin(currentTime * 0.1) * 10} 150 25 T 300 ${30 + Math.cos(currentTime * 0.1) * 15}`}
              fill="none"
              stroke="url(#gradient1)"
              strokeWidth="3"
              className="animate-pulse"
            />
            <path
              d={`M 0 40 Q 75 ${35 + Math.cos(currentTime * 0.15) * 8} 150 35 T 300 ${40 + Math.sin(currentTime * 0.12) * 12}`}
              fill="none"
              stroke="url(#gradient2)"
              strokeWidth="2"
              className="animate-pulse"
            />
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Stats */}
        <div className="flex justify-between text-center">
          <div>
            <PieChart className="w-6 h-6 text-purple-400 mx-auto mb-1" />
            <div className="text-lg font-semibold text-white">2.4K</div>
            <div className="text-xs text-blue-200">Products</div>
          </div>
          <div>
            <Activity className="w-6 h-6 text-green-400 mx-auto mb-1" />
            <div className="text-lg font-semibold text-white">
              {Math.floor(50 + Math.sin(currentTime * 0.1) * 10)}M
            </div>
            <div className="text-xs text-blue-200">Predictions</div>
          </div>
        </div>
      </div>

      {/* Orbiting Elements */}
      <div className="absolute inset-0">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
            style={{
              left: '50%',
              top: '50%',
              transform: `
                translate(-50%, -50%) 
                rotate(${currentTime * (1 + i * 0.5)}deg) 
                translateX(${150 + i * 50}px) 
                rotate(-${currentTime * (1 + i * 0.5)}deg)
              `,
              opacity: 0.6,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoginPage;
