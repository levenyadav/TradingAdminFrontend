import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { 
  Users, 
  TrendingUp, 
  Activity, 
  DollarSign,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  AlertCircle
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { getSystemMetrics, getTradingAnalytics } from '../lib/api';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';

export function Dashboard() {
  const [currency, setCurrency] = useState('USD');
  const [timeRange, setTimeRange] = useState('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [tradingAnalytics, setTradingAnalytics] = useState<any>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [metrics, trading] = await Promise.all([
        getSystemMetrics(),
        getTradingAnalytics('day'),
      ]);

      setSystemMetrics(metrics.data);
      setTradingAnalytics(trading.data);
      console.log('System Metrics:', metrics.data);
      console.log('Trading Analytics:', trading.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleExport = () => {
    // Export functionality
    const exportData = { systemMetrics, tradingAnalytics };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-export-${new Date().toISOString()}.json`;
    link.click();
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    // Check if it's a connection error
    if (error.includes('Cannot connect') || error.includes('backend')) {
      return <div className="p-4 sm:p-6 lg:p-8">
        <Alert className="border-blue-500 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <p className="mb-2">{error}</p>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleRefresh} size="sm">Retry</Button>
              <Button variant="outline" size="sm" onClick={() => window.open('/SETUP.md', '_blank')}>
                Setup Guide
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>;
    }
    
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

  const statsCards = [
    { 
      title: 'Total Users', 
      value: systemMetrics?.users?.total?.toLocaleString() || '0',
      change: `${systemMetrics?.users?.activePercentage || 0}% active`,
      trend: 'up', 
      icon: Users 
    },
    { 
      title: 'Active Users', 
      value: systemMetrics?.users?.active?.toLocaleString() || '0',
      change: `${systemMetrics?.users?.verificationRate || 0}% verified`,
      trend: 'up', 
      icon: Activity 
    },
    { 
      title: 'Realtime Orders', 
      value: tradingAnalytics?.summary?.pendingOrders?.toLocaleString() || '0',
      change: `${tradingAnalytics?.summary?.totalTrades || 0} total`,
      trend: 'up', 
      icon: TrendingUp 
    },
    { 
      title: 'Open Positions', 
      value: tradingAnalytics?.summary?.activePositions?.toLocaleString() || '0',
      change: `Vol: ${tradingAnalytics?.summary?.totalVolume?.toFixed(2) || 0}`,
      trend: 'up', 
      icon: Activity 
    },
    { 
      title: 'Trading Volume', 
      value: `$${(tradingAnalytics?.summary?.totalVolume * 100000 || 0).toLocaleString()}`,
      change: `${systemMetrics?.users?.newToday || 0} new today`,
      trend: 'up', 
      icon: DollarSign 
    },
  ];

  const chartData = (tradingAnalytics?.timeSeries?.volume || []).map((item: any) => ({
    time: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    volume: item.volume * 100000, // Convert to larger scale for display
    trades: tradingAnalytics?.timeSeries?.trades?.find((t: any) => t._id === item._id)?.count || 0,
  }));

  const topPairs = (tradingAnalytics?.topPerformers?.symbols || []).map((symbol: any) => ({
    pair: symbol._id,
    volume: `$${(symbol.volume * 100000).toLocaleString()}`,
    change: `${symbol.count} trades`,
    trend: 'up',
  }));

  const marketStatus = systemMetrics?.performance?.healthScore > 90;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Real-time business intelligence and trading overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <ArrowUpRight className="h-4 w-4" />
                    <span className="text-sm">{stat.change}</span>
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-sm mb-1">{stat.title}</div>
                  <div className="text-gray-900">{stat.value}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trading Activity Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Trading Activity</CardTitle>
                  <CardDescription>Volume trends over time</CardDescription>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Live Updates</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Area type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVolume)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No trading data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Volume Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Trade Count Trends</CardTitle>
              <CardDescription>Number of trades over time</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Bar dataKey="trades" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Overview */}
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Platform health and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Health Score</span>
                  <span className="text-gray-900">{systemMetrics?.performance?.healthScore || 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Active Connections</span>
                  <span className="text-gray-900">{systemMetrics?.users?.online?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">API Calls (24h)</span>
                  <span className="text-gray-900">{systemMetrics?.performance?.api?.total?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Avg Response Time</span>
                  <span className="text-gray-900">{systemMetrics?.performance?.responseTime?.average?.toFixed(0) || 0}ms</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Information Panel */}
        <div className="space-y-6">
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                marketStatus ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${
                    marketStatus ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`} />
                  <div>
                    <div className="text-sm text-gray-900">Market Status</div>
                    <div className="text-xs text-gray-500">
                      {systemMetrics?.system?.environment || 'Unknown'} environment
                    </div>
                  </div>
                </div>
                <Badge className={marketStatus ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}>
                  {marketStatus ? 'Open' : 'Closed'}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Database</span>
                  <span className="text-gray-900">
                    {systemMetrics?.database?.mongodb?.connected ? '✓ Connected' : '✗ Disconnected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Memory Usage</span>
                  <span className="text-gray-900">{systemMetrics?.system?.memory?.usagePercentage || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Documents</span>
                  <span className="text-gray-900">{systemMetrics?.database?.mongodb?.documents?.toLocaleString() || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Pairs */}
          <Card>
            <CardHeader>
              <CardTitle>Top Currency Pairs</CardTitle>
              <CardDescription>By trading volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPairs.length > 0 ? topPairs.slice(0, 5).map((pair: any) => (
                  <div key={pair.pair} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-900">{pair.pair}</div>
                      <div className="text-xs text-gray-500">{pair.volume}</div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <ArrowUpRight className="h-3 w-3" />
                      <span>{pair.change}</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-gray-500 py-4">No data available</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Verified Users</span>
                <span className="text-gray-900">{systemMetrics?.users?.verified || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Trades</span>
                <span className="text-gray-900">{tradingAnalytics?.summary?.totalTrades || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">New Users (Today)</span>
                <span className="text-gray-900">{systemMetrics?.users?.newToday || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total P&L</span>
                <span className="text-gray-900">${tradingAnalytics?.summary?.totalPnL?.toFixed(2) || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
