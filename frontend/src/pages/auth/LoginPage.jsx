import { useState, useEffect } from 'react';
import { Eye, EyeOff, TrendingUp, BarChart3, Brain, Pill, Activity } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import axios from 'axios';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const err = searchParams.get('error');
    const email = searchParams.get('email');
    if (err === 'password_required' && email) {
      setShowSetPassword(true);
      setFormData(prev => ({ ...prev, email }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await login(formData.email, formData.password);
      if (result?.success) {
        navigate('/dashboard', { replace: true });
      } else if (result?.error === 'password_required') {
        setShowSetPassword(true);
      } else {
        setError(result?.error || 'Invalid email or password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      if (err.response?.data?.error === 'password_required') setShowSetPassword(true);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) { setError('Passwords do not match'); return; }
    if (passwordData.newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/set-password`,
        { email: formData.email, newPassword: passwordData.newPassword }
      );
      if (response.data.success) {
        const result = await login(formData.email, passwordData.newPassword);
        if (result?.success) navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set password.');
    }
  };

  // --- Set Password View ---
  if (showSetPassword) {
    return (
      <div className="flex min-h-screen bg-slate-900">
        <div className="flex flex-col justify-center px-6 py-8 w-full max-w-md mx-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl">
            <h1 className="text-2xl font-bold text-white mb-1">Set Your Password</h1>
            <p className="text-sm text-slate-400 mb-6">Create a password for {formData.email}</p>
            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">{error}</div>}
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                <div className="relative">
                  <input name="newPassword" type={showPassword ? 'text' : 'password'} required value={passwordData.newPassword} onChange={handlePasswordChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="Enter new password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
                <input name="confirmPassword" type={showPassword ? 'text' : 'password'} required value={passwordData.confirmPassword} onChange={handlePasswordChange}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="Confirm password" />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors">Set Password & Continue</button>
            </form>
            <div className="mt-4 text-center">
              <button onClick={() => setShowSetPassword(false)} className="text-blue-400 hover:text-blue-300 text-sm font-medium">Back to login</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Login View ---
  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Left — Form */}
      <div className="flex flex-col justify-center px-6 py-8 w-full md:w-1/2 max-w-md mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#471396] to-blue-600 flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">PharmForecast</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400 text-sm">Sign in to access your forecasting dashboard</p>
        </div>

        {/* Google Login */}
        <button
          type="button"
          className="w-full flex items-center justify-center px-4 py-3 border border-slate-600 rounded-xl hover:bg-slate-800 transition-colors mb-6"
          onClick={() => { window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/google?prompt=select_account`; }}
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-sm font-medium text-slate-300">Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-4 bg-slate-900 text-slate-500">or</span></div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
            <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="you@example.com"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={handleChange} placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" name="rememberMe" checked={formData.rememberMe} onChange={handleChange} className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-slate-400">Remember me</span>
            </label>
            <a href="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 font-medium">Forgot password?</a>
          </div>

          <button type="submit" className="w-full bg-gradient-to-r from-[#471396] to-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-[#3a0f7a] hover:to-blue-700 focus:ring-4 focus:ring-blue-500/20 transition-all text-sm">
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <a href="/signup" className="text-blue-400 hover:text-blue-300 font-semibold">Create Account</a>
        </p>
      </div>

      {/* Right — Project Showcase Panel */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-slate-900 via-[#1a0a2e] to-slate-900 relative overflow-hidden items-center justify-center p-12">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.04]">
          <svg className="w-full h-full"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)" /></svg>
        </div>
        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-blue-600/15 rounded-full blur-[80px]" />

        <div className="relative z-10 max-w-sm w-full">
          {/* Title */}
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-2">Drug Demand Forecasting</h2>
            <p className="text-sm text-slate-400">ML-powered predictions for pharmaceutical sales</p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { icon: Brain, label: "ML Models", value: "3", sub: "RF · KNN · XGB", color: "text-purple-400" },
              { icon: Pill, label: "Drug Codes", value: "8", sub: "ATC categories", color: "text-blue-400" },
              { icon: BarChart3, label: "Data Span", value: "6yr", sub: "2014 – 2019", color: "text-green-400" },
              { icon: Activity, label: "Granularity", value: "Daily", sub: "& monthly", color: "text-yellow-400" }
            ].map((s, i) => (
              <div key={i} className="bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] rounded-xl p-4 text-center hover:bg-white/[0.08] transition-colors">
                <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-2`} />
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-[11px] text-slate-400 font-medium">{s.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Animated chart preview */}
          <div className="bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">Sales Forecast Preview</span>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <svg className="w-full h-14" viewBox="0 0 300 56" fill="none">
              <defs>
                <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#3b82f6"/></linearGradient>
                <linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#10b981"/><stop offset="100%" stopColor="#06b6d4"/></linearGradient>
                <linearGradient id="fill1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3"/><stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/></linearGradient>
              </defs>
              <path d="M0 40 Q30 28 60 32 T120 20 T180 26 T240 14 T300 18" stroke="url(#lg1)" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M0 40 Q30 28 60 32 T120 20 T180 26 T240 14 T300 18 V56 H0Z" fill="url(#fill1)"/>
              <path d="M0 44 Q40 38 80 42 T160 34 T240 38 T300 30" stroke="url(#lg2)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 3"/>
            </svg>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-slate-500">Jan</span>
              <span className="text-[10px] text-slate-500">Jun</span>
              <span className="text-[10px] text-slate-500">Dec</span>
            </div>
          </div>

          {/* Drug pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {['M01AB','M01AE','N02BA','N02BE','N05B','N05C','R03','R06'].map(code => (
              <span key={code} className="text-[10px] font-mono font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full">
                {code}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
