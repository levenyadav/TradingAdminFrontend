import { config, isBrowser } from './config';
import type { LoginRequest, LoginResponse, APIResponse } from './types';

// API Configuration
const API_BASE_URL = config.apiUrl;

// Helper function to get auth token
const getAuthToken = () => {
  if (isBrowser) {
    return localStorage.getItem('accessToken') || '';
  }
  return '';
};

// Auth token management
export const setAuthTokens = (tokens: { accessToken: string; refreshToken: string; }) => {
  if (isBrowser) {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }
};

export const clearAuthTokens = () => {
  if (isBrowser) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};

export const setUser = (user: any) => {
  if (isBrowser) {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export const getUser = () => {
  if (isBrowser) {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

// Generic API call function
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Always use real API - no mock data fallbacks

  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const apiConfig: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, apiConfig);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status} - ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        console.warn('Failed to parse error response:', parseError);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    // Improved error handling and logging
    console.error('API Error Details:', {
      url,
      error,
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Extract meaningful error message
    let errorMessage = 'Failed to connect to server';
    
    if (error.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error.toString && error.toString() !== '[object Object]') {
      errorMessage = error.toString();
    }
    
    // If it's a connection error, provide setup instructions
    if (errorMessage.includes('fetch') || errorMessage.includes('Network') || errorMessage.includes('TypeError')) {
      throw new Error(
        `Cannot connect to backend at ${API_BASE_URL}. ` +
        `Please ensure your backend is running at localhost:5022`
      );
    }
    
    // Throw a new error with the extracted message
    throw new Error(errorMessage);
  }
}

// User Analytics
export const getUserAnalytics = (granularity: string = 'day') => 
  apiCall(`/admin/users/analytics?granularity=${granularity}`);

// User Management
export const getAllUsers = (params?: { page?: number; limit?: number; status?: string; kycStatus?: string; search?: string }) => 
  apiCall(`/admin/users?${new URLSearchParams(params as any)}`);

export const getUserDetails = (userId: string) => 
  apiCall(`/admin/users/${userId}`);

export const updateUserStatus = (userId: string, status: string, reason: string) => 
  apiCall(`/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason }),
  });

export const updateUserDetails = (userId: string, userData: any) => 
  apiCall(`/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });

export const adjustUserBalance = (userId: string, amount: number, reason: string) => 
  apiCall(`/admin/finance/adjust-balance`, {
    method: 'POST',
    body: JSON.stringify({ 
      userId, 
      amount, 
      reason, 
      type: 'correction',
      notifyUser: true 
    }),
  });

// Trading Analytics - UPDATED: Real backend endpoint with granularity
export const getTradingAnalytics = (granularity: string = 'day') => 
  apiCall(`/admin/trading/analytics?granularity=${granularity}`);

export const getAllPositions = (params?: { page?: number; limit?: number }) => 
  apiCall(`/admin/positions?${new URLSearchParams(params as any)}`);

export const getTradingVolumeAnalytics = (period?: string) => 
  apiCall(`/admin/analytics/trading/volume?period=${period || '30d'}`);

// Wallet Management
export const getAllWallets = (params?: { page?: number; limit?: number; sortBy?: string }) => 
  apiCall(`/admin/wallets?${new URLSearchParams(params as any)}`);

// Transaction Management
export const getAllTransactions = (params?: { page?: number; limit?: number; type?: string; status?: string }) => 
  apiCall(`/admin/transactions?${new URLSearchParams(params as any)}`);

export const approveTransaction = (transactionId: string, notes?: string) => 
  apiCall(`/admin/transactions/${transactionId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });

export const rejectTransaction = (transactionId: string, reason: string) => 
  apiCall(`/admin/transactions/${transactionId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });

// Financial Analytics
export const getFinancialAnalytics = () => 
  apiCall('/admin/analytics/financial');

// System Metrics - NEW: Real backend endpoint
export const getSystemMetrics = () => 
  apiCall('/admin/monitoring/metrics');

export const getSystemHealth = () => 
  apiCall('/admin/analytics/system/health');

export const getAnalyticsDashboard = () => 
  apiCall('/admin/analytics/dashboard');

// Audit Logs
export const getAuditLogs = (params?: { page?: number; limit?: number; category?: string; action?: string }) => 
  apiCall(`/admin/audit-logs?${new URLSearchParams(params as any)}`);

// Notifications
export const getNotificationStats = () => 
  apiCall('/admin/analytics/notifications');

// KYC Management
export const getAllKYCApplications = (params?: { page?: number; limit?: number; status?: string; sortBy?: string; sortOrder?: string; search?: string }) => 
  apiCall(`/admin/kyc/applications?${new URLSearchParams(params as any)}`);

export const getKYCDetails = (kycId: string) => 
  apiCall(`/admin/kyc/applications/${kycId}`);

export const reviewKYC = (kycId: string, action: 'approve' | 'reject' | 'request-changes', notes?: string, rejectionReason?: string) => 
  apiCall(`/admin/kyc/applications/${kycId}/review`, {
    method: 'POST',
    body: JSON.stringify({ action, notes, rejectionReason }),
  });

export const approveKYC = (kycId: string, notes?: string) => 
  reviewKYC(kycId, 'approve', notes);

export const rejectKYC = (kycId: string, reason: string) => 
  reviewKYC(kycId, 'reject', undefined, reason);

export const requestKYCChanges = (kycId: string, reason: string) => 
  reviewKYC(kycId, 'request-changes', reason);

// Platform Settings
export const getPlatformSettings = () => 
  apiCall('/admin/settings');

export const updatePlatformSettings = (settings: any) => 
  apiCall('/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });

export const getTradingConfig = () => 
  apiCall('/admin/trading/config');

// Currency Pairs Management
export const getAllCurrencyPairs = (params?: { page?: number; limit?: number; category?: string }) => 
  apiCall(`/admin/currency-pairs?${new URLSearchParams(params as any)}`);

export const getCurrencyPairDetails = (pairId: string) => 
  apiCall(`/admin/currency-pairs/${pairId}`);

export const createCurrencyPair = (pairData: any) => 
  apiCall('/admin/currency-pairs', {
    method: 'POST',
    body: JSON.stringify(pairData),
  });

export const updateCurrencyPair = (pairId: string, pairData: any) => 
  apiCall(`/admin/currency-pairs/${pairId}`, {
    method: 'PATCH',
    body: JSON.stringify(pairData),
  });

export const deleteCurrencyPair = (pairId: string) => 
  apiCall(`/admin/currency-pairs/${pairId}`, {
    method: 'DELETE',
  });

export const toggleCurrencyPairStatus = (pairId: string, enabled: boolean) => 
  apiCall(`/admin/currency-pairs/${pairId}/toggle`, {
    method: 'PATCH',
    body: JSON.stringify({ tradingEnabled: enabled }),
  });

// Authentication API
export const login = async (loginData: LoginRequest): Promise<APIResponse<LoginResponse>> => {
  const url = `${API_BASE_URL}/auth/login`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Store tokens and user data
    if (data.success && data.data) {
      setAuthTokens(data.data.tokens);
      setUser(data.data.user);
    }
    
    return data;
  } catch (error: any) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = () => {
  clearAuthTokens();
};
