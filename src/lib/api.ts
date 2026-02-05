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
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
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
        errorMessage = errorData?.error?.message || errorData.message || errorMessage;
      } catch { }
      throw new Error(errorMessage);
    }

    const body = await response.json();
    const wrapped: APIResponse<T> = {
      success: true,
      message: '',
      statusCode: response.status,
      timestamp: new Date().toISOString(),
      data: body?.data ?? body,
    };
    return wrapped;
  } catch (error: any) {
    console.error('API Error Details:', { url, error, message: error.message });
    let errorMessage = error.message || 'Failed to connect to server';
    if (errorMessage.includes('fetch') || errorMessage.includes('Network') || errorMessage.includes('TypeError')) {
      throw new Error(`Cannot connect to backend at ${API_BASE_URL}. Please ensure the backend is reachable and CORS/CSP allow the request.`);
    }
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

export const getAllPositions = (params?: { page?: number; limit?: number; status?: string; symbol?: string; accountId?: string; userId?: string }) =>
  apiCall(`/admin/trading/positions?${new URLSearchParams(params as any)}`);

export const getTradingVolumeAnalytics = (period?: string) =>
  apiCall(`/admin/monitoring/trading-volume?period=${period || '30d'}`);

// Wallet Management
export const getAllWallets = (params?: { page?: number; limit?: number; sortBy?: string }) =>
  apiCall(`/admin/finance/wallets?${new URLSearchParams(params as any)}`);

// Transaction Management
export const getAllTransactions = (params?: { page?: number; limit?: number; type?: string; status?: string }) =>
  apiCall(`/admin/finance/transactions?${new URLSearchParams(params as any)}`);

export const approveTransaction = (transactionId: string, notes?: string) =>
  apiCall(`/admin/finance/verification/approve/${transactionId}`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });

export const rejectTransaction = (transactionId: string, reason: string) =>
  apiCall(`/admin/finance/verification/reject/${transactionId}`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });

// Financial Analytics
export const getFinancialAnalytics = () =>
  apiCall('/admin/finance/analytics');

// Finance Management - Payment/Transaction APIs
export const getFinanceTransactions = (params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  type?: string;
  status?: string;
  search?: string;
}) =>
  apiCall(`/admin/finance/transactions?${new URLSearchParams(params as any)}`);

export const getFinanceAnalytics = (granularity: string = 'day') =>
  apiCall(`/admin/finance/analytics?granularity=${granularity}`);

export const approveDeposit = (transactionId: string, notes?: string) =>
  apiCall(`/admin/finance/verification/approve/${transactionId}`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });

export const approveWithdrawal = (transactionId: string, notes?: string) =>
  apiCall(`/admin/finance/approve-withdrawal/${transactionId}`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });

export const rejectFinanceTransaction = (transactionId: string, reason: string) =>
  apiCall(`/admin/finance/verification/reject/${transactionId}`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });

// System Metrics - NEW: Real backend endpoint
export const getSystemMetrics = () =>
  apiCall('/admin/monitoring/metrics');

export const getSystemHealth = () =>
  apiCall('/admin/monitoring/health');

export const getAnalyticsDashboard = () =>
  apiCall('/admin/monitoring/dashboard');

// Audit Logs
export const getAuditLogs = (params?: { page?: number; limit?: number; category?: string; action?: string }) =>
  apiCall(`/admin/monitoring/audit-logs?${new URLSearchParams(params as any)}`);

// Notifications
export const getNotificationStats = () =>
  apiCall('/admin/monitoring/notification-stats');

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

export const getTradingSettings = () =>
  apiCall('/admin/settings/trading');

export const getNotificationSettings = () =>
  apiCall('/admin/settings/notifications');

export const getBusinessSettings = () =>
  apiCall('/admin/settings/business');

export const updatePlatformSettings = (settings: any) =>
  apiCall('/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });

export const updateTradingSettings = (settings: any) =>
  apiCall('/admin/settings/trading', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });

export const updateNotificationSettings = (settings: any) =>
  apiCall('/admin/settings/notifications', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });

export const updateBusinessSettings = (settings: any) =>
  apiCall('/admin/settings/business', {
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
    method: 'PUT',
    body: JSON.stringify(pairData),
  });

export const deleteCurrencyPair = (pairId: string) =>
  apiCall(`/admin/currency-pairs/${pairId}`, {
    method: 'DELETE',
  });

export const toggleCurrencyPairStatus = (pairId: string, enabled: boolean) =>
  apiCall(`/admin/currency-pairs/${pairId}/toggle-trading`, {
    method: 'PATCH',
    body: JSON.stringify({ tradingEnabled: enabled }),
  });

// Authentication API
export const login = async (loginData: LoginRequest): Promise<APIResponse<LoginResponse>> => {
  const resp = await apiCall<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(loginData),
  });
  if (resp?.data?.tokens) {
    setAuthTokens(resp.data.tokens);
    setUser(resp.data.user);
  }
  return resp;
};

export const logout = () => {
  clearAuthTokens();
};

// Payment Methods (Admin)
export const getPaymentMethods = () =>
  apiCall('/admin/payment-methods');

export const getPaymentMethodStatistics = () =>
  apiCall('/admin/payment-methods/statistics');

export const updatePaymentBankDetails = (methodId: string, bankDetails: any) =>
  apiCall(`/admin/payment-methods/${methodId}/bank-details`, {
    method: 'PUT',
    body: JSON.stringify({ bankDetails }),
  });

export const togglePaymentMethod = (methodId: string, enabled: boolean) =>
  apiCall(`/admin/payment-methods/${methodId}/toggle`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  });

// ============================================
// Trading Management - Account APIs
// ============================================

export const getAllAccounts = (params?: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  currency?: string;
  minBalance?: number;
  maxBalance?: number;
  userId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}) =>
  apiCall(`/admin/trading/accounts?${new URLSearchParams(params as any)}`);

export const getAccountDetails = (accountId: string) =>
  apiCall(`/admin/trading/accounts/${accountId}`);

export const createAccount = (accountData: {
  userId: string;
  type?: 'demo' | 'live';
  currency?: string;
  leverage?: number;
  initialBalance?: number;
  notes?: string;
}) =>
  apiCall('/admin/trading/accounts', {
    method: 'POST',
    body: JSON.stringify(accountData),
  });

export const updateAccount = (accountId: string, data: {
  leverage?: number;
  status?: 'active' | 'inactive' | 'suspended';
  maxDailyVolume?: number;
  maxPositions?: number;
  notes?: string;
}) =>
  apiCall(`/admin/trading/accounts/${accountId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteAccount = (accountId: string, data: {
  reason: string;
  forceClose?: boolean;
}) =>
  apiCall(`/admin/trading/accounts/${accountId}`, {
    method: 'DELETE',
    body: JSON.stringify(data),
  });

export const adjustAccountBalance = (accountId: string, data: {
  amount: number;
  type: 'credit' | 'debit';
  reason: 'bonus' | 'correction' | 'refund' | 'adjustment' | 'promotion' | 'compensation' | 'fee' | 'other';
  notes?: string;
}) =>
  apiCall(`/admin/trading/accounts/${accountId}/adjust-balance`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

// ============================================
// Trading Management - Position APIs
// ============================================

export const createPosition = (positionData: {
  accountId: string;
  symbol: string;
  direction: 'buy' | 'sell';
  volume: number;
  openPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  comment?: string;
  reason: string;
}) =>
  apiCall('/admin/trading/positions', {
    method: 'POST',
    body: JSON.stringify(positionData),
  });


export const updatePosition = (positionId: string, data: {
  stopLoss?: number;
  takeProfit?: number;
  comment?: string;
  notes?: string;
}) =>
  apiCall(`/admin/trading/positions/${positionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const forceClosePosition = (positionId: string, data: {
  reason?: string;
  notifyUser?: boolean;
}) =>
  apiCall(`/admin/trading/positions/${positionId}/force-close`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
