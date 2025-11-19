import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Settings,
  CreditCard,
  AccountBalance,
  Wallet,
  Bitcoin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Label } from './ui/label';
import {
  getPaymentMethods,
  updatePaymentBankDetails,
  togglePaymentMethod,
  getFinanceTransactions,
  getFinanceAnalytics,
  approveDeposit,
  approveWithdrawal,
  rejectFinanceTransaction,
} from '../lib/api';

// Types for payment methods
interface PaymentMethod {
  _id: string;
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  currencies: string[];
  fees: {
    deposit: string | number;
    withdrawal: string | number;
  };
  limits: {
    deposit: { min: number; max: number };
    withdrawal: { min: number; max: number };
  };
  processingTime: string;
  requiresVerification: boolean;
  requiresDocuments: boolean;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    routingNumber?: string;
    swiftCode?: string;
    iban?: string;
    bankAddress?: string;
    instructions: string;
  };
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface BankDetailsForm {
  accountName: string;
  accountNumber: string;
  bankName: string;
  routingNumber: string;
  swiftCode: string;
  iban: string;
  bankAddress: string;
  instructions: string;
}

export function PaymentMethodManagement() {
  // State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [bankDetailsForm, setBankDetailsForm] = useState<BankDetailsForm>({
    accountName: '',
    accountNumber: '',
    bankName: '',
    routingNumber: '',
    swiftCode: '',
    iban: '',
    bankAddress: '',
    instructions: ''
  });

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      setError(null);

      const data: any = await getPaymentMethods();
      setPaymentMethods(data.data?.paymentMethods || data.data || []);
    } catch (err: any) {
      console.error('Error fetching payment methods:', err);
      setError(err.message || 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  // Initialize component
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  // Get method icon
  const getMethodIcon = (methodId: string) => {
    const iconMap: Record<string, any> = {
      'bank_transfer': AccountBalance,
      'stripe': CreditCard,
      'paypal': Wallet,
      'crypto': Bitcoin
    };
    return iconMap[methodId] || Settings;
  };

  // Format fee display
  const formatFee = (fee: string | number): string => {
    if (typeof fee === 'number') {
      return `$${fee}`;
    }
    return fee;
  };

  // Filter payment methods
  const filteredMethods = paymentMethods.filter(method => {
    const matchesSearch = method.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         method.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         method.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'enabled' && method.enabled) ||
                         (statusFilter === 'disabled' && !method.enabled);

    return matchesSearch && matchesStatus;
  });

  // Open bank details modal
  const openBankDetailsModal = (method: PaymentMethod) => {
    setSelectedMethod(method);
    if (method.bankDetails) {
      setBankDetailsForm({
        accountName: method.bankDetails.accountName,
        accountNumber: method.bankDetails.accountNumber,
        bankName: method.bankDetails.bankName,
        routingNumber: method.bankDetails.routingNumber || '',
        swiftCode: method.bankDetails.swiftCode || '',
        iban: method.bankDetails.iban || '',
        bankAddress: method.bankDetails.bankAddress || '',
        instructions: method.bankDetails.instructions
      });
    } else {
      setBankDetailsForm({
        accountName: '',
        accountNumber: '',
        bankName: '',
        routingNumber: '',
        swiftCode: '',
        iban: '',
        bankAddress: '',
        instructions: ''
      });
    }
    setShowBankDetailsModal(true);
  };

  // Save bank details
  const saveBankDetails = async () => {
    if (!selectedMethod) return;

    try {
      setSaving(true);
      setError(null);

      await updatePaymentBankDetails(selectedMethod._id, bankDetailsForm);

      await fetchPaymentMethods();
      setShowBankDetailsModal(false);
      setSelectedMethod(null);
    } catch (err: any) {
      console.error('Error saving bank details:', err);
      setError(err.message || 'Failed to save bank details');
    } finally {
      setSaving(false);
    }
  };

  // Toggle payment method status
  const toggleMethodStatus = async (method: PaymentMethod) => {
    try {
      setError(null);

      await togglePaymentMethod(method._id, !method.enabled);

      setPaymentMethods(methods =>
        methods.map(m => m._id === method._id ? { ...m, enabled: !m.enabled } : m)
      );
    } catch (err: any) {
      console.error('Error toggling payment method:', err);
      setError(err.message || 'Failed to update payment method');
    }
  };

  // Get status badge
  const getStatusBadge = (enabled: boolean) => {
    if (enabled) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
          <CheckCircle className="h-3 w-3" />
          Enabled
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
          <XCircle className="h-3 w-3" />
          Disabled
        </Badge>
      );
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payment Method Management</h1>
          <p className="text-gray-500 mt-1">Manage payment methods and bank details for collections</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Method
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium">Error</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search payment methods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Methods ({filteredMethods.length})</CardTitle>
              <CardDescription>Configure payment methods available to users</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="text-gray-500">Loading payment methods...</span>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Currencies</TableHead>
                    <TableHead>Fees</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMethods.map((method) => {
                    const Icon = getMethodIcon(method.id);
                    return (
                      <TableRow key={method._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Icon className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-medium">{method.name}</div>
                              <div className="text-sm text-gray-500">{method.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-600 truncate">{method.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {method.currencies.map(currency => (
                              <Badge key={currency} variant="outline" className="text-xs">
                                {currency}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Deposit: {formatFee(method.fees.deposit)}</div>
                            <div>Withdrawal: {formatFee(method.fees.withdrawal)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(method.enabled)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">{method.displayOrder}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {method.id === 'bank_transfer' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openBankDetailsModal(method)}
                                className="gap-1"
                              >
                                <Settings className="h-3 w-3" />
                                Bank Details
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleMethodStatus(method)}
                              className={method.enabled ? "text-red-600" : "text-green-600"}
                            >
                              {method.enabled ? 'Disable' : 'Enable'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bank Details Modal */}
      <Dialog open={showBankDetailsModal} onOpenChange={(open) => !open && setShowBankDetailsModal(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMethod?.name} - Bank Details
            </DialogTitle>
            <DialogDescription>
              Configure bank account details for payment collection
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name *</Label>
                <Input
                  id="accountName"
                  value={bankDetailsForm.accountName}
                  onChange={(e) => setBankDetailsForm(prev => ({ ...prev, accountName: e.target.value }))}
                  placeholder="Company Name Ltd"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input
                  id="accountNumber"
                  value={bankDetailsForm.accountNumber}
                  onChange={(e) => setBankDetailsForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  value={bankDetailsForm.bankName}
                  onChange={(e) => setBankDetailsForm(prev => ({ ...prev, bankName: e.target.value }))}
                  placeholder="Bank Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="routingNumber">Routing Number</Label>
                <Input
                  id="routingNumber"
                  value={bankDetailsForm.routingNumber}
                  onChange={(e) => setBankDetailsForm(prev => ({ ...prev, routingNumber: e.target.value }))}
                  placeholder="021000021"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="swiftCode">SWIFT Code</Label>
                <Input
                  id="swiftCode"
                  value={bankDetailsForm.swiftCode}
                  onChange={(e) => setBankDetailsForm(prev => ({ ...prev, swiftCode: e.target.value }))}
                  placeholder="BANKCODE33"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="iban">IBAN</Label>
                <Input
                  id="iban"
                  value={bankDetailsForm.iban}
                  onChange={(e) => setBankDetailsForm(prev => ({ ...prev, iban: e.target.value }))}
                  placeholder="US12345678901234567890"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankAddress">Bank Address</Label>
              <Input
                id="bankAddress"
                value={bankDetailsForm.bankAddress}
                onChange={(e) => setBankDetailsForm(prev => ({ ...prev, bankAddress: e.target.value }))}
                placeholder="123 Main Street, City, State 12345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Transfer Instructions *</Label>
              <Textarea
                id="instructions"
                value={bankDetailsForm.instructions}
                onChange={(e) => setBankDetailsForm(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Please include your username in the transfer reference. Allow 1-2 business days for processing."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBankDetailsModal(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={saveBankDetails}
              disabled={saving}
              className="gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Bank Details
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
