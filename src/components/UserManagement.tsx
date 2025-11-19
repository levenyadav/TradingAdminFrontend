import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Search, Download, Filter, MoreVertical, AlertCircle, CheckCircle, XCircle, User, Loader2, DollarSign, TrendingUp, TrendingDown, Activity, Calendar, Globe, Shield, Bell, FileText, Clock, Info } from 'lucide-react';
import { config } from '../lib/config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Label } from './ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { getAllUsers, getUserDetails, updateUserStatus, adjustUserBalance, updateUserDetails } from '../lib/api';
import type { User as UserType, APIResponse, RecentTransaction, RecentOrder, UserStatistics, KYCDocument } from '../lib/types';
import { UserAnalyticsSection } from './UserAnalytics';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';

export function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Balance adjustment dialog
  const [balanceDialog, setBalanceDialog] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Status change dialog
  const [statusChangeDialog, setStatusChangeDialog] = useState(false);
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [pendingStatusChange, setPendingStatusChange] = useState<{userId: string, status: string, userName: string} | null>(null);
  
  // Edit user details dialog
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [editUserData, setEditUserData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    country: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    }
  });

  const fetchUsers = async () => {
    try {
      setError(null);
      const params: any = { 
        page: currentPage, 
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (kycFilter !== 'all') params.kycStatus = kycFilter;
      if (searchQuery) params.search = searchQuery;

      const response: APIResponse<any> = await getAllUsers(params);
      setUsers(response.data.users || []);
      setPagination(response.data.metadata?.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
      console.error('Users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetail = async (userId: string) => {
    try {
      setActionLoading(true);
      const response: APIResponse<any> = await getUserDetails(userId);
      
      // Ensure all expected fields have default values if missing
      const userData = {
        ...response.data,
        recentTransactions: response.data.recentTransactions || [],
        recentOrders: response.data.recentOrders || [],
        statistics: response.data.statistics || {
          deposits: { total: 0, count: 0 },
          withdrawals: { total: 0, count: 0 },
          totalTrades: 0,
          openPositions: 0,
          accountsCount: 0
        },
        kycDocument: response.data.kycDocument || null,
        notifications: response.data.notifications || {},
        metadata: response.data.metadata || {}
      };
      
      setSelectedUser(userData);
    } catch (err: any) {
      toast.error('Failed to load user details');
      console.error('User detail fetch error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, statusFilter, kycFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchUsers();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleStatusChange = async (userId: string, newStatus: string, customReason?: string) => {
    try {
      setActionLoading(true);
      
      // Provide appropriate default reasons for admin actions
      const reason = customReason || (newStatus === 'suspended' 
        ? 'Account suspended by admin' 
        : 'Account activated by admin');
      
      await updateUserStatus(userId, newStatus, reason);
      toast.success(`User status updated to ${newStatus}`);
      fetchUsers();
      if (selectedUser?._id === userId) {
        fetchUserDetail(userId);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!selectedUser || !balanceAmount || !balanceReason) {
      toast.error('Please fill all fields');
      return;
    }

    const amount = parseFloat(balanceAmount);
    if (isNaN(amount)) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount === 0) {
      toast.error('Amount cannot be zero');
      return;
    }

    try {
      setActionLoading(true);
      await adjustUserBalance(selectedUser._id, amount, balanceReason);
      toast.success(`Balance ${amount > 0 ? 'credited' : 'debited'} successfully`);
      setBalanceDialog(false);
      setBalanceAmount('');
      setBalanceReason('');
      fetchUserDetail(selectedUser._id);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to adjust balance');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChangeConfirm = async () => {
    if (!pendingStatusChange || !statusChangeReason.trim()) {
      toast.error('Please provide a reason for this action');
      return;
    }

    try {
      setActionLoading(true);
      await updateUserStatus(pendingStatusChange.userId, pendingStatusChange.status, statusChangeReason);
      toast.success(`User status updated to ${pendingStatusChange.status}`);
      setStatusChangeDialog(false);
      setStatusChangeReason('');
      setPendingStatusChange(null);
      fetchUsers();
      if (selectedUser?._id === pendingStatusChange.userId) {
        fetchUserDetail(pendingStatusChange.userId);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const openStatusChangeDialog = (userId: string, status: string, userName: string) => {
    setPendingStatusChange({ userId, status, userName });
    setStatusChangeDialog(true);
  };

  const openEditUserDialog = (user: any) => {
    setEditUserData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      country: user.country || '',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
      address: {
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        postalCode: user.address?.postalCode || '',
        country: user.address?.country || user.country || ''
      }
    });
    setEditUserDialog(true);
  };

  const handleUpdateUserDetails = async () => {
    if (!selectedUser) {
      toast.error('No user selected');
      return;
    }

    try {
      setActionLoading(true);
      await updateUserDetails(selectedUser._id, editUserData);
      toast.success('User details updated successfully');
      setEditUserDialog(false);
      fetchUserDetail(selectedUser._id);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user details');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ['ID', 'Name', 'Email', 'Country', 'Status', 'KYC', 'Balance', 'Registered'].join(','),
      ...users.map(user => [
        user.id,
        `"${user.fullName}"`,
        user.email,
        user.country,
        user.status,
        user.kycStatus,
        user.walletBalance?.$numberDecimal || '0',
        new Date(user.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      active: { variant: 'default', icon: CheckCircle },
      pending: { variant: 'secondary', icon: AlertCircle },
      suspended: { variant: 'destructive', icon: XCircle },
    };
    const config = variants[status] || variants.active;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getKYCBadge = (kyc: string) => {
    const colors: Record<string, string> = {
      verified: 'bg-green-100 text-green-700 border-green-200',
      approved: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
    };
    return <Badge className={colors[kyc] || colors.pending}>{kyc}</Badge>;
  };

  const getBalance = (balance: any) => {
    if (typeof balance === 'object' && balance?.$numberDecimal) {
      return parseFloat(balance.$numberDecimal).toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    }
    if (typeof balance === 'number') {
      return balance.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    }
    return '0.00';
  };

  const getOrderStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; color: string }> = {
      pending: { variant: 'secondary', icon: Clock, color: 'text-yellow-600' },
      executed: { variant: 'default', icon: CheckCircle, color: 'text-green-600' },
      cancelled: { variant: 'destructive', icon: XCircle, color: 'text-red-600' },
      rejected: { variant: 'destructive', icon: XCircle, color: 'text-red-600' },
      filled: { variant: 'default', icon: CheckCircle, color: 'text-green-600' },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getTransactionStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      completed: { variant: 'default', icon: CheckCircle },
      pending: { variant: 'secondary', icon: Clock },
      failed: { variant: 'destructive', icon: XCircle },
      cancelled: { variant: 'destructive', icon: XCircle },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getAmountDisplay = (amount: number, type?: string) => {
    const isPositive = amount > 0;
    const colorClass = type === 'profit_loss' ? 
      (isPositive ? 'text-green-600' : 'text-red-600') : 
      'text-gray-900';
    const icon = type === 'profit_loss' ? 
      (isPositive ? <TrendingUp className="h-3 w-3 inline mr-1" /> : <TrendingDown className="h-3 w-3 inline mr-1" />) : 
      null;
    
    return (
      <span className={`font-medium ${colorClass}`}>
        {icon}
        {isPositive && type !== 'profit_loss' ? '+' : ''}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    const isConnectionError = error.includes('Cannot connect') || error.includes('backend') || error.includes('fetch');
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Alert variant={isConnectionError ? undefined : "destructive"} className={isConnectionError ? "border-blue-500 bg-blue-50" : ""}>
          <AlertCircle className={`h-4 w-4 ${isConnectionError ? 'text-blue-600' : ''}`} />
          <AlertDescription className={isConnectionError ? "text-blue-800" : ""}>
            <p className="mb-2">
              {isConnectionError 
                ? `Unable to connect to the backend server. Please ensure the API is running at ${config.apiUrl}`
                : error}
            </p>
            <div className="flex gap-2 mt-4">
              <Button onClick={fetchUsers} size="sm">Retry</Button>
              {isConnectionError && (
                <Button variant="outline" size="sm" onClick={() => window.open('/README.md', '_blank')}>
                  Setup Guide
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage all platform users and their accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Analytics Section */}
      <UserAnalyticsSection className="mb-8" />

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or user ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={kycFilter} onValueChange={setKycFilter}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="KYC Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All KYC</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({pagination?.totalRecords || users.length})</CardTitle>
          <CardDescription>Complete list of registered platform users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => {
                    setSelectedUser(user);
                    fetchUserDetail(user.id);
                  }}>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-sm font-semibold">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">{user.fullName}</div>
                          <div className="text-sm text-gray-500 truncate">ID: {user.id.slice(-8)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-sm text-gray-900">{user.country}</div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-medium text-gray-900">${getBalance(user.walletBalance)}</div>
                    </TableCell>
                    <TableCell className="py-4">{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="py-4">{getKYCBadge(user.kycStatus)}</TableCell>
                    <TableCell className="py-4">
                      <div className="text-sm text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            fetchUserDetail(user.id);
                          }}>View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                            openEditUserDialog(user);
                          }}>Edit Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                            setBalanceDialog(true);
                          }}>Adjust Balance</DropdownMenuItem>
                          {user.status === 'active' ? (
                            <DropdownMenuItem className="text-red-600" onClick={(e) => {
                              e.stopPropagation();
                              openStatusChangeDialog(user.id, 'suspended', user.fullName);
                            }}>Suspend Account</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-green-600" onClick={(e) => {
                              e.stopPropagation();
                              openStatusChangeDialog(user.id, 'active', user.fullName);
                            }}>Activate Account</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * pagination.recordsPerPage) + 1} to {Math.min(currentPage * pagination.recordsPerPage, pagination.totalRecords)} of {pagination.totalRecords}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrevPage}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Sheet */}
      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent className="sm:max-w-md w-full overflow-y-auto p-0">
          {selectedUser && (
            <>
              <SheetHeader className="px-6 py-4 border-b">
                <SheetTitle className="flex items-center gap-2">
                  User Details
                  {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                </SheetTitle>
                <SheetDescription>Complete profile and trading information</SheetDescription>
              </SheetHeader>
              <div className="px-6 py-4 space-y-6">
                {/* Profile Summary */}
                <div className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-sm font-semibold">
                    {selectedUser.firstName?.charAt(0)}{selectedUser.lastName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{selectedUser.fullName}</h3>
                    <p className="text-sm text-gray-500 truncate">{selectedUser.email}</p>
                    <div className="flex gap-1 mt-2">
                      {getStatusBadge(selectedUser.status)}
                      {getKYCBadge(selectedUser.kycStatus)}
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="trading">Trading</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="profile" className="space-y-4 mt-4">
                    {/* Basic Information */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Basic Information
                      </h4>
                      <div className="grid gap-3">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">User ID</div>
                          <div className="text-sm text-gray-900 mt-1 font-mono">{selectedUser.id}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</div>
                            <div className="text-sm text-gray-900 mt-1">{selectedUser.phone || 'N/A'}</div>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Country</div>
                            <div className="text-sm text-gray-900 mt-1">{selectedUser.country}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Age</div>
                            <div className="text-sm text-gray-900 mt-1">{selectedUser.age} years</div>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Language</div>
                            <div className="text-sm text-gray-900 mt-1">{selectedUser.language?.toUpperCase() || 'N/A'}</div>
                          </div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="text-xs font-medium text-green-700 uppercase tracking-wide">Account Balance</div>
                          <div className="text-lg font-semibold text-green-800 mt-1">${getBalance(selectedUser.walletBalance)}</div>
                        </div>
                      </div>
                    </div>

                    {/* KYC Information */}
                    {selectedUser?.kycDocument && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          KYC Verification
                        </h4>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Status</div>
                              <div className="mt-1">{getKYCBadge(selectedUser.kycDocument.status)}</div>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Level</div>
                              <div className="text-sm text-blue-800 mt-1 capitalize">{selectedUser.kycDocument.verificationLevel}</div>
                            </div>
                            <div className="col-span-2">
                              <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Submitted</div>
                              <div className="text-sm text-blue-800 mt-1">{new Date(selectedUser.kycDocument.submittedAt).toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notification Preferences */}
                    {selectedUser?.notifications && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          Notification Preferences
                        </h4>
                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(selectedUser.notifications).map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between">
                                <span className="text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                                <span className={`font-medium ${value ? 'text-green-600' : 'text-red-600'}`}>
                                  {value ? '✓ Enabled' : '✗ Disabled'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Account Metadata */}
                    {selectedUser?.metadata && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Account Metadata
                        </h4>
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 space-y-2">
                          <div>
                            <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">Registration Source</div>
                            <div className="text-sm text-purple-800 mt-1 capitalize">{selectedUser.metadata.source}</div>
                          </div>
                          {selectedUser.metadata.ipAddress && (
                            <div>
                              <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">Last IP Address</div>
                              <div className="text-sm text-purple-800 mt-1 font-mono">{selectedUser.metadata.ipAddress}</div>
                            </div>
                          )}
                          {selectedUser.lastLoginIP && selectedUser.lastLoginIP !== 'unknown' && (
                            <div>
                              <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">Login IP</div>
                              <div className="text-sm text-purple-800 mt-1 font-mono">{selectedUser.lastLoginIP}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Terms & Privacy */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Legal Agreements
                      </h4>
                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 space-y-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs font-medium text-orange-700 uppercase tracking-wide">Terms of Service</div>
                            <div className={`text-sm mt-1 font-medium ${selectedUser.acceptedTerms ? 'text-green-600' : 'text-red-600'}`}>
                              {selectedUser.acceptedTerms ? '✓ Accepted' : '✗ Not Accepted'}
                            </div>
                            {selectedUser.acceptedTermsAt && (
                              <div className="text-xs text-orange-600 mt-1">
                                {new Date(selectedUser.acceptedTermsAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-orange-700 uppercase tracking-wide">Privacy Policy</div>
                            <div className={`text-sm mt-1 font-medium ${selectedUser.acceptedPrivacy ? 'text-green-600' : 'text-red-600'}`}>
                              {selectedUser.acceptedPrivacy ? '✓ Accepted' : '✗ Not Accepted'}
                            </div>
                            {selectedUser.acceptedPrivacyAt && (
                              <div className="text-xs text-orange-600 mt-1">
                                {new Date(selectedUser.acceptedPrivacyAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Account Activity */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Account Activity
                      </h4>
                      <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Registration Date</div>
                          <div className="text-sm text-gray-900 mt-1">{new Date(selectedUser.createdAt).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Login</div>
                          <div className="text-sm text-gray-900 mt-1">{selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : 'Never'}</div>
                        </div>
                        {selectedUser.passwordChangedAt && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Password Changed</div>
                            <div className="text-sm text-gray-900 mt-1">{new Date(selectedUser.passwordChangedAt).toLocaleString()}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="trading" className="space-y-4 mt-4">
                    {selectedUser?.statistics && (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Total Trades</div>
                          <div className="text-lg font-semibold text-blue-800 mt-1">{selectedUser.statistics.totalTrades}</div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="text-xs font-medium text-green-700 uppercase tracking-wide">Open Positions</div>
                          <div className="text-lg font-semibold text-green-800 mt-1">{selectedUser.statistics.openPositions}</div>
                        </div>
                      </div>
                    )}
                    
                    {selectedUser?.recentOrders && selectedUser.recentOrders.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Recent Orders</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {selectedUser.recentOrders.slice(0, 10).map((order) => (
                            <div key={order.id} className="p-3 border rounded-lg bg-gray-50">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-gray-900">{order.symbol}</div>
                                {getOrderStatusBadge(order.status)}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                <div>
                                  <span className="text-xs text-gray-500">Direction:</span> 
                                  <span className={`ml-1 font-medium ${order.direction === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                                    {order.direction.toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Volume:</span> 
                                  <span className="ml-1 font-medium">{order.volume}</span>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Type:</span> 
                                  <span className="ml-1">{order.type}</span>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Date:</span> 
                                  <span className="ml-1">{new Date(order.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">No recent orders found</p>
                        <p className="text-xs text-gray-400 mt-1">Trading orders will appear here once the user places trades</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="transactions" className="space-y-4 mt-4">
                    {selectedUser?.statistics && (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="text-xs font-medium text-green-700 uppercase tracking-wide">Total Deposits</div>
                          <div className="text-lg font-semibold text-green-800 mt-1">
                            ${selectedUser.statistics.deposits.total.toLocaleString()} ({selectedUser.statistics.deposits.count})
                          </div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Total Withdrawals</div>
                          <div className="text-lg font-semibold text-blue-800 mt-1">
                            ${selectedUser.statistics.withdrawals.total.toLocaleString()} ({selectedUser.statistics.withdrawals.count})
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {selectedUser?.recentTransactions && selectedUser.recentTransactions.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Recent Transactions</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {selectedUser.recentTransactions.slice(0, 10).map((transaction) => (
                            <div key={transaction.id} className="p-3 border rounded-lg bg-gray-50">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="font-medium text-gray-900">{transaction.type.replace('_', ' ').toUpperCase()}</div>
                                  {transaction.type === 'profit_loss' && (
                                    transaction.amount > 0 ? 
                                    <TrendingUp className="h-4 w-4 text-green-600" /> : 
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                                {getTransactionStatusBadge(transaction.status)}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-xs text-gray-500">Amount:</span> 
                                  <div className="mt-1">{getAmountDisplay(transaction.amount, transaction.type)}</div>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Date:</span> 
                                  <div className="mt-1 text-gray-900">{new Date(transaction.createdAt).toLocaleDateString()}</div>
                                </div>
                                {transaction.amountInUSD && (
                                  <div className="col-span-2">
                                    <span className="text-xs text-gray-500">USD Value:</span> 
                                    <div className="mt-1">{getAmountDisplay(transaction.amountInUSD, transaction.type)}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">No recent transactions found</p>
                        <p className="text-xs text-gray-400 mt-1">Transaction history will appear here once the user makes deposits or withdrawals</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Action Buttons */}
                <div className="sticky bottom-0 bg-white border-t pt-4 pb-4 space-y-2">
                  <Button className="w-full" onClick={() => openEditUserDialog(selectedUser)} disabled={actionLoading}>
                    <User className="h-4 w-4 mr-2" />
                    Edit Details
                  </Button>
                  <Button className="w-full" onClick={() => setBalanceDialog(true)} disabled={actionLoading}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Adjust Balance
                  </Button>
                  {selectedUser.status === 'active' ? (
                    <Button 
                      variant="outline" 
                      className="w-full text-red-600 hover:bg-red-50 hover:border-red-300" 
                      onClick={() => openStatusChangeDialog(selectedUser.id, 'suspended', selectedUser.fullName)}
                      disabled={actionLoading}
                    >
                      {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Suspend Account
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full text-green-600 hover:bg-green-50 hover:border-green-300" 
                      onClick={() => openStatusChangeDialog(selectedUser.id, 'active', selectedUser.fullName)}
                      disabled={actionLoading}
                    >
                      {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Activate Account
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Balance Adjustment Dialog */}
      <Dialog open={balanceDialog} onOpenChange={setBalanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust User Balance</DialogTitle>
            <DialogDescription>
              {selectedUser?.fullName} - Current: ${getBalance(selectedUser?.walletBalance)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <div className="flex items-center gap-2">
                <Label>Amount (use + or - for credit/debit)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <div>• Use <strong>+5000</strong> to add balance</div>
                      <div>• Use <strong>-5000</strong> to deduct balance</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="number"
                placeholder="e.g., 5000 or -5000"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                className="mt-2"
                step="0.01"
                min="-999999"
                max="999999"
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Input
                placeholder="e.g., Manual adjustment, Bonus, Correction"
                value={balanceReason}
                onChange={(e) => setBalanceReason(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialog(false)}>Cancel</Button>
            <Button onClick={handleAdjustBalance} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusChangeDialog} onOpenChange={setStatusChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingStatusChange?.status === 'suspended' ? 'Suspend User Account' : 'Activate User Account'}
            </DialogTitle>
            <DialogDescription>
              {pendingStatusChange?.userName} - {pendingStatusChange?.status === 'suspended' 
                ? 'This will suspend the user account and prevent access.'
                : 'This will activate the user account and restore access.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Reason for {pendingStatusChange?.status === 'suspended' ? 'suspension' : 'activation'}</Label>
              <Input
                placeholder={pendingStatusChange?.status === 'suspended' 
                  ? "e.g., Violation of terms, Suspicious activity, Admin review"
                  : "e.g., Issue resolved, Manual review complete, Admin approval"}
                value={statusChangeReason}
                onChange={(e) => setStatusChangeReason(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusChangeDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleStatusChangeConfirm} 
              disabled={actionLoading}
              variant={pendingStatusChange?.status === 'suspended' ? 'destructive' : 'default'}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {pendingStatusChange?.status === 'suspended' ? 'Suspend Account' : 'Activate Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Details Dialog */}
      <Dialog open={editUserDialog} onOpenChange={setEditUserDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
            <DialogDescription>
              {selectedUser?.fullName} - Update personal information and address
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Personal Information */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Personal Information</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input
                    value={editUserData.firstName}
                    onChange={(e) => setEditUserData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input
                    value={editUserData.lastName}
                    onChange={(e) => setEditUserData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={editUserData.phone}
                    onChange={(e) => setEditUserData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1234567890"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input
                    value={editUserData.country}
                    onChange={(e) => setEditUserData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="US"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={editUserData.dateOfBirth}
                  onChange={(e) => setEditUserData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Address Information</Label>
              <div>
                <Label>Street Address</Label>
                <Input
                  value={editUserData.address.street}
                  onChange={(e) => setEditUserData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, street: e.target.value }
                  }))}
                  placeholder="123 Main Street"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={editUserData.address.city}
                    onChange={(e) => setEditUserData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, city: e.target.value }
                    }))}
                    placeholder="New York"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>State/Province</Label>
                  <Input
                    value={editUserData.address.state}
                    onChange={(e) => setEditUserData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, state: e.target.value }
                    }))}
                    placeholder="NY"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Postal Code</Label>
                  <Input
                    value={editUserData.address.postalCode}
                    onChange={(e) => setEditUserData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, postalCode: e.target.value }
                    }))}
                    placeholder="10001"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input
                    value={editUserData.address.country}
                    onChange={(e) => setEditUserData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, country: e.target.value }
                    }))}
                    placeholder="US"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateUserDetails} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
