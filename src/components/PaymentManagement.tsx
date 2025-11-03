import { useState } from 'react';
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

const transactions = [
  { id: 'TXN-001', user: 'John Smith', type: 'deposit', method: 'Bank Transfer', amount: '$5,000', status: 'completed', reference: 'REF-2024-1001', date: '2024-10-28 14:32' },
  { id: 'TXN-002', user: 'Emma Wilson', type: 'withdrawal', method: 'Credit Card', amount: '$2,300', status: 'pending', reference: 'REF-2024-1002', date: '2024-10-28 13:15' },
  { id: 'TXN-003', user: 'Michael Chen', type: 'deposit', method: 'Cryptocurrency', amount: '$10,500', status: 'pending', reference: 'REF-2024-1003', date: '2024-10-28 11:45' },
  { id: 'TXN-004', user: 'Sarah Johnson', type: 'withdrawal', method: 'Bank Transfer', amount: '$3,800', status: 'completed', reference: 'REF-2024-1004', date: '2024-10-27 16:22' },
  { id: 'TXN-005', user: 'David Lee', type: 'deposit', method: 'Credit Card', amount: '$1,500', status: 'failed', reference: 'REF-2024-1005', date: '2024-10-27 10:30' },
  { id: 'TXN-006', user: 'Maria Garcia', type: 'withdrawal', method: 'PayPal', amount: '$4,200', status: 'pending', reference: 'REF-2024-1006', date: '2024-10-27 09:15' },
  { id: 'TXN-007', user: 'James Brown', type: 'deposit', method: 'Bank Transfer', amount: '$8,900', status: 'completed', reference: 'REF-2024-1007', date: '2024-10-26 15:45' },
  { id: 'TXN-008', user: 'Lisa Anderson', type: 'withdrawal', method: 'Bank Transfer', amount: '$2,100', status: 'completed', reference: 'REF-2024-1008', date: '2024-10-26 12:30' },
];

const summaryStats = [
  { title: 'Total Deposits', value: '$25,900', change: '+12.5%', icon: ArrowDownRight, color: 'green' },
  { title: 'Total Withdrawals', value: '$12,400', change: '+8.3%', icon: ArrowUpRight, color: 'blue' },
  { title: 'Net Balance', value: '+$13,500', change: '+18.7%', icon: DollarSign, color: 'indigo' },
  { title: 'Pending Requests', value: '3', change: '-2', icon: Clock, color: 'yellow' },
];

export function PaymentManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<typeof transactions[0] | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionNotes, setActionNotes] = useState('');

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = txn.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         txn.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         txn.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || txn.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || txn.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || txn.method === methodFilter;
    return matchesSearch && matchesType && matchesStatus && matchesMethod;
  });

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

  const handleAction = () => {
    console.log(`${actionType} transaction:`, selectedTransaction?.id, 'Notes:', actionNotes);
    setSelectedTransaction(null);
    setActionType(null);
    setActionNotes('');
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
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" className="gap-2">
            Reconciliation Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat) => {
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
                        <Button size="sm" variant="ghost">View</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
