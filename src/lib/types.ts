// API Response Types
export interface APIResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  timestamp: string;
  data: T;
}

// Address Type
export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Recent Transaction Type
export interface RecentTransaction {
  _id: string;
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  isPending: boolean;
  isProcessing: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  isCancelled: boolean;
  isExpired: boolean;
  amountInUSD: number;
  feeInUSD: number | null;
  netAmount: number | null;
  netAmountInUSD: number | null;
}

// Recent Order Type
export interface RecentOrder {
  _id: string;
  id: string;
  symbol: string;
  type: string;
  direction: string;
  volume: number;
  status: string;
  createdAt: string;
  remainingVolume: number | null;
  isFilled: boolean;
  isPending: boolean;
  isExecuted: boolean;
  isCancelled: boolean;
  isRejected: boolean;
  isExpired: boolean;
  isPartiallyFilled: boolean;
}

// User Statistics Type
export interface UserStatistics {
  deposits: {
    total: number;
    count: number;
  };
  withdrawals: {
    total: number;
    count: number;
  };
  totalTrades: number;
  openPositions: number;
  accountsCount: number;
}

// KYC Document Type
export interface KYCDocument {
  status: string;
  verificationLevel: string;
  submittedAt: string;
}

// User Types - Updated to match backend response exactly
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
  address?: Address;
  role: string;
  status: string;
  kycStatus: string;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  walletBalance: { $numberDecimal: string };
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  lastLoginIP?: string;
  isLocked: boolean;
  age: number;
  // Additional fields from backend response
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    tradeAlerts: boolean;
    priceAlerts: boolean;
    accountAlerts: boolean;
    marketingEmails: boolean;
  };
  metadata: {
    source: string;
    userAgent?: string;
    ipAddress?: string;
  };
  timezone: string;
  language: string;
  currency: string;
  accounts: any[];
  acceptedTerms: boolean;
  acceptedTermsAt?: string;
  acceptedPrivacy: boolean;
  acceptedPrivacyAt?: string;
  passwordChangedAt?: string;
  kycSubmittedAt?: string;
  __v?: number;
  // Enhanced fields from detailed API response
  recentTransactions?: RecentTransaction[];
  recentOrders?: RecentOrder[];
  statistics?: UserStatistics;
  kycDocument?: KYCDocument;
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
    createdAt: string;
    isLocked: boolean;
    age: number | null;
  };
  verificationLevel: string;
  status: string;
  submittedAt: string;
  files: any[];
  rejectionReasons: string[];
  expiresAt: string;
  lastModifiedAt: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  checks: {
    duplicateDocument: boolean;
    blacklisted: boolean;
    watchlist: boolean;
    amlScreening: boolean;
    sanctionsList: boolean;
  };
  isExpired: boolean;
  canEdit: boolean;
  age: number | null;
}

export interface KYCDocument {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  _id?: string;
}

export interface KYCDetails extends KYCApplication {
  documents?: {
    documentFront?: KYCDocument;
    documentBack?: KYCDocument;
    selfie?: KYCDocument;
  };
  selfie?: KYCDocument;
  reviewedAt?: string;
  reviewedBy?: string;
  userId: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
    fullName: string;
    isLocked: boolean;
    age: number;
  };
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
