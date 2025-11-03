# NovaPip Admin Panel - Setup Guide

## 🚀 Quick Start

### Option A: Test with Mock Data (No Backend Required)

The fastest way to see the admin panel in action:

1. Open `/lib/config.ts`
2. Set `useMockData: true`
3. Run `npm run dev`
4. Open [http://localhost:5173](http://localhost:5173)

This will use sample data so you can explore the UI without setting up the backend.

### Option B: Connect to Your Backend

### 1. Configure Your Backend API URL

Open `/lib/config.ts` and update the API URL:

```typescript
export const config = {
  // Change this to your backend URL
  apiUrl: 'http://localhost:3000/api',
  
  // Set to true to use mock data for testing
  useMockData: false,
  
  // Or set it dynamically based on environment:
  // apiUrl: window.location.hostname === 'localhost' 
  //   ? 'http://localhost:3000/api' 
  //   : 'https://api.novapip.com/api',
};
```

### 2. Configure Authentication

Open `/lib/api.ts` and update the `getAuthToken()` function:

```typescript
const getAuthToken = () => {
  // Replace with your actual auth token retrieval
  if (isBrowser) {
    return localStorage.getItem('authToken') || '';
    // Or use your auth library:
    // return authStore.getToken();
  }
  return '';
};
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🔐 Setting the Auth Token

For testing, you can manually set the token in browser console:

```javascript
localStorage.setItem('authToken', 'your-jwt-token-here');
```

Or implement a login page that sets it automatically.

## 📡 API Endpoints Used

The admin panel integrates with these backend endpoints:

### Dashboard
- `GET /admin/analytics/dashboard` - Overall dashboard data
- `GET /admin/analytics/users` - User analytics
- `GET /admin/analytics/trading` - Trading analytics
- `GET /admin/analytics/system/health` - System health

### User Management
- `GET /admin/users` - List all users (with filters)
- `GET /admin/users/:id` - Get user details
- `PATCH /admin/users/:id/status` - Update user status
- `PATCH /admin/users/:id/balance` - Adjust user balance

### KYC Management
- `GET /admin/kyc` - List KYC applications
- `GET /admin/kyc/:id` - Get KYC details
- `POST /admin/kyc/:id/approve` - Approve KYC
- `POST /admin/kyc/:id/reject` - Reject KYC
- `POST /admin/kyc/:id/request-changes` - Request changes

### Transactions
- `GET /admin/transactions` - List transactions
- `POST /admin/transactions/:id/approve` - Approve transaction
- `POST /admin/transactions/:id/reject` - Reject transaction

### Currency Pairs
- `GET /admin/currency-pairs` - List all pairs
- `POST /admin/currency-pairs` - Create new pair
- `PATCH /admin/currency-pairs/:id` - Update pair
- `DELETE /admin/currency-pairs/:id` - Delete pair

## 🎨 Image URLs for KYC Documents

Update the base URL in `/components/KYCManagement.tsx`:

```typescript
const getImageUrl = (path: string) => {
  if (!path) return '';
  const baseUrl = 'http://localhost:3000'; // Change to your backend URL
  return `${baseUrl}/${path}`;
};
```

## 📝 Features Implemented

✅ Real-time Dashboard with analytics
✅ User Management (view, edit, enable/disable, adjust balance)
✅ KYC Management (approve, reject, request changes)
✅ Document image preview
✅ Search and filtering
✅ Pagination
✅ Toast notifications
✅ Loading states
✅ Error handling
✅ CSV export
✅ Responsive design

## 🛠️ Customization

### Change Color Scheme
Edit `/styles/globals.css` to modify the color palette.

### Add More Filters
Update the filter sections in each component to add additional filter options.

### Modify Table Columns
Edit the `<TableHeader>` and `<TableRow>` sections in each component.

## 🐛 Troubleshooting

### CORS Errors
Make sure your backend allows CORS from your frontend URL:
```javascript
// Backend CORS config
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### 401 Unauthorized
Check that your auth token is valid and being sent in the Authorization header.

### Images Not Loading
Verify the image paths in your KYC documents match the backend file structure.

## 📚 Next Steps

1. Complete Payment Management integration
2. Complete Platform Settings with currency pair CRUD
3. Add real-time WebSocket updates
4. Implement advanced analytics charts
5. Add bulk operations for users
6. Add activity logs viewer
