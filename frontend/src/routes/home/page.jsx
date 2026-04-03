import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { Footer } from '@/layouts/footer';
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  TrendingUp,
  Brain,
  Clock,
  Package,
  ArrowRight,
  Activity,
  CheckCircle,
  Pill
} from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: LayoutDashboard,
      title: "Forecast Dashboard",
      description: "Monitor predicted drug sales with interactive line and bar charts across daily, monthly, and yearly views.",
      path: "/dashboard",
      accent: "bg-blue-500/20 text-blue-500 dark:bg-blue-600/20 dark:text-blue-400"
    },
    {
      icon: BarChart3,
      title: "Analytics & Heatmaps",
      description: "Explore sales trends, seasonal patterns, and demand heatmaps for each drug category over custom date ranges.",
      path: "/analytics",
      accent: "bg-purple-500/20 text-purple-500 dark:bg-purple-600/20 dark:text-purple-400"
    },
    {
      icon: FileText,
      title: "Reports & Export",
      description: "Generate combined actual vs. forecast reports. Export your data as CSV or JSON for further analysis.",
      path: "/report",
      accent: "bg-green-500/20 text-green-500 dark:bg-green-600/20 dark:text-green-400"
    },
    {
      icon: Brain,
      title: "ML Model Predictions",
      description: "Forecasts powered by Random Forest, KNN, and XGBoost models trained on 6 years of pharmaceutical sales data.",
      path: "/dashboard",
      accent: "bg-yellow-500/20 text-yellow-500 dark:bg-yellow-600/20 dark:text-yellow-400"
    }
  ];

  const drugCategories = [
    { code: "M01AB", name: "Anti-inflammatory (acetic acid derivatives)" },
    { code: "M01AE", name: "Anti-inflammatory (propionic acid derivatives)" },
    { code: "N02BA", name: "Analgesics (salicylic acid)" },
    { code: "N02BE", name: "Analgesics (anilides)" },
    { code: "N05B", name: "Anxiolytics" },
    { code: "N05C", name: "Hypnotics & Sedatives" },
    { code: "R03", name: "Obstructive airway diseases" },
    { code: "R06", name: "Antihistamines (systemic)" }
  ];

  const stats = [
    { value: "6", label: "Years of Data", sublabel: "2014 – 2019", icon: Clock },
    { value: "8", label: "Drug Categories", sublabel: "ATC classified", icon: Package },
    { value: "3", label: "ML Models", sublabel: "RF · KNN · XGB", icon: Brain },
    { value: "16K+", label: "Sales Records", sublabel: "Daily granularity", icon: Activity }
  ];

  return (
    <div className="flex flex-col gap-y-6">
      <h1 className="title">Home</h1>

      {/* Welcome Banner */}
      <div className="card overflow-hidden">
        <div className="relative bg-gradient-to-r from-[#471396] to-blue-600 px-8 py-10">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-1/2 w-24 h-24 bg-white/5 rounded-full translate-y-10" />

          <div className="relative z-10 max-w-3xl">
            <p className="text-sm font-medium text-purple-200 mb-1">
              Welcome back{user?.name ? `, ${user.name}` : ''}
            </p>
            <h2 className="text-3xl font-bold text-white mb-3">
              Pharmaceutical Demand Forecasting
            </h2>
            <p className="text-base text-purple-100 leading-relaxed mb-6 max-w-2xl">
              Predict future drug demand using machine learning models trained on historical pharmacy sales data.
              View forecasts, compare trends, and export reports — all from one dashboard.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center px-5 py-2.5 bg-white text-[#471396] rounded-lg font-semibold text-sm hover:bg-purple-50 transition-colors group"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="card">
            <div className="card-header">
              <div className="w-fit rounded-lg bg-blue-500/20 p-2 text-blue-500 dark:bg-blue-600/20 dark:text-blue-400">
                <stat.icon size={22} />
              </div>
              <p className="card-title">{stat.label}</p>
            </div>
            <div className="card-body bg-slate-100 transition-colors dark:bg-slate-950">
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{stat.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{stat.sublabel}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
          What You Can Do
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, i) => (
            <button
              key={i}
              onClick={() => navigate(feature.path)}
              className="card text-left group hover:ring-1 hover:ring-blue-500/30 transition-all"
            >
              <div className="card-header">
                <div className={`w-fit rounded-lg p-2.5 ${feature.accent}`}>
                  <feature.icon size={22} />
                </div>
                <p className="card-title group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                  {feature.title}
                </p>
              </div>
              <div className="card-body bg-slate-100 dark:bg-slate-950">
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
                <span className="inline-flex items-center text-xs font-medium text-blue-500 dark:text-blue-400 mt-3 group-hover:translate-x-1 transition-transform">
                  Open
                  <ArrowRight className="w-3 h-3 ml-1" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Drug Categories & Dataset Info */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Drug codes */}
        <div className="card lg:col-span-3">
          <div className="card-header">
            <div className="w-fit rounded-lg bg-purple-500/20 p-2 text-purple-500 dark:bg-purple-600/20 dark:text-purple-400">
              <Pill size={22} />
            </div>
            <p className="card-title">Drug Categories (ATC)</p>
          </div>
          <div className="card-body bg-slate-100 dark:bg-slate-950">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {drugCategories.map((drug) => (
                <div
                  key={drug.code}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                >
                  <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                    {drug.code}
                  </span>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{drug.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dataset overview */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <div className="w-fit rounded-lg bg-green-500/20 p-2 text-green-500 dark:bg-green-600/20 dark:text-green-400">
              <CheckCircle size={22} />
            </div>
            <p className="card-title">About the Dataset</p>
          </div>
          <div className="card-body bg-slate-100 dark:bg-slate-950 space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Sales data exported from a pharmacy POS system, covering <span className="font-semibold text-slate-900 dark:text-slate-100">January 2014 to December 2019</span>.
            </p>
            <div className="space-y-2.5">
              {[
                "Daily, weekly, and monthly aggregations",
                "Pre-processed with outlier treatment",
                "Weather features for enhanced predictions",
                "8 drug categories across ATC codes"
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">{item}</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">ML Models</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Random Forest, K-Nearest Neighbors, and XGBoost — each trained with and without weather features.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick start tip */}
      <div className="card">
        <div className="card-header">
          <div className="w-fit rounded-lg bg-yellow-500/20 p-2 text-yellow-500 dark:bg-yellow-600/20 dark:text-yellow-400">
            <TrendingUp size={22} />
          </div>
          <p className="card-title">Getting Started</p>
        </div>
        <div className="card-body bg-slate-100 dark:bg-slate-950">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: "1", title: "Dashboard", desc: "Check predicted sales and KPIs for all 8 drug categories." },
              { step: "2", title: "Analytics", desc: "Explore heatmaps and drill into daily trends for specific drugs." },
              { step: "3", title: "Reports", desc: "Compare actual vs. forecast data and export results as CSV or JSON." }
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center">
                  {s.step}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{s.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;