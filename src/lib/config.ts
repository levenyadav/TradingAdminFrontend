// Application Configuration
export const config = {
  // ⚠️ IMPORTANT: Change this to your backend URL
  // API Base URL - Update this to match your backend server
  apiUrl: (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:5022/api/v1',

  // You can also set it dynamically:
  // apiUrl: window.location.hostname === 'localhost' 
  //   ? 'http://localhost:3000/api' 
  //   : 'https://your-production-api.com/api',

  // Demo mode: Set to true to use mock data instead of real API
  // 💡 TIP: Start with true to test the UI, then set to false for production
  useMockData: false,
};

// Helper to check if we're in browser
export const isBrowser = typeof window !== 'undefined';
