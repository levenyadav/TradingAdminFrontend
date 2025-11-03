import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { UserManagement } from './components/UserManagement';
import { KYCManagement } from './components/KYCManagement';
import { PaymentManagement } from './components/PaymentManagement';
import { PlatformSettings } from './components/PlatformSettings';
import { AdminLayout } from './components/AdminLayout';
import { Login } from './components/Login';
import { Toaster } from './components/ui/sonner';
import { isAuthenticated } from './lib/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated on app load
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage('dashboard');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <UserManagement />;
      case 'kyc':
        return <KYCManagement />;
      case 'payments':
        return <PaymentManagement />;
      case 'settings':
        return <PlatformSettings />;
      default:
        return <Dashboard />;
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold">N</span>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isLoggedIn) {
    return (
      <>
        <Login onLoginSuccess={handleLoginSuccess} />
        <Toaster />
      </>
    );
  }

  // Show admin dashboard if authenticated
  return (
    <>
      <AdminLayout 
        currentPage={currentPage} 
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
        {renderPage()}
      </AdminLayout>
      <Toaster />
    </>
  );
}
