import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/theme-context";
import { AuthProvider } from "@/contexts/auth-context";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { useAuth } from "@/contexts/auth-context";

import Layout from "@/routes/layout";
import DashboardPage from "@/routes/dashboard/page";
import AnalyticsPage from "@/routes/analytics/page";
import ReportPage from "@/routes/report/page";
import SettingsPage from "@/routes/settings/page";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import ErrorBoundary from '@/components/ErrorBoundary';
import HomePage from "@/routes/home/page";
import OAuthCallback from "@/pages/auth/OAuthCallback"; 

// Protected Route component with role-based access control
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { authenticated, loading, user } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }
  
  // Check if route requires admin access and user is not admin
  if (adminOnly && user?.RoleId !== 1) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <Navigate to="/dashboard/home" replace />,
        },
        // Public routes
        {
            path: "/login",
            element: <LoginPage />,
        },
        {
            path: "/signup",
            element: <SignupPage />,
        },
        {
            path: "/forgot-password",
            element: <ForgotPasswordPage />,
        },
        {
            path: "/reset-password",
            element: <ResetPasswordPage />,
        },
        {
            path: "/oauth-callback",
            element: <OAuthCallback />,
        },
        // Protected routes
        {
            path: "/dashboard",
            element: (
                <ProtectedRoute>
                    <ErrorBoundary>
                        <Layout />
                    </ErrorBoundary>
                </ProtectedRoute>
            ),
            children: [
                {
                    index: true,
                    element: <Navigate to="home" replace />,
                },
                {
                    path: "home",
                    element: <HomePage />,
                },
                {
                    path: "dashboard",
                    element: <DashboardPage />,
                },
                {
                    path: "analytics",
                    element: (
                        <ErrorBoundary>
                            <AnalyticsPage />
                        </ErrorBoundary>
                    ),
                },
                {
                    path: "reports",
                    element: (
                        <ProtectedRoute adminOnly={true}>
                            <ReportPage />
                        </ProtectedRoute>
                    ),
                },
                {
                    path: "settings",
                    element: (
                        <ErrorBoundary>
                            <SettingsPage />
                        </ErrorBoundary>
                    ),
                },
            ],
        },
        // Catch-all route
        {
            path: "*",
            element: <Navigate to="/dashboard/home" replace />,
        },
    ]);

    return (
        <ThemeProvider>
            <AuthProvider>
                <NotificationProvider>
                    <RouterProvider router={router} />
                </NotificationProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;