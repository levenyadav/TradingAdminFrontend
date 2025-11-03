# NovaPip Admin Panel

A professional, high-end admin panel for the NovaPip Forex trading platform. Built with React, TypeScript, and Tailwind CSS.

![Admin Panel](https://img.shields.io/badge/Status-Production%20Ready-green)
![React](https://img.shields.io/badge/React-18.x-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4.x-cyan)

## ✨ Features

### 📊 Dashboard
- Real-time analytics and system health monitoring
- Trading volume and activity charts
- User statistics and growth metrics
- System performance indicators
- Auto-refresh every 30 seconds

### 👥 User Management
- Complete user list with search and filters
- User detail view with tabs (Profile, Trading, Transactions)
- **Enable/Disable** user accounts
- **Adjust balances** with reason tracking
- Pagination and CSV export
- Real-time data updates

### 🔐 KYC Management
- Document review and approval workflow
- Image preview for uploaded documents
- **Approve**, **Reject**, or **Request Changes**
- Status-based filtering (Pending, Approved, Rejected, Resubmitted)
- Search and bulk operations

### 💰 Payment Management
- Transaction monitoring and management
- Approve/Reject deposit and withdrawal requests
- Filter by type, status, and payment method
- Transaction details with user information

### ⚙️ Platform Settings
- Market controls (open/close, trading hours)
- Currency pair management (CRUD operations)
- Notification templates
- Access control and security settings
- Maintenance mode toggle

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the admin panel.

## 🎮 Two Ways to Use

### 1️⃣ Demo Mode (No Backend)
Perfect for testing the UI without setting up a backend:

```typescript
// In /lib/config.ts
export const config = {
  useMockData: true,  // Enable mock data
  apiUrl: 'http://localhost:3000/api',
};
```

### 2️⃣ Production Mode (With Backend)
Connect to your real NovaPip backend:

```typescript
// In /lib/config.ts
export const config = {
  useMockData: false,  // Use real API
  apiUrl: 'http://your-backend-url/api',
};
```

See [SETUP.md](./SETUP.md) for detailed configuration instructions.

## 🔧 Configuration

### Backend API URL
Update `/lib/config.ts`:
```typescript
apiUrl: 'http://your-backend-url/api'
```

### Authentication
Update `/lib/api.ts` to match your auth system:
```typescript
const getAuthToken = () => {
  return localStorage.getItem('authToken') || '';
};
```

### Image URLs (KYC Documents)
Update `/components/KYCManagement.tsx`:
```typescript
const baseUrl = 'http://your-backend-url';
```

## 📡 API Integration

The admin panel integrates with these backend endpoints:

- `/admin/analytics/dashboard` - Dashboard overview
- `/admin/users` - User management
- `/admin/users/:id/status` - Update user status
- `/admin/users/:id/balance` - Adjust balance
- `/admin/kyc` - KYC applications
- `/admin/kyc/:id/approve` - Approve KYC
- `/admin/kyc/:id/reject` - Reject KYC
- `/admin/transactions` - Transaction management
- `/admin/currency-pairs` - Currency pair CRUD
- `/admin/settings` - Platform settings

See [SETUP.md](./SETUP.md) for the complete API reference.

## 🎨 Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Shadcn/ui** - Component library
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **Sonner** - Toast notifications

## 📂 Project Structure

```
├── components/
│   ├── Dashboard.tsx          # Analytics dashboard
│   ├── UserManagement.tsx     # User list & details
│   ├── KYCManagement.tsx      # KYC review
│   ├── PaymentManagement.tsx  # Transactions
│   ├── PlatformSettings.tsx   # Settings & config
│   ├── AdminLayout.tsx        # Main layout
│   └── ui/                    # Reusable components
├── lib/
│   ├── api.ts                 # API service
│   ├── config.ts              # Configuration
│   ├── types.ts               # TypeScript types
│   └── mockData.ts            # Demo data
├── styles/
│   └── globals.css            # Global styles
└── App.tsx                    # Main app component
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🔒 Security Notes

- Always use HTTPS in production
- Implement proper CORS on backend
- Use secure authentication tokens
- Never commit API keys or secrets
- Enable rate limiting on backend

## 📝 Features Checklist

- ✅ Real-time dashboard with analytics
- ✅ User management (CRUD operations)
- ✅ Enable/Disable user accounts
- ✅ Balance adjustment with audit trail
- ✅ KYC document review with images
- ✅ Approve/Reject/Request changes workflow
- ✅ Transaction management
- ✅ Search and filtering
- ✅ Pagination
- ✅ CSV export
- ✅ Toast notifications
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design
- ✅ Mock data mode
- ✅ TypeScript support

## 🐛 Troubleshooting

### Connection Errors
If you see "Cannot connect to backend":
1. Check that your backend is running
2. Verify the API URL in `/lib/config.ts`
3. Ensure CORS is enabled
4. Or enable mock data mode for testing

### CORS Errors
Add to your backend:
```javascript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### 401 Unauthorized
Set your auth token:
```javascript
localStorage.setItem('authToken', 'your-jwt-token');
```

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Detailed setup instructions
- [Attributions](./Attributions.md) - Third-party licenses

## 🤝 Contributing

This is a custom-built admin panel for NovaPip. For modifications:
1. Update the relevant component in `/components`
2. Test with mock data first
3. Update TypeScript types in `/lib/types.ts`
4. Update API calls in `/lib/api.ts`

## 📄 License

Proprietary - NovaPip Admin Panel

---

**Built with ❤️ for NovaPip**
