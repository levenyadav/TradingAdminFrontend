import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import {
    Wallet,
    TrendingUp,
    Users,
    Activity,
    DollarSign,
    RefreshCw,
    Plus,
    Search,
    Edit,
    Trash2,
    ArrowUpDown,
    AlertCircle,
    CreditCard,
    ArrowUp,
    ArrowDown,
    X
} from 'lucide-react';
import {
    getAllAccounts,
    getAccountDetails,
    createAccount,
    updateAccount,
    deleteAccount,
    adjustAccountBalance,
    getAllPositions,
    createPosition,
    updatePosition,
    forceClosePosition,
    getAllUsers,
} from '../lib/api';

// Types
interface Account {
    _id: string;
    accountNumber: string;
    userId: { _id: string; email: string; firstName: string; lastName: string };
    accountType: string;
    currency: string;
    balance: number;
    equity: number;
    leverage: number;
    status: string;
    createdAt: string;
}

interface Position {
    _id: string;
    userId: { _id: string; email: string; firstName: string; lastName: string };
    accountId: { _id: string; accountNumber: string };
    symbol: string;
    direction: string;
    volume: number;
    openPrice: number;
    currentPrice?: number;
    unrealizedPL?: number;
    stopLoss?: number;
    takeProfit?: number;
    status: string;
    createdAt: string;
}

interface User {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
}

export function TradingManagement() {
    const [activeTab, setActiveTab] = useState('accounts');
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Accounts state
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [accountsPagination, setAccountsPagination] = useState({ page: 1, limit: 10, total: 0 });
    const [accountsFilter, setAccountsFilter] = useState({ type: 'all', status: 'all', search: '' });

    // Positions state
    const [positions, setPositions] = useState<Position[]>([]);
    const [positionsPagination, setPositionsPagination] = useState({ page: 1, limit: 10, total: 0 });
    const [positionsFilter, setPositionsFilter] = useState({ status: 'all', symbol: '', search: '' });

    // Users for dropdowns
    const [users, setUsers] = useState<User[]>([]);

    // Modal states
    const [createAccountOpen, setCreateAccountOpen] = useState(false);
    const [editAccountOpen, setEditAccountOpen] = useState(false);
    const [adjustBalanceOpen, setAdjustBalanceOpen] = useState(false);
    const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
    const [createPositionOpen, setCreatePositionOpen] = useState(false);
    const [editPositionOpen, setEditPositionOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

    // Search states for modal dropdowns
    const [userSearch, setUserSearch] = useState('');
    const [accountSearch, setAccountSearch] = useState('');

    // Form states
    const [createAccountForm, setCreateAccountForm] = useState({
        userId: '',
        type: 'live',
        currency: 'USD',
        leverage: 100,
        initialBalance: 0,
        notes: ''
    });

    const [editAccountForm, setEditAccountForm] = useState({
        leverage: 100,
        status: 'active',
        maxPositions: 50,
        notes: ''
    });

    const [adjustBalanceForm, setAdjustBalanceForm] = useState({
        amount: 0,
        type: 'credit' as 'credit' | 'debit',
        reason: 'bonus' as const,
        notes: ''
    });

    const [deleteAccountForm, setDeleteAccountForm] = useState({
        reason: '',
        forceClose: false
    });

    const [createPositionForm, setCreatePositionForm] = useState({
        accountId: '',
        symbol: '',
        direction: 'buy' as 'buy' | 'sell',
        volume: 0.01,
        openPrice: 0,
        stopLoss: 0,
        takeProfit: 0,
        comment: '',
        reason: ''
    });

    const [editPositionForm, setEditPositionForm] = useState({
        stopLoss: 0,
        takeProfit: 0,
        comment: '',
        notes: ''
    });

    // Fetch data
    const fetchAccounts = async () => {
        try {
            const params: any = {
                page: accountsPagination.page,
                limit: accountsPagination.limit
            };
            if (accountsFilter.type && accountsFilter.type !== 'all') params.type = accountsFilter.type;
            if (accountsFilter.status && accountsFilter.status !== 'all') params.status = accountsFilter.status;
            if (accountsFilter.search) params.search = accountsFilter.search;

            const response = await getAllAccounts(params);
            setAccounts(response.data?.accounts || []);
            setAccountsPagination(prev => ({
                ...prev,
                total: response.data?.metadata?.total || 0
            }));
        } catch (err: any) {
            console.error('Error fetching accounts:', err);
        }
    };

    const fetchPositions = async () => {
        try {
            const params: any = {
                page: positionsPagination.page,
                limit: positionsPagination.limit
            };
            if (positionsFilter.status && positionsFilter.status !== 'all') params.status = positionsFilter.status;
            if (positionsFilter.symbol) params.symbol = positionsFilter.symbol;

            const response = await getAllPositions(params);
            setPositions(response.data?.positions || []);
            setPositionsPagination(prev => ({
                ...prev,
                total: response.data?.metadata?.total || 0
            }));
        } catch (err: any) {
            console.error('Error fetching positions:', err);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await getAllUsers({ limit: 100 });
            setUsers(response.data?.users || []);
        } catch (err: any) {
            console.error('Error fetching users:', err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            await Promise.all([fetchAccounts(), fetchPositions(), fetchUsers()]);
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!loading) {
            fetchAccounts();
        }
    }, [accountsPagination.page, accountsFilter]);

    useEffect(() => {
        if (!loading) {
            fetchPositions();
        }
    }, [positionsPagination.page, positionsFilter]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchData();
    };

    // Account actions
    const handleCreateAccount = async () => {
        try {
            await createAccount(createAccountForm);
            toast.success('Account created successfully');
            setCreateAccountOpen(false);
            setCreateAccountForm({
                userId: '',
                type: 'live',
                currency: 'USD',
                leverage: 100,
                initialBalance: 0,
                notes: ''
            });
            fetchAccounts();
        } catch (err: any) {
            toast.error(err.message || 'Failed to create account');
        }
    };

    const handleEditAccount = async () => {
        if (!selectedAccount) return;
        try {
            await updateAccount(selectedAccount._id, editAccountForm);
            toast.success('Account updated successfully');
            setEditAccountOpen(false);
            fetchAccounts();
        } catch (err: any) {
            toast.error(err.message || 'Failed to update account');
        }
    };

    const handleAdjustBalance = async () => {
        if (!selectedAccount) return;
        try {
            await adjustAccountBalance(selectedAccount._id, adjustBalanceForm);
            toast.success('Balance adjusted successfully');
            setAdjustBalanceOpen(false);
            fetchAccounts();
        } catch (err: any) {
            toast.error(err.message || 'Failed to adjust balance');
        }
    };

    const handleDeleteAccount = async () => {
        if (!selectedAccount) return;
        try {
            await deleteAccount(selectedAccount._id, deleteAccountForm);
            toast.success('Account deleted successfully');
            setDeleteAccountOpen(false);
            fetchAccounts();
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete account');
        }
    };

    // Position actions
    const [createPositionLoading, setCreatePositionLoading] = useState(false);
    const createPositionLoadingRef = useRef(false);

    // Position actions
    const handleCreatePosition = async () => {
        if (createPositionLoadingRef.current) return;
        createPositionLoadingRef.current = true;
        setCreatePositionLoading(true);
        try {
            const res = await createPosition(createPositionForm);
            toast.success('Position created successfully');
            setCreatePositionOpen(false);
            setCreatePositionForm({
                accountId: '',
                symbol: '',
                direction: 'buy',
                volume: 0.01,
                openPrice: 0,
                stopLoss: 0,
                takeProfit: 0,
                comment: '',
                reason: ''
            });
            fetchPositions();

            // Update account balance locally if account is in the list
            if (res.data?.account) {
                setAccounts(prev => prev.map(acc =>
                    acc._id === res.data.account._id ? { ...acc, ...res.data.account } : acc
                ));
            } else {
                fetchAccounts();
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to create position');
        } finally {
            createPositionLoadingRef.current = false;
            setCreatePositionLoading(false);
        }
    };

    const handleEditPosition = async () => {
        if (!selectedPosition) return;
        try {
            await updatePosition(selectedPosition._id, editPositionForm);
            toast.success('Position updated successfully');
            setEditPositionOpen(false);
            fetchPositions();
        } catch (err: any) {
            toast.error(err.message || 'Failed to update position');
        }
    };

    // Stats
    const stats = [
        {
            title: 'Total Accounts',
            value: accountsPagination.total.toString(),
            icon: Wallet,
            color: 'blue'
        },
        {
            title: 'Live Accounts',
            value: accounts.filter(a => a.accountType === 'live').length.toString(),
            icon: TrendingUp,
            color: 'green'
        },
        {
            title: 'Demo Accounts',
            value: accounts.filter(a => a.accountType === 'demo').length.toString(),
            icon: Activity,
            color: 'purple'
        },
        {
            title: 'Open Positions',
            value: positions.filter(p => p.status === 'open').length.toString(),
            icon: ArrowUpDown,
            color: 'orange'
        },
        {
            title: 'Total Balance',
            value: `$${accounts.reduce((sum, a) => sum + (a.balance || 0), 0).toLocaleString()}`,
            icon: DollarSign,
            color: 'emerald'
        }
    ];

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <Skeleton className="h-12 w-full" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32" />)}
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button onClick={handleRefresh} className="mt-4">Retry</Button>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Trading Management</h1>
                    <p className="text-gray-500 mt-1">Manage accounts and positions</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={() => activeTab === 'accounts' ? setCreateAccountOpen(true) : setCreatePositionOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        {activeTab === 'accounts' ? 'New Account' : 'New Position'}
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`h-10 w-10 rounded-lg bg-${stat.color}-50 flex items-center justify-center`}>
                                        <Icon className={`h-5 w-5 text-${stat.color}-600`} />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-500 text-sm mb-1">{stat.title}</div>
                                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="accounts">Accounts</TabsTrigger>
                    <TabsTrigger value="positions">Positions</TabsTrigger>
                </TabsList>

                {/* Accounts Tab */}
                <TabsContent value="accounts" className="mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <CardTitle>Trading Accounts</CardTitle>
                                    <CardDescription>Manage user trading accounts</CardDescription>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Select value={accountsFilter.type} onValueChange={(v) => setAccountsFilter({ ...accountsFilter, type: v })}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue placeholder="Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="live">Live</SelectItem>
                                            <SelectItem value="demo">Demo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={accountsFilter.status} onValueChange={(v) => setAccountsFilter({ ...accountsFilter, status: v })}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="suspended">Suspended</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Account #</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Balance</TableHead>
                                            <TableHead>Equity</TableHead>
                                            <TableHead>Leverage</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {accounts.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                                    No accounts found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            accounts.map((account) => (
                                                <TableRow key={account._id}>
                                                    <TableCell className="font-medium">{account.accountNumber}</TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{account.userId?.firstName} {account.userId?.lastName}</div>
                                                            <div className="text-sm text-gray-500">{account.userId?.email}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={account.accountType === 'live' ? 'default' : 'secondary'}>
                                                            {account.accountType}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>${account.balance?.toLocaleString() || '0'}</TableCell>
                                                    <TableCell>${account.equity?.toLocaleString() || '0'}</TableCell>
                                                    <TableCell>1:{account.leverage}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={account.status === 'active' ? 'default' : 'destructive'}>
                                                            {account.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    setSelectedAccount(account);
                                                                    setEditAccountForm({
                                                                        leverage: account.leverage,
                                                                        status: account.status,
                                                                        maxPositions: 50,
                                                                        notes: ''
                                                                    });
                                                                    setEditAccountOpen(true);
                                                                }}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    setSelectedAccount(account);
                                                                    setAdjustBalanceOpen(true);
                                                                }}
                                                            >
                                                                <CreditCard className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    setSelectedAccount(account);
                                                                    setDeleteAccountOpen(true);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {accountsPagination.total > accountsPagination.limit && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-gray-500">
                                        Showing {((accountsPagination.page - 1) * accountsPagination.limit) + 1} to{' '}
                                        {Math.min(accountsPagination.page * accountsPagination.limit, accountsPagination.total)} of{' '}
                                        {accountsPagination.total} accounts
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={accountsPagination.page === 1}
                                            onClick={() => setAccountsPagination(p => ({ ...p, page: p.page - 1 }))}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={accountsPagination.page * accountsPagination.limit >= accountsPagination.total}
                                            onClick={() => setAccountsPagination(p => ({ ...p, page: p.page + 1 }))}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Positions Tab */}
                <TabsContent value="positions" className="mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <CardTitle>Trading Positions</CardTitle>
                                    <CardDescription>View and manage open positions</CardDescription>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Select value={positionsFilter.status} onValueChange={(v) => setPositionsFilter({ ...positionsFilter, status: v })}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Position ID</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Account</TableHead>
                                            <TableHead>Symbol</TableHead>
                                            <TableHead>Direction</TableHead>
                                            <TableHead>Volume</TableHead>
                                            <TableHead>Open Price</TableHead>
                                            <TableHead>P/L</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {positions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                                                    No positions found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            positions.map((position) => (
                                                <TableRow key={position._id}>
                                                    <TableCell className="font-medium font-mono text-xs">
                                                        {position._id.slice(-8)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{position.userId?.firstName} {position.userId?.lastName}</div>
                                                            <div className="text-sm text-gray-500">{position.userId?.email}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{position.accountId?.accountNumber}</TableCell>
                                                    <TableCell className="font-medium">{position.symbol}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={position.direction === 'buy' ? 'default' : 'destructive'} className="gap-1">
                                                            {position.direction === 'buy' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                                            {position.direction.toUpperCase()}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{position.volume}</TableCell>
                                                    <TableCell>${position.openPrice?.toFixed(5)}</TableCell>
                                                    <TableCell className={position.unrealizedPL && position.unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                        ${position.unrealizedPL?.toFixed(2) || '0.00'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={position.status === 'open' ? 'default' : 'secondary'}>
                                                            {position.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                disabled={position.status !== 'open'}
                                                                onClick={() => {
                                                                    setSelectedPosition(position);
                                                                    setEditPositionForm({
                                                                        stopLoss: position.stopLoss || 0,
                                                                        takeProfit: position.takeProfit || 0,
                                                                        comment: '',
                                                                        notes: ''
                                                                    });
                                                                    setEditPositionOpen(true);
                                                                }}
                                                                title="Edit position"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            {position.status === 'open' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={async () => {
                                                                        if (confirm(`Close ${position.direction.toUpperCase()} ${position.volume} lots of ${position.symbol}?`)) {
                                                                            try {
                                                                                await forceClosePosition(position._id, { reason: 'Admin closed', notifyUser: true });
                                                                                toast.success('Position closed successfully');
                                                                                // Refresh positions
                                                                                const res = await getAllPositions({ page: positionsPagination.page, limit: positionsPagination.limit, status: positionsFilter.status });
                                                                                setPositions(res.data?.positions || []);
                                                                            } catch (err: any) {
                                                                                toast.error(err.message || 'Failed to close position');
                                                                            }
                                                                        }
                                                                    }}
                                                                    title="Close position"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {positionsPagination.total > positionsPagination.limit && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-gray-500">
                                        Showing {((positionsPagination.page - 1) * positionsPagination.limit) + 1} to{' '}
                                        {Math.min(positionsPagination.page * positionsPagination.limit, positionsPagination.total)} of{' '}
                                        {positionsPagination.total} positions
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={positionsPagination.page === 1}
                                            onClick={() => setPositionsPagination(p => ({ ...p, page: p.page - 1 }))}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={positionsPagination.page * positionsPagination.limit >= positionsPagination.total}
                                            onClick={() => setPositionsPagination(p => ({ ...p, page: p.page + 1 }))}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create Account Dialog */}
            <Dialog open={createAccountOpen} onOpenChange={setCreateAccountOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create Trading Account</DialogTitle>
                        <DialogDescription>Create a new trading account for a user</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>User</Label>
                            <Input
                                placeholder="Search by name or email..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className="mb-2"
                            />
                            <Select value={createAccountForm.userId} onValueChange={(v) => setCreateAccountForm({ ...createAccountForm, userId: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select user" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {users
                                        .filter((user) => {
                                            const searchLower = userSearch.toLowerCase();
                                            return !userSearch ||
                                                user.firstName?.toLowerCase().includes(searchLower) ||
                                                user.lastName?.toLowerCase().includes(searchLower) ||
                                                user.email?.toLowerCase().includes(searchLower);
                                        })
                                        .map((user) => (
                                            <SelectItem key={user._id} value={user._id}>
                                                {user.firstName} {user.lastName} ({user.email})
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Account Type</Label>
                                <Select value={createAccountForm.type} onValueChange={(v) => setCreateAccountForm({ ...createAccountForm, type: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="live">Live</SelectItem>
                                        <SelectItem value="demo">Demo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Currency</Label>
                                <Select value={createAccountForm.currency} onValueChange={(v) => setCreateAccountForm({ ...createAccountForm, currency: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="GBP">GBP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Leverage</Label>
                                <Select value={createAccountForm.leverage.toString()} onValueChange={(v) => setCreateAccountForm({ ...createAccountForm, leverage: parseInt(v) })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="50">1:50</SelectItem>
                                        <SelectItem value="100">1:100</SelectItem>
                                        <SelectItem value="200">1:200</SelectItem>
                                        <SelectItem value="500">1:500</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Initial Balance</Label>
                                <Input
                                    type="number"
                                    value={createAccountForm.initialBalance}
                                    onChange={(e) => setCreateAccountForm({ ...createAccountForm, initialBalance: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input
                                value={createAccountForm.notes}
                                onChange={(e) => setCreateAccountForm({ ...createAccountForm, notes: e.target.value })}
                                placeholder="Optional notes..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateAccountOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateAccount} disabled={!createAccountForm.userId}>Create Account</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Account Dialog */}
            <Dialog open={editAccountOpen} onOpenChange={setEditAccountOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Account</DialogTitle>
                        <DialogDescription>Update account settings for {selectedAccount?.accountNumber}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Leverage</Label>
                                <Select value={editAccountForm.leverage.toString()} onValueChange={(v) => setEditAccountForm({ ...editAccountForm, leverage: parseInt(v) })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="50">1:50</SelectItem>
                                        <SelectItem value="100">1:100</SelectItem>
                                        <SelectItem value="200">1:200</SelectItem>
                                        <SelectItem value="500">1:500</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={editAccountForm.status} onValueChange={(v) => setEditAccountForm({ ...editAccountForm, status: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Max Positions</Label>
                            <Input
                                type="number"
                                value={editAccountForm.maxPositions}
                                onChange={(e) => setEditAccountForm({ ...editAccountForm, maxPositions: parseInt(e.target.value) || 50 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input
                                value={editAccountForm.notes}
                                onChange={(e) => setEditAccountForm({ ...editAccountForm, notes: e.target.value })}
                                placeholder="Reason for changes..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditAccountOpen(false)}>Cancel</Button>
                        <Button onClick={handleEditAccount}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Adjust Balance Dialog */}
            <Dialog open={adjustBalanceOpen} onOpenChange={setAdjustBalanceOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Adjust Balance</DialogTitle>
                        <DialogDescription>
                            Credit or debit balance for {selectedAccount?.accountNumber}
                            <br />
                            Current Balance: ${selectedAccount?.balance?.toLocaleString() || '0'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Amount</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={adjustBalanceForm.amount}
                                    onChange={(e) => setAdjustBalanceForm({ ...adjustBalanceForm, amount: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={adjustBalanceForm.type} onValueChange={(v: 'credit' | 'debit') => setAdjustBalanceForm({ ...adjustBalanceForm, type: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="credit">Credit (+)</SelectItem>
                                        <SelectItem value="debit">Debit (-)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Reason</Label>
                            <Select value={adjustBalanceForm.reason} onValueChange={(v: any) => setAdjustBalanceForm({ ...adjustBalanceForm, reason: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bonus">Bonus</SelectItem>
                                    <SelectItem value="correction">Correction</SelectItem>
                                    <SelectItem value="refund">Refund</SelectItem>
                                    <SelectItem value="adjustment">Adjustment</SelectItem>
                                    <SelectItem value="promotion">Promotion</SelectItem>
                                    <SelectItem value="compensation">Compensation</SelectItem>
                                    <SelectItem value="fee">Fee</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input
                                value={adjustBalanceForm.notes}
                                onChange={(e) => setAdjustBalanceForm({ ...adjustBalanceForm, notes: e.target.value })}
                                placeholder="Additional notes..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAdjustBalanceOpen(false)}>Cancel</Button>
                        <Button onClick={handleAdjustBalance} disabled={adjustBalanceForm.amount <= 0}>
                            {adjustBalanceForm.type === 'credit' ? 'Add' : 'Deduct'} ${adjustBalanceForm.amount}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Account Dialog */}
            <Dialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Delete Account</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete account {selectedAccount?.accountNumber}?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Reason *</Label>
                            <Input
                                value={deleteAccountForm.reason}
                                onChange={(e) => setDeleteAccountForm({ ...deleteAccountForm, reason: e.target.value })}
                                placeholder="Reason for deletion..."
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="forceClose"
                                checked={deleteAccountForm.forceClose}
                                onChange={(e) => setDeleteAccountForm({ ...deleteAccountForm, forceClose: e.target.checked })}
                            />
                            <Label htmlFor="forceClose" className="text-sm">Force close open positions</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteAccountOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteAccount} disabled={!deleteAccountForm.reason}>
                            Delete Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Position Dialog */}
            <Dialog open={createPositionOpen} onOpenChange={setCreatePositionOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create Position (Admin Trade)</DialogTitle>
                        <DialogDescription>Open a new position for a user account</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Account</Label>
                            <Input
                                placeholder="Search by account #, name or email..."
                                value={accountSearch}
                                onChange={(e) => setAccountSearch(e.target.value)}
                                className="mb-2"
                            />
                            <Select value={createPositionForm.accountId} onValueChange={(v) => setCreatePositionForm({ ...createPositionForm, accountId: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {accounts
                                        .filter(a => a.status === 'active')
                                        .filter((account) => {
                                            const searchLower = accountSearch.toLowerCase();
                                            return !accountSearch ||
                                                account.accountNumber?.toString().includes(searchLower) ||
                                                account.userId?.firstName?.toLowerCase().includes(searchLower) ||
                                                account.userId?.lastName?.toLowerCase().includes(searchLower) ||
                                                account.userId?.email?.toLowerCase().includes(searchLower);
                                        })
                                        .map((account) => (
                                            <SelectItem key={account._id} value={account._id}>
                                                {`${account.accountNumber} - ${account.userId?.firstName} ${account.userId?.lastName} ($${account.balance})`}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Symbol</Label>
                                <Input
                                    value={createPositionForm.symbol}
                                    onChange={(e) => setCreatePositionForm({ ...createPositionForm, symbol: e.target.value.toUpperCase() })}
                                    placeholder="EUR/USD"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Direction</Label>
                                <Select value={createPositionForm.direction} onValueChange={(v: 'buy' | 'sell') => setCreatePositionForm({ ...createPositionForm, direction: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="buy">BUY</SelectItem>
                                        <SelectItem value="sell">SELL</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Volume (Lots)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={createPositionForm.volume}
                                    onChange={(e) => setCreatePositionForm({ ...createPositionForm, volume: parseFloat(e.target.value) || 0.01 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Open Price (optional)</Label>
                                <Input
                                    type="number"
                                    step="0.00001"
                                    value={createPositionForm.openPrice || ''}
                                    onChange={(e) => setCreatePositionForm({ ...createPositionForm, openPrice: parseFloat(e.target.value) || 0 })}
                                    placeholder="Market price"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Stop Loss</Label>
                                <Input
                                    type="number"
                                    step="0.00001"
                                    value={createPositionForm.stopLoss || ''}
                                    onChange={(e) => setCreatePositionForm({ ...createPositionForm, stopLoss: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Take Profit</Label>
                                <Input
                                    type="number"
                                    step="0.00001"
                                    value={createPositionForm.takeProfit || ''}
                                    onChange={(e) => setCreatePositionForm({ ...createPositionForm, takeProfit: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Reason *</Label>
                            <Input
                                value={createPositionForm.reason}
                                onChange={(e) => setCreatePositionForm({ ...createPositionForm, reason: e.target.value })}
                                placeholder="Reason for admin trade..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreatePositionOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleCreatePosition}
                            disabled={createPositionLoading || !createPositionForm.accountId || !createPositionForm.symbol || !createPositionForm.reason}
                        >
                            {createPositionLoading ? 'Opening...' : 'Open Position'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Position Dialog */}
            <Dialog open={editPositionOpen} onOpenChange={setEditPositionOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Position</DialogTitle>
                        <DialogDescription>
                            Modify SL/TP for position on {selectedPosition?.symbol}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Stop Loss</Label>
                                <Input
                                    type="number"
                                    step="0.00001"
                                    value={editPositionForm.stopLoss || ''}
                                    onChange={(e) => setEditPositionForm({ ...editPositionForm, stopLoss: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Take Profit</Label>
                                <Input
                                    type="number"
                                    step="0.00001"
                                    value={editPositionForm.takeProfit || ''}
                                    onChange={(e) => setEditPositionForm({ ...editPositionForm, takeProfit: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input
                                value={editPositionForm.notes}
                                onChange={(e) => setEditPositionForm({ ...editPositionForm, notes: e.target.value })}
                                placeholder="Reason for modification..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditPositionOpen(false)}>Cancel</Button>
                        <Button onClick={handleEditPosition}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
