import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Search, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Filter
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Textarea } from './ui/textarea';
import { 
  getFinanceTransactions, 
  getFinanceAnalytics, 
  approveDeposit, 
  approveWithdrawal, 
  rejectFinanceTransaction 
} from '../lib/api';

// Types for API data
interface ApiTransaction {
  _id: string;
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
  description?: string;
  createdAt: string;
  metadata?: any;
}

interface TransactionForComponent {
  id: string;
  user: string;
  type: string;
  method: string;
  amount: string;
  status: string;
  reference: string;
  date: string;
}

interface AnalyticsData {
  summary: {
    deposits: { total: number; count: number; pending: { total: number; count: number } };
    withdrawals: { total: number; count: number; pending: { total: number; count: number } };
    netFlow: number;
    totalWalletBalance: any;
  };
}

export function PaymentManagement() {
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  
  // Data states
  const [transactions, setTransactions] = useState<TransactionForComponent[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal states
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionForComponent | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [viewTransaction, setViewTransaction] = useState<TransactionForComponent | null>(null);

  // Transform API transaction to component format
  const transformTransaction = (apiTxn: ApiTransaction): TransactionForComponent => {
    // Map transaction types
    let displayType = apiTxn.type;
    if (apiTxn.type === 'correction') displayType = 'deposit'; // Admin corrections shown as deposits
    if (apiTxn.type === 'profit_loss') displayType = apiTxn.amount > 0 ? 'deposit' : 'withdrawal';
    
    // Generate method - fallback since API doesn't provide this
    const getPaymentMethod = (type: string, metadata?: any) => {
      if (metadata?.adminUserId) return 'Admin Adjustment';
      if (type === 'profit_loss') return 'Trading P&L';
      return 'Bank Transfer'; // Default fallback
    };

    return {
      id: apiTxn._id,  // Use MongoDB _id for API calls
      user: apiTxn.userId.fullName,
      type: displayType,
      method: getPaymentMethod(apiTxn.type, apiTxn.metadata),
      amount: `$${Math.abs(apiTxn.amount).toLocaleString()}`,
      status: apiTxn.status,
      reference: apiTxn.transactionId,  // Keep readable ID for display
      date: new Date(apiTxn.createdAt).toLocaleString(),
    };
  };

  // CSV Export functionality
  const handleExportCSV = () => {
    try {
      // Prepare CSV data
      const csvHeaders = [
        'Transaction ID',
        'User',
        'Type',
        'Method',
        'Amount',
        'Status',
        'Reference',
        'Date & Time'
      ];

      const csvData = filteredTransactions.map(txn => [
        txn.id,
        txn.user,
        txn.type,
        txn.method,
        txn.amount,
        txn.status,
        txn.reference,
        txn.date
      ]);

      // Create CSV content
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => 
          row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `transactions-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Failed to export CSV file');
    }
  };

  // Create summary stats from analytics data
  const getSummaryStats = () => {
    if (!analyticsData) {
      return [
        { title: 'Total Deposits', value: '$0', change: '0%', icon: ArrowDownRight, color: 'green' },
        { title: 'Total Withdrawals', value: '$0', change: '0%', icon: ArrowUpRight, color: 'blue' },
        { title: 'Net Balance', value: '$0', change: '0%', icon: DollarSign, color: 'indigo' },
        { title: 'Pending Requests', value: '0', change: '0', icon: Clock, color: 'yellow' },
      ];
    }

    const { summary } = analyticsData;
    return [
      { 
        title: 'Total Deposits', 
        value: `$${summary.deposits.total.toLocaleString()}`, 
        change: `${summary.deposits.count} transactions`, 
        icon: ArrowDownRight, 
        color: 'green' 
      },
      { 
        title: 'Total Withdrawals', 
        value: `$${summary.withdrawals.total.toLocaleString()}`, 
        change: `${summary.withdrawals.count} transactions`, 
        icon: ArrowUpRight, 
        color: 'blue' 
      },
      { 
        title: 'Net Balance', 
        value: `$${summary.netFlow.toLocaleString()}`, 
        change: `${summary.totalWalletBalance?.$numberDecimal || '0'} total`, 
        icon: DollarSign, 
        color: 'indigo' 
      },
      { 
        title: 'Pending Requests', 
        value: `${summary.deposits.pending.count + summary.withdrawals.pending.count}`, 
        change: `$${(summary.deposits.pending.total + summary.withdrawals.pending.total).toLocaleString()} value`, 
        icon: Clock, 
        color: 'yellow' 
      },
    ];
  };

  // Since filtering is now done server-side, we'll use client-side filtering only for method
  // as the API doesn't support method filtering
  const filteredTransactions = transactions.filter(txn => {
    const matchesMethod = methodFilter === 'all' || txn.method === methodFilter;
    return matchesMethod;
  });

  // Fetch data functions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...(searchQuery && { search: searchQuery }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      };
      
      const response = await getFinanceTransactions(params);
      
      if (response.success && response.data) {
        const transformedTransactions = response.data.transactions.map(transformTransaction);
        setTransactions(transformedTransactions);
        setTotalPages(response.data.metadata?.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await getFinanceAnalytics();
      if (response.success && response.data) {
        setAnalyticsData(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchTransactions();
  }, [currentPage, searchQuery, typeFilter, statusFilter]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: string; icon: any }> = {
      completed: { variant: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
      pending: { variant: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
      failed: { variant: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.variant} gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return type === 'deposit' ? (
      <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1">
        <ArrowDownRight className="h-3 w-3" />
        Deposit
      </Badge>
    ) : (
      <Badge className="bg-purple-100 text-purple-700 border-purple-200 gap-1">
        <ArrowUpRight className="h-3 w-3" />
        Withdrawal
      </Badge>
    );
  };

  const handleAction = async () => {
    if (!selectedTransaction || !actionType) return;
    
    try {
      setActionLoading(true);
      
      if (actionType === 'approve') {
        // Determine if it's a deposit or withdrawal based on transaction type
        if (selectedTransaction.type === 'deposit') {
          await approveDeposit(selectedTransaction.id, actionNotes || undefined);
        } else {
          await approveWithdrawal(selectedTransaction.id, actionNotes || undefined);
        }
      } else if (actionType === 'reject') {
        await rejectFinanceTransaction(selectedTransaction.id, actionNotes || 'No reason provided');
      }
      
      // Refresh transactions after action
      await fetchTransactions();
      
      // Close modal
      setSelectedTransaction(null);
      setActionType(null);
      setActionNotes('');
    } catch (err: any) {
      console.error('Error processing transaction action:', err);
      setError(err.message || 'Failed to process transaction');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-gray-900">Payment Management</h1>
          <p className="text-gray-500 mt-1">Track and manage all deposits and withdrawals</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex">
            <XCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium">Error loading data</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {getSummaryStats().map((stat) => {
          const Icon = stat.icon;
          const colorClasses: Record<string, string> = {
            green: 'bg-green-50 text-green-600',
            blue: 'bg-blue-50 text-blue-600',
            indigo: 'bg-indigo-50 text-indigo-600',
            yellow: 'bg-yellow-50 text-yellow-600',
          };
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-lg ${colorClasses[stat.color]} flex items-center justify-center`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-gray-500 text-sm">{stat.title}</div>
                    <div className="text-gray-900">{stat.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{stat.change} vs last period</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="withdrawal">Withdrawals</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
                <SelectItem value="Cryptocurrency">Cryptocurrency</SelectItem>
                <SelectItem value="PayPal">PayPal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Transactions ({filteredTransactions.length})</CardTitle>
              <CardDescription>Complete list of payment transactions</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Bulk Actions
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="text-gray-500">Loading transactions...</span>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.id}</TableCell>
                    <TableCell>{transaction.user}</TableCell>
                    <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        {transaction.method}
                      </div>
                    </TableCell>
                    <TableCell>{transaction.amount}</TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{transaction.reference}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{transaction.date}</TableCell>
                    <TableCell className="text-right">
                      {transaction.status === 'pending' ? (
                        <div className="flex gap-2 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-green-600"
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setActionType('approve');
                            }}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600"
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setActionType('reject');
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setViewTransaction(transaction)}
                        >
                          View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={(open) => !open && setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Transaction' : 'Reject Transaction'}
            </DialogTitle>
            <DialogDescription>
              {selectedTransaction?.id} - {selectedTransaction?.user}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Amount</div>
                <div className="text-gray-900">{selectedTransaction?.amount}</div>
              </div>
              <div>
                <div className="text-gray-500">Method</div>
                <div className="text-gray-900">{selectedTransaction?.method}</div>
              </div>
              <div>
                <div className="text-gray-500">Type</div>
                <div>{selectedTransaction && getTypeBadge(selectedTransaction.type)}</div>
              </div>
              <div>
                <div className="text-gray-500">Reference</div>
                <div className="text-gray-900">{selectedTransaction?.reference}</div>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-900 mb-2 block">
                {actionType === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason'}
              </label>
              <Textarea
                placeholder={actionType === 'approve' ? 'Add any notes...' : 'Provide a reason for rejection...'}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAction}
              disabled={actionLoading}
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {actionLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Transaction Details Modal */}
      <Dialog open={!!viewTransaction} onOpenChange={(open) => !open && setViewTransaction(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Complete information for transaction {viewTransaction?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Transaction Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Transaction ID</div>
                <div className="text-gray-900 font-mono">{viewTransaction?.id}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <div>{viewTransaction && getStatusBadge(viewTransaction.status)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">User</div>
                <div className="text-gray-900">{viewTransaction?.user}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Type</div>
                <div>{viewTransaction && getTypeBadge(viewTransaction.type)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Amount</div>
                <div className="text-gray-900 font-semibold text-lg">{viewTransaction?.amount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Payment Method</div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{viewTransaction?.method}</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Reference ID</div>
                <div className="text-gray-900 font-mono text-sm">{viewTransaction?.reference}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Date & Time</div>
                <div className="text-gray-900">{viewTransaction?.date}</div>
              </div>
            </div>

            {/* Additional Details Section */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Additional Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Processing Status:</span>
                  <span className="text-gray-900 capitalize">{viewTransaction?.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction Category:</span>
                  <span className="text-gray-900">{viewTransaction?.type === 'deposit' ? 'Incoming Payment' : 'Outgoing Payment'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Processing Method:</span>
                  <span className="text-gray-900">{viewTransaction?.method}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTransaction(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
