import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
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

const currencyPairs = [
  { pair: 'EUR/USD', enabled: true, spread: '0.8', leverage: '1:100' },
  { pair: 'GBP/USD', enabled: true, spread: '1.2', leverage: '1:100' },
  { pair: 'USD/JPY', enabled: true, spread: '0.9', leverage: '1:100' },
  { pair: 'AUD/USD', enabled: true, spread: '1.1', leverage: '1:50' },
  { pair: 'USD/CAD', enabled: false, spread: '1.3', leverage: '1:50' },
  { pair: 'EUR/GBP', enabled: true, spread: '1.0', leverage: '1:100' },
];

export function PlatformSettings() {
  const [marketOpen, setMarketOpen] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoCloseWeekend, setAutoCloseWeekend] = useState(true);
  const [enableNotifications, setEnableNotifications] = useState(true);

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

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
            v2.4.1
          </Badge>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save All Changes
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Platform Name</Label>
                  <Input defaultValue="NovaPip" className="mt-2" />
                </div>
                <div>
                  <Label>Default Currency</Label>
                  <Input defaultValue="USD" className="mt-2" />
                </div>
                <div>
                  <Label>Session Timeout (minutes)</Label>
                  <Input type="number" defaultValue="30" className="mt-2" />
                </div>
                <div>
                  <Label>Max Leverage</Label>
                  <Input defaultValue="1:100" className="mt-2" />
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
                <Button className="gap-2">
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
                  {currencyPairs.map((pair) => (
                    <TableRow key={pair.pair}>
                      <TableCell>{pair.pair}</TableCell>
                      <TableCell>
                        <Badge className={pair.enabled ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}>
                          {pair.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input defaultValue={pair.spread} className="w-24" />
                      </TableCell>
                      <TableCell>
                        <Input defaultValue={pair.leverage} className="w-24" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
                    defaultValue="We are currently performing scheduled maintenance. The platform will be back online shortly."
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
                    <div className="text-gray-900">v2.4.1</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Last Updated</div>
                    <div className="text-gray-900">2024-10-15</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Database Version</div>
                    <div className="text-gray-900">PostgreSQL 14.2</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Server Status</div>
                    <Badge className="bg-green-100 text-green-700 border-green-200">Healthy</Badge>
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
