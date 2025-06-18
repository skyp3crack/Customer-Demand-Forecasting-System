import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/theme-context";
import { AuthProvider } from "@/contexts/auth-context";
import { useAuth } from "@/contexts/auth-context";

import Layout from "@/routes/layout";
import DashboardPage from "@/routes/dashboard/page";
import AnalyticsPage from "@/routes/analytics/page";
import ReportPage from "@/routes/report/page";
import SettingsPage from "@/routes/settings/page";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ErrorBoundary from '@/components/ErrorBoundary';
import HomePage from "@/routes/home/page";

// Create a Protected Route component
const ProtectedRoute = ({ children }) => {
  const { authenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <Navigate to="/dashboard/home" replace />,
        },
        {
            path: "/dashboard",
            element: (
                <ErrorBoundary>
                    <Layout />
                </ErrorBoundary>
            ),
            children: [
                {
                    index: true,
                    element: <Navigate to="home" replace />,
                },
                {
                    path: "home",
                    element: <ProtectedRoute><HomePage /></ProtectedRoute>,
                },
                {
                    path: "dashboard",
                    element: <ProtectedRoute><DashboardPage /></ProtectedRoute>,
                },
                {
                    path: "analytics",
                    element: (
                        <ErrorBoundary>
                            <ProtectedRoute>
                                <AnalyticsPage />
                            </ProtectedRoute>
                        </ErrorBoundary>
                    ),
                },
                {
                    path: "reports",
                    element: <ProtectedRoute><ReportPage /></ProtectedRoute>,
                },
                {
                    path: "settings",
                    element: (
                        <ErrorBoundary>
                            <ProtectedRoute>
                                <SettingsPage />
                            </ProtectedRoute>
                        </ErrorBoundary>
                    ),
                },
            ],
        },
        {
            path: "/login",
            element: <LoginPage />,
        },
        {
            path: "/signup",
            element: <SignupPage />,
        },
    ]);

    return (
      <AuthProvider>
        <ThemeProvider>
            <RouterProvider router={router} />
        </ThemeProvider>
      </AuthProvider>
    );
}

export default App;