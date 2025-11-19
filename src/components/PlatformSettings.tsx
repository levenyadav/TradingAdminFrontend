import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { 
  Settings, 
  Clock, 
  TrendingUp, 
  Bell, 
  Shield,
  Wrench,
  Save,
  X,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner@2.0.3';
import { 
  getPlatformSettings, 
  getTradingSettings, 
  getNotificationSettings, 
  getBusinessSettings,
  updatePlatformSettings,
  updateTradingSettings,
  updateNotificationSettings,
  updateBusinessSettings
} from '../lib/api';
import { getAllCurrencyPairs, createCurrencyPair, updateCurrencyPair, deleteCurrencyPair } from '../lib/api';
import type { 
  PlatformSettings, 
  TradingSettings, 
  NotificationSettings, 
  BusinessSettings,
  APIResponse,
  CurrencyPair
} from '../lib/types';

export function PlatformSettings() {
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings data
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [tradingSettings, setTradingSettings] = useState<TradingSettings | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [currencyPairs, setCurrencyPairs] = useState<CurrencyPair[]>([]);

  // UI state variables
  const [marketOpen, setMarketOpen] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoCloseWeekend, setAutoCloseWeekend] = useState(true);
  const [enableNotifications, setEnableNotifications] = useState(true);

  // Load all settings on component mount
  useEffect(() => {
    loadAllSettings();
    loadCurrencyPairs();
  }, []);

  const loadAllSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const [platformRes, tradingRes, notificationRes, businessRes] = await Promise.all([
        getPlatformSettings() as Promise<APIResponse<PlatformSettings>>,
        getTradingSettings() as Promise<APIResponse<TradingSettings>>,
        getNotificationSettings() as Promise<APIResponse<NotificationSettings>>,
        getBusinessSettings() as Promise<APIResponse<BusinessSettings>>
      ]);

      if (platformRes.success) {
        setPlatformSettings(platformRes.data);
        setMarketOpen(!platformRes.data.globalTradingHalt.isHalted);
        setMaintenanceMode(platformRes.data.maintenanceMode.isEnabled);
        setEnableNotifications(platformRes.data.notificationSettings.enableEmailNotifications);
      }

      if (tradingRes.success) {
        setTradingSettings(tradingRes.data);
      }

      if (notificationRes.success) {
        setNotificationSettings(notificationRes.data);
      }

      if (businessRes.success) {
        setBusinessSettings(businessRes.data);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
      console.error('Settings load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrencyPairs = async () => {
    try {
      const res = await getAllCurrencyPairs({ page: 1, limit: 50 }) as APIResponse<CurrencyPair[]>;
      if (res.success) setCurrencyPairs(res.data || []);
    } catch (err) {
      console.error('Load currency pairs error:', err);
    }
  };

  // Pairs CRUD state
  const [showAddPair, setShowAddPair] = useState(false);
  const [addSymbol, setAddSymbol] = useState('');
  const [addBase, setAddBase] = useState('');
  const [addQuote, setAddQuote] = useState('');
  const [addCategory, setAddCategory] = useState('major');
  const [pairSaving, setPairSaving] = useState(false);

  const [editPair, setEditPair] = useState<CurrencyPair | null>(null);
  const [showEditPair, setShowEditPair] = useState(false);
  const [editSpread, setEditSpread] = useState<number>(1.0);
  const [editLeverage, setEditLeverage] = useState<number>(100);
  const [editEnabled, setEditEnabled] = useState<boolean>(true);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const handleAddPair = async () => {
    try {
      setPairSaving(true);
      const payload = {
        symbol: addSymbol.trim(),
        baseCurrency: addBase.trim().toUpperCase(),
        quoteCurrency: addQuote.trim().toUpperCase(),
        category: addCategory,
        isActive: true,
        tradingEnabled: true,
      };
      const resp = await createCurrencyPair(payload) as APIResponse<CurrencyPair>;
      if (resp.success) {
        toast.success('Pair added');
        setShowAddPair(false);
        setAddSymbol(''); setAddBase(''); setAddQuote(''); setAddCategory('major');
        await loadCurrencyPairs();
      } else {
        throw new Error(resp.message || 'Failed to add pair');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add pair');
    } finally {
      setPairSaving(false);
    }
  };

  const openEditPair = (p: CurrencyPair) => {
    setEditPair(p);
    setEditSpread(p.defaultSpread ?? 1.0);
    setEditLeverage(p.maxLeverage ?? (platformSettings?.tradingParameters.maxLeverage || 100));
    setEditEnabled(!!p.tradingEnabled);
    setShowEditPair(true);
  };

  const handleEditPair = async () => {
    if (!editPair) return;
    try {
      setPairSaving(true);
      const resp = await updateCurrencyPair(editPair._id, {
        defaultSpread: editSpread,
        maxLeverage: editLeverage,
        tradingEnabled: editEnabled,
      }) as APIResponse<CurrencyPair>;
      if (resp.success) {
        toast.success('Pair updated');
        setShowEditPair(false);
        setEditPair(null);
        await loadCurrencyPairs();
      } else {
        throw new Error(resp.message || 'Failed to update pair');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update pair');
    } finally {
      setPairSaving(false);
    }
  };

  const confirmDeletePair = (p: CurrencyPair) => {
    setDeleteId(p._id);
    setShowDelete(true);
  };

  const handleDeletePair = async () => {
    if (!deleteId) return;
    try {
      setPairSaving(true);
      const resp = await deleteCurrencyPair(deleteId) as APIResponse<any>;
      if (resp.success) {
        toast.success('Pair deleted');
        setShowDelete(false);
        setDeleteId(null);
        await loadCurrencyPairs();
      } else {
        throw new Error(resp.message || 'Failed to delete pair');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete pair');
    } finally {
      setPairSaving(false);
    }
  };

  const handleSave = async () => {
    if (!platformSettings) return;

    try {
      setSaving(true);
      setError(null);

      // Update platform settings with current UI state
      const updatedSettings = {
        ...platformSettings,
        globalTradingHalt: {
          isHalted: !marketOpen
        },
        maintenanceMode: {
          ...platformSettings.maintenanceMode,
          isEnabled: maintenanceMode
        },
        notificationSettings: {
          ...platformSettings.notificationSettings,
          enableEmailNotifications: enableNotifications
        }
      };

      const response = await updatePlatformSettings(updatedSettings) as APIResponse<PlatformSettings>;
      
      if (response.success) {
        setPlatformSettings(response.data);
        toast.success('Settings saved successfully');
      } else {
        throw new Error(response.message || 'Failed to save settings');
      }

    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
      toast.error(err.message || 'Failed to save settings');
      console.error('Settings save error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading settings...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Alert className="border-red-200 bg-red-50">
          <X className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-3" 
              onClick={loadAllSettings}
            >
              Retry
            </Button>
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
          <h1 className="text-gray-900">Platform Settings</h1>
          <p className="text-gray-500 mt-1">Configure system-level platform controls</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            v{platformSettings?.version || '2.4.1'}
          </Badge>
          <Button 
            onClick={handleSave} 
            disabled={saving || !platformSettings}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>

      {/* Main Settings */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="market" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Market Time</span>
          </TabsTrigger>
          <TabsTrigger value="pairs" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Pairs</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="access" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Access</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-2">
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Maintenance</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Market Controls</CardTitle>
              <CardDescription>Manage market status and trading availability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <div className={`h-3 w-3 rounded-full ${marketOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <Label className="text-gray-900">Market Status</Label>
                  </div>
                  <p className="text-sm text-gray-500">
                    {marketOpen ? 'Trading is currently enabled for all users' : 'Trading is currently disabled'}
                  </p>
                </div>
                <Switch checked={marketOpen} onCheckedChange={setMarketOpen} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-gray-900">Auto-close on Weekends</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Automatically disable trading on Saturday and Sunday
                  </p>
                </div>
                <Switch checked={autoCloseWeekend} onCheckedChange={setAutoCloseWeekend} />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Max Leverage</Label>
                  <Input 
                    type="number"
                    value={platformSettings?.tradingParameters.maxLeverage || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          tradingParameters: {
                            ...platformSettings.tradingParameters,
                            maxLeverage: parseInt(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
                <div>
                  <Label>Min Trade Volume</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={platformSettings?.tradingParameters.minTradeVolume || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          tradingParameters: {
                            ...platformSettings.tradingParameters,
                            minTradeVolume: parseFloat(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
                <div>
                  <Label>Max Trade Volume</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={platformSettings?.tradingParameters.maxTradeVolume || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          tradingParameters: {
                            ...platformSettings.tradingParameters,
                            maxTradeVolume: parseFloat(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
                <div>
                  <Label>Max Open Positions</Label>
                  <Input 
                    type="number"
                    value={platformSettings?.tradingParameters.maxOpenPositions || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          tradingParameters: {
                            ...platformSettings.tradingParameters,
                            maxOpenPositions: parseInt(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
                <div>
                  <Label>Max Daily Volume</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={platformSettings?.tradingParameters.maxDailyVolume || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          tradingParameters: {
                            ...platformSettings.tradingParameters,
                            maxDailyVolume: parseFloat(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
                <div>
                  <Label>Margin Call Level (%)</Label>
                  <Input 
                    type="number"
                    value={platformSettings?.tradingParameters.marginCallLevel || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          tradingParameters: {
                            ...platformSettings.tradingParameters,
                            marginCallLevel: parseFloat(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
                <div>
                  <Label>Stop Out Level (%)</Label>
                  <Input 
                    type="number"
                    value={platformSettings?.tradingParameters.stopOutLevel || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          tradingParameters: {
                            ...platformSettings.tradingParameters,
                            stopOutLevel: parseFloat(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-gray-900 font-medium">KYC Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="text-gray-900">Require KYC for Trading</Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Users must complete KYC verification to place trades
                      </p>
                    </div>
                    <Switch 
                      checked={platformSettings?.tradingParameters.requireKYCForTrading || false} 
                      onCheckedChange={(checked) => {
                        if (platformSettings) {
                          setPlatformSettings({
                            ...platformSettings,
                            tradingParameters: {
                              ...platformSettings.tradingParameters,
                              requireKYCForTrading: checked
                            }
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="text-gray-900">Require KYC for Withdrawal</Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Users must complete KYC verification to withdraw funds
                      </p>
                    </div>
                    <Switch 
                      checked={platformSettings?.tradingParameters.requireKYCForWithdrawal || false} 
                      onCheckedChange={(checked) => {
                        if (platformSettings) {
                          setPlatformSettings({
                            ...platformSettings,
                            tradingParameters: {
                              ...platformSettings.tradingParameters,
                              requireKYCForWithdrawal: checked
                            }
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Management */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Management</CardTitle>
              <CardDescription>Configure risk controls and loss limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Max Drawdown (%)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={platformSettings?.riskManagement.maxDrawdownPercent || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          riskManagement: {
                            ...platformSettings.riskManagement,
                            maxDrawdownPercent: parseFloat(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
                <div>
                  <Label>Daily Loss Limit</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={platformSettings?.riskManagement.dailyLossLimit || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          riskManagement: {
                            ...platformSettings.riskManagement,
                            dailyLossLimit: parseFloat(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
                <div>
                  <Label>Weekly Loss Limit</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={platformSettings?.riskManagement.weeklyLossLimit || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          riskManagement: {
                            ...platformSettings.riskManagement,
                            weeklyLossLimit: parseFloat(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
                <div>
                  <Label>Monthly Loss Limit</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={platformSettings?.riskManagement.monthlyLossLimit || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          riskManagement: {
                            ...platformSettings.riskManagement,
                            monthlyLossLimit: parseFloat(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-gray-900 font-medium">Risk Controls</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="text-gray-900">Enable Auto Stop Out</Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Automatically close positions when stop out level is reached
                      </p>
                    </div>
                    <Switch 
                      checked={platformSettings?.riskManagement.enableAutoStopOut || false} 
                      onCheckedChange={(checked) => {
                        if (platformSettings) {
                          setPlatformSettings({
                            ...platformSettings,
                            riskManagement: {
                              ...platformSettings.riskManagement,
                              enableAutoStopOut: checked
                            }
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="text-gray-900">Enable Risk Alerts</Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Send notifications when risk thresholds are approached
                      </p>
                    </div>
                    <Switch 
                      checked={platformSettings?.riskManagement.enableRiskAlerts || false} 
                      onCheckedChange={(checked) => {
                        if (platformSettings) {
                          setPlatformSettings({
                            ...platformSettings,
                            riskManagement: {
                              ...platformSettings.riskManagement,
                              enableRiskAlerts: checked
                            }
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="text-gray-900">Suspend High Risk Accounts</Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Automatically suspend accounts that exceed risk limits
                      </p>
                    </div>
                    <Switch 
                      checked={platformSettings?.riskManagement.suspendHighRiskAccounts || false} 
                      onCheckedChange={(checked) => {
                        if (platformSettings) {
                          setPlatformSettings({
                            ...platformSettings,
                            riskManagement: {
                              ...platformSettings.riskManagement,
                              suspendHighRiskAccounts: checked
                            }
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Settings</CardTitle>
              <CardDescription>Configure deposit and withdrawal limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Min Deposit</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={platformSettings?.financialSettings.minDeposit || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          financialSettings: {
                            ...platformSettings.financialSettings,
                            minDeposit: parseFloat(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
                <div>
                  <Label>Max Deposit</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={platformSettings?.financialSettings.maxDeposit || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          financialSettings: {
                            ...platformSettings.financialSettings,
                            maxDeposit: parseFloat(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
                <div>
                  <Label>Min Withdrawal</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={platformSettings?.financialSettings.minWithdrawal || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          financialSettings: {
                            ...platformSettings.financialSettings,
                            minWithdrawal: parseFloat(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
                <div>
                  <Label>Max Withdrawal</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={platformSettings?.financialSettings.maxWithdrawal || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          financialSettings: {
                            ...platformSettings.financialSettings,
                            maxWithdrawal: parseFloat(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
                <div>
                  <Label>Max Daily Withdrawal</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={platformSettings?.financialSettings.maxDailyWithdrawal || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          financialSettings: {
                            ...platformSettings.financialSettings,
                            maxDailyWithdrawal: parseFloat(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
                <div>
                  <Label>Max Weekly Withdrawal</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={platformSettings?.financialSettings.maxWeeklyWithdrawal || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          financialSettings: {
                            ...platformSettings.financialSettings,
                            maxWeeklyWithdrawal: parseFloat(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
                <div>
                  <Label>Max Monthly Withdrawal</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={platformSettings?.financialSettings.maxMonthlyWithdrawal || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          financialSettings: {
                            ...platformSettings.financialSettings,
                            maxMonthlyWithdrawal: parseFloat(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
                <div>
                  <Label>Withdrawal Processing Time (hours)</Label>
                  <Input 
                    type="number"
                    value={platformSettings?.financialSettings.withdrawalProcessingTime || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          financialSettings: {
                            ...platformSettings.financialSettings,
                            withdrawalProcessingTime: parseInt(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
                <div>
                  <Label>Admin Approval Amount</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={platformSettings?.financialSettings.requireAdminApprovalAmount || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          financialSettings: {
                            ...platformSettings.financialSettings,
                            requireAdminApprovalAmount: parseFloat(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-gray-900 font-medium">Auto-Approval Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="text-gray-900">Auto-Approve Deposits</Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Automatically approve deposits without manual review
                      </p>
                    </div>
                    <Switch 
                      checked={platformSettings?.financialSettings.autoApproveDeposits || false} 
                      onCheckedChange={(checked) => {
                        if (platformSettings) {
                          setPlatformSettings({
                            ...platformSettings,
                            financialSettings: {
                              ...platformSettings.financialSettings,
                              autoApproveDeposits: checked
                            }
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="text-gray-900">Auto-Approve Withdrawals</Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Automatically approve withdrawals below admin approval amount
                      </p>
                    </div>
                    <Switch 
                      checked={platformSettings?.financialSettings.autoApproveWithdrawals || false} 
                      onCheckedChange={(checked) => {
                        if (platformSettings) {
                          setPlatformSettings({
                            ...platformSettings,
                            financialSettings: {
                              ...platformSettings.financialSettings,
                              autoApproveWithdrawals: checked
                            }
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Settings */}
          <Card>
            <CardHeader>
              <CardTitle>API Settings</CardTitle>
              <CardDescription>Configure API access and rate limiting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Rate Limit Requests</Label>
                  <Input 
                    type="number"
                    value={platformSettings?.apiSettings.rateLimitRequests || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          apiSettings: {
                            ...platformSettings.apiSettings,
                            rateLimitRequests: parseInt(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
                <div>
                  <Label>Rate Limit Window (minutes)</Label>
                  <Input 
                    type="number"
                    value={platformSettings?.apiSettings.rateLimitWindow || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          apiSettings: {
                            ...platformSettings.apiSettings,
                            rateLimitWindow: parseInt(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
                <div>
                  <Label>Max Webhook Retries</Label>
                  <Input 
                    type="number"
                    value={platformSettings?.apiSettings.maxWebhookRetries || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          apiSettings: {
                            ...platformSettings.apiSettings,
                            maxWebhookRetries: parseInt(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
                <div>
                  <Label>API Timeout (seconds)</Label>
                  <Input 
                    type="number"
                    value={platformSettings?.apiSettings.apiTimeoutSeconds || ''} 
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          apiSettings: {
                            ...platformSettings.apiSettings,
                            apiTimeoutSeconds: parseInt(e.target.value) || 0
                          }
                        });
                      }
                    }}
                    className="mt-2" 
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-gray-900 font-medium">API Access Control</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="text-gray-900">Enable API</Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Allow external applications to access the API
                      </p>
                    </div>
                    <Switch 
                      checked={platformSettings?.apiSettings.enableAPI || false} 
                      onCheckedChange={(checked) => {
                        if (platformSettings) {
                          setPlatformSettings({
                            ...platformSettings,
                            apiSettings: {
                              ...platformSettings.apiSettings,
                              enableAPI: checked
                            }
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="text-gray-900">Enable Webhooks</Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Allow webhook notifications for events
                      </p>
                    </div>
                    <Switch 
                      checked={platformSettings?.apiSettings.enableWebhooks || false} 
                      onCheckedChange={(checked) => {
                        if (platformSettings) {
                          setPlatformSettings({
                            ...platformSettings,
                            apiSettings: {
                              ...platformSettings.apiSettings,
                              enableWebhooks: checked
                            }
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Time Settings */}
        <TabsContent value="market" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Trading Hours Schedule</CardTitle>
              <CardDescription>Configure market opening and closing times</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  All times are in UTC. The platform will automatically manage market status based on these settings.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                  <div key={day} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-32">
                      <Label>{day}</Label>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-500">Open Time</Label>
                        <Input type="time" defaultValue="00:00" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Close Time</Label>
                        <Input type="time" defaultValue="23:59" className="mt-1" />
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}

                {['Saturday', 'Sunday'].map((day) => (
                  <div key={day} className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                    <div className="w-32">
                      <Label className="text-gray-500">{day}</Label>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-400">Open Time</Label>
                        <Input type="time" disabled className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-400">Close Time</Label>
                        <Input type="time" disabled className="mt-1" />
                      </div>
                    </div>
                    <Switch disabled />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Currency Pairs */}
        <TabsContent value="pairs" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Currency Pair Management</CardTitle>
                  <CardDescription>Configure available trading pairs and spreads</CardDescription>
                </div>
                <Button className="gap-2" onClick={() => setShowAddPair(true)}>
                  <Plus className="h-4 w-4" />
                  Add Pair
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Currency Pair</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Spread (pips)</TableHead>
                    <TableHead>Max Leverage</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(currencyPairs.length ? currencyPairs : tradingSettings?.availableSymbols || []).map((symbol: any) => (
                    <TableRow key={symbol._id}>
                      <TableCell>{symbol.symbol}</TableCell>
                      <TableCell>
                        <Badge className={symbol.tradingEnabled ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}>
                          {symbol.tradingEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input defaultValue={String(symbol.defaultSpread ?? 1.0)} className="w-24" placeholder="Spread" readOnly />
                      </TableCell>
                      <TableCell>
                        <Input defaultValue={`1:${symbol.maxLeverage ?? (platformSettings?.tradingParameters.maxLeverage || 100)}`} className="w-24" placeholder="Leverage" readOnly />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => openEditPair(symbol)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-600" onClick={() => confirmDeletePair(symbol)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) || (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">
                        No trading symbols available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
          </CardContent>
          </Card>
          {/* Add Pair Modal */}
          <Dialog open={showAddPair} onOpenChange={setShowAddPair}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Currency Pair</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Symbol (e.g., EUR/USD)" value={addSymbol} onChange={(e) => setAddSymbol(e.target.value.toUpperCase())} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Base (e.g., EUR)" value={addBase} onChange={(e) => setAddBase(e.target.value.toUpperCase())} />
                  <Input placeholder="Quote (e.g., USD)" value={addQuote} onChange={(e) => setAddQuote(e.target.value.toUpperCase())} />
                </div>
                <div>
                  <Select value={addCategory} onValueChange={setAddCategory}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="exotic">Exotic</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="commodities">Commodities</SelectItem>
                      <SelectItem value="indices">Indices</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddPair(false)}>Cancel</Button>
                <Button onClick={handleAddPair} disabled={pairSaving || !addSymbol || !addBase || !addQuote}> {pairSaving ? 'Adding...' : 'Add Pair'} </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Pair Modal */}
          <Dialog open={showEditPair} onOpenChange={setShowEditPair}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Pair</DialogTitle>
              </DialogHeader>
              {editPair && (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">{editPair.symbol}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Spread (pips)</Label>
                      <Input type="number" step="0.1" value={editSpread} onChange={(e) => setEditSpread(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                      <Label>Max Leverage</Label>
                      <Input type="number" value={editLeverage} onChange={(e) => setEditLeverage(parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <Label>Trading Enabled</Label>
                    <Switch checked={editEnabled} onCheckedChange={setEditEnabled} />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditPair(false)}>Cancel</Button>
                <Button onClick={handleEditPair} disabled={pairSaving || !editPair}>{pairSaving ? 'Saving...' : 'Save Changes'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirm */}
          <Dialog open={showDelete} onOpenChange={setShowDelete}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Pair</DialogTitle>
              </DialogHeader>
              <div className="text-sm text-gray-600">Are you sure you want to delete this pair?</div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
                <Button className="text-red-600" onClick={handleDeletePair} disabled={pairSaving || !deleteId}>{pairSaving ? 'Deleting...' : 'Delete'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Management</CardTitle>
              <CardDescription>Configure system alerts and user notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-gray-900">Enable Notifications</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Master switch for all platform notifications
                  </p>
                </div>
                <Switch checked={enableNotifications} onCheckedChange={setEnableNotifications} />
              </div>

              <Separator />

              <div>
                <Label>System Announcement</Label>
                <Textarea 
                  placeholder="Enter announcement message for all users..."
                  className="mt-2"
                  rows={4}
                />
                <Button className="mt-3">Broadcast Announcement</Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-gray-900">Notification Templates</h3>
                <div className="space-y-3">
                  {[
                    { title: 'KYC Approval', desc: 'Sent when KYC is approved' },
                    { title: 'KYC Rejection', desc: 'Sent when KYC is rejected' },
                    { title: 'Deposit Confirmed', desc: 'Sent when deposit is confirmed' },
                    { title: 'Withdrawal Processed', desc: 'Sent when withdrawal is completed' },
                    { title: 'Large Trade Alert', desc: 'Alert for trades exceeding threshold' },
                  ].map((template) => (
                    <div key={template.title} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="text-sm text-gray-900">{template.title}</div>
                        <div className="text-xs text-gray-500">{template.desc}</div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Control */}
        <TabsContent value="access" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Access Control</CardTitle>
              <CardDescription>Manage user permissions and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label className="text-gray-900">Require 2FA for Withdrawals</Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Force two-factor authentication for all withdrawal requests
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label className="text-gray-900">IP Whitelist</Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Restrict admin access to specific IP addresses
                    </p>
                  </div>
                  <Switch />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label className="text-gray-900">Login Attempt Limit</Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Maximum failed login attempts before account lock
                    </p>
                  </div>
                  <Input type="number" defaultValue="5" className="w-24" />
                </div>

                <Separator />

                <div>
                  <Label>Admin Activity Logging</Label>
                  <p className="text-sm text-gray-500 mt-1 mb-3">
                    Track all administrative actions for security audit
                  </p>
                  <Button variant="outline">View Activity Logs</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance */}
        <TabsContent value="maintenance" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Mode</CardTitle>
              <CardDescription>System maintenance and version information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Wrench className="h-4 w-4" />
                <AlertDescription>
                  Enabling maintenance mode will disable all trading and show a maintenance message to users.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <Label className="text-gray-900">Maintenance Mode</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    {maintenanceMode ? 'Platform is in maintenance mode' : 'Platform is operational'}
                  </p>
                </div>
                <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
              </div>

              {maintenanceMode && (
                <div>
                  <Label>Maintenance Message</Label>
                  <Textarea 
                    placeholder="Enter message to display to users..."
                    className="mt-2"
                    value={platformSettings?.maintenanceMode.message || "We are currently performing scheduled maintenance. The platform will be back online shortly."}
                    onChange={(e) => {
                      if (platformSettings) {
                        setPlatformSettings({
                          ...platformSettings,
                          maintenanceMode: {
                            ...platformSettings.maintenanceMode,
                            message: e.target.value
                          }
                        });
                      }
                    }}
                    rows={3}
                  />
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <h3 className="text-gray-900">System Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Platform Version</div>
                    <div className="text-gray-900">v{platformSettings?.version || '2.4.1'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Last Updated</div>
                    <div className="text-gray-900">
                      {platformSettings?.lastUpdatedAt ? 
                        new Date(platformSettings.lastUpdatedAt).toLocaleDateString() : 
                        '2024-10-15'
                      }
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Created At</div>
                    <div className="text-gray-900">
                      {platformSettings?.createdAt ? 
                        new Date(platformSettings.createdAt).toLocaleDateString() : 
                        'N/A'
                      }
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Server Status</div>
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      {platformSettings?.maintenanceMode.isEnabled ? 'Maintenance' : 'Healthy'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-gray-900">Database Operations</h3>
                <div className="flex gap-3">
                  <Button variant="outline">Backup Database</Button>
                  <Button variant="outline">Clear Cache</Button>
                  <Button variant="outline" className="text-red-600">Reset System</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
