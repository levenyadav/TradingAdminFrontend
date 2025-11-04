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
  RefreshCw,
  UserCheck,
  Shield,
  Globe,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { getUserAnalytics } from '../lib/api';
import type { UserAnalytics } from '../lib/types';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';

interface UserAnalyticsProps {
  className?: string;
}

export function UserAnalyticsSection({ className }: UserAnalyticsProps) {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [granularity, setGranularity] = useState('day');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setError(null);
      const response = await getUserAnalytics(granularity);
      setAnalytics(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load user analytics');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchAnalytics();
    }
  }, [granularity]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertDescription>
          <p className="mb-2">{error}</p>
          <Button onClick={fetchAnalytics} size="sm" variant="outline">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!analytics) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">User Analytics</h2>
          <p className="text-sm text-gray-600">Overview of user registration, activity, and demographics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={granularity} onValueChange={setGranularity}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <UserAnalyticsCards analytics={analytics} />

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <UserTimelineCharts analytics={analytics} />
        <UserDemographicsCharts analytics={analytics} />
      </div>
    </div>
  );
}

interface UserAnalyticsCardsProps {
  analytics: UserAnalytics;
}

function UserAnalyticsCards({ analytics }: UserAnalyticsCardsProps) {
  const cards = [
    {
      title: 'Total Users',
      value: analytics.summary.totalUsers.toLocaleString(),
      description: `${analytics.summary.activeUsers} active users`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      trend: {
        value: analytics.summary.activeUserPercentage,
        label: 'active rate'
      }
    },
    {
      title: 'Verified Users',
      value: analytics.summary.verifiedUsers.toLocaleString(),
      description: `${analytics.summary.verificationRate}% verification rate`,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      trend: {
        value: analytics.summary.verificationRate,
        label: 'verified'
      }
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const trendValue = card.trend ? parseFloat(card.trend.value) : 0;
        const isPositive = trendValue >= 50;
        
        return (
          <Card key={index} className={`border ${card.borderColor}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`h-8 w-8 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              <div className="flex items-center gap-1 mt-1">
                <p className="text-xs text-gray-600">{card.description}</p>
                {card.trend && (
                  <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    <span className="text-xs font-medium">{card.trend.value}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

interface UserTimelineChartsProps {
  analytics: UserAnalytics;
}

function UserTimelineCharts({ analytics }: UserTimelineChartsProps) {
  // Prepare registration data
  const registrationData = (analytics.timeSeries?.registrations || []).map(item => ({
    date: item._id,
    registrations: item.count,
    formattedDate: new Date(item._id).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }));

  // Prepare activity data
  const activityData = (analytics.timeSeries?.activity || []).map(item => ({
    date: item._id,
    activity: item.count,
    formattedDate: new Date(item._id).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }));

  const chartConfig = {
    registrations: {
      label: "Registrations",
      color: "hsl(212, 82%, 60%)",
    },
    activity: {
      label: "Active Users",
      color: "hsl(154, 62%, 45%)",
    },
  };

  return (
    <>
      {/* User Registrations Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            User Registrations
          </CardTitle>
          <CardDescription>
            New user registrations over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={registrationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formattedDate" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                labelFormatter={(value) => `Date: ${value}`}
              />
              <Area
                type="monotone"
                dataKey="registrations"
                stroke={chartConfig.registrations.color}
                fill={chartConfig.registrations.color}
                fillOpacity={0.2}
                strokeWidth={2}
              />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* User Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            User Activity
          </CardTitle>
          <CardDescription>
            Daily active users over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formattedDate" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                labelFormatter={(value) => `Date: ${value}`}
              />
              <Line
                type="monotone"
                dataKey="activity"
                stroke={chartConfig.activity.color}
                strokeWidth={3}
                dot={{ r: 4, fill: chartConfig.activity.color }}
                activeDot={{ r: 6, fill: chartConfig.activity.color }}
              />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

interface UserDemographicsChartsProps {
  analytics: UserAnalytics;
}

function UserDemographicsCharts({ analytics }: UserDemographicsChartsProps) {
  // Prepare country data for bar chart
  const countryData = analytics.demographics.byCountry.slice(0, 5).map(item => ({
    country: item._id,
    users: item.count,
    percentage: ((item.count / analytics.summary.totalUsers) * 100).toFixed(1)
  }));

  // Prepare status data for pie chart
  const statusData = analytics.demographics.byStatus.map(item => ({
    name: item._id,
    value: item.count,
    percentage: ((item.count / analytics.summary.totalUsers) * 100).toFixed(1)
  }));

  const statusColors = {
    active: '#10b981',
    pending: '#f59e0b',
    suspended: '#ef4444'
  };

  return (
    <>
      {/* Countries Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-600" />
            Top Countries
          </CardTitle>
          <CardDescription>
            User distribution by country
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis 
                  type="category" 
                  dataKey="country" 
                  fontSize={12}
                  width={40}
                />
                <Tooltip 
                  formatter={(value: any, name: any) => [
                    `${value} users (${countryData.find(d => d.users === value)?.percentage}%)`,
                    'Users'
                  ]}
                />
                <Bar dataKey="users" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* User Status Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            User Status
          </CardTitle>
          <CardDescription>
            Distribution by account status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={statusColors[entry.name as keyof typeof statusColors] || '#6b7280'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: any, props: any) => [
                      `${value} users (${props.payload.percentage}%)`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 pl-4">
              <div className="space-y-2">
                {statusData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ 
                        backgroundColor: statusColors[item.name as keyof typeof statusColors] || '#6b7280' 
                      }}
                    />
                    <span className="text-sm text-gray-700 capitalize">{item.name}</span>
                    <span className="text-sm font-medium text-gray-900 ml-auto">
                      {item.value} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}