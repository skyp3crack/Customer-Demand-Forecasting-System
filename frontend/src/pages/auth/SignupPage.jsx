import { useState } from 'react';
import { Eye, EyeOff, Camera, Brain, Pill, BarChart3, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,15}$/;
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email) errors.email = 'Email is required';
    else if (!emailRegex.test(formData.email)) errors.email = 'Enter a valid email';
    if (formData.phone && !phoneRegex.test(formData.phone)) errors.phone = 'Enter a valid phone number';
    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 8) errors.password = 'Min 8 characters';
    if (!formData.confirmPassword) errors.confirmPassword = 'Confirm your password';
    else if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (formErrors[e.target.name]) setFormErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) { setError('Please select a valid image (JPEG, PNG, GIF, WebP)'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5 MB'); return; }
    setImage(file);
    setError('');
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const userData = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        image
      };
      const success = await signup(userData);
      if (success) navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = (() => {
    const p = formData.password;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[a-z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthColor = passwordStrength < 3 ? 'bg-red-500' : passwordStrength < 4 ? 'bg-yellow-500' : 'bg-green-500';
  const strengthLabel = passwordStrength < 2 ? 'Weak' : passwordStrength < 4 ? 'Medium' : 'Strong';

  const InputField = ({ label, name, type = 'text', placeholder, required = true, error: fieldErr, children }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          id={name} name={name} type={type} required={required}
          value={formData[name]} onChange={handleChange} placeholder={placeholder}
          className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm ${fieldErr ? 'border-red-500' : 'border-slate-600'}`}
        />
        {children}
      </div>
      {fieldErr && <p className="mt-1 text-xs text-red-400">{fieldErr}</p>}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex w-5/12 bg-gradient-to-br from-slate-900 via-[#1a0a2e] to-slate-900 relative overflow-hidden items-center justify-center p-12">
        {/* Background effects */}
        <div className="absolute inset-0 opacity-[0.04]">
          <svg className="w-full h-full"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)" /></svg>
        </div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-purple-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-blue-600/15 rounded-full blur-[80px]" />

        <div className="relative z-10 max-w-xs w-full">
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#471396] to-blue-600 flex items-center justify-center mx-auto mb-4">
              <Pill className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">PharmForecast</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Predict pharmaceutical demand using Random Forest, KNN, and XGBoost models trained on 6 years of real data.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3 mb-8">
            {[
              { icon: Brain, text: "3 ML models with weather features", color: "text-purple-400" },
              { icon: BarChart3, text: "Daily, monthly & yearly forecasts", color: "text-blue-400" },
              { icon: TrendingUp, text: "Interactive charts & heatmaps", color: "text-green-400" }
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/[0.05] border border-white/[0.08] rounded-lg px-4 py-3">
                <f.icon className={`w-4 h-4 ${f.color} flex-shrink-0`} />
                <span className="text-sm text-slate-300">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Drug codes */}
          <div className="flex flex-wrap gap-2 justify-center">
            {['M01AB','M01AE','N02BA','N02BE','N05B','N05C','R03','R06'].map(code => (
              <span key={code} className="text-[10px] font-mono font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full">
                {code}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Signup Form */}
      <div className="flex flex-col justify-center px-6 py-8 w-full lg:w-7/12 max-w-lg mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-5 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#471396] to-blue-600 flex items-center justify-center">
              <Pill className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-semibold text-white">PharmForecast</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Create Account</h1>
          <p className="text-sm text-slate-400">Join PharmForecast to start analyzing drug demand</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 ml-2 text-lg leading-none">&times;</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Image */}
          <div className="flex items-center gap-4 mb-2">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl text-slate-500">👤</span>
                )}
              </div>
              <label htmlFor="profile-image" className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer transition-colors">
                <Camera className="w-3 h-3 text-white" />
                <input id="profile-image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">Profile Photo</p>
              <p className="text-xs text-slate-500">Optional · Max 5 MB</p>
            </div>
          </div>

          {/* Name Row */}
          <div className="grid grid-cols-2 gap-3">
            <InputField label="First Name" name="firstName" placeholder="John" error={formErrors.firstName} />
            <InputField label="Last Name" name="lastName" placeholder="Doe" error={formErrors.lastName} />
          </div>

          <InputField label="Email" name="email" type="email" placeholder="you@example.com" error={formErrors.email} />
          <InputField label="Phone" name="phone" type="tel" placeholder="+60 12-345 6789" required={false} error={formErrors.phone} />

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">Password<span className="text-red-400 ml-0.5">*</span></label>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={handleChange} placeholder="Min 8 characters"
                className={`w-full px-4 py-3 pr-12 bg-slate-800 border rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm ${formErrors.password ? 'border-red-500' : 'border-slate-600'}`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formErrors.password && <p className="mt-1 text-xs text-red-400">{formErrors.password}</p>}

            {/* Strength bar */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(lv => (
                    <div key={lv} className={`flex-1 h-1 rounded-full transition-colors ${passwordStrength >= lv ? strengthColor : 'bg-slate-700'}`} />
                  ))}
                </div>
                <p className={`text-xs mt-1 ${passwordStrength < 3 ? 'text-red-400' : passwordStrength < 4 ? 'text-yellow-400' : 'text-green-400'}`}>{strengthLabel}</p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password<span className="text-red-400 ml-0.5">*</span></label>
            <div className="relative">
              <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password"
                className={`w-full px-4 py-3 pr-12 bg-slate-800 border rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm ${formErrors.confirmPassword ? 'border-red-500' : 'border-slate-600'}`} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formErrors.confirmPassword && <p className="mt-1 text-xs text-red-400">{formErrors.confirmPassword}</p>}
            {formData.confirmPassword && formData.password === formData.confirmPassword && !formErrors.confirmPassword && (
              <p className="mt-1 text-xs text-green-400">✓ Passwords match</p>
            )}
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#471396] to-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-[#3a0f7a] hover:to-blue-700 focus:ring-4 focus:ring-blue-500/20 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2">
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <a href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">Sign in</a>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;