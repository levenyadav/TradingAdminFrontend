import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Search, Download, Filter, MoreVertical, AlertCircle, CheckCircle, XCircle, User, Loader2, DollarSign } from 'lucide-react';
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
import { getAllUsers, getUserDetails, updateUserStatus, adjustUserBalance } from '../lib/api';
import type { User as UserType, APIResponse } from '../lib/types';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner@2.0.3';

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

  const fetchUsers = async () => {
    try {
      setError(null);
      const params: any = { page: currentPage, limit: 20 };
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
      const response: APIResponse<any> = await getUserDetails(userId);
      setSelectedUser(response.data);
    } catch (err: any) {
      toast.error('Failed to load user details');
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

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      await updateUserStatus(userId, newStatus);
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

    try {
      setActionLoading(true);
      await adjustUserBalance(selectedUser._id, parseFloat(balanceAmount), balanceReason);
      toast.success('Balance adjusted successfully');
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

  const handleExport = () => {
    const csv = [
      ['ID', 'Name', 'Email', 'Country', 'Status', 'KYC', 'Balance', 'Registered'].join(','),
      ...users.map(user => [
        user.id,
        user.fullName,
        user.email,
        user.country,
        user.status,
        user.kycStatus,
        typeof user.walletBalance === 'object' ? user.walletBalance.$numberDecimal : user.walletBalance,
        new Date(user.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users-${new Date().toISOString()}.csv`;
    link.click();
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
    if (typeof balance === 'object' && balance.$numberDecimal) {
      return parseFloat(balance.$numberDecimal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return typeof balance === 'number' ? balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
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
    const isConnectionError = error.includes('Cannot connect') || error.includes('backend');
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Alert variant={isConnectionError ? undefined : "destructive"} className={isConnectionError ? "border-blue-500 bg-blue-50" : ""}>
          <AlertCircle className={`h-4 w-4 ${isConnectionError ? 'text-blue-600' : ''}`} />
          <AlertDescription className={isConnectionError ? "text-blue-800" : ""}>
            <p className="mb-2">{error}</p>
            <div className="flex gap-2 mt-4">
              <Button onClick={fetchUsers} size="sm">Retry</Button>
              {isConnectionError && (
                <Button variant="outline" size="sm" onClick={() => window.open('/SETUP.md', '_blank')}>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage all platform users and their accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

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
                  <TableRow key={user.id} className="cursor-pointer hover:bg-gray-50" onClick={() => {
                    setSelectedUser(user);
                    fetchUserDetail(user.id);
                  }}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xs">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </div>
                        <span>{user.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.country}</TableCell>
                    <TableCell>${getBalance(user.walletBalance)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>{getKYCBadge(user.kycStatus)}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
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
                            setBalanceDialog(true);
                          }}>Adjust Balance</DropdownMenuItem>
                          {user.status === 'active' ? (
                            <DropdownMenuItem className="text-red-600" onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(user.id, 'suspended');
                            }}>Suspend Account</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-green-600" onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(user.id, 'active');
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
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {selectedUser && (
            <>
              <SheetHeader>
                <SheetTitle>User Details</SheetTitle>
                <SheetDescription>Complete profile and trading information</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Profile Summary */}
                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white">
                    {selectedUser.firstName?.charAt(0)}{selectedUser.lastName?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gray-900">{selectedUser.fullName}</h3>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                    <div className="flex gap-2 mt-2">
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
                  
                  <TabsContent value="profile" className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-500">User ID</div>
                        <div className="text-gray-900">{selectedUser.id}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Phone</div>
                        <div className="text-gray-900">{selectedUser.phone || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Country</div>
                        <div className="text-gray-900">{selectedUser.country}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Date of Birth</div>
                        <div className="text-gray-900">{selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString() : 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Registration Date</div>
                        <div className="text-gray-900">{new Date(selectedUser.createdAt).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Last Login</div>
                        <div className="text-gray-900">{selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : 'Never'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Account Balance</div>
                        <div className="text-gray-900">${getBalance(selectedUser.walletBalance)}</div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="trading" className="space-y-4">
                    {selectedUser.statistics ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 border rounded-lg">
                            <div className="text-sm text-gray-500">Total Trades</div>
                            <div className="text-gray-900">{selectedUser.statistics.totalTrades}</div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="text-sm text-gray-500">Open Positions</div>
                            <div className="text-gray-900">{selectedUser.statistics.openPositions}</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 mb-2">Recent Orders</div>
                          <div className="space-y-2">
                            {selectedUser.recentOrders?.slice(0, 5).map((order: any) => (
                              <div key={order.id} className="p-3 border rounded-lg">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-900">{order.symbol}</span>
                                  <Badge>{order.status}</Badge>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                  <span>{order.type} • {order.direction} • {order.volume}</span>
                                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">No trading data available</div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="transactions" className="space-y-4">
                    {selectedUser.recentTransactions?.length > 0 ? (
                      <div className="space-y-2">
                        {selectedUser.recentTransactions.slice(0, 10).map((txn: any) => (
                          <div key={txn.id} className="p-3 border rounded-lg">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-900">{txn.type}</span>
                              <span className={txn.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                                ${Math.abs(txn.amount).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <Badge variant="outline">{txn.status}</Badge>
                              <span>{new Date(txn.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">No transactions found</div>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Action Buttons */}
                <div className="space-y-2 pt-4 border-t">
                  <Button className="w-full" onClick={() => setBalanceDialog(true)}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Adjust Balance
                  </Button>
                  {selectedUser.status === 'active' ? (
                    <Button variant="outline" className="w-full text-red-600" onClick={() => handleStatusChange(selectedUser.id, 'suspended')}>
                      Suspend Account
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full text-green-600" onClick={() => handleStatusChange(selectedUser.id, 'active')}>
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
              <Label>Amount (use + or - for credit/debit)</Label>
              <Input
                type="number"
                placeholder="+100 or -50"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                className="mt-2"
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
    </div>
  );
}
