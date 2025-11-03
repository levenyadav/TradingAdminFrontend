// Mock data for development/demo purposes when backend is not available

export const mockDashboardData = {
  success: true,
  data: {
    overview: {
      systemHealth: 95,
      totalUsers: 2,
      totalTrades: 7,
      totalVolume: 0.7,
      totalRevenue: 0
    },
    system: {
      performance: {
        healthScore: 95,
        responseTime: {
          average: 127.31
        }
      },
      users: {
        online: 2,
        total: 2,
        active: 2
      },
      database: {
        mongodb: {
          connected: true,
          documents: 12887079
        }
      },
      system: {
        memory: {
          usagePercentage: "48.66"
        }
      }
    },
    platform: {
      apiCalls: 1,
      accounts: 0,
      kyc: {
        pending: 1,
        approved: 1
      }
    },
    users: {
      summary: {
        newUsers: 2
      }
    }
  }
};

export const mockUserAnalytics = {
  success: true,
  data: {
    summary: {
      totalUsers: 2,
      activeUsers: 1,
      suspendedUsers: 0,
      verifiedUsers: 1,
      totalDeposits: 0,
      totalTrades: 7,
      activeUserPercentage: "50.00",
      verificationRate: "50.00"
    },
    timeSeries: {
      registrations: [
        { _id: "2025-10-26", count: 1 },
        { _id: "2025-10-29", count: 1 }
      ],
      activity: [
        { _id: "2025-11-03", count: 2 }
      ]
    },
    demographics: {
      byCountry: [{ _id: "IN", count: 2 }],
      byRole: [
        { _id: "admin", count: 1 },
        { _id: "user", count: 1 }
      ],
      byStatus: [
        { _id: "pending", count: 1 },
        { _id: "active", count: 1 }
      ]
    }
  }
};

export const mockTradingAnalytics = {
  success: true,
  data: {
    summary: {
      totalTrades: 7,
      totalVolume: 0.7,
      totalPnL: 0,
      activePositions: 5,
      pendingOrders: 3
    },
    timeSeries: {
      volume: [
        { _id: "2025-10-31", volume: 0.5 },
        { _id: "2025-11-01", volume: 0.1 },
        { _id: "2025-11-02", volume: 0.1 }
      ],
      trades: [
        { _id: "2025-10-31", count: 5 },
        { _id: "2025-11-01", count: 1 },
        { _id: "2025-11-02", count: 1 }
      ],
      pnl: []
    },
    topPerformers: {
      symbols: [
        { _id: "EUR/USD", count: 4, volume: 0.4 },
        { _id: "USD/JPY", count: 2, volume: 0.2 },
        { _id: "USD/CHF", count: 1, volume: 0.1 }
      ]
    }
  }
};

export const mockSystemHealth = {
  success: true,
  data: {
    status: "healthy",
    issues: [],
    checks: {
      database: true,
      redis: false,
      memory: { usage: "48.76", status: true },
      errors: { rate: "0.00", status: true }
    }
  }
};

export const mockUsers = {
  success: true,
  data: {
    users: [
      {
        _id: "690230ed9c345226ecda4bd6",
        id: "690230ed9c345226ecda4bd6",
        email: "admin@demo.com",
        firstName: "Admin",
        lastName: "User",
        fullName: "Admin User",
        country: "IN",
        role: "admin",
        status: "active",
        kycStatus: "verified",
        walletBalance: { $numberDecimal: "100000" },
        createdAt: "2025-10-29T15:21:17.040Z",
        lastLoginAt: "2025-11-03T06:20:45.837Z",
        isLocked: false,
        age: 0
      },
      {
        _id: "68fe55a611e8dde7bdbd0897",
        id: "68fe55a611e8dde7bdbd0897",
        email: "user@demo.com",
        firstName: "John",
        lastName: "Doe",
        fullName: "John Doe",
        country: "US",
        role: "user",
        status: "pending",
        kycStatus: "pending",
        walletBalance: { $numberDecimal: "9500" },
        createdAt: "2025-10-26T17:08:54.645Z",
        lastLoginAt: "2025-11-03T06:39:19.183Z",
        isLocked: false,
        age: 24
      }
    ],
    metadata: {
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalRecords: 2,
        recordsPerPage: 20,
        hasNextPage: false,
        hasPrevPage: false
      }
    }
  }
};

export const mockKYCApplications = {
  success: true,
  data: {
    applications: [
      {
        _id: "6903b52c9fbdc46025828b3e",
        id: "6903b52c9fbdc46025828b3e",
        kycId: "KYC-DEMO-001",
        userId: {
          _id: "68fe55a611e8dde7bdbd0897",
          email: "user@demo.com",
          firstName: "John",
          lastName: "Doe",
          fullName: "John Doe",
          kycStatus: "pending"
        },
        verificationLevel: "basic",
        status: "pending",
        submittedAt: "2025-10-30T18:57:48.875Z",
        rejectionReasons: [],
        isExpired: false,
        canEdit: true
      }
    ],
    metadata: {
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalRecords: 1,
        recordsPerPage: 20,
        hasNextPage: false,
        hasPrevPage: false
      }
    }
  }
};
