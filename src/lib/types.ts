// API Response Types
export interface APIResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  timestamp: string;
  data: T;
}

// User Types
export interface User {
  _id: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  country: string;
  dateOfBirth?: string;
  role: string;
  status: string;
  kycStatus: string;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  walletBalance: { $numberDecimal: string } | number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  lastLoginIP?: string;
  isLocked: boolean;
  age: number | null;
}

export interface UserAnalytics {
  summary: {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    verifiedUsers: number;
    totalDeposits: number;
    totalTrades: number;
    activeUserPercentage: string;
    verificationRate: string;
  };
  timeSeries: {
    registrations: Array<{ _id: string; count: number }>;
    activity: Array<{ _id: string; count: number }>;
  };
  demographics: {
    byCountry: Array<{ _id: string; count: number }>;
    byRole: Array<{ _id: string; count: number }>;
    byStatus: Array<{ _id: string; count: number }>;
  };
}

// Transaction Types
export interface Transaction {
  _id: string;
  id: string;
  transactionId: string;
  userId: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
  };
  type: string;
  amount: number;
  currency: string;
  status: string;
  fee: number;
  metadata?: any;
  createdAt: string;
  completedAt?: string;
  isPending: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  amountInUSD: number;
  netAmount: number;
}

// KYC Types
export interface KYCApplication {
  _id: string;
  id: string;
  kycId: string;
  userId: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    kycStatus: string;
  };
  verificationLevel: string;
  status: string;
  submittedAt: string;
  documents?: any;
  rejectionReasons: string[];
  isExpired: boolean;
  canEdit: boolean;
}

// Trading Types
export interface TradingAnalytics {
  summary: {
    totalTrades: number;
    totalVolume: number;
    totalPnL: number;
    activePositions: number;
    pendingOrders: number;
  };
  timeSeries: {
    volume: Array<{ _id: string; volume: number }>;
    trades: Array<{ _id: string; count: number }>;
    pnl: Array<{ _id: string; pnl: number }>;
  };
  topPerformers: {
    symbols: Array<{ _id: string; count: number; volume: number }>;
  };
}

// Currency Pair Types
export interface CurrencyPair {
  _id: string;
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  tradingEnabled: boolean;
  pipSize: number;
  digits: number;
  minLotSize: number;
  maxLotSize: number;
  defaultSpread: number;
  maxLeverage: number;
  swapLong: number;
  swapShort: number;
  tradingHours?: any;
  tags: string[];
  totalVolume24h: number;
  maintenanceMode: boolean;
  lastUpdated: string;
}

// Platform Settings Types
export interface PlatformSettings {
  _id: string;
  globalTradingHalt: {
    isHalted: boolean;
  };
  maintenanceMode: {
    isEnabled: boolean;
    message?: string;
    affectedServices: string[];
  };
  tradingParameters: {
    maxLeverage: number;
    minTradeVolume: number;
    maxTradeVolume: number;
    maxOpenPositions: number;
    requireKYCForTrading: boolean;
    requireKYCForWithdrawal: boolean;
  };
  riskManagement: {
    maxDrawdownPercent: number;
    dailyLossLimit: number;
    enableAutoStopOut: boolean;
    enableRiskAlerts: boolean;
  };
  financialSettings: {
    minDeposit: number;
    maxDeposit: number;
    minWithdrawal: number;
    maxWithdrawal: number;
    autoApproveDeposits: boolean;
    autoApproveWithdrawals: boolean;
  };
  notificationSettings: {
    enableEmailNotifications: boolean;
    enableSMSNotifications: boolean;
    enablePushNotifications: boolean;
  };
}

// System Metrics Types
export interface SystemMetrics {
  timestamp: string;
  system: {
    platform: string;
    uptime: { system: number; process: number };
    memory: {
      total: number;
      used: number;
      free: number;
      usagePercentage: string;
    };
    cpu: {
      cores: number;
      model: string;
      load: number[];
    };
  };
  database: {
    mongodb: {
      connected: boolean;
      database: string;
      collections: number;
      documents: number;
    };
    redis: {
      connected: boolean;
    };
  };
  users: {
    total: number;
    active: number;
    online: number;
    activePercentage: string;
  };
  trading: {
    trades: { total: number; today: number };
    volume: { total: number; today: number };
    positions: { open: number; profitable: number };
  };
  performance: {
    healthScore: number;
    errors: { total: number };
    responseTime: {
      average: number;
      p95: number;
      p99: number;
    };
  };
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  recordsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  status: string;
  twoFactorEnabled: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
  sessionId: string;
}
