import React from 'react';
import { 
  Home, 
  BarChart3, 
  FileText, 
  LayoutDashboard,
  TrendingUp,
  Package,
  Brain,
  Clock,
  ShoppingCart,
  Zap,
  Activity,
  Shield,
  Cloud,
  ArrowRight,
  Star,
  CheckCircle
} from 'lucide-react';

const HomePage = () => {
  const features = [
    {
      icon: <LayoutDashboard className="w-6 h-6" />,
      title: "Real-time Dashboard",
      description: "Monitor pharmacy operations with live data visualization, key performance indicators, and instant alerts for critical inventory levels.",
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Demand Forecasting",
      description: "AI-powered predictive analytics to forecast medication demand, optimize inventory levels, and reduce stockouts by up to 40%.",
      color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Advanced Analytics",
      description: "Deep insights into sales patterns, seasonal trends, customer behavior, and medication usage patterns with interactive charts.",
      color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
      gradient: "from-purple-500 to-violet-600"
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: "Inventory Management",
      description: "Smart inventory tracking with automated reorder points, expiration date monitoring, and supplier performance analytics.",
      color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Comprehensive Reports",
      description: "Generate detailed reports on sales performance, inventory turnover, profit margins, and regulatory compliance metrics.",
      color: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
      gradient: "from-pink-500 to-rose-600"
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "ML Predictions",
      description: "Machine learning algorithms analyze historical data to predict future demand patterns and optimize purchasing decisions.",
      color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
      gradient: "from-indigo-500 to-blue-600"
    }
  ];

  const benefits = [
    { icon: <Zap className="w-4 h-4" />, text: "Reduce stockouts by 40%" },
    { icon: <Activity className="w-4 h-4" />, text: "Improve forecast accuracy by 85%" },
    { icon: <ShoppingCart className="w-4 h-4" />, text: "Optimize inventory costs by 25%" },
    { icon: <Shield className="w-4 h-4" />, text: "Ensure regulatory compliance" },
    { icon: <Cloud className="w-4 h-4" />, text: "Real-time data synchronization" }
  ];

  const stats = [
    { number: "600K+", label: "Transaction Records", icon: <BarChart3 className="w-5 h-5" /> },
    { number: "6", label: "Years of Data", icon: <Clock className="w-5 h-5" /> },
    { number: "57", label: "Drug Categories", icon: <Package className="w-5 h-5" /> },
    { number: "85%", label: "Accuracy Rate", icon: <Star className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
        
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl mb-16 shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90"></div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative z-10 px-8 py-16 lg:px-16 lg:py-24">
            <div className="max-w-4xl">
              <div className="flex items-center mb-8">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl mr-6">
                  <Home className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                    Pharmacy Demand
                    <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                      Forecasting
                    </span>
                  </h1>
                  <p className="text-xl lg:text-2xl text-blue-100 font-medium">
                    AI-Powered Admin Dashboard for Smart Pharmacy Management
                  </p>
                </div>
              </div>
              
              <p className="text-lg lg:text-xl text-blue-50 leading-relaxed mb-8 max-w-3xl">
                Transform your pharmacy operations with cutting-edge machine learning algorithms and predictive analytics. 
                Our comprehensive dashboard provides real-time insights, automated forecasting, and intelligent inventory 
                management to maximize efficiency and profitability.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all duration-300 flex items-center justify-center group shadow-lg">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/20 rounded-full text-sm text-white shadow-lg hover:bg-white/30 transition-all duration-300"
                  >
                    <span className="text-yellow-300">{benefit.icon}</span>
                    {benefit.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white mb-4">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.number}</div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Everything you need to optimize your pharmacy operations and maximize profitability
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mt-6 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                
                <div className="relative z-10">
                  <div className="flex items-start mb-6">
                    <div className={`p-4 rounded-xl ${feature.color} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-2 transition-transform duration-300">
                    Learn more
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dataset Information Section */}
        <div className="mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">About Our Drug Dataset</h2>
              <p className="text-blue-100 text-lg max-w-2xl mx-auto">
                Powered by comprehensive pharmaceutical data spanning 6 years of real-world transactions
              </p>
            </div>
            
            <div className="p-8 lg:p-12">
              <div className="grid lg:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                    Dataset Overview
                  </h3>
                  <div className="space-y-4 text-gray-700 dark:text-gray-300">
                    <p className="text-lg">
                      Our platform is powered by a comprehensive dataset of <span className="font-bold text-blue-600 dark:text-blue-400">600,000+ transactional records</span> collected over 6 years (2014-2019), including detailed sales data exported from pharmacy Point-of-Sale systems.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border-l-4 border-blue-500">
                      <p className="text-blue-700 dark:text-blue-300 font-medium">
                        The dataset has been pre-processed with outlier detection, treatment, and missing data imputation, and is available in hourly, daily, weekly, and monthly aggregations.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <Package className="w-6 h-6 text-purple-500 mr-3" />
                    Drug Categories
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    The dataset includes 57 carefully selected pharmaceutical drugs classified under ATC categories:
                  </p>
                  <div className="grid gap-3">
                    {[
                      "M01AB - Anti-inflammatory and antirheumatic products",
                      "M01AE - Propionic acid derivatives",
                      "N02BA - Salicylic acid derivatives",
                      "N02BE/B - Pyrazolones and Anilides",
                      "N05B - Anxiolytic drugs",
                      "N05C - Hypnotics and sedatives",
                      "R03 - Drugs for obstructive airway diseases",
                      "R06 - Antihistamines for systemic use"
                    ].map((category, index) => (
                      <div key={index} className="flex items-start p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-8 lg:p-12 mb-16 border border-gray-200 dark:border-gray-600 shadow-xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Technical Capabilities
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Advanced technology stack powering intelligent pharmacy management
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6 flex items-center">
                <Brain className="w-6 h-6 mr-3" />
                Machine Learning Models
              </h3>
              <div className="space-y-4">
                {[
                  "Time Series Forecasting (ARIMA, LSTM, Prophet)",
                  "Demand Pattern Recognition & Analysis",
                  "Seasonal Trend Analysis & Predictions",
                  "Real-time Anomaly Detection Algorithms"
                ].map((item, index) => (
                  <div key={index} className="flex items-start p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                    <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-6 flex items-center">
                <Cloud className="w-6 h-6 mr-3" />
                Data Integration
              </h3>
              <div className="space-y-4">
                {[
                  "Real-time POS System Integration",
                  "Electronic Health Records (EHR) Compatibility",
                  "Automated Supplier API Connections",
                  "Multi-location Data Synchronization"
                ].map((item, index) => (
                  <div key={index} className="flex items-start p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                    <CheckCircle className="w-5 h-5 text-purple-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started Section */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-3xl overflow-hidden shadow-2xl">
          <div className="relative px-8 py-16 lg:px-16 lg:py-24">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10 max-w-4xl">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                Ready to Get Started?
              </h2>
              
              <div className="grid lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2">
                  <p className="text-green-50 text-lg leading-relaxed mb-6">
                    Navigate through the dashboard using the sidebar menu to access different modules. Each section 
                    is designed with intuitive controls and comprehensive help documentation to ensure smooth operation.
                  </p>
                  <p className="text-green-50 text-lg leading-relaxed">
                    Start with the Dashboard overview to get familiar with your pharmacy's current performance metrics, 
                    then explore the Forecasting module to set up your first demand predictions.
                  </p>
                </div>
                
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Clock className="w-6 h-6 mr-3" />
                    Need Help?
                  </h3>
                  <p className="text-green-50 leading-relaxed mb-6">
                    Access our comprehensive documentation, interactive video tutorials, or contact our 24/7 expert support team.
                  </p>
                  <button className="w-full px-6 py-3 bg-white text-green-600 rounded-xl font-semibold hover:bg-green-50 transition-colors">
                    Get Support
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-8 py-4 bg-white text-green-600 rounded-xl font-bold text-lg hover:bg-green-50 transition-all duration-300 flex items-center justify-center group shadow-lg">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;